import templatePromise from "../template.js";
templatePromise.then((templateDocument)=>{
	BoxChat.prototype.template = templateDocument.getElementById("box-chat");
	window.constructor_withTemplate.push(BoxChat);
});
export default function BoxChat(){
	const _this = Reflect.construct(HTMLElement, [], BoxChat);
	_this.attachShadow({mode: "open"});
	_this.initShadowRoot();
	
	const form = _this.shadowRoot.querySelector("form");
	form.addEventListener("submit", function(e){
		e.preventDefault();
		_this.dispatchEvent(new CustomEvent("message-send", {
			bubbles: true,
			detail: new FormData(this),
		}));
	});

	_this.els_tooperate={
		form,
	};
	return _this;
}
Object.setPrototypeOf(BoxChat.prototype, HTMLElement.prototype);
Object.setPrototypeOf(BoxChat, HTMLElement);
Object.defineProperty(BoxChat, "observedAttributes", {get: function() {return ["value"]}});
BoxChat.prototype.connectedCallback = function(){
	
}
BoxChat.prototype.attributeChangedCallback = function(name, oldValue, newValue){
	
}
BoxChat.prototype.disconnectedCallback = function(){
	
}
BoxChat.prototype.adoptedCallback = function(){
	
}