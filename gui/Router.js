export default function Router(config_route) {
	this.Ns_link_config = new Map();
	this.Ns_link_page = new Map();
	const setroute = (route)=>{
		route.forEach((route)=>{
			this.Ns_link_config.set(route.path, route);
			if(route.routes) setroute(route.routes);
		});
	}
	setroute(config_route);
	document.querySelectorAll("a[route]").forEach(a=>{
		a.href = a.getAttribute("route");
		a.addEventListener("click", (e)=>{
			e.preventDefault();
			this.push(a.getAttribute("href"));
		}, false);
	});
	document.querySelectorAll("[route]:not(a)").forEach((page)=>{
		page.page_container = page.parentElement;
		this.Ns_link_page.set(page.getAttribute("route"), page);
		page.remove();
	});

	window.addEventListener("popstate", this.render.bind(this), false);
	//window.addEventListener("load", this.render.bind(this), false);
}

Router.prototype.render = function() {
	const topath = window.location.pathname;
	const patharray = topath.split("/");
	for(let i=1, path="/"+patharray[i]; i<patharray.length; i++, path+=("/"+patharray[i])){
		const page = this.Ns_link_page.get(path);
		if(!page || page.isConnected) continue;
		page.page_container.replaceChildren(page);
		if(page.rd_torender?.length) page.reactiverender(page.__proto__.constructor.RDCLASS.flag_connectedcallback); //给没有connectedCallback逻辑的兜底，如果connectedCallback里有调用reactiverender那么到这句时已经page.rd_torender.length==0
	}
	window.dispatchEvent(new Event("routechange"));
}

Router.prototype.push = function(topath) {
	const config = this.Ns_link_config.get(topath);
	history.pushState(config.state, '', topath); //location.pathname = path;
	this.render();
	if(config.call) config.call();
}

Router.prototype.replace = function(topath) {
	const config = this.Ns_link_config.get(topath);
	history.replaceState(config.state, '', topath);
	this.render();
	if(config.call) config.call();
}