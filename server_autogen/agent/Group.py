from typing import AsyncGenerator, Mapping, Any, Literal
from asyncio import Future
import json

from autogen_agentchat.agents import AssistantAgent, BaseChatAgent, UserProxyAgent
from autogen_agentchat.base import TerminationCondition, TaskResult
from autogen_agentchat.conditions import TextMentionTermination, ExternalTermination
from autogen_agentchat.messages import BaseChatMessage, BaseAgentEvent, UserInputRequestedEvent, MultiModalMessage, TextMessage
from autogen_agentchat.teams import BaseGroupChat, RoundRobinGroupChat, SelectorGroupChat
from autogen_core import Image
from autogen_core.memory import Memory, ListMemory, MemoryContent
from autogen_core.models import ModelFamily, UserMessage, LLMMessage, AssistantMessage
from autogen_ext.models.openai import OpenAIChatCompletionClient
from collections.abc import Sequence

from autogen_ext.models.openai._message_transform import user_condition, single_user_transformer_funcs, \
	base_user_transformer_funcs, _set_name, user_transformer_constructors, __BASE_TRANSFORMER_MAP
from autogen_ext.models.openai._transformation import register_transformer, build_conditional_transformer_func
from openai.types.chat import ChatCompletionContentPartParam, ChatCompletionContentPartTextParam
from pydantic import BaseModel

from .ChatAgentNameMessageToResponse import ChatAgentNameMessageToResponse


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
	api_key="sk-6161741cf2e3421c9f3cfbd418413a6c",
	base_url="https://api.deepseek.com",
	model_info={
		"vision": True,
		"function_calling": False,
		"json_output": True,
		"family": "deepseek-flash",
		"structured_output": True,
	},
	add_name_prefixes=True
);


class Group():
	def __init__(this,
		name:str,
	*,	max_turns: int | None = None,
	):
		this.name = name;
		# this.termination_condition = ExternalTermination();
		this.groupchat = None;

		async def input_func(prompt:str, cancellation_token=None):
			this.user_input = Future();
			return await this.user_input;
		this.messages = ListMemory(name);
		this.user_input:Future[str]|None = None;
		this.members:list[BaseChatAgent] = []; ##[UserProxyAgent("user", input_func=input_func)];

		this.add_member({"name": "aaa", "system_message": "你是一个智能体助手"});

	async def __call__(this,
		message: str|MultiModalMessage,
	) -> AsyncGenerator[BaseAgentEvent | BaseChatMessage | TaskResult, None]:
		async for m in this.groupchat.run_stream(task=message):
			print(m);
			if type(m)== TaskResult:
				this.user_input = None;
				return;
			await this.messages.add(MemoryContent(mime_type="application/json", content=m.dump()));
			yield m;

	async def save_state(this):
		state = await this.groupchat.save_state();
		return {
			"name": this.name,
			"members": list(map(lambda m: {"name": m.name}, this.members)),
			"messages": list(map(lambda c: c.content, this.messages.content)),
			"manager_state": state["agent_states"]["RoundRobinGroupChatManager"],
		};

	def add_member(this, agent):
		this.members.append(AssistantAgent(
			agent["name"], llm,
			# model_client_stream=True,
			system_message = f"""
你是一个在群聊里的AI智能体，群聊成员由你和其他用户组成。
你需要通过name区分发言者，即每条消息前“【】”包含的内容，【name】是系统自动添加的，你无需生成。
如果需要回复指定的用户则在自己发言前说“@name,”。
例如：
	“@kax,我认同你的说法。”；
	“@locy,@jil,你们今天心情怎么样？”。
你的名字是“{agent["name"]}”，你要注意别人对你的@，但由你自己视情况决定是否回复@你的人。
这是额外的自定义系统提示词：{agent["system_message"]}
"""
		));
		this.groupchat = RoundRobinGroupChat(
			this.members,
			name=this.name,
			# termination_condition=this.termination_condition,
			max_turns = 1,
		);