from typing import AsyncGenerator

from autogen_agentchat.agents import AssistantAgent, BaseChatAgent, UserProxyAgent
from autogen_agentchat.base import TerminationCondition, TaskResult
from autogen_agentchat.conditions import TextMentionTermination
from autogen_agentchat.messages import BaseChatMessage, BaseAgentEvent
from autogen_agentchat.teams import BaseGroupChat, RoundRobinGroupChat, SelectorGroupChat
from autogen_core.memory import Memory, ListMemory, MemoryContent
from autogen_core.models import ModelFamily
from autogen_ext.models.openai import OpenAIChatCompletionClient
from collections.abc import Sequence

from .ChatAgentNameMessageToResponse import ChatAgentNameMessageToResponse

llm = OpenAIChatCompletionClient(
	model="deepseek-v4-flash",
	api_key="sk-6161741cf2e3421c9f3cfbd418413a6c",
	base_url="https://api.deepseek.com",
	model_info={
		"vision": False,
		"function_calling": False,
		"json_output": False,
		"family": ModelFamily.R1,
		"structured_output": True,
	},
);

class Group:
	def __init__(this,
		name:str,
	*,	termination_condition: TerminationCondition | None = TextMentionTermination("结束"),
		max_turns: int | None = None,
	):
		this.name = name;
		this.participants:list[BaseChatAgent] = [UserProxyAgent("user")];
		this.chat_history: Memory = ListMemory(name);
		this.termination_condition = termination_condition;
		this.groupchat: BaseGroupChat|None = None;

	def __call__(this,
		message: str | BaseChatMessage | Sequence[BaseChatMessage],
	) -> AsyncGenerator[BaseAgentEvent | BaseChatMessage | TaskResult, None]:
		# SelectorGroupChat(this.participants, llm).run(task=message);\
		if this.groupchat is None: this.groupchat = RoundRobinGroupChat(
			this.participants,
			name=this.name,
			termination_condition=this.termination_condition,
		);
		result = this.groupchat.run_stream(task=message);
		# print(result);
		# for cm in result.messages:
		# 	await this.chat_history.add(MemoryContent(content=cm.to_text(), mime_type="text/plain"));
		return result;

	def add_participant(this, state):
		user = this.participants[-1];
		this.participants[-1] = ChatAgentNameMessageToResponse(
			state["name"], llm,
			model_client_stream=True,
			system_message = """
系统说明：
你是一个在群聊里的AI智能体，群聊成员由你和其他用户组成。
你需要通过name区分发言者，即每条消息前"【】"包含的内容，【name】是系统自动添加的，你无需生成。
如果需要回复指定的用户则在自己发言前说"@name,"。
例如：
	"@kax,我认同你的说法。"；
	"@locy,@jil,你们今天心情怎么样？"。
这是额外的自定义系统提示词：
"""
+f"这是你的name：{state['name']}。"
+state["system_message"]
		);
		this.participants.append(user);
		this.groupchat = None;


__all__ = [
	"Group"
]
