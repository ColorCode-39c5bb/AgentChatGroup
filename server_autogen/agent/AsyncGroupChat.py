from autogen_agentchat.teams import BaseGroupChat


class AsyncGroupChat(BaseGroupChat):
    def __init__(this, name, participants):
        super().__init__(name, participants);