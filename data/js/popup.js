var cookiemonster = angular.module('cookiemonster', ['cookiemonsterDirectives']);
var settings = {'treat_analtytics_as_normal': false};

setting = function(name) {
	console.log(settings)
	return (settings && settings[name]);
}

function tracking_cookie(regex, category, description) {
	var tc = new Object();
	tc.regex = regex;
	tc.category = category;
	tc.description = description;
	return tc;
}

// good source: http://sociable.co/cookies/
tracking_cookies_definitions = {
	"__qca": null, // Quantacast, http://www.quantcast.com/how-we-do-it/consumer-choice/privacy-policy/
	"Google Analytics": [
		"^__utma$",
		"^__utmb$",
		"^__utmc$",
		"^__utmv$",
		"^__utmx$",
		"^__utmz$",
		"^_ga$",
	],
	"Webtrends": [
		"^WT_FPC$",
		"^WEBTRENDS_ID$",
	],
	"gaug.es": [ // Gitub tracking
		"^_gauges_unique_year$",
		"^_gauges_unique$",
		"^_gauges_unique_month$",
		"^_gauges_unique_hour$",
		"^_gauges_unique_day$",
	],
	"Piwik Web Analytics": [
		"^_pk_id\.1\.[a-fA-F0-9]{4}$",
		"^_pk_ref\.1\.[a-fA-F0-9]{4}$",
		"^_pk_cvar\.1\.[a-fA-F0-9]{4}$",
		"^_pk_ses\.1\.[a-fA-F0-9]{4}$",
	],
	"opentracker": [
		"^_otor$",
		"^_ots$",
		"^_otr$",
		"^_otui$",
		"^_otpe$",
	],
	"Maxymiser - http://www.maxymiser.com/cookies": [
		"^mmcore.pd$",
		"^mmcore.srv$",
		"^mmcore.tst$",
		"^mmid$",
		"^mmpa.rh$",
		"^mmcore.id$",
		"^mmpa.tst$",
		"^mm_([a-zA-Z0-9_])+$",
	],
	"IBM Unica NetInsight": [
		"^UnicaNIODID$"
	],
	"Optimizely": [ // https://www.optimizely.com/
		"^optimizely[A-Z].*$",
	],
	"AddThis": [ // http://www.addthis.com/ ; source: http://www.bbsrc.ac.uk/site/privacy.aspx
		"^di$", 
		"^dt$", 
		"^psc$", 
		"^uit$", 
		"^uvc$", 
		"^ssc$",
	]
}

function is_tracking_cookie(cookiename) {
	for(var category in tracking_cookies_definitions) {
		for(var signature in tracking_cookies_definitions[category]) {
			var category_name = category;
			if(cookiename.match(tracking_cookies_definitions[category][signature])) {
				return {
					category: category_name,
					signature: tracking_cookies_definitions[category][signature]
				};
			}
		}
	}
	return null;
}

function prefilter_cookie(cookie) {
	for(var i=0; i < prefilters.length; i++) {
		cookie = prefilters[i](cookie);
	}
	return cookie;
}

function filter_cookie(cookie) {
	for(var i=0; i < filters.length; i++) {
		cookie = filters[i](cookie);
	}
	return cookie;
}

function update_cookie_object(cookie) {
	cookie.is_tracking = false;
	cookie.tracking = {}
	cookie.is_known = false;
	cookie.prefilters = [];
	cookie.filters = [];
	cookie.types = [];
	cookie.undecoded_value = cookie.value;
	cookie.value = decodeURIComponent(cookie.value)

	if(cookie.hostOnly)
		cookie.types.push('hostOnly');
	if(cookie.httpOnly)
		cookie.types.push('httpOnly');
	if(cookie.secure)
		cookie.types.push('secure');
	if(cookie.session)
		cookie.types.push('session');

	var tracking;
	console.log(setting('treat_analtytics_as_normal'))
	if(!setting('treat_analtytics_as_normal')) {
		if(tracking = is_tracking_cookie(cookie.name)) {
			cookie.is_tracking = true;
			cookie.tracking = tracking;
		}
	}

	cookie = prefilter_cookie(cookie);
	cookie = filter_cookie(cookie);
	return cookie;
}

function purify_cookie(cookie, url) {
	var ret = {};
	ret.url = url;
	ret.name = cookie.name;
	ret.value = cookie.value;
	ret.domain = cookie.domain;
	ret.path = cookie.path;
	ret.secure = cookie.secure;
	ret.httpOnly = cookie.httpOnly;
	ret.expirationDate = cookie.expirationDate;
	ret.storeId = cookie.storeId;
	return ret;
}

function CookieListCtrl($scope, $rootScope) {
	$scope.tracking_categories_opened = {}
	$scope.tracking_categories = {}
	$scope.cookies = [];
	$scope.curl_command = "";
	$scope.wget_command = "";
	$scope.url = "";
	$scope.settings = settings;
	
	get_url_of_current_tab(function(url) {
		$scope.url = url;
		$scope.$apply("url");
	});

	$rootScope.$on('refreshCookies', function() {
		$scope.refresh_cookies();
	});

	$rootScope.$on('settingsChanged', function() {
		$scope.updateSettings();
		$scope.refresh_cookies();
	});

	$scope.updateSettings = function() {
		get_storage_data('settings',function(item) {
			console.log(item)
			if(!jQuery.isEmptyObject(item)) {
				$scope.settings = item['settings'];
				settings = $scope.settings;
				$scope.$apply("settings");
			}
		});
	}

	$scope.refresh_cookies = function() {
		$scope.tracking_categories = {};
		$scope.cookies = [];
		// treat_analtytics_as_normal
		get_cookies_of_current_tab(function(cookies) {
			for(var i=0; i < cookies.length; i++) {
				cookies[i] = update_cookie_object(cookies[i])
				// Set up tracking cookie categories
				if(cookies[i].is_tracking) {
					var category = cookies[i].tracking.category;
					if(!(category in $scope.tracking_categories)) {
						$scope.tracking_categories[category] = [];
					}
					$scope.tracking_categories[category].push(cookies[i])
				}
			}

			cookies.sort(function(a,b) {
				var ta = a.name.toUpperCase();
				var tb = b.name.toUpperCase();
				return (ta < tb) ? -1 : (ta > tb) ? 1 : 0;
			});

			$scope.cookies = cookies;

			$scope.curl_command = generate_curl_command(cookies, $scope.url);
			$scope.wget_command = generate_wget_command(cookies, $scope.url);

			$scope.$apply("cookies");
			$scope.$apply("curl_command");
			$scope.$apply("wget_command");
		});
	}

	$scope.save_cookie = function(cookie) {
		cookie.value = cookie.local_value;
		var ck = purify_cookie(cookie, $scope.url);

		set_cookie(ck, function() {
			$scope.$emit('refreshCookies');
		});
	}

	$scope.edit_cookie = function($event, cookie) {
		$event.stopPropagation();
		cookie.local_edit = 1;
	}

	$scope.delete_cookie = function($event, cookie) {
		remove_cookie($scope.url, cookie.name, function() {
			$scope.$emit('refreshCookies');
		});
		if($event) {
			$event.stopPropagation();
		}
	}

	$scope.clear_cookies = function() {
		for(var i in $scope.cookies) {
			$scope.delete_cookie(null, $scope.cookies[i]);
		}
	}
	
	// analyse cookie functions. Will take a cookie and a method to return value for the field cookie.analysis
	$scope.analyse = function(cookie,method) {
		console.log("run analysis "+method);
		cookie.analysis = analysis_methods[method](cookie);
	}

	$scope.updateSettings();
	$scope.refresh_cookies();
}

function CookieSnapshotsCtrl($scope, $rootScope) {
	$scope.tab = null;
	$scope.cookies = [];
	
	// Only holds snapshots for current domain
	$scope.snapshots = [];
	// Holds all snapshots
	$scope.all_snapshots = [];

	$rootScope.$on('refreshCookies', function() {
		$scope.refresh_cookies();
	});

	$scope.refresh_cookies = function() {
		get_current_tab(function(tab) {
			$scope.tab = tab[0];
			$scope.$apply("tab");
		});
		get_cookies_of_current_tab(function(cookies) {
			$scope.cookies = cookies;
			$scope.$apply("cookies");
		});
	}

	$scope.refresh_snapshots = function() {
		$scope.snapshots = [];
		$scope.all_snapshots = [];
		get_storage_data(null, function(items) {
			for(var item in items) {
				if(items[item].type != "snapshot") continue;
				if(items[item].domain !== get_domain_from_url($scope.tab.url)) {
					$scope.all_snapshots.push({
						"name": item,
						"cookies": items[item]});
				} else {
					$scope.snapshots.push({
						"name": item,
						"cookies": items[item]});
				}
			}
			$scope.$apply("snapshots");
			$scope.$apply("all_snapshots");
		});
	}

	$scope.create_snapshot = function() {
		var currentdate = new Date();
		var cookiename = get_domain_from_url($scope.tab.url) + " cookies " + currentdate.toLocaleString();
		var cookie_object = {
			type: "snapshot",
			url: $scope.tab.url,
			domain: get_domain_from_url($scope.tab.url),
			cookies: $scope.cookies
		};
		var store = {}
		store[cookiename] = cookie_object;
		set_storage_data(store, function() {
			$scope.refresh_snapshots();
		});
	}

	$scope.get_snapshot = function(name, callback) {
		get_storage_data(name, function(items) {
			for(var item in items) {
				for(var cookie in items[item].cookies) {
					var ck = items[item].cookies[cookie];

					if(!ck) continue;

					var ck_pure = purify_cookie(ck, items[item].url);

					set_cookie(ck_pure);
				}
				$scope.$emit('refreshCookies');
				if(callback) {
					callback(items[item]);
				}
			}
		});
	}

	$scope.goto_snapshot = function(name) {
		$scope.get_snapshot(name, function(snapshot) {
			console.log("Loading snapshot for URL: " + snapshot.url);
			/*
			chrome.tabs.update($scope.tab.id, {
				url: snapshot.url
			});
*/
		});
	}

	$scope.delete_snapshot = function(name) {
		remove_storage_data(name, function() {
			$scope.refresh_snapshots();
		})
	}

	// TODO: Deduplicate this code...
	$scope.delete_cookie = function(cookie) {
		remove_cookie($scope.tab.url, cookie.name, function() {
			$scope.$emit('refreshCookies');
		})
	}

	$scope.clear_cookies = function() {
		for(var i in $scope.cookies) {
			$scope.delete_cookie($scope.cookies[i]);
		}
	}

	$scope.reload_tab = function() {
		/*
		chrome.tabs.reload($scope.tab.id, null, function() {
			$scope.$emit('refreshCookies');
		});
*/
	}

	$scope.refresh_cookies();
	$scope.refresh_snapshots();
}


function SettingsCtrl($scope, $rootScope) {

	$scope.settings = settings;

	$scope.getSettings = function() {
		get_storage_data('settings',function(item) {
			if(!jQuery.isEmptyObject(item)) {
				$scope.settings = item['settings'];
				$scope.$apply("settings");
			}
		});
	}

	$scope.settingsChanged = function() {
		set_storage_data({ 'settings': $scope.settings },function() {});
		var settings = $scope.settings;
		$scope.$emit('settingsChanged');
	}

	$scope.getSettings();
}
