import math
from unittest import case

import uvicorn
import json

from autogen_agentchat.base import TaskResult

from agent.Group import Group
from server.app import path, app, pathws

groups: dict[str, Group] = {};
# runtime = SingleThreadedAgentRuntime();
@path("/")
async def on_home(scope, receive, send):
	await send({
		"type": "http.response.body",
		"body": json.dumps(list(map(lambda n: {"name": n}, groups.keys()))).encode(),
	});


@path("/group")
async def on_group(scope, receive, send):
	print(receive);
	match scope["method"]:
		case "GET":
			group = groups[scope["query"]["name"]];
			state = await group.save_state();
			await send({
				"type": "http.response.body",
				"body": json.dumps(await group.save_state()).encode(),
			});
		case "POST":
			groups[receive["name"]] = Group(receive["name"]);
			await send({
				"type": "http.response.body",
				"body": b"created successfully!",
			});


@path("/message")
async def on_message(scope, receive, send):
	print(receive);
	match scope["method"]:
		case "POST":
			group = groups[scope["query"]["group"]];
			async for m_e in group(receive["content"]):
				if isinstance(m_e, TaskResult): break;
				await send({
					"type": "http.response.body",
					"body": (json.dumps(m_e.dump()) + "\n").encode(),
					"more_body": True
				});
		case "GET":
			pass;
	await send({
		"type": "http.response.body",
		"body": b"",
	});


@path("/member")
async def on_member(scope, receive, send):
	print(receive);
	group = groups[scope["query"]["group"]];
	match scope["method"]:
		case "POST":
			group.add_member(receive);

	await send({
		"type": "http.response.body",
		"body": b"",
	});


@pathws("/message")
async def on_message_ws(scope, receive, send):
	print(receive);
	await send({
		"type": "websocket.send",
		"text": "Hello world!",
	});


uvicorn.run(app, host="0.0.0.0", port=5000, log_level="info", ws="websockets-sansio");