import json

import requests
import uvicorn
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
			g = Group(receive["name"]);
			groups[receive["name"]] = g;
			await g.add_member([{"name":"wel","system_message":"你是本群的一个智能体助手","history":True}, {"name":"boob","system_message":"你是本群的一个智能体助手","history":True}]);
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
					headers={'Authorization': 'Bearer sk-6ad1b3b99fd44ba9b9063f693a1cf3ab'},
					files={"file": (file.field_name, file.file_object)},
					data={"purpose": "user_data"}
				)
				message = MultiModalMessage(content=[message, r.json()["id"]], source="user");
			group = groups[scope["query"]["group"]];
			async for message_with_response in group(message):
				await send({
					"type": "http.response.body",
					"body": (json.dumps(message_with_response) + "\n").encode(),
					"more_body": True
				});
				if type(message_with_response) == UserInputRequestedEvent: break;
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
			await group.add_member([receive]);

	await send({
		"type": "http.response.body",
		"body": b"",
	});


uvicorn.run(app, host="0.0.0.0", port=5000, log_level="debug");

