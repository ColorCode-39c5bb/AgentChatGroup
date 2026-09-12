from types import FunctionType
from urllib import parse
from python_multipart.multipart import Field, FormParser

path_handler = {};
pathws_handler = {};
async def app(scope, receive, send):
	print(scope);
	handler = None;
	if scope["type"] == "http":
		handler = path_handler.get(scope["path"], None);
	elif scope["type"] == "websocket":
		handler = pathws_handler.get(scope["path"], None);
	if type(handler) == FunctionType: await handler(scope, receive, send);
	else: await on_nopath_handler(scope, receive, send);


def path(path:str):
	def register_path(on_path):
		async def on_path_wraped(scope, receive, send):
			await send({
				"type": "http.response.start",
				"status": 200,
				"headers": [
					["Content-Type", "text/plain"],
					["Access-Control-Allow-Origin", "*"]
				]
			});
			if scope["query_string"]: scope["query"] = dict(map(lambda q: (q[0].decode(), q[1].decode()), parse.parse_qsl(scope["query_string"])))
			if scope["method"] != "POST": return await on_path(scope, receive, send);
			content_type = dict(scope["headers"]).get(b"content-type").decode();
			if content_type is None: return await on_path(scope, receive, send);

			def on_field(field: Field):
				fields.append(field);
			boundary = None; fields = None;
			fields = [];
			if content_type.startswith("multipart/form-data"):
				boundary = content_type.split("boundary=")[1];
				content_type = "multipart/form-data";
			parser_form = FormParser(
				content_type=content_type,
				on_field=on_field,
				on_file=None,
				boundary=boundary,
			);
			more_body = True;
			while more_body:
				recv = await receive();
				parser_form.write(recv["body"]);
				more_body = recv["more_body"];
			parser_form.finalize();
			fields = map(lambda field: (field.field_name.decode(), field.value.decode()), fields);
			return await on_path(scope, dict(fields), send);
		path_handler[path] = on_path_wraped;
		return on_path_wraped;
	return register_path;


def pathws(pathws:str):
	def register_pathws(on_pathws):
		async def on_pathws_wraped(scope, receive, send):
			while True:
				_receive = await receive();
				match _receive["type"]:
					case "websocket.connect":
						await send({"type": "websocket.accept"});
					case "websocket.disconnect":
						await send({"type": "websocket.close", "reason": "disconnect"});
					case _:
						await on_pathws(scope, _receive, send);
		pathws_handler[pathws] = on_pathws_wraped;
		return on_pathws_wraped;
	return register_pathws;


async def on_nopath_handler(scope, receive, send):
	await send({
		"type": "http.response.start",
		"status": 404,
		"headers": [
			["Content-Type", "text/plain"],
		]
	});
	await send({
		"type": "http.response.body",
		"body": b"404 Not Found",
	});