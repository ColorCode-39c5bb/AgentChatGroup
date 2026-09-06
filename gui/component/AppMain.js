import templatePromise from "../template.js";
templatePromise.then((templateDocument)=>{
	AppMain.prototype.template = templateDocument.getElementById("app-main");
	window.constructor_withTemplate.push(AppMain);
});
export default function AppMain(){
	const _this = Reflect.construct(HTMLElement, [], AppMain);
	_this.attachShadow({mode: "open"});
	_this.initShadowRoot();

	const dialog_group_new = _this.shadowRoot.getElementById("group-new");
	const btn_new = _this.shadowRoot.getElementById("btn-new");
	const list_group = _this.shadowRoot.getElementById("list-group");
	list_group.addEventListener("click", function(e){
		if(!e.target.classList.contains("group")) return;
		_this.reactiverender({cur_group: e.target.reactivedata});
	});
	btn_new.addEventListener("click", function(e){
		dialog_group_new.showModal();
	});
	dialog_group_new.addEventListener("close", function(e){
		if(this.returnValue == "N") return;
		const group = new FormData(this.firstElementChild);
		fetch("http://localhost:5000/group", {
			method: "POST",
			body: group
		})
		// .then(rep=>rep.json())
		.then(rep=>{
			_this.reactiverender({
				groups: [Object.fromEntries(group.entries())],
			});
			this.querySelectorAll("input").forEach(el=>el.value="");
		});
	});
	_this.els_tooperate={
		dialog_group_new,
		list_group,
			item_group: _this.shadowRoot.querySelector(".group"),
		group: _this.shadowRoot.getElementById("el-group")
	}

	fetch("http://localhost:5000")
	.then(rep=>rep.json())
	.then(groups=>_this.reactiverender({ groups }));

	return _this;
}
Object.setPrototypeOf(AppMain.prototype, HTMLElement.prototype);
Object.setPrototypeOf(AppMain, HTMLElement);
Object.defineProperty(AppMain, "observedAttributes", {get: function() {return ["value"]}});
AppMain.prototype.connectedCallback = function(){
}
AppMain.prototype.attributeChangedCallback = function(name, oldValue, newValue){
	
}
AppMain.prototype.disconnectedCallback = function(){
	
}
AppMain.prototype.adoptedCallback = function(){
	
}
AppMain.prototype.reactiverender = function(rd_delta){
	const rd_this = this.reactivedata;
	const {item_group, group:el_group} = this.els_tooperate;

	el_group.reactiverender(rd_delta.cur_group);
	if(rd_delta.groups) item_group.reactiverender_for(rd_this.groups,
		function(rd_group){
			this.lastElementChild.innerHTML = rd_group.name;
		},
	);
}

AppMain.prototype.RDCLASS = function(){
	this.groups = [];
}

AppMain.prototype.RDCLASS.prototype.merge = function(Ns_rd_delta){
	const rd_delta = Ns_rd_delta.reduce(function(prev, cur){
		if(!prev) return cur; if(!cur) return prev;
		prev.groups.push(...cur.groups || []);
		return prev;
	});
	if(!rd_delta) return rd_delta;
	this.groups.push(...rd_delta.groups || []);
	const rd_temp = {
		groups: rd_delta.groups
	}
	delete rd_delta.groups;
	Object.assign(this, rd_delta);
	return Object.assign(rd_delta, rd_temp);
}