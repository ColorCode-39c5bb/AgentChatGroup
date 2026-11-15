import templatePromise from "../template.js";
templatePromise.then((templateDocument)=>{
	AppMain.template = templateDocument.getElementById("app-main");
	window.constructor_customelement.push(AppMain);
});
export default function AppMain(){
	const _this = Reflect.construct(HTMLElement, [], AppMain);
	_this.initShadowRoot(AppMain);

	const dialog_group_new = _this.shadowRoot.getElementById("group-new");
	const btn_new = _this.shadowRoot.querySelector(".btn-new");
	const list_group = _this.shadowRoot.getElementById("list-group");
	list_group.addEventListener("click", function(e){
		if(!e.target.classList.contains("group")) return;
		_this.reactiverender({group_cur: e.target.reactivedata.datavalue});
		this.querySelectorAll(".group").forEach(function(g){
			if(g.reactivedata.datavalue.name == _this.reactivedata.datavalue.group_cur?.name) g.classList.add("selected");
			else g.classList.remove("selected");
		});
	});
	btn_new.addEventListener("click", function(e){
		dialog_group_new.showModal();
	});
	dialog_group_new.addEventListener("close", function(e){
		if(this.returnValue == "N") return;
		const group = new FormData(this.firstElementChild);
		fetch("http://localhost:5000/group", {method: "POST", body: group})
		// .then(rep=>rep.json())
		.then(rep=>{
			_this.reactiverender({groups: [Object.fromEntries(group.entries())]});
			this.querySelectorAll("input").forEach(el=>el.value="");
		});
	});

	_this.elements_todo={
		dialog_group_new,
		list_group,
			item_group: _this.shadowRoot.querySelector(".group"),
		group: _this.shadowRoot.getElementById("el-group")
	};
	return _this;
}
Object.setPrototypeOf(AppMain.prototype, HTMLElement.prototype); Object.setPrototypeOf(AppMain, HTMLElement);
Object.defineProperty(AppMain, "observedAttributes", {get: function() {return []}});
AppMain.prototype.connectedCallback = function(){
	fetch("http://localhost:5000").then(rep=>rep.json())
	.then(groups=>this.reactiverender({groups: Object.defineProperty(groups, "isprimary", {value:true, enumerable:false})}));
}
AppMain.prototype.attributeChangedCallback = function(name, oldValue, newValue){}
AppMain.prototype.disconnectedCallback = function(){}
AppMain.prototype.adoptedCallback = function(){}
AppMain.prototype.reactiverender = function(delta, value){
	const {group:el_group, item_group:el_item_group}=this.elements_todo;
	if(delta.group_cur){
		el_group.reactiverender({name_torender: value.group_cur.name});
	}
	if(delta.groups){
		el_item_group.reactiverender_for(value.groups, function(delta, value){
			this.lastElementChild.innerHTML = value.name;
			if(value.name == value.group_cur?.name) this.classList.add("selected");
			else this.classList.remove("selected");
		});
	}
}

AppMain.RDCLASS = function(){
	this.construction = { isprimary: false,

	};
	return this;
}