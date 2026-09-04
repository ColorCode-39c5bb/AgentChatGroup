const templatePromise = fetch("./component/component.html")
.then(response => {
	if(!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
	return response.text();
})
.then(text => new DOMParser().parseFromString(text, "text/html"));

const requestCache = new Map([["templatePromise", templatePromise]]);

function getTemplate(moduleImportMetaUrl, templateRelativePath){
	const templateURL = new URL(templateRelativePath, moduleImportMetaUrl).href;
	if(requestCache.has(templateURL)) return requestCache.get(templateURL);
	const promise = fetch(templateURL)
		.then(response => response.text())
		.then(text => new DOMParser().parseFromString(text, "text/html"))
	requestCache.set(templateURL, promise);
	return promise;
}

export default templatePromise;
export {
	templatePromise,
	getTemplate,
	requestCache,
}