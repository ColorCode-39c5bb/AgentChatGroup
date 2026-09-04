import templatePromise from "../template.js";
templatePromise.then((templateDocument)=>{
	NotSlotted.template = templateDocument.getElementById("not-slotted");
	window.constructor_withTemplate.push(NotSlotted);
});
export default function NotSlotted(){
	const _this = Reflect.construct(HTMLElement, [], NotSlotted);
	_this.attachShadow({mode: "open"});
	_this.initShadowRoot();
	return _this;
}
Object.setPrototypeOf(NotSlotted.prototype, HTMLElement.prototype);
Object.setPrototypeOf(NotSlotted, HTMLElement);
Object.defineProperty(NotSlotted.prototype, "observedAttributes", {get: function() {return ["value"]}});
NotSlotted.prototype.connectedCallback = function(){
	
}
NotSlotted.prototype.attributeChangedCallback = function(name, oldValue, newValue){
	
}
NotSlotted.prototype.disconnectedCallback = function(){
	
}
NotSlotted.prototype.adoptedCallback = function(){
	
}