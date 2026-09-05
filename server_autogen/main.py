import uvicorn
import json

from autogen_agentchat.base import TaskResult

from agent.Group import Group
from server.app import path, app

# runtime = SingleThreadedAgentRuntime();
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

groups: dict[str, Group] = {};
@path("/api")
async def on_api(scope, receive, send):
	print(receive);
	match(scope["query"]["action"]):
		case "new_group":
			groups[receive["name"]] = Group(receive["name"]);
		case "new_participant":
			groups["group"].add_participant(receive);

	await send({
		"type": "http.response.body",
		"body": b"created successfully!",
	});

@path("/message")
async def on_chat(scope, receive, send):
	print(receive);
	async for m_e in group(receive["content"]):
		if isinstance(m_e, TaskResult): break;
		await send({
			"type": "http.response.body",
			"body": (json.dumps(m_e.dump())+"\n").encode(),
			"more_body": True
		});
	await send({
		"type": "http.response.body",
		"body": b"",
		"more_body": False
	});


uvicorn.run(app, host="0.0.0.0", port=5000, log_level="info");