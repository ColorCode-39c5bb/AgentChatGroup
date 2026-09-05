from typing import Sequence, AsyncGenerator

from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.base import Response
from autogen_agentchat.messages import BaseChatMessage, TextMessage, BaseAgentEvent, AgentEvent, ChatMessage
from autogen_core import CancellationToken


class ChatAgentNameMessageToResponse(AssistantAgent):
    def __init__(this, *a, **d):
        super().__init__(*a, **d);

    async def on_messages_stream(this, messages, cancellation_token) -> AsyncGenerator[AgentEvent | ChatMessage | Response, None]:
        g = super().on_messages_stream(messages, cancellation_token);
        async for r in g:
            if isinstance(r, Response):
                r.chat_message.content = f"【{this.name}】" + r.chat_message.content;
            yield r;