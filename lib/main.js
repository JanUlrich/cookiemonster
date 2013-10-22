var data = require("sdk/self").data;
var ss = require("sdk/simple-storage");
var tabs = require("sdk/tabs");

//Include XPCOM CookieManager:
var { Class } = require('sdk/core/heritage');
var { Unknown } = require('sdk/platform/xpcom');
var { Cc, Ci } = require('chrome')
var cookieService = Cc['@mozilla.org/cookieService;1'].
                        getService(Ci.nsICookieService);
 
var CookieManager = Class({
  extends:  Unknown,
  interfaces: [ 'nsICookieService' ],
  topic: '*',
  getCookieString: function getCookieString(url) {
    console.log("Getting Cookies 4: "+ url);
    return cookieService.getCookieString(url,null);
  }
});

var cookieManager = CookieManager(); 

// Construct a panel, loading its content from the "text-entry.html"
// file in the "data" directory, and loading the "get-text.js" script
// into it.
var popup = require("sdk/panel").Panel({
  contentURL: data.url("popup.html"),
  contentScriptFile: data.url("popupcontentScript.js")
});
 
popup.on("show", function() {
	refreshCookies();
});

// Create a widget, and attach the panel to it, so the panel is
// shown when the user clicks the widget.

require("sdk/widget").Widget({
  label: "CookieMonster",
  id: "popup",
  contentURL: data.url("icon19.png"),
    panel: popup
});


// Listen for messages called "text-entered" coming from
// the content script. The message payload is the text the user
// entered.
// In this implementation we'll just log the text to the console.
popup.port.on("getStorageData", function (dataString) {
  //this.port.emit("getStorageData-result", ss.storage[dataString]);
});

popup.port.on("setStorageData", function (data, callback) {
  for (key in data) {
		ss.storage[key] = data[key];
	}
  callback();
});



popup.port.on("removeCookieInCurrentTab", function(cookieName){
	var worker = tabs.activeTab.attach({
      contentScriptFile: data.url('cookies.js')
      });
	worker.port.on("cookie_deleted", function(success){
		//if(success)popup.port.emit("removeCookieInCurrentTab-result");
	});
	worker.port.emit("start_delete", cookieName);
});

popup.port.on("getCookiesOfCurrentTab", refreshCookies);

function refreshCookies(){

  var cookies = cookieManager.getCookieString(tabs.activeTab.url);
  popup.port.emit("getCookiesOfCurrentTab-result", cookies);

	/*
  var worker = tabs.activeTab.attach({
      contentScriptFile: data.url('cookies.js')
      });
	worker.port.on("cookies", function(cookies){
		popup.port.emit("getCookiesOfCurrentTab-result", cookies);
	});
	worker.port.emit("start_refresh");
  */
}

function onOpen(tab) {
  console.log(tab.url + " is open");
  tab.on("pageshow", logShow);
  tab.on("activate", logActivate);
  tab.on("deactivate", logDeactivate);
  tab.on("close", logClose);
}
 
function logShow(tab) {
  console.log(tab.url + " is loaded");
}
 
function logActivate(tab) {
	refreshCookies();
  	console.log(tab.url + " is activated");
}
 
function logDeactivate(tab) {
  console.log(tab.url + " is deactivated");
}
 
function logClose(tab) {
  console.log(tab.url + " is closed");
}
 
tabs.on('open', onOpen);