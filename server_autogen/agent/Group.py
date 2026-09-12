from typing import AsyncGenerator, Mapping, Any

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

class Group():
	def __init__(this,
		name:str,
	*,	termination_condition: TerminationCondition | None = TextMentionTermination("结束"),
		max_turns: int | None = None,
	):
		this.name = name;
		this.members:list[BaseChatAgent] = [UserProxyAgent("user")];
		this.messages = ListMemory(name);
		this.termination_condition = termination_condition;
		this.add_member({"name": "aaa", "system_message": "你是一个智能体助手"});

	async def __call__(this,
		message: str | BaseChatMessage | Sequence[BaseChatMessage],
	) -> AsyncGenerator[BaseAgentEvent | BaseChatMessage | TaskResult, None]:
		async for m_e in this.groupchat.run_stream(task=f"【user】{message}"):
			print(m_e);
			if type(m_e)!=TaskResult: await this.messages.add(MemoryContent(content=m_e.dump(), mime_type="text/plain"));
			yield m_e;
		return;

	async def save_state(this):
		state = await this.groupchat.save_state();
		return {
			"name": this.name,
			"members": list(map(lambda m: {"name": m.name}, this.members)),
			"messages": list(map(lambda c: c.content, this.messages.content)),
			"manager_state": state["agent_states"]["RoundRobinGroupChatManager"],
		};

	def add_member(this, agent):
		user = this.members[-1];
		this.members[-1] = ChatAgentNameMessageToResponse(
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
		);
		this.members.append(user);
		this.groupchat = RoundRobinGroupChat(
			this.members,
			name=this.name,
			termination_condition=this.termination_condition,
		);
