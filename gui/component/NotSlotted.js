import templatePromise from "../template.js";
templatePromise.then((templateDocument)=>{
	NotSlotted.template = templateDocument.getElementById("not-slotted");
	window.constructor_customelement.push(NotSlotted);
});
export default function NotSlotted(){
	const _this = Reflect.construct(HTMLElement, [], NotSlotted);
	_this.initShadowRoot(NotSlotted);
	_this.elements_todo={};
	return _this;
}
Object.setPrototypeOf(NotSlotted.prototype, HTMLElement.prototype); Object.setPrototypeOf(NotSlotted, HTMLElement);
Object.defineProperty(NotSlotted, "observedAttributes", {get: function() {return []}});
NotSlotted.prototype.connectedCallback = function(){
}
NotSlotted.prototype.attributeChangedCallback = function(name, oldValue, newValue){
}
NotSlotted.prototype.disconnectedCallback = function(){
}
NotSlotted.prototype.adoptedCallback = function(){
}