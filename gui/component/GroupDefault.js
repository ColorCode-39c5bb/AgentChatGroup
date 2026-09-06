import templatePromise from "../template.js";
templatePromise.then((templateDocument)=>{
	GroupDefault.prototype.template = templateDocument.getElementById("group-default");
	window.constructor_withTemplate.push(GroupDefault);
});
export default function GroupDefault(){
	const _this = Reflect.construct(HTMLElement, [], GroupDefault);
	_this.attachShadow({mode: "open"});
	_this.initShadowRoot();
	
	const btn_new = _this.shadowRoot.getElementById("btn-new");
	const dialog_member_new = _this.shadowRoot.getElementById("member-new");

	btn_new.addEventListener("click", function(){
		dialog_member_new.showModal();
	});
	dialog_member_new.addEventListener("close", function(){
		if(this.returnValue == "N") return;
		const agent = new FormData(this.firstElementChild);
		fetch("http://localhost:5000/member?group="+_this.reactivedata.name, {
			method: "POST",
			body: agent
		})
		// .then(rep=>rep.json())
		.then(rep=>{
			_this.reactiverender({
				members: [Object.fromEntries(agent.entries())],
			});
			this.querySelectorAll("input").forEach(el=>el.value="");
		});
	});
	_this.addEventListener("message-send", function(e){
		// e.detail.append("group", this.);
		fetch("http://localhost:5000/message?group="+this.reactivedata.name, {
			method: "POST",
			body: e.detail
		})
		.then(async rs=>{
			let isdone = false;
			const reader = rs.body.getReader();
			const decoder = new TextDecoder();
			while(!isdone){
				const {done, value} = await reader.read();
				const messages = decoder.decode(value).split("\n").map(function(o){
					if(!o) return undefined;
					//if(m_e.type == "UserInputRequestedEvent")
					return JSON.parse(o);
				});
				_this.reactiverender({ messages });
				isdone = done;
			}
			console.log("流结束");
		});
	});

	_this.els_tooperate={
		dialog_member_new,
		list_member:_this.shadowRoot.getElementById("list-member"),
			member: _this.shadowRoot.querySelector(".member"),
		list_message:_this.shadowRoot.getElementById("list-message"),
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
GroupDefault.prototype.reactiverender = function(rd_delta){
	const rd_this = this.reactivedata;
	const {member:el_member, message:el_message} = this.els_tooperate;
	if(rd_delta.name){
		fetch("http://localhost:5000/group?name="+rd_delta.name)
		.then(rep=>rep.json())
		.then(group=>this.reactiverender(group));
		return;
	}
	if(rd_delta.members) el_member.reactiverender_for(rd_this.members,
		function(rd_member){
			this.lastElementChild.innerHTML = rd_member.name;
		},
	);
	if(rd_delta.messages) el_message.reactiverender_for(rd_this.messages,
		function(rd_message){
			if(rd_message.source == "user") this.firstElementChild.classList.add("sender-user");
			else this.firstElementChild.classList.remove("sender-user");
			this.lastElementChild.innerHTML = rd_message.content;
		},
	);
}

GroupDefault.prototype.RDCLASS = function(rd_raw){
	this.name = null;
	this.messages = [];
	this.members = [];
	this.manager_state = {
		type: "RoundRobinManagerState",
		version: "1.0.0",
		message_thread: [],
		current_turn: 0,
		next_speaker_index: 0,
	}
}
GroupDefault.prototype.RDCLASS.prototype.merge = function(Ns_rd_delta){
	const rd = Ns_rd_delta.reduce(function(prev, cur){
		if(!prev) return cur; if(!cur) return prev;
		if(!prev.members) prev.members = cur.members
		else prev.members.push(...cur.members || []);
		if(!prev.messages) prev.messages = cur.messages;
		else prev.messages.push(...cur.messages || []);
		return prev;
	});
	if(!rd) return rd;
	this.members.push(...rd.members || []);
	this.messages.push(...rd.messages || []);
	const rd_temp = {
		members: rd.members,
		messages: rd.messages,
		// name: rd.name==this.name ? undefined : rd.name,
	};
	delete rd.members; delete rd.messages;
	Object.assign(this, rd);
	return Object.assign(rd, rd_temp);
};