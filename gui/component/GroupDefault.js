import templatePromise from "../template.js";
templatePromise.then((templateDocument)=>{
	GroupDefault.template = templateDocument.getElementById("group-default");
	window.constructor_withTemplate.push(GroupDefault);
});
export default function GroupDefault(){
	const _this = Reflect.construct(HTMLElement, [], GroupDefault);
	_this.attachShadow({mode: "open"});
	_this.initShadowRoot();
	
	const dialog_member_new = _this.shadowRoot.getElementById("member-new");
	const btn_new = _this.shadowRoot.getElementById("btn-new");

	btn_new.addEventListener("click", function(){
		dialog_member_new.showModal();
	});
	dialog_member_new.addEventListener("close", function(){
		if(this.returnValue == "N") return;
		const agent = new FormData(this.firstElementChild);
		// fetch("http://localhost:5000/api", {
		// 	method: "POST",
		// 	body: agent
		// }).then(rep=>rep.json())
		// .then(rep=>{
		// 	_this.reactiverender({
		// 		members: [Object.fromEntries(agent.entries())],
		// 	});
		// 	this.querySelectorAll("input").forEach(el=>el.value="");
		// }){
		_this.reactiverender({
			members: [Object.fromEntries(agent.entries())],
		});
		this.querySelectorAll("input").forEach(el=>el.value="");

	});
	window.addEventListener("message-send", function(e){
		fetch("http://localhost:5000/message", {
			method: "POST",
			body: e.detail
		}).then(rep=>rep.json())
		.then(messages=>{
			_this.reactiverender({ messages });
		})
	});

	_this.els_tooperate={
		dialog_member_new,
		sec_member:_this.shadowRoot.getElementById("member"),
			member: _this.shadowRoot.querySelector(".member"),
		sec_chat:_this.shadowRoot.getElementById("chat"),
			message: _this.shadowRoot.querySelector(".message"),
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
GroupDefault.prototype.reactivemerge = function(){
	if(this.rd_torender.length<2) this.rd_torender.push(undefined);
	const rd = this.rd_torender.reduce(function(prev, cur){
		if(!prev) return cur; if(!cur) return prev;
		if(!prev.members) prev.members = cur.members
		else prev.members.push(...cur.members || []);
		if(!prev.messages) prev.messages = cur.messages;
		else prev.messages.push(...cur.messages || []);
		return prev;
	});
	this.reactivedata ??= {
		members: [],
		messages: [],
	};
	this.reactivedata.members.push(...rd.members || []);
	this.reactivedata.messages.push(...rd.messages || []);
	const rd_temp = {
		members: rd.members,
		messages: rd.messages,
	};
	delete rd.members; delete rd.messages;
	Object.assign(this.reactivedata, rd);
	return Object.assign(rd, rd_temp);
}
GroupDefault.prototype.reactiverender = function(rd_delta){
	const rd_this = this.reactivedata;
	const {member:el_member, message:el_message} = this.els_tooperate;
	if(rd_delta.members) el_member.reactiverender_for(rd_this.members, 
		function(rd_member){
			this.lastElementChild.innerHTML = rd_member.agent_type;
		},
	);
	if(rd_delta.messages) el_message.reactiverender_for(rd_this.messages, 
		function(rd_message){
			this.lastElementChild.innerHTML = rd_message.content;
		},
	);
}