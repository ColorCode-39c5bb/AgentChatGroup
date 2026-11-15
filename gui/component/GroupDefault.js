import templatePromise from "../template.js";
templatePromise.then((templateDocument)=>{
	GroupDefault.template = templateDocument.getElementById("group-default");
	window.constructor_customelement.push(GroupDefault);
});
export default function GroupDefault(){
	const _this = Reflect.construct(HTMLElement, [], GroupDefault);
	_this.initShadowRoot(GroupDefault);

	const btn_new = _this.shadowRoot.querySelector(".btn-new");
	const dialog_member_new = _this.shadowRoot.getElementById("member-new");

	btn_new.addEventListener("click", function(){
		dialog_member_new.showModal();
	});
	dialog_member_new.addEventListener("close", function(){
		if(this.returnValue == "N") return;
		const agent = new FormData(this.firstElementChild);
		fetch("http://localhost:5000/member?group="+_this.reactivedata.datavalue.name, {
			method: "POST",
			body: agent
		})//.then(rep=>rep.json())
		.then(rep=>{
			_this.reactiverender({agent_states: Object.fromEntries([
				[agent.get("name"), {}]
			])});
			this.querySelectorAll("input").forEach(el=>el.value="");
		});
	});
	_this.shadowRoot.addEventListener("message-send", function(e){
		if(!e.detail.get("content")) return;
		fetch("http://localhost:5000/message?group="+_this.reactivedata.datavalue.name, {
			method: "POST",
			body: e.detail
		})
		.then(async rs=>{
			let isdone = false;
			const reader = rs.body.getReader();
			const decoder = new TextDecoder();
			while(!isdone){
				const {done, value} = await reader.read();
				const messages = decoder.decode(value).split("\n").filter(o=>o).map(m=>JSON.parse(m));
				_this.reactiverender({agent_states:{"SelectorGroupChatManager":{message_thread: messages}}});
				isdone = done;
			}
			console.log("流结束");
		});
	});

	_this.elements_todo={
		group_name: _this.shadowRoot.getElementById("group-name"),
		list_message:_this.shadowRoot.getElementById("list-message"),
			message: _this.shadowRoot.querySelector(".message"),
		dialog_detail: _this.shadowRoot.getElementById("detail"),
			list_member:_this.shadowRoot.getElementById("list-member"),
				dialog_member_new,
				member: _this.shadowRoot.querySelector(".member"),
	};
	return _this;
}
Object.setPrototypeOf(GroupDefault.prototype, HTMLElement.prototype); Object.setPrototypeOf(GroupDefault, HTMLElement);
Object.defineProperty(GroupDefault, "observedAttributes", {get: function() {return []}});
GroupDefault.prototype.connectedCallback = function(){}
GroupDefault.prototype.attributeChangedCallback = function(name, oldValue, newValue){}
GroupDefault.prototype.disconnectedCallback = function(){}
GroupDefault.prototype.adoptedCallback = function(){}
GroupDefault.prototype.reactiverender = function(delta, value){
	const {dialog_detail:el_detail, member:el_member, message:el_message, group_name:el_group_name}=this.elements_todo;
	if(delta.name_torender){
		el_group_name.innerHTML = value.name_torender;
		return fetch("http://localhost:5000/group?name="+value.name_torender).then(rep=>rep.json())
		.then(group=>this.reactiverender(Object.defineProperty(group, "isprimary", {value:true, enumerable:false})));
	}
	if(delta.agent_states["SelectorGroupChatManager"]?.message_thread){
		el_message.reactiverender_for(value.agent_states["SelectorGroupChatManager"].message_thread, function(delta){
			const message=delta[0], llm_response=delta[1];
			this.firstElementChild.reactiverender({source: message.source});
			this.classList.remove("message-multi");
			const el_content = this.querySelector(".message-content");
			if(message.source == "user"){
				this.classList.add("message-this"); this.classList.remove("message-that");
				if(message.type == "MultiModalMessage"){
					this.classList.add("message-multi");
					el_content.reactiverender_for(message.content, function(delta){this.innerHTML = delta;});
					return;
				}
			}else{
				this.classList.add("message-that"); this.classList.remove("message-this");
				switch(message.type){
				case "ToolCallRequestEvent":
					el_content.reactiverender_for(["请求工具："+message.content.reduce((prev, cur)=>prev+cur.name+"、", "")], function(function_request){this.innerHTML = function_request;});
					return;
				case "ToolCallExecutionEvent":
					this.classList.add("message-multi");
					el_content.reactiverender_for(message.content, function(function_call_result){
						this.innerHTML = `${function_call_result.name} -> ${function_call_result.content}`;
					});
					return;
				case "SelectSpeakerEvent":
					console.log(message);
					break;
				}
			}
			//ChatMessage
			el_content.reactiverender_for([message.content], function(message_content){
				if(typeof message_content == "string") return this.innerHTML = message_content; //user
				this.innerHTML = Object.entries(message_content).reduce((p, [at, content])=>p + at+","+content+"\n", ""); //agent
			});
		});
	}
	el_detail.reactiverender(value, function(rd){
		Object.entries(rd).forEach(function([k, v]){
			const e=this.querySelector(`label[name="${k}"]`)?.firstElementChild;
			if(e) e.innerHTML=v;
		}, el_detail);
		el_member.reactiverender_for(Object.entries(rd.agent_states), function([k, v]){
			this.lastElementChild.innerHTML = k;
			this.firstElementChild.reactiverender({source: k});
		});
	});
}

GroupDefault.RDCLASS = function(){
	this.construction = { isprimary: false,
		agent_states: { isprimary: false,
			"SelectorGroupChatManager": { isprimary: false,
				message_thread: {
					isprimary: false,
				}
			}
		},
	};
	return this;
}