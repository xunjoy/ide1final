// Copyright 2011 Google Inc. All Rights Reserved.
/**
 * @fileoverview Common functions for the Personal Blocklist Chrome extension.
 * @author manuelh@google.com (Manuel Holtz)
 * @tweaker mrsetht@gmail.com (Seth Thompson)
 */
/**
 * The URL and path to the gen_204 GWS endpoint.
 * @type {string}
 */
var GEN_204_URL = 'http://www.google.com/gen_204?';

/**
 * The URL of gNBlocklist management.
 */
var GOOGLE_BLOCKLIST_URL = 'http://www.google.com/reviews/t?hl=' +
    chrome.i18n.getMessage('@@ui_locale');

/**
 * Boundary used for google to detect batch upload.
 */
var GOOGLE_POST_BOUNDARY = '----WebKitFormBoundaryGAFchuwStnPEXbaT';

/**
 * The oi ("onebox information") tag that identifies 204s as Site blocker.
 * @type {string}
 */
var BLOCKER_OI = 'site_blocker';

var gNBlocklist = {};

/**
 * Namespace for common functions of the Blocklist Chrome extension.
 * @const
 */
gNBlocklist.common = {};

gNBlocklist.common.GETBLOCKLIST = 'getBlocklist';
gNBlocklist.common.ADDTOBLOCKLIST = 'addToBlocklist';
gNBlocklist.common.SETISSILENT = 'setIsSilent';
gNBlocklist.common.ADDBULKTOBLOCKLIST = 'addBulkToBlocklist';
gNBlocklist.common.DELETEFROMBLOCKLIST = 'deleteFromBlocklist';
gNBlocklist.common.EXPORTTOGOOGLE = 'exportToGoogle';
gNBlocklist.common.FINISHEXPORT = 'finishExport';

/**
 * Batch size for logging bulk added patterns to gen_204.
 * @type {int}
 */
gNBlocklist.common.LOG_BATCH_SIZE = 10;

/**
 * Regular expression to strip whitespace.
 * @type {RegExp}
 */
gNBlocklist.common.STRIP_WHITESPACE_REGEX = new RegExp('^\s+|\s+$', 'g');

/**
 * A regular expression to find the host for a url.
 * @type {RegExp}
 */
gNBlocklist.common.HOST_REGEX = new RegExp(
    '^https?://(www[.])?([0-9a-zA-Z.-]+).*$');

/**
 * Logs an action by sending an XHR to www.google.com/gen_204.
 * The logging action may in the form of:
 * block/release [site].
 * @param {Object} request The detail request containing site and search event
 * id.
 * @private
 */
gNBlocklist.common.logAction_ = function(request) {
    var site = request.pattern;
    var eid = request.ei;
    var action = request.type;
    // Ignore logging when user is under https search result page.
    if (request.enc) {
        return;
    }
    //I don't log anywhere so...
    return;

    var args = [
        'atyp=i',
        'oi=' + BLOCKER_OI,
        'ct=' + action,
        'ei=' + eid,
        'cad=' + encodeURIComponent(site)
    ];
    var url = GEN_204_URL + args.join('&');
    try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true /* async */ );
        xhr.send();
    } catch (e) {
        // Unable to send XHR.
    }
};

/**
 * Provides read & write access to local storage for content scripts.
 */
gNBlocklist.common.startBackgroundListeners = function() {
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
			console.log('common.startBackgroundListeners-' + request.type);
			if (request.type == gNBlocklist.common.GETBLOCKLIST) {
				var gNBlocklistPatterns = [];
                if (!localStorage.gNBlocklist) {
                    localStorage['gNBlocklist'] = JSON.stringify(gNBlocklistPatterns);
                } else {
                    gNBlocklistPatterns = JSON.parse(localStorage['gNBlocklist']);
                }
				var gNIsSilent = false;
                if (!localStorage.gNIsSilent || localStorage.gNIsSilent === undefined) {
                    localStorage['gNIsSilent'] = JSON.stringify(gNIsSilent);
                } else {
                    gNIsSilent = JSON.parse(localStorage['gNIsSilent']);
                }
                var resultPatterns = [];
                if (request.num != undefined && request.num > 0) {
                    resultPatterns = gNBlocklistPatterns.slice(
                        request.start, request.start + request.num);
                } else {
                    resultPatterns = gNBlocklistPatterns;
                }
                resultPatterns.sort();
                sendResponse({
                    gNBlocklist: resultPatterns,
                    gNIsSilent: gNIsSilent,
                    start: request.start,
                    num: request.num,
                    total: gNBlocklistPatterns.length
                });
            } else if (request.type == gNBlocklist.common.SETISSILENT) {
                localStorage['gNIsSilent'] = JSON.stringify(request.gNIsSilent);

                sendResponse({
                    success: 1
                });
            } else if (request.type == gNBlocklist.common.ADDTOBLOCKLIST) {
                var bls = JSON.parse(localStorage['gNBlocklist']);
                if (bls.indexOf(request.pattern) == -1) {
                    bls.push(request.pattern);
                    bls.sort();
                    localStorage['gNBlocklist'] = JSON.stringify(bls);
                    gNBlocklist.common.logAction_(request);
                }
				sendResponse({
                    success: 1,
                    pattern: request.pattern
                });
            } else if (request.type == gNBlocklist.common.ADDBULKTOBLOCKLIST) {
                var bls = JSON.parse(localStorage['gNBlocklist']);
                var countBefore = bls.length;
                var log_patterns = new Array();
                for (var i = 0; i < request.patterns.length; i++) {
                    if (bls.indexOf(request.patterns[i]) == -1) {
                        bls.push(request.patterns[i]);
                        log_patterns.push(request.patterns[i]);
                    }
                    // Log to gen_204 in batches of 10 patterns.
                    if (log_patterns.length >= gNBlocklist.common.LOG_BATCH_SIZE) {
                        request.pattern = log_patterns.join('|');
                        gNBlocklist.common.logAction_(request);
                        log_patterns = new Array();
                    }
                }
                if (log_patterns.length > 0) {
                    request.pattern = log_patterns.join('|');
                    gNBlocklist.common.logAction_(request);
                }
                bls.sort();
                localStorage['gNBlocklist'] = JSON.stringify(bls);
                sendResponse({
                    success: 1,
                    count: bls.length - countBefore
                });
            } else if (request.type == gNBlocklist.common.DELETEFROMBLOCKLIST) {
                var bls = JSON.parse(localStorage['gNBlocklist']);
                var index = bls.indexOf(request.pattern);
                if (index != -1) {
                    bls.splice(index, 1);
                    localStorage['gNBlocklist'] = JSON.stringify(bls);
                    gNBlocklist.common.logAction_(request);
                }
                sendResponse({
                    success: 1,
                    pattern: request.pattern
                });
            } else if (request.type == gNBlocklist.common.EXPORTTOGOOGLE) {
                gNBlocklist.common.sendTokenRequest(sendResponse);
            } else if (request.type == gNBlocklist.common.FINISHEXPORT) {
                var isDisable = true;
                if (localStorage['disabled'] == 'true') {
                    isDisable = true;
                } else {
                    isDisable = false;
                }
                chrome.management.setEnabled(
                    chrome.i18n.getMessage("@@extension_id"), !isDisable);
            }
        });
};

/**
 * Sends request of exporting list of sites to google.
 * @param {string} token security token got from the token request.
 * @param {Function} sendResponse response callback.
 */
gNBlocklist.common.sendExportRequest = function(token, sendResponse) {
    try {
        var gNBlocklistPatterns = [];
        if (localStorage['gNBlocklist']) {
            gNBlocklistPatterns = JSON.parse(localStorage['gNBlocklist']);
        }
        var xhr = new XMLHttpRequest();
        var body = gNBlocklist.common.constructPostBody_(token, gNBlocklistPatterns);
        xhr.open('POST', GOOGLE_BLOCKLIST_URL, true);
        xhr.setRequestHeader(
            'Content-Type', 'multipart/form-data; boundary=' +
            GOOGLE_POST_BOUNDARY);
        xhr.setRequestHeader(
            'Content-Length', body.length);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    sendResponse({
                        success: 1,
                        responseText: xhr.responseText
                    });
                } else {
                    sendResponse({
                        success: 0,
                        responseText: xhr.responseText,
                        responseStatus: xhr.status
                    });
                }
            }
        };
        xhr.send(body);
    } catch (e) {
        // Not sucessful.
        sendResponse({
            success: 0,
            responseText: xhr.responseText,
            reponseStatus: xhr.status
        });
    }
};

/**
 * Gets security token from google.
 * @param {Function} sendResponse response callback.
 */
gNBlocklist.common.sendTokenRequest = function(sendResponse) {
    try {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', GOOGLE_BLOCKLIST_URL, true);
        var body = '--' + GOOGLE_POST_BOUNDARY + '\r\n' +
            'Content-Disposition: form-data; name="rit"\r\n' +
            '\r\n' +
            'blck\r\n' +
            '--' + GOOGLE_POST_BOUNDARY + '--\r\n';
        xhr.setRequestHeader(
            'Content-Type', 'multipart/form-data; boundary=' +
            GOOGLE_POST_BOUNDARY);
        xhr.setRequestHeader(
            'Content-Length', body.length);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    gNBlocklist.common.sendExportRequest(xhr.responseText, sendResponse);
                } else {
                    sendResponse({
                        success: 0,
                        responseText: xhr.responseText,
                        responseStatus: xhr.status
                    });
                }
            }
        };
        xhr.send(body);
    } catch (e) {
        // Not sucessfull.
        sendResponse({
            success: 0,
            responseText: xhr.responseText,
            reponseStatus: xhr.status
        });
    }
};

/**
 * Construct a post body to fake a file uploading.
 * @param {string} token security token got from google.
 * @param {Array} gNBlocklistPatterns The list of block patterns.
 * @return {string} The post body.
 * @private
 */
gNBlocklist.common.constructPostBody_ = function(token, gNBlocklistPatterns) {
    // Prepend http:// to make reviews/t happy.
    var httpPatterns = [];
    for (var i = 0; i < gNBlocklistPatterns.length; ++i) {
        httpPatterns.push('http://' + gNBlocklistPatterns[i]);
    }
    var list = httpPatterns.join('\r\n') + '\r\n';
    var body =
        '--' + GOOGLE_POST_BOUNDARY + '\r\n' +
        'Content-Disposition: form-data; name="tk"\r\n' +
        '\r\n' +
        token.trim() + '\r\n' +
        "--" + GOOGLE_POST_BOUNDARY + "\r\n" +
        "Content-Disposition: form-data; name=\"text_file\"; " +
        "filename=\"gNBlocklist.txt\"\r\n" +
        "Content-Type: text/plain\r\n" +
        "\r\n" +
        list +
        "\r\n" +
        "--" + GOOGLE_POST_BOUNDARY + "--\r\n";
    return body;
};

/**
 * Adds a class name to the classes of an html element.
 * @param {string} classNameString Class name string.
 * @param {string} classToAdd Single class to add to the class names.
 * @return {string} Class names string including the added class.
 */
gNBlocklist.common.addClass = function(classNameString, classToAdd) {
    var classNameArray = classNameString.split(' ');
    var hasClassName = false;
    for (var i = 0; i < classNameArray.length; i++) {
        if (classNameArray[i] == classToAdd) {
            hasClassName = true;
            break;
        }
    }
    if (!hasClassName) {
        classNameString += ' ' + classToAdd;
    }
    return classNameString;
};

/**
 * Removes a class name from the classes of an html element.
 * @param {string} classNameString Class name string.
 * @param {string} classToRemove Single class to remove from the class names.
 * @return {string} Class names string excluding the removed class.
 */
gNBlocklist.common.removeClass = function(classNameString, classToRemove) {
    var reg = new RegExp('( +|^)' + classToRemove + '( +|$)', 'g');
    var newClassNameString = classNameString.replace(reg, ' ');
    newClassNameString = newClassNameString.replace(
        gNBlocklist.common.STRIP_WHITESPACE_REGEX, '');
    return newClassNameString;
};

/**
 * Checks if a class name appears in the classes of an html element.
 * @param {string} classNameString Class name string.
 * @param {string} classToCheck Single class to check membership for.
 * @return {boolean} Is true if class appears in class names, else false.
 */
gNBlocklist.common.hasClass = function(classNameString, classToCheck) {
    var classNameArray = classNameString.split(' ');
    var result = false;
    for (var i = 0; i < classNameArray.length; i++) {
        if (classNameArray[i] == classToCheck) {
            result = true;
            break;
        }
    }
    return result;
};

document.addEventListener('DOMContentLoaded', function() {
    gNBlocklist.common.startBackgroundListeners();
});
// show thank you page upon first install
if (chrome.runtime.onInstalled) {
    chrome.runtime.onInstalled.addListener(function(details) {
        if (details.reason == 'install') {
            open_in_current('thank_you.html');
        }
    });
}

/**
 * Opens url in current tab or opens one if no tabs are open
 * @param {string} url url to open string.
 */
function open_in_current(url) {
    chrome.windows.getCurrent(function(window) {
        chrome.tabs.query({
            'windowId': window.id,
            'active': true
        }, function(tabs) {
            var tab = tabs[0];
            if (typeof(tab) == undefined) {
                open_tab_url(url);
            } else {
                chrome.tabs.update(tab.id, {
                    url: url,
                    selected: true
                });
            }
        });
    });
}