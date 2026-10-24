import templatePromise from "../template.js";
templatePromise.then((templateDocument)=>{
	AgentDefault.template = templateDocument.getElementById("agent-default");
	window.constructor_customelement.push(AgentDefault);
});
export default function AgentDefault(){
	const _this = Reflect.construct(HTMLElement, [], AgentDefault);
	_this.initShadowRoot(AgentDefault);
	_this.elements_todo={
		detailbox: _this.shadowRoot.getElementById("detail"),
	};
	return _this;
}
Object.setPrototypeOf(AgentDefault.prototype, HTMLElement.prototype); Object.setPrototypeOf(AgentDefault, HTMLElement);
Object.defineProperty(AgentDefault, "observedAttributes", {get: function() {return []}});
AgentDefault.prototype.connectedCallback = function(){
}
AgentDefault.prototype.attributeChangedCallback = function(name, oldValue, newValue){
}
AgentDefault.prototype.disconnectedCallback = function(){
}
AgentDefault.prototype.reactiverender = function(delta){
	const {detailbox: el_detailbox}=this.elements_todo;  const rd=this.reactivedata.datavalue;
	el_detailbox.firstElementChild.innerHTML = rd.source;
}

//AgentDefault.RDCLASS = function(){
//	this.construction = {
//		mergemode: "mode_incremental", isprimary: false,
//		
//	};
//	return this;
//}