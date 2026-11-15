HTMLElement._render = function(render){
	return function(rd, render_acquired){
		this.rd_torender ??= [];
		this.rd_torender.push(rd);
		if(this.__proto__.constructor==HTMLElement && this.tagName.includes("-")) return; //排除还没有升级的自定义元素
		if(!this.isConnected) return;

		this.reactivedata ??= new this.__proto__.constructor.RDCLASS(); //自定义元素在初始化时已确保，此句仅作用于内置元素
		this.reactivedata.datadelta = undefined;
		this.reactivedata.merge(this.rd_torender);
		this.rd_torender.length = 0;
		render.call(this, this.reactivedata.datadelta, this.reactivedata.datavalue, render_acquired);
	};
};

const defaultStyleSheet = new CSSStyleSheet();
for(let i=1; i<document.styleSheets[0].cssRules.length; i++) defaultStyleSheet.insertRule(document.styleSheets[0].cssRules[i].cssText);
HTMLElement.prototype.initShadowRoot = function(C){
	this.attachShadow({mode: "open"});
	this.shadowRoot.adoptedStyleSheets.push(defaultStyleSheet);
	this.reactivedata = C.RDCLASS.__proto__.constructor==DataReactive ? new C.RDCLASS() : C.RDCLASS.call(Reflect.construct(DataReactive, [], C.RDCLASS)); //this.reactivedata = this.RDCLASS.call(DataReactive.call(Object.create(this.RDCLASS.prototype)));
	this.shadowRoot.appendChild(C.template.content.cloneNode(true));
	this.shadowRoot.querySelectorAll(".fold-trigger").forEach(btn=>btn.addEventListener("click", (e)=>btn.parentElement.classList.toggle("fold")));
	this.shadowRoot.querySelectorAll(".fold-trigger").forEach(btn=>btn.parentElement.classList.add("fold"));
}

HTMLElement.prototype.reactiverender = HTMLElement._render(function(delta, value, render_acquired){
	//到这里只有内置元素
	if(typeof(render_acquired)!="function") return;
	render_acquired.call(this, delta, value);
});

HTMLElement.prototype.reactiverender_for = function(rdarray, render_acquired){
	//if(!rdarray) throw new Error("rdarray必须是数组, 否则此方法不应该有机会调用");
	this.Ns_active ??= [this];
	this.Ns_inactive ??= [];
	this.container ??= this.parentElement;
	rdarray.forEach((rdi, i)=>{ //数组、可迭代对象
		let next = this.Ns_active[i];
		if(!next){
			next = this.Ns_inactive.pop();
			if(!next) next = this.cloneNode(true);
			this.container.appendChild(next);
			this.Ns_active.push(next);
		}
		next.reactiverender(rdi, render_acquired);
	});
	for(let j=this.Ns_active.length-rdarray.length; j>0; j--){
		const item = this.Ns_active.pop();
		item.remove();
		this.Ns_inactive.push(item);
	}
};


function DataReactive(type){
	this.datatype = type;
	this.datadelta = undefined; this.datavalue = undefined;
	return this;
}
Object.defineProperties(DataReactive.prototype, {
	datatype: {set(v){Object.defineProperty(this, "datatype", {value: v, enumerable: false, writable: true});}, get(){return undefined}},
	construction: {set(v){Object.defineProperty(this, "construction", {value: v, enumerable: false});}, get(){return undefined}},
	datadelta: {set(v){Object.defineProperty(this, "datadelta", {value: v, enumerable: false, configurable: true, writable: true});}, get(){return undefined}},
	datavalue: {set(v){Object.defineProperty(this, "datavalue", {value: v, enumerable: false, configurable: true, writable: true});}, get(){return undefined}},
});
function get_mergemode(d, c){ for(let m of [d?.mergemode, c?.mergemode]) if(m!==undefined) return m; return "mode_incremental"; }
function get_isprimary(d, c){ for(let p of [d?.isprimary, c?.isprimary]) if(p!==undefined) return p; return true; }
DataReactive.prototype.update_property = function(dt, dd, construction, keys_transitive=[]){
	if(dt instanceof Promise) return dt.then(dt_pv=>this.update_property(dt_pv, dd, construction, keys_transitive));
	if(dt===undefined) dt = {}; //为处理所有嵌套dd[k]==null
	Object.keys(dd).forEach((k)=>{
		if(dd[k]?.datatype=="type_torender") return dd[k].datavalue.forEach(ddki=>dt=this.update_property(dt, Object.fromEntries([[k,ddki]]), construction, keys_transitive)); //对于delta->value，遍历复制到value里
		if(dd[k]===null) dd[k] = structuredClone(construction[k]?.data_default);
		switch(get_mergemode(dd[k], construction[k])){
			case "mode_transitive":
				const keypath = construction.keypath+"."+k;
				if(!keys_transitive.includes(keypath)){
					keys_transitive.push(keypath);
					dt[k] = Object.defineProperty(new DataReactive("type_torender"), "datavalue", {value: []});
				}
				return dt[k].datavalue.push(dd[k]);
			case "mode_incremental":
				if(get_isprimary(dd[k], construction[k]) || typeof(dd[k])!="object") return dt[k]=dd[k]; //dd[k]=undefined
				if(dd[k].__proto__.constructor==Array){
					if(dt[k]===undefined) return dt[k]=dd[k];//dt[k]=[]; dt[k].push(...dd[k]);
					return dt[k].push(...dd[k]);
				}
				if(dt[k]==dd[k]) return;
				if(dd[k].__proto__.constructor==Promise){
					return dt[k]=dd[k].then(ddk_pv=>this.update_property(dt, Object.fromEntries([[k,ddk_pv]]), construction, keys_transitive)[k]);
				}
				break;
			//case "mode_decremental":
			//	break;
		}
		//Object
		dt[k] = this.update_property(dt[k], dd[k], Object.defineProperty(construction[k], "keypath", {value: construction.keypath+"."+k, configurable: true}), keys_transitive);
	});
	return dt;
}
DataReactive.prototype.merge = function(rd_torender){
	const keys_transitive = [];
	for(let rd of rd_torender){ switch(rd?.datatype){
		case "type_skipping":
			break;
		default: //type_torender、undefined
			this.update_property(this, Object.defineProperty(DataReactive.const_dd, "datadelta", {value: rd, enumerable: true}), {datadelta: this.construction, keypath: ""}, keys_transitive);
			break;
	}}
	Object.defineProperty(DataReactive.const_dd, "datadelta", {enumerable: false});
	DataReactive.const_dd.datavalue = this.datadelta;
	Object.defineProperty(DataReactive.const_dd, "datavalue", {enumerable: true});
	this.update_property(this, DataReactive.const_dd, {datavalue: this.construction, keypath: ""});
	Object.defineProperty(DataReactive.const_dd, "datavalue", {enumerable: false});
};
DataReactive.flag_connectedcallback = new DataReactive("type_skipping");
DataReactive.const_dd = new DataReactive();

HTMLElement.RDCLASS = DataReactive;

//import Router from "./Router.js";
//import config_route from "./config/config_route.js";
//window.router = new Router(config_route);
import {requestCache} from "./template.js";
window.constructor_customelement = [];
Promise.all(requestCache.values()).then(()=>{
	for(let C of constructor_customelement){
		C.prototype.reactiverender = HTMLElement._render(C.prototype.reactiverender);
		if(C.RDCLASS==DataReactive) continue;
		Object.setPrototypeOf(C.RDCLASS, DataReactive);
		Object.setPrototypeOf(C.RDCLASS.prototype, DataReactive.prototype);
	}
	for(let C of constructor_customelement) customElements.define(C.template.id, C);
});
//window.router.push("/");

//import NotSlotted from "./component/NotSlotted.js";
import AppMain from "./component/AppMain.js";
import AgentDefault from "./component/AgentDefault.js";
import GroupDefault from "./component/GroupDefault.js";
import BoxChat from "./component/BoxChat.js";