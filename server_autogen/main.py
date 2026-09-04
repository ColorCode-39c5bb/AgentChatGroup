from email import message

import uvicorn
import json

from server_autogen.agent.Group import Group
from server_autogen.server.app import path, app


# runtime = SingleThreadedAgentRuntime();
group = Group("Group0");


@path("/")
async def on_home(scope, receive, send):
	await send({
		"type": "http.response.start",
		"status": 200,
		"headers": [
			["Content-Type", "text/plain"],
		]
	});
	await send({
		"type": "http.response.body",
		"body": b"Hello, world!",
	});

@path("/api")
async def on_api(scope, receive, send):
	print(receive);
	group.add_participant(None);

	await send({
		"type": "http.response.body",
		"body": None,
	});

@path("/message")
async def on_chat(scope, receive, send):
	print(receive);
	ms = (await group(receive["content"])).messages;
	await send({
		"type": "http.response.body",
		"body": json.dumps(list(map(lambda cm:cm.dump(), ms))).encode()
	});


uvicorn.run(app, host="0.0.0.0", port=5000, log_level="info");