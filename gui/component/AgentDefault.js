import templatePromise from "../template.js";
templatePromise.then((templateDocument)=>{
	AgentDefault.prototype.template = templateDocument.getElementById("agent-default");
	window.constructor_customelement.push(AgentDefault);
});
export default function AgentDefault(){
	const _this = Reflect.construct(HTMLElement, [], AgentDefault);
	_this.attachShadow({mode: "open"});
	_this.initShadowRoot();

	_this.els = {
		detailbox: _this.shadowRoot.getElementById("detail"),
	}
	return _this;
}
Object.setPrototypeOf(AgentDefault.prototype, HTMLElement.prototype);
Object.setPrototypeOf(AgentDefault, HTMLElement);
Object.defineProperty(AgentDefault, "observedAttributes", {get: function() {return []}});
AgentDefault.prototype.connectedCallback = function(){
}
AgentDefault.prototype.attributeChangedCallback = function(name, oldValue, newValue){
	
}
AgentDefault.prototype.disconnectedCallback = function(){
	
}
AgentDefault.prototype.adoptedCallback = function(){
}
AgentDefault.prototype.reactiverender = function(rd){
	this.els.detailbox.firstElementChild.innerHTML = rd.source;
}