import asyncio
from typing import AsyncGenerator, Any, Literal, Mapping

from autogen_agentchat.agents import AssistantAgent, BaseChatAgent
from autogen_agentchat.base import TaskResult
from autogen_agentchat.conditions import FunctionalTermination
from autogen_agentchat.messages import BaseChatMessage, BaseAgentEvent, MultiModalMessage, StructuredMessage
from autogen_agentchat.state import ChatAgentContainerState
from autogen_agentchat.teams import SelectorGroupChat
from autogen_core import SingleThreadedAgentRuntime
from autogen_core.model_context import UnboundedChatCompletionContext
from autogen_core.models import UserMessage, LLMMessage, AssistantMessage
from autogen_core.tools import FunctionTool
from autogen_ext.models.openai import OpenAIChatCompletionClient
from autogen_ext.models.openai._message_transform import user_condition, base_user_transformer_funcs, _set_name, user_transformer_constructors, __BASE_TRANSFORMER_MAP
from autogen_ext.models.openai._transformation import register_transformer, build_conditional_transformer_func
from openai.types.chat import ChatCompletionContentPartParam, ChatCompletionContentPartTextParam


class ChatCompletionContentPartFileIDParam(dict):
	file_id: str
	type: Literal["file"]
	prompt_cache_breakpoint = None

# TODO 2026-11-15 DeepSeek多模态消息接口已更新
def multimodal(message: LLMMessage, context: dict) -> dict[str, list[ChatCompletionContentPartParam|ChatCompletionContentPartFileIDParam]]:
	assert isinstance(message, (UserMessage, AssistantMessage))
	prepend = context.get("prepend_name", False);
	parts: list[ChatCompletionContentPartParam|ChatCompletionContentPartFileIDParam] = [];
	for idx, part in enumerate(message.content):
		if isinstance(part, str) and part.startswith("file-api-"):
			parts.append(ChatCompletionContentPartFileIDParam(type="file", file_id=part));
		elif isinstance(part, str):
			# If prepend, Append the name to the first text part
			part = f"【{message.source}】"+part if prepend and idx == 0 else part;
			parts.append(ChatCompletionContentPartTextParam(type="text", text=part));
		else:
			raise ValueError(f"Unknown content part: {part}");
	return {"content": parts}
def text(message: LLMMessage, context: dict[str, Any]) -> dict[str, str]:
	assert isinstance(message, (UserMessage, AssistantMessage));
	assert isinstance(message.content, str);
	prepend = context.get("prepend_name", False);
	prefix = f"【{message.source}】" if prepend else "";
	return {"content": prefix + message.content};

register_transformer("openai", "deepseek-flash", {**__BASE_TRANSFORMER_MAP, **{
	UserMessage: build_conditional_transformer_func(
		funcs_map={
			"text": base_user_transformer_funcs+[_set_name, text],
			"multimodal": base_user_transformer_funcs+[_set_name, multimodal],
		},
		message_param_func_map=user_transformer_constructors,
		condition_func=user_condition,
	)
}});

llm = OpenAIChatCompletionClient(
	model="deepseek-flash",
	api_key="sk-c4f776eb11e94e0d8bb66144d4dc7be1",
	base_url="https://api.deepseek.com",
	model_info={
		"vision": True,
		"function_calling": True,
		"json_output": True,
		"family": "deepseek-flash",
		"structured_output": False,
	},
	add_name_prefixes=True
);
_process_create_args = llm._process_create_args;
llm._process_create_args = lambda a,b,c,d,e: _process_create_args(a,b,c,True,e);


import logging
from autogen_core import EVENT_LOGGER_NAME
from autogen_core.logging import LLMCallEvent
class LLMEventHandler(logging.Handler):
	def emit(self, record):
		if isinstance(record.msg, LLMCallEvent):
			#由于gourp和gourp_manager不是同步流（BaseGroupChat:549），如果有多个speaker并发，会根据实际llm_call（BaseOpenAIChatCompletionClient:704）返回response的顺序覆盖，所以selector_func选择返回单人
			TeamId_LLMResponse[record.msg.kwargs["agent_id"].split("/")[1]] = record.msg.kwargs["response"];

logger = logging.getLogger(EVENT_LOGGER_NAME);
logger.addHandler(LLMEventHandler());
logger.setLevel(logging.INFO);
TeamId_LLMResponse: dict[str, dict]={};
class Group:
	def __init__(this,
		name:str,
	):
		this.name = name;
		#this.runtime = SingleThreadedAgentRuntime(); this.runtime.start();
		this.groupchat = None;

		# async def input_func(prompt:str, cancellation_token=None):
		# 	this.user_input = Future();
		# 	return await this.user_input;
		# this.user_input:Future[str]|None = None;
		this.members:list[BaseChatAgent] = []; ##[UserProxyAgent("user", input_func=input_func)];
		this.history_speakers = ["user"]; this.hsi = 0;
		this.response_thread = [];
		this.history_context = [];


	async def __call__(this,
		message: str|MultiModalMessage,
	) -> AsyncGenerator[tuple[BaseAgentEvent|BaseChatMessage, dict], None]:
		this.history_speakers = this.get_members(); this.hsi = 0;
		async for m in this.groupchat.run_stream(task=message):
			LLMResponse = TeamId_LLMResponse.get(this.groupchat._team_id, None);
			TeamId_LLMResponse[this.groupchat._team_id] = None;
			if type(m) == TaskResult: return;
			this.response_thread.append(LLMResponse);
			yield m.dump(), LLMResponse;

	async def save_state(this):
		if this.groupchat is None: return {"agent_states": {}};
		state = await this.groupchat.save_state();
		state.update({
			"name": this.name,
		});
		state["agent_states"]["SelectorGroupChatManager"]["message_thread"] = list(zip(state["agent_states"]["SelectorGroupChatManager"]["message_thread"], this.response_thread));
		return state;

	async def update_groupchat(this, agents):
		groupchat = this.groupchat;
		# this.groupchat = RoundRobinGroupChat(
		# 	this.members,
		# 	name=this.name,
		# 	termination_condition=MaxMessageTermination(len(this.members)+1, False),
		# 	custom_message_types=[StructuredMessage[AAA]]
		# 	# max_turns=len(this.members),
		# );
		this.groupchat = SelectorGroupChat(
			#runtime=this.runtime,
			model_client=llm,
			participants=this.members,
			name=this.name,
			custom_message_types=[StructuredMessage[AtName_Content]],
			selector_func=lambda ms: this.history_speakers[this.hsi],
			termination_condition=FunctionalTermination(this.termination_function)
		);
		if groupchat is not None:
			state_groupchat = await groupchat.save_state();
			state_groupchat["agent_states"].update((a.name,ChatAgentContainerState(agent_state=state)) for a,state in zip(agents, await asyncio.gather(*(a_.save_state() for a_ in agents))));
			await this.groupchat.load_state(state_groupchat);

	async def add_member(this, agents):
		for i,agent in enumerate(agents): agents[i] = AssistantAgent(
			agent["name"], llm,
			model_context=UnboundedChatCompletionContext(this.history_context) if agent.get("history", False) else None,
			# model_client_stream=True,
			reflect_on_tool_use=True,
			output_content_type=AtName_Content,
			tools=[
				FunctionTool(this.get_members, "获取群聊所有成员"),
				FunctionTool(this.get_member, "获取某成员的具体信息")
			],
			system_message = f"""
你是一个群聊成员,你的name是"{agent["name"]}".
你需要通过name区分发言者,即每条消息前"【】"包含的内容,【name】是系统自动添加的,你无需生成.你要注意别人对你的@,但由你自己视情况决定是否回复@你的人.
请以JSON格式字符串生成内容,JSON字符串的键名为"@name1@name2"的格式,键值为对该成员的回复内容.如果没有要@的成员即正常对话,则键名为"@__null".
例如:
{{
	"@kax": "又见面了,...",
	"@locy@jil": "你们今天心情怎么样？...",
	"@__null": "大家做个自我介绍,...",
}},
{{
	"@__null": "听起来很不错,..."
}},
这是额外的系统提示词:{agent["system_message"]}
"""
		);
		this.members.extend(agents);
		await this.update_groupchat(this.members);

	async def delete_member(this, agents):
		this.members = [member for member in filter(lambda member: member._name!=agents[0].name, this.members)];
		await this.update_groupchat(this.members);

	def termination_function(this, chatmessage: list[BaseAgentEvent | BaseChatMessage]):
		this.history_context.append(chatmessage[-1].to_model_message());
		if chatmessage[-1].source != "user":
			for ats in [filter(lambda n: n != "", ktrings.split("@")) for ktrings in chatmessage[-1].content.model_dump().keys()]:
				for at in ats: this.history_speakers.append(at);
		this.hsi = this.hsi + 1;
		while True:
			if this.hsi>len(this.history_speakers)-1 or this.history_speakers[this.hsi]=="user": return True;
			if this.history_speakers[this.hsi]=="__null": this.hsi = this.hsi + 1;
			else: return False;

	def get_members(this)->list[str]:
		return ["user"]+[agent.name for agent in this.members];

	async def get_member(this, index:int)->Mapping[str, Any]:
		return await this.members[index].save_state();

from pydantic import BaseModel
class AtName_Content(BaseModel):
	model_config = {'extra': 'allow', "strict": False};