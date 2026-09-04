from typing import Mapping, Any
import json

from autogen_core import MessageContext, RoutedAgent, message_handler
from autogen_core.models import UserMessage, ChatCompletionClient, SystemMessage

from .Group import Group

class AgentCustom(RoutedAgent):
	def __init__(this, agent_config:dict, group:Group):
		super().__init__("AgentCustom")
		this.model: ChatCompletionClient = agent_config["model"]
		this.system_prompt: SystemMessage = agent_config["system_prompt"]
		this.group: Group = group

	@message_handler
	async def handle_my_message(this, message:UserMessage, ctx:MessageContext) -> None:
		print(f"Received message: {message}")
		print(await this.model.create(
			messages=[
				this.system_prompt,
				message
			],
		))
		print(ctx)

	def get_state(this) -> Mapping[str, Any]:
		return {
			"model": str(this.model),
			"system_prompt": this.system_prompt.content,
			"group": this.group.name
		};

	async def save_state(this) -> Mapping[str, Any]:
		return this.get_state();

	def __str__(this) -> str:
		return json.dumps(this.get_state());

__all__ = [
    "AgentCustom",
]