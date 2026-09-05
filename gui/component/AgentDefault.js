import templatePromise from "../template.js";
templatePromise.then((templateDocument)=>{
	AgentDefault.prototype.template = templateDocument.getElementById("agent-default");
	window.constructor_withTemplate.push(AgentDefault);
});
export default function AgentDefault(){
	const _this = Reflect.construct(HTMLElement, [], AgentDefault);
	_this.attachShadow({mode: "open"});
	_this.initShadowRoot();
	
	_this.els_tooperate={
		
	};
	return _this;
}
Object.setPrototypeOf(AgentDefault.prototype, HTMLElement.prototype);
Object.setPrototypeOf(AgentDefault, HTMLElement);
Object.defineProperty(AgentDefault, "observedAttributes", {get: function() {return ["value"]}});
AgentDefault.prototype.connectedCallback = function(){
	
}
AgentDefault.prototype.attributeChangedCallback = function(name, oldValue, newValue){
	
}
AgentDefault.prototype.disconnectedCallback = function(){
	
}
AgentDefault.prototype.adoptedCallback = function(){
	
}