import templatePromise from "../template.js";
templatePromise.then((templateDocument)=>{
	GroupDefault.prototype.template = templateDocument.getElementById("group-default");
	window.constructor_withTemplate.push(GroupDefault);
});
export default function GroupDefault(){
	const _this = Reflect.construct(HTMLElement, [], GroupDefault);
	_this.attachShadow({mode: "open"});
	_this.initShadowRoot();
	
	const btn_new = _this.shadowRoot.querySelector(".btn-new");
	const dialog_member_new = _this.shadowRoot.getElementById("member-new");

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
			_this.reactiverender({
				members: [Object.fromEntries(agent.entries())],
			});
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
GroupDefault.prototype.reactiverender = function(rd){
	const {member:el_member, message:el_message} = this.els_tooperate;
	if(rd.fetch)
		return fetch("http://localhost:5000/group?name="+rd.fetch.name)
		.then(rep=>rep.json())
		.then(group=>this.reactiverender(Object.defineProperties(group, {
			i_f: FALSE,
			isprimary: FALSE
		})));
	if(rd.members) 
		el_member.reactiverender_for(
			rd.members,
			function(rd_member){
				this.lastElementChild.innerHTML = rd_member.name;
			},
		);
	if(rd.messages)
		el_message.reactiverender_for(rd.messages, function(rd_message){
			if(rd_message.source == "user"){
				this.classList.add("message-user");
				if(rd_message.type == "MultiModalMessage"){
					this.classList.add("message-multi");
					this.firstElementChild.reactiverender_for(rd_message.content, function(rd_content){this.innerHTML = rd_content;});
				}else{
					this.classList.remove("message-multi")
					this.firstElementChild.innerHTML = rd_message.content;
				}
			}else{
				this.classList.remove("message-user");
				this.firstElementChild.innerHTML = rd_message.content;
				this.lastElementChild.reactiverender({source: rd_message.source});
			}
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
		members: {
			i_f: true,
			construction: {
				i_f: false,
				isprimary: true
			}
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