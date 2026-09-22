HTMLElement._render = function(render){
	return function(rd, render_acquired){
		this.rd_torender ??= [];
		this.rd_torender.push(rd);
		if(this.__proto__.constructor == HTMLElement) return; //排除还没有升级的自定义元素
		if(!this.isConnected) return;

		this.reactivedata ??= new DataReactive(); //自定义元素在初始化时已确保，此句仅作用于内置元素
		render.call(this, this.reactivedata.merge(this.rd_torender), render_acquired);
		this.rd_torender = undefined;
	};
};

HTMLElement._connectedcallback = function(connectedcallback){
	return function(){
		if(this.rd_torender) this.reactiverender();
		return connectedcallback.call(this);
	}
};

const defaultStyleSheet = new CSSStyleSheet();
for(let i=1; i<document.styleSheets[0].cssRules.length; i++) defaultStyleSheet.insertRule(document.styleSheets[0].cssRules[i].cssText);
HTMLElement.prototype.initShadowRoot = function(){
	if(this.shadowRoot == null) new Error("未开启ShadowRoot");
	this.reactivedata = this.RDCLASS.call(Reflect.construct(DataReactive, [], this.RDCLASS));
	this.shadowRoot.adoptedStyleSheets.push(defaultStyleSheet);
	this.shadowRoot.appendChild(this.template.content.cloneNode(true));
	this.shadowRoot.querySelectorAll(".fold-trigger").forEach(btn=>btn.addEventListener("click", (e)=>btn.parentElement.classList.toggle("fold")));
	// this.shadowRoot.querySelectorAll(".fold-trigger").forEach(btn=>btn.parentElement.classList.add("fold"));
}

HTMLElement.prototype.reactiverender = HTMLElement._render(function(rd_merged, render_acquired){
	//到这里只有内置元素
	if(typeof(render_acquired)!="function") return;
	render_acquired.call(this, rd_merged);
});

HTMLElement.prototype.reactiverender_for = function(rdarray, render_acquired){
	//if(!rdarray) throw new Error("rdarray必须是数组, 否则此方法不应该有机会调用");
	if(rdarray === undefined) return;
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


function DataReactive(){
	Object.defineProperty(this, "construction", {value: {i_f: false, isprimary: true}, enumerable: false, writable: true});
	return this;
}

DataReactive.prototype.merge = function(rd_torender){
	function f(dt, dd, construction){
		if(dd.i_f===undefined?construction.i_f:dd.i_f){
			Object.keys(dd).forEach((k)=>{
				if(!dt[k]) return dt[k]=dd[k];
				if(dd[k].i_f===undefined?construction[k].i_f:dd[k].i_f){
					if(!dd[k]) return;
					if(dd[k].__proto__.constructor==Array) return dt[k].push(...dd[k]);
				}else{
					if(!dd[k]) return dt[k]=dd[k];
					if(dd[k].__proto__.constructor==Array) return dt[k]=dd[k];
				}
				if(dd[k].isprimary===undefined?construction[k].isprimary:dd[k].isprimary || typeof(dd[k])=="object") return dt[k]=dd[k];
				dt[k] = f(dt[k], dd[k], construction[k]);
			});
			return dt;	
		} else {
			Object.keys(dt).forEach((k)=>{
				if(!dt[k]) return;
				if(dd[k].i_f===undefined?construction[k].i_f:dd[k].i_f){
					if(!dd[k]) return dd[k]=dt[k];
					if(dd[k].__proto__.constructor==Array){
						dt[k].push(...dd[k]);
						return dd[k] = dt[k];
					}
				}else{
					if(!dd[k]) return;
					if(dd[k].__proto__.constructor==Array) return dt[k]=dd[k];
				}
				if(dd[k].isprimary===undefined?construction[k].isprimary:dd[k].isprimary || typeof(dd[k])=="object") return;
				dd[k] = f(dt[k], dd[k], construction[k]);
			});
			return dd;
		}
	}
	for(let rd of rd_torender) f(this, {value: rd}, Object.defineProperty({value: this.construction}, "i_f", {value: true}));
	return this.value;
};


import {requestCache} from "./template.js";
import NotSlotted from "./component/NotSlotted.js";
import AppMain from "./component/AppMain.js";
window.TRUE = {value: true, enumerable: false};
window.FALSE = {value: false, enumerable: false};
window.constructor_customelement = [];
//window.router = new Router(config_route);
//window.router.push("/home");
Promise.all(requestCache.values()).then(()=>{
	const appmain = document.getElementById("appmain");
	appmain.remove();
	constructor_customelement.forEach((C)=>{
		C.prototype.reactiverender = HTMLElement._render(C.prototype.reactiverender);
		C.prototype.connectedCallback = HTMLElement._connectedcallback(C.prototype.connectedCallback);
		if(C.prototype.RDCLASS) Object.setPrototypeOf(C.prototype.RDCLASS.prototype, DataReactive.prototype);
		else C.prototype.RDCLASS = DataReactive;
		customElements.define(C.prototype.template.id, C);
	});
	document.body.appendChild(appmain);
});

import AgentDefault from "./component/AgentDefault.js";
import GroupDefault from "./component/GroupDefault.js";
import BoxChat from "./component/BoxChat.js";