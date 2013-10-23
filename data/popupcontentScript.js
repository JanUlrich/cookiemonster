/*
Executed in the cookiemonster popup to communicate with addon-sdk (main.js)
*/
document.documentElement.addEventListener("getStorageData", function(event) {
  
	self.port.emit("getStorageData", event.detail);
	
}, false);

self.port.on("getStorageData-result", function getStorageDataCallback(result) {
  var event = document.createEvent('CustomEvent');
	event.initCustomEvent("getStorageData-result", true, true, result);
	document.documentElement.dispatchEvent(event);
});

document.documentElement.addEventListener("getCookiesOfCurrentTab", function(event) {
	self.port.emit("getCookiesOfCurrentTab");
}, false);

self.port.on("getCookiesOfCurrentTab-result", function(cookies){
		var event = document.createEvent('CustomEvent');
		event.initCustomEvent("getCookiesOfCurrentTab-result", true, true, cookies);
		document.documentElement.dispatchEvent(event);
	});


document.documentElement.addEventListener("removeCookieInCurrentTab", function(event) {
	self.port.emit("removeCookieInCurrentTab", event.detail);
}, false);

self.port.on("removeCookieInCurrentTab-result", function(){
		var event = document.createEvent('CustomEvent');
		event.initCustomEvent("removeCookieInCurrentTab-result", true, true, null);
		document.documentElement.dispatchEvent(event);
	});