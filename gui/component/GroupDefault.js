import templatePromise from "../template.js";
templatePromise.then((templateDocument)=>{
	GroupDefault.prototype.template = templateDocument.getElementById("group-default");
	window.constructor_customelement.push(GroupDefault);
});
export default function GroupDefault(){
	const _this = Reflect.construct(HTMLElement, [], GroupDefault);
	_this.attachShadow({mode: "open"});
	_this.initShadowRoot();
	
	const btn_new = _this.shadowRoot.querySelector(".btn-new");
	const dialog_member_new = _this.shadowRoot.getElementById("member-new");
	const dialog_detail = _this.shadowRoot.getElementById("detail");

	btn_new.addEventListener("click", function(){
		dialog_member_new.showModal();
	});
	dialog_member_new.addEventListener("close", function(){
		if(this.returnValue == "N") return;
		const agent = new FormData(this.firstElementChild);
		fetch("http://localhost:5000/member?group="+_this.reactivedata.value.name, {
			method: "POST",
			body: agent
		})
		// .then(rep=>rep.json())
		.then(rep=>{
			_this.reactiverender({agent_states: Object.fromEntries([
				[agent.get("name"), {}]
			])});
			this.querySelectorAll("input").forEach(el=>el.value="");
		});
	});
	_this.shadowRoot.addEventListener("message-send", function(e){
		fetch("http://localhost:5000/message?group="+_this.reactivedata.value.name, {
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
				_this.reactiverender({ messages });
				isdone = done;
			}
			console.log("流结束");
		});
	});

	_this.els_tooperate={
		group_name: _this.shadowRoot.getElementById("group-name"),
		list_message:_this.shadowRoot.getElementById("list-message"),
			message: _this.shadowRoot.querySelector(".message"),
		dialog_detail,
			list_member:_this.shadowRoot.getElementById("list-member"),
				dialog_member_new,
				member: _this.shadowRoot.querySelector(".member"),
	};
	return _this;
}
Object.setPrototypeOf(GroupDefault.prototype, HTMLElement.prototype);
Object.setPrototypeOf(GroupDefault, HTMLElement);
Object.defineProperty(GroupDefault, "observedAttributes", {get: function() {return ["value"]}});
GroupDefault.prototype.connectedCallback = function(){
}
GroupDefault.prototype.attributeChangedCallback = function(name, oldValue, newValue){
	
}
GroupDefault.prototype.disconnectedCallback = function(){
	
}
GroupDefault.prototype.adoptedCallback = function(){
	
}
GroupDefault.prototype.reactiverender = function(rd){
	const {dialog_detail:el_detail, member:el_member, message:el_message, group_name:el_group_name} = this.els_tooperate;
	if(rd.fetch)
		return fetch("http://localhost:5000/group?name="+rd.fetch.name)
		.then(rep=>rep.json())
		.then(group=>this.reactiverender(Object.defineProperties(group, {i_f: FALSE, isprimary: TRUE})));
	el_detail.reactiverender(rd, function(rd){
		el_member.reactiverender_for(Object.entries(rd.agent_states), function([k, v]){
			this.lastElementChild.innerHTML = k;
			this.firstElementChild.reactiverender({source: k});
		});
	});
	if(rd.name)
		el_group_name.innerHTML = rd.name;
	if(rd.messages)
		el_message.reactiverender_for(rd.messages, function(rd_message){
			const el_content = this.querySelector(".message-content");
			if(rd_message.source == "user"){
				this.classList.add("message-this"); this.classList.remove("message-that");
				if(rd_message.type == "MultiModalMessage"){
					this.classList.add("message-multi");
					el_content.reactiverender_for(rd_message.content, function(rd_content){this.innerHTML = rd_content;});
				}else{
					this.classList.remove("message-multi")
					el_content.reactiverender_for([rd_message.content], function(rd_content){this.innerHTML = rd_content;});
				}
			}else{
				this.classList.add("message-that"); this.classList.remove("message-this");
				if(rd_message.type == "ToolCallRequestEvent"){
					this.classList.add("message-multi");
					el_content.reactiverender_for([
						"请求工具：",
						rd_message.content.reduce((prev, cur)=>prev+cur.name+"、", ""),
					], function(rd_content){this.innerHTML = rd_content;});
				}else if(rd_message.type == "ToolCallExecutionEvent"){
					this.classList.add("message-multi");
					el_content.reactiverender_for(rd_message.content, function(function_call){
						this.innerHTML = `${function_call.name} -> ${function_call.content}`;
					});
				}else{
					this.classList.remove("message-multi");
					el_content.innerHTML = rd_message.content;
				}
			}
			this.firstElementChild.reactiverender({source: rd_message.source});
		});
}

GroupDefault.prototype.RDCLASS = function(){
	this.construction = {
		i_f: true,
		fetch: {
			i_f: false,
			isprimary: true
		},
		//name: {},
		agent_states: {
			i_f: true,
		},
		messages: {
			i_f: true,
			construction: {
				i_f: false,
				isprimary: true
			}
		},
		manager_state: {
			i_f: false,
			isprimary: true,
		},
	};
	return this;
}