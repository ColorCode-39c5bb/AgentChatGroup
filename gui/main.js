HTMLElement._render = function(render){
	return function(rd, render_acquired){
		this.rd_torender ??= [];
		this.rd_torender.push(rd);
		if(this.__proto__.constructor == HTMLElement) return; //排除还没有升级的自定义元素
		if(!this.isConnected) return;

		this.reactivedata ??= new DataReactive(); //自定义元素在初始化时已确保，此句仅作用于内置元素
		this.reactivedata.datadelta = undefined;
		this.reactivedata.merge(this.rd_torender);
		this.rd_torender.length = 0;
		render.call(this, this.reactivedata.datadelta, render_acquired);
	};
};

HTMLElement._connectedcallback = function(connectedcallback){
	return function(){
		if(this.rd_torender?.length) this.reactiverender(DataReactive.flag_connectedcallback);
		return connectedcallback.call(this);
	}
};

const defaultStyleSheet = new CSSStyleSheet();
for(let i=1; i<document.styleSheets[0].cssRules.length; i++) defaultStyleSheet.insertRule(document.styleSheets[0].cssRules[i].cssText);
HTMLElement.prototype.initShadowRoot = function(C){
	this.attachShadow({mode: "open"}); 
	this.shadowRoot.adoptedStyleSheets.push(defaultStyleSheet);
	this.reactivedata = C.RDCLASS ? C.RDCLASS.call(Reflect.construct(DataReactive, [], C.RDCLASS)) : new DataReactive(); //this.reactivedata = this.RDCLASS.call(DataReactive.call(Object.create(this.RDCLASS.prototype)));
	this.shadowRoot.appendChild(C.template.content.cloneNode(true));
	this.shadowRoot.querySelectorAll(".fold-trigger").forEach(btn=>btn.addEventListener("click", (e)=>btn.parentElement.classList.toggle("fold")));
	this.shadowRoot.querySelectorAll(".fold-trigger").forEach(btn=>btn.parentElement.classList.add("fold"));
}

HTMLElement.prototype.reactiverender = HTMLElement._render(function(rd_merged, render_acquired){
	//到这里只有内置元素
	if(typeof(render_acquired)!="function") return;
	render_acquired.call(this, rd_merged);
});

HTMLElement.prototype.reactiverender_for = function(rdarray, render_acquired){
	//if(!rdarray) throw new Error("rdarray必须是数组, 否则此方法不应该有机会调用");
	this.Ns_active ??= [this];
	this.Ns_inactive ??= [];
	this.container ??= this.parentElement;
	for(let i=0; i<rdarray.length; i++){
		let next = this.Ns_active[i];
		if(!next){
			next = this.Ns_inactive.pop();
			if(!next) next = this.cloneNode(true);
			this.container.appendChild(next);
			this.Ns_active.push(next);
		}
		next.reactiverender(rdarray[i], render_acquired);
	}
	for(let j=this.Ns_active.length-rdarray.length; j>0; j--){
		const item = this.Ns_active.pop();
		item.remove();
		this.Ns_inactive.push(item);
	}
};


function DataReactive(type="raw"){
	this.datatype = type;
	return this;
}
DataReactive.prototype.construction_default = {mergemode: false, isprimary: true};
Object.defineProperties(DataReactive.prototype, {
	datatype: {set(v){Object.defineProperty(this, "datatype", {value: v, enumerable: false});}, get(){return undefined}},
	datadelta: {set(v){Object.defineProperty(this, "datadelta", {value: v, enumerable: false, configurable: true, writable: true});}, get(){return undefined}},
	datavalue: {set(v){Object.defineProperty(this, "datavalue", {value: v, enumerable: false, configurable: true, writable: true});}, get(){return undefined}},
	construction: {set(v){Object.defineProperty(this, "construction", {value: v, enumerable: false});}, get(){return this.construction_default}},
});
DataReactive.prototype.merge = function(rd_torender, keys_transitive=[]){
	function update(dt, dd, construction){ Object.keys(dd).forEach((k)=>{
		if(dd[k]===null) dd[k] = structuredClone(construction[k]?.data_default);
		switch(get_mode(dd[k], construction[k])){
			case "mode_transitive":
				const keypath = construction.keypath+"."+k;
				if(!keys_transitive.includes(keypath)){
					keys_transitive.push(keypath);
					dt[k] = Object.defineProperties(new DataReactive("type_multiple"), {datadelta: {value: []}, mergemode: {value: "mode_incremental", enumerable: false}, isprimary: {value: true, enumerable: false}});
				}
				return dt[k].datadelta.push(dd[k]);
			case false: case "mode_full":
				if(dd[k]===undefined) return dt[k]=dd[k];
				if(dd[k].__proto__.constructor==Array) return dt[k]=dd[k];
				break;
			case true: case "mode_incremental":
				if(dd[k]===undefined) return;
				if(dd[k].__proto__.constructor==Array){
					if(dt[k]===undefined) return dt[k]=dd[k]; //dt[k]=[]; dt[k].push(...dd[k]);
					else return dt[k].push(...dd[k]);
				}
				break;
		}
		if(get_isprimary(dd[k], construction[k]) || typeof(dd[k])!="object") return dt[k]=dd[k];
		if(dt[k]===undefined) dt[k] = {};
		update(dt[k], dd[k], Object.defineProperty(construction[k], "keypath", {value: construction.keypath+"."+k, configurable: true}));
	});}
	function get_mode(dd, construction){
		for(let m of [dd?.mergemode, construction?.mergemode]) if(m!==undefined) return m;
		return "mode_full";
	}
	function get_isprimary(dd, construction){
		for(let p of [dd?.isprimary, construction?.isprimary]) if(p!==undefined) return p;
		return true;
	}

	for(let rd of rd_torender){
		switch(rd?.datatype){
			case "type_nothing": continue;
			case "type_multiple": this.merge(rd.datadelta, keys_transitive); continue;
		}
		// case undefined:
		Object.defineProperty(DataReactive.const_dd, "datadelta", {value: rd, enumerable: true});
		update(this, DataReactive.const_dd, {datadelta: this.construction, keypath: ""});
	};
	Object.defineProperty(DataReactive.const_dd, "datadelta", {enumerable: false});
	DataReactive.const_dd.datavalue = this.datadelta;
	Object.defineProperty(DataReactive.const_dd, "datavalue", {enumerable: true});
	update(this, DataReactive.const_dd, {datavalue: this.construction, keypath: ""});
	Object.defineProperty(DataReactive.const_dd, "datavalue", {enumerable: false});
};
DataReactive.flag_connectedcallback = new DataReactive("type_nothing");
DataReactive.const_dd = new DataReactive(); DataReactive.const_dd.datadelta = undefined; DataReactive.const_dd.datavalue = undefined;

//import Router from "./Router.js";
//import config_route from "./config/config_route.js";
//window.router = new Router(config_route);
//window.router.push("/");
import {requestCache} from "./template.js";
window.constructor_customelement = [];
Promise.all(requestCache.values()).then(()=>{
	for(let C of constructor_customelement){
		C.prototype.reactiverender = HTMLElement._render(C.prototype.reactiverender);
		C.prototype.connectedCallback = HTMLElement._connectedcallback(C.prototype.connectedCallback);
		if(C.RDCLASS) Object.setPrototypeOf(C.RDCLASS.prototype, DataReactive.prototype);
	}
	for(let C of constructor_customelement) customElements.define(C.template.id, C);
});
import NotSlotted from "./component/NotSlotted.js";
import AppMain from "./component/AppMain.js";


window.TRUE = {value: true, enumerable: false};
window.FALSE = {value: false, enumerable: false};
import AgentDefault from "./component/AgentDefault.js";
import GroupDefault from "./component/GroupDefault.js";
import BoxChat from "./component/BoxChat.js";