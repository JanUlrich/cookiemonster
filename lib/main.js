var data = require("sdk/self").data;
var ss = require("sdk/simple-storage");
var tabs = require("sdk/tabs");

//Listen on CookieChange:
var events = require("sdk/system/events");
 
function listener(event) {
  console.log(JSON.stringify(event));
}
 
events.on("cookie-changed", listener);

//Include XPCOM CookieManager:
var { Cc, Ci } = require('chrome')
var cookieService = Cc['@mozilla.org/cookieService;1'].
                        getService(Ci.nsICookieService);
 
function makeURI(aURL, aOriginCharset, aBaseURI) {
  var ioService = Cc["@mozilla.org/network/io-service;1"]
                  .getService(Ci.nsIIOService);
  return ioService.newURI(aURL, aOriginCharset, aBaseURI);
}


// Construct a panel, loading its content from the "text-entry.html"
// file in the "data" directory, and loading the "get-text.js" script
// into it.
var popup = require("sdk/panel").Panel({
  contentURL: data.url("popup.html"),
  width: 600,
  height: 300,
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

  var cookies = cookieManager.getCookies(tabs.activeTab.url);
  //var cookies = "test=test";
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

var cookieManager = (function(){
  var ret = {};
  
  ret.getCookies = function(fromURL){
    var cookieString = getCookieString(fromURL),
        ret = [],
        cKeys = keys(cookieString);

    for (var i = cKeys.length - 1; i >= 0; i--) {
      var key = cKeys[i];
      ret.push({path: fromURL, name: key, value: getCookie(key, cookieString)})
    };
    return ret;
  }

  //PRIVATE FUNCTIONS:
  var getCookieString = function(fromURL){
    var uri= makeURI(fromURL, "UTF-8",null),
        cookies = cookieService.getCookieStringFromHttp(uri,uri, null);
    
    console.log("Cookies 4 "+fromURL+": "+cookies);
    return cookies;
  }

  var keys = function (cookieString) {
    var aKeys = cookieString.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
    for (var nIdx = 0; nIdx < aKeys.length; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
    return aKeys;
  }

  var getCookie = function (sKey, fromCookieString) {
    return decodeURIComponent(fromCookieString.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
  }

  return ret;
})();