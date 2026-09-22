import asyncio
from typing import AsyncGenerator, Any, Literal, Mapping

from autogen_agentchat.agents import AssistantAgent, BaseChatAgent
from autogen_agentchat.base import TaskResult
from autogen_agentchat.conditions import FunctionalTermination
from autogen_agentchat.messages import BaseChatMessage, BaseAgentEvent, MultiModalMessage, StructuredMessage
from autogen_agentchat.state import ChatAgentContainerState
from autogen_agentchat.teams import SelectorGroupChat
from autogen_core.models import UserMessage, LLMMessage, AssistantMessage
from autogen_core.tools import FunctionTool
from autogen_ext.models.openai import OpenAIChatCompletionClient
from autogen_ext.models.openai._message_transform import user_condition, base_user_transformer_funcs, _set_name, user_transformer_constructors, __BASE_TRANSFORMER_MAP
from autogen_ext.models.openai._transformation import register_transformer, build_conditional_transformer_func
from openai.types.chat import ChatCompletionContentPartParam, ChatCompletionContentPartTextParam
from pydantic import BaseModel


class ChatCompletionContentPartFileIDParam(dict):
	file_id: str
	type: Literal["file"]
	prompt_cache_breakpoint = None

def multimodal(message: LLMMessage, context: dict) -> dict[str, list[ChatCompletionContentPartParam|ChatCompletionContentPartFileIDParam]]:
	assert isinstance(message, (UserMessage, AssistantMessage))
	prepend = context.get("prepend_name", False);
	parts: list[ChatCompletionContentPartParam|ChatCompletionContentPartFileIDParam] = [];
	for idx, part in enumerate(message.content):
		if isinstance(part, str) and part.startswith("file-api-"):
			parts.append(ChatCompletionContentPartFileIDParam(type="file", file_id=part))
		elif isinstance(part, str):
			# If prepend, Append the name to the first text part
			part = f"【{message.source}】"+part if prepend and idx == 0 else part
			parts.append(ChatCompletionContentPartTextParam(type="text", text=part))
		else:
			raise ValueError(f"Unknown content part: {part}")
	return {"content": parts}
def text(message: LLMMessage, context: dict[str, Any]) -> dict[str, str]:
	assert isinstance(message, (UserMessage, AssistantMessage))
	assert isinstance(message.content, str)
	prepend = context.get("prepend_name", False)
	prefix = f"【{message.source}】" if prepend else ""
	return {"content": prefix + message.content}

register_transformer("openai", "deepseek-flash",{
	**__BASE_TRANSFORMER_MAP,
	**{
		UserMessage: build_conditional_transformer_func(
			funcs_map={
				"text": base_user_transformer_funcs+[_set_name, text],
				"multimodal": base_user_transformer_funcs+[_set_name, multimodal],
			},
			message_param_func_map=user_transformer_constructors,
			condition_func=user_condition,
		)
	}
})

llm = OpenAIChatCompletionClient(
	model="deepseek-flash",
	api_key="sk-ce3b7eb71209417683ca5280de1ea556",
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

class Group:
	def __init__(this,
		name:str,
	):
		this.name = name;
		this.groupchat = None;

		# async def input_func(prompt:str, cancellation_token=None):
		# 	this.user_input = Future();
		# 	return await this.user_input;
		# this.user_input:Future[str]|None = None;
		this.members:list[BaseChatAgent] = []; ##[UserProxyAgent("user", input_func=input_func)];
		this.speakers = []; this.spi = 0;


	async def __call__(this,
		message: str|MultiModalMessage,
	) -> AsyncGenerator[BaseAgentEvent | BaseChatMessage | TaskResult, None]:
		async for m in this.groupchat.run_stream(task=message): yield m;

	async def save_state(this):
		if this.groupchat is None: return {"agent_states": {}};
		state = await this.groupchat.save_state();
		state.update({
			"name": this.name
		});
		return state;

	async def add_member(this, agents):
		for i,agent in enumerate(agents): agents[i] = AssistantAgent(
			agent["name"], llm,
			# model_client_stream=True,
			reflect_on_tool_use=True,
			output_content_type=AAA,
			tools=[
				FunctionTool(this.get_members, "获取群聊所有成员"),
				FunctionTool(this.get_member, "获取某成员的具体信息")
			],
			system_message = f"""
你是一个群聊成员,你的name是“{agent["name"]}”.
你需要通过name区分发言者,即每条消息前“【】”包含的内容,【name】是系统自动添加的,你无需生成.你要注意别人对你的@,但由你自己视情况决定是否回复@你的人.
请以JSON格式字符串生成内容,JSON字符串的键名为“@name1@name2”的格式,键值为对该成员的回复内容.如果没有要@的成员即正常对话,则键名为“@_”.
例如:
{{
	"@kax": "又见面了,...",
	"@locy@jil": "你们今天心情怎么样？...",
	"@_": "大家做个自我介绍,...",
}},
{{
	"@_": "我今天和同学吃了一顿火锅,..."
}}.
这是额外的系统提示词:{agent["system_message"]}
"""
		);
		this.members.extend(agents);

		groupchat = this.groupchat;
		# this.groupchat = RoundRobinGroupChat(
		# 	this.members,
		# 	name=this.name,
		# 	termination_condition=MaxMessageTermination(len(this.members)+1, False),
		# 	custom_message_types=[StructuredMessage[AAA]]
		# 	# max_turns=len(this.members),
		# );
		this.groupchat = SelectorGroupChat(
			model_client=llm,
			participants=this.members,
			name=this.name,
			custom_message_types=[StructuredMessage[AAA]],
			selector_func=this.selector_func,
			termination_condition=FunctionalTermination(this.termination_function)
		);
		if groupchat is not None:
			state_groupchat = await groupchat.save_state();
			state_groupchat["agent_states"].update((a.name,ChatAgentContainerState(agent_state=state)) for a,state in zip(agents, await asyncio.gather(*(a_.save_state() for a_ in agents))));
			await this.groupchat.load_state(state_groupchat);

		this.speakers = [agent.name for agent in this.members]
		this.spi = 0;

	def termination_function(this, messages):
		if messages[-1].source != "user":
			ks = messages[-1].content.model_dump().keys();
			for k in ks: this.speakers.extend(filter(lambda n: n != "", k.split("@")));
		while True:
			if this.spi>len(this.speakers)-1:
				this.speakers = [member.name for member in this.members];
				this.spi = 0;
				return True;
			if this.speakers[this.spi]=="user" or this.speakers[this.spi]=="_": this.spi = this.spi + 1;
			else: return False;

	def selector_func(this, messages):
		speaker = this.speakers[this.spi];
		this.spi = this.spi+1;
		return speaker;

	def get_members(this)->list[str]:
		return [agent.name for agent in this.members]+["user"];

	async def get_member(this, index:int)->Mapping[str, Any]:
		return await this.members[index].save_state();

	def get_groupfiles(this)->list[str]:
		return [agent.name for agent in this.members];

class AAA(BaseModel):
	model_config = {'extra': 'allow', "strict": False}