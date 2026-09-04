from autogen_agentchat.agents import AssistantAgent, BaseChatAgent, UserProxyAgent
from autogen_agentchat.conditions import TextMentionTermination
from autogen_agentchat.teams import BaseGroupChat, RoundRobinGroupChat, SelectorGroupChat
from autogen_core import AgentId
from autogen_core.memory import Memory, ListMemory, MemoryContent
from autogen_core.models import ModelFamily
from autogen_ext.models.openai import OpenAIChatCompletionClient

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
	def __init__(this, name):
		this.name = name;
		this.participants:list[BaseChatAgent] = [UserProxyAgent("me")];
		this.chat_history: Memory = ListMemory(name);

	async def __call__(this, message):
		# SelectorGroupChat(this.participants, llm).run(task=message);\
		result = await RoundRobinGroupChat(
			this.participants,
			termination_condition=TextMentionTermination("结束"),
		).run(task=message);
		print(result);
		for cm in result.messages:
			await this.chat_history.add(MemoryContent(content=cm.to_text(), mime_type="text/plain"))
		return result;

	def add_participant(this, participants:BaseChatAgent|None):
		this.participants.append(AssistantAgent("agent_custom", llm));


__all__ = [
	"Group"
]
