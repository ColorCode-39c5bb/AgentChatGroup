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
		_this.reactiverender({cur_group: e.target.reactivedata.value});
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
				groups: Object.defineProperty([Object.fromEntries(group.entries())], "i_f", TRUE),
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
	.then(groups=>_this.reactiverender(Object.defineProperties({groups}, {
		i_f: FALSE,
		isprimary: TRUE
	})));

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
AppMain.prototype.reactiverender = function(rd){
	const {item_group, group:el_group} = this.els_tooperate;
	if(rd.cur_group)
		el_group.reactiverender({fetch: rd.cur_group});
	if(rd.groups) item_group.reactiverender_for(rd.groups,
		function(rd_group){
			this.lastElementChild.innerHTML = rd_group.name;
			if(rd_group.name == rd.cur_group?.name) this.classList.add("selected");
			else this.classList.remove("selected");
		},
	);
}

AppMain.prototype.RDCLASS = function(){
	this.construction = {
		i_f: true,
		cur_group: {
			i_f: false,
			isprimary: true
		},
		groups: {
			i_f: true,
			construction: {
				i_f: false,
				isprimary: true,
			}
		},
	};
	return this;
}