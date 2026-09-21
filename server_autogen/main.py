import json

import requests
import uvicorn
from autogen_agentchat.base import Response, TaskResult
from autogen_agentchat.messages import UserInputRequestedEvent, MultiModalMessage

from agent.Group import Group
from server.app import path, app

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
			file = receive.get("file", None);
			message = receive["content"];
			if file.file_name:
				r = requests.post(
					"https://api.deepseek.com/files",
					headers={'Authorization': 'Bearer sk-ea6c7959fde940dc811bf56b9439fc7a'},
					files={"file": (file.field_name, file.file_object)},
					data={"purpose": "user_data"}
				)
				message = MultiModalMessage(content=[message, r.json()["id"]], source="user");
			async for m in groups[scope["query"]["group"]](message):
				if type(m) == TaskResult: break;
				if type(m) == Response: m = m.chat_massage;
				await send({
					"type": "http.response.body",
					"body": (json.dumps(m.dump()) + "\n").encode(),
					"more_body": True
				});
				if type(m) == UserInputRequestedEvent: break;
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


uvicorn.run(app, host="0.0.0.0", port=5000, log_level="debug");

