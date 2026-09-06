HTMLElement._render = function(render){
	return function(rd_delta, render_acquired, merge_acquired){
		this.rd_torender ??= [];
		this.rd_torender.push(rd_delta);
		if(this.__proto__.constructor == HTMLElement) return; //排除还没有升级的自定义元素
		if(!this.isConnected) return;

		this.reactivedata ??= new DataReactive(); //自定义元素在初始化时已确保，此句仅作用于内置元素
		rd_delta = this.reactivedata.merge(this.rd_torender);
		if(rd_delta !== undefined) render.call(this, rd_delta, render_acquired, merge_acquired); //null放行，可以作为自定义信号
		// if(this.reactivedata.isequal(rd_delta)) render.call(this, rd_delta, render_acquired, merge_acquired);
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
	if(this.shadowRoot == null) return;
	this.reactivedata = new this.RDCLASS();
	this.shadowRoot.adoptedStyleSheets.push(defaultStyleSheet);
	this.shadowRoot.appendChild(this.template.content.cloneNode(true));
}

HTMLElement.prototype.reactiverender = HTMLElement._render(function(rd_delta, render_acquired, merge_acquired){
	//到这里只有内置元素
	if(typeof(render_acquired)!="function") return;
	render_acquired.call(this, merge_acquired ? merge_acquired.call(this.reactivedata, this.rd_torender) : rd_delta);
});

HTMLElement.prototype.reactiverender_for = function(rdarray, render_acquired, merge_acquired){
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
		next.reactiverender(rdarray[i], render_acquired, merge_acquired);
	}
	for(let j=this.Ns_active.length-rdarray.length; j>0; j--){
		const item = this.Ns_active.pop();
		item.remove();
		this.Ns_inactive.push(item);
	}
};


function DataReactive(rd_raw){
	Object.assign(this, rd_raw);
}

DataReactive.prototype.merge = function(Ns_rd_delta){
	const rd_delta = Ns_rd_delta.reduce(function(prev, cur){
		if(!prev) return cur; //if(!cur) return prev;
		return Object.assign(prev, cur);
	});
	Object.assign(this, rd_delta);
	return rd_delta;
};

DataReactive.prototype.isequal = function(o){
	return this == o;
};


import {requestCache} from "./template.js";
import NotSlotted from "./component/NotSlotted.js";
import AppMain from "./component/AppMain.js";
window.constructor_withTemplate = [];
//window.router = new Router(config_route);
//window.router.push("/home");
Promise.all(requestCache.values()).then(()=>{
	const appmain = document.getElementById("appmain");
	appmain.remove();
	constructor_withTemplate.forEach((C)=>{
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