
function is_valid_hex(data) {
	if((data.length%2) != 0) return false;
	if(data.match(/^([a-fA-F0-9]){2,}$/)) {
		return true;
	}
	return false;
}

function is_valid_int(data) {
	if(data.match(/^[1-9][0-9]*$/)) {
		return true;
	}
	return false;
}

function is_valid_string(data) {
	if(data.match(/^[a-zA-Z0-9]+$/)) {
		return true;
	}
	return false;
}

function is_valid_float(data) {
	if(data.match(/^[1-9][0-9]*(\.|,)[0-9]+$/)) {
		return true;
	}
	return false;
}

function is_valid_base64(data) {
	// RegEx from: http://stackoverflow.com/questions/8571501/how-to-check-whether-the-string-is-base64-encoded-or-not
	if(data.match(/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/)) {
		return true;
	}
	return false;
}




function get_current_tab(callback) {
	/*
	chrome.tabs.query({"windowId":chrome.windows.WINDOW_ID_CURRENT,"active":true}, function(tab){
		callback(tab);
	});
	*/
}

function get_url_of_current_tab(callback) {
	get_current_tab(function(tab) {
		callback(tab[0].url);
	});
}

function get_domain_from_url(url) {
	// Regex from http://stackoverflow.com/questions/3689423/google-chrome-plugin-how-to-get-domain-from-url-tab-url
	return url.match(/^[\w-]+:\/*\[?([\w\.:-]+)\]?(?::\d+)?/)[1];
}
/*
TODO! (JanUlrich)
function reload_tab(tabId, callback){
	chrome.tabs.reload(tabId, null, callback);
}
*/
function get_storage_data(dataString, callback){
	var event = document.createEvent('CustomEvent');
    event.initCustomEvent("getStorageData", true, true, dataString);

    document.documentElement.addEventListener("getStorageData-result", function(event) {
        window.alert(event.detail);
      }, false);
    document.documentElement.dispatchEvent(event);

	/*var event = document.createEvent('CustomEvent');
        event.initCustomEvent("getStorageData", true, true, data);
        document.documentElement.dispatchEvent(event);
	document.documentElement.addEventListener("addon-message", function(event) {
        callback(event);
      }, false);
	self.port.emit("getStorageData", dataString, callback);
	*/
}

function set_storage_data(data, callback){
/*
	self.port.emit("setStorageData", data, callback);
*/}

function remove_storage_data(name, callback){

}

function set_cookie(cookieData, callback){

}

function remove_cookie(url, name, callback){
	var event = document.createEvent('CustomEvent');
    event.initCustomEvent("removeCookieInCurrentTab", true, true, name);
    document.documentElement.addEventListener("removeCookieInCurrentTab-result", function(event) {
        callback();
      }, false);
    document.documentElement.dispatchEvent(event);
}

function get_cookies_of_current_tab(callback) {
	var event = document.createEvent('CustomEvent');
    event.initCustomEvent("getCookiesOfCurrentTab", true, true, null);
    document.documentElement.addEventListener("getCookiesOfCurrentTab-result", function(event) {
        callback(event.detail);
      }, false);
    document.documentElement.dispatchEvent(event);
}

function generate_cookie_header_list(cookies) {
	var cookie_list = "";
	for(var i=0; i < cookies.length; i++) {
		cookie_list += cookies[i].name + "=" + cookies[i].undecoded_value + ";";
	}
	return cookie_list;
}

function generate_wget_command(cookies, url) {
	var wget_command = "wget --no-cookies --header 'Cookie: "
	wget_command += generate_cookie_header_list(cookies);
	wget_command += "' '" + url + "'";
	return wget_command;
}

function generate_curl_command(cookies, url) {
	var curl_command = "curl -LO --cookie '";
	curl_command += generate_cookie_header_list(cookies);
	curl_command += "' '" + url + "'";
	return curl_command;
}
