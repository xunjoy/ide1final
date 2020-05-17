// Copyright 2011 Google Inc. All Rights Reserved.
/**
 * @fileoverview Applies gNBlocklist features to Google search result pages.
 * @author manuelh@google.com (Manuel Holtz)
 * @tweaker mrsetht@gmail.com (Seth Thompson)
 */
 /**
 * Namespace for the content script functions for Google search result pages.
 * @const
 */
gNBlocklist.serp = {};
/**
 * Class of the search results on Google SERP.
 * @type {string}
 */
gNBlocklist.serp.SEARCH_RESULT_CLASS = '';

/**
 * Class of the search results on Google SERP.
 * @type {string}
 */
gNBlocklist.serp.SEARCH_RESULT_SELECTOR = 'div[data-n-ham]';
/**
 * Class of the search results on right hand side of Google SERP.
 * @type {string}
 */
gNBlocklist.serp.SEARCH_RESULT_SELECTOR_SECONDARY = 'article';

/**
 * Class of the search results on right hand side of Google SERP.
 * @type {string}
 */
gNBlocklist.serp.SEARCH_RESULT_SELECTOR_THIRD = 'main > div > c-wiz > c-wiz > c-wiz > div > div > div > div > c-wiz';


/**
 * Class to add to a search result after it was processed by the extension.
 * @type {string}
 */
gNBlocklist.serp.PERSONAL_BLOCKLIST_CLASS = 'pb';

/**
 * Class of blocked search results.
 * @type {string}
 */
gNBlocklist.serp.BLOCKED_SEARCH_RESULT_SELECTOR = 'blocked';

/**
 * Class of blocked search results that were requested to be shown.
 * @type {string}
 */
gNBlocklist.serp.BLOCKED_VISIBLE_SEARCH_RESULT_SELECTOR = 'blockedVisible';

/**
 * Class of a element that holds block/unblock links.
 * @type {string}
 */
gNBlocklist.serp.BLOCK_LINK_CLASS = 'fl';

/**
 * Class of the search result bodies on Google SERP.
 * @type {string}
 */
gNBlocklist.serp.SEARCH_RESULT_BODY_CLASS = 's';

/**
 * Class of the search results lower links on Google SERP.
 * @type {string}
 */
gNBlocklist.serp.SEARCH_RESULT_LOWER_LINKS_CLASS = 'gl';

/**
 * Class that contains the cite tag on Google SERP.
 * @type {string}
 */
gNBlocklist.serp.SEARCH_RESULT_CITE_DIV_CLASS = 'kv';

/**
 * Class of the short (snippet-less) search results links on Google SERP.
 * @type {string}
 */
gNBlocklist.serp.SEARCH_RESULT_SHORT_LINKS_CLASS = 'vshid';

/**
 * Class of lower links span for definition-like results (e.g. query "viagra").
 * @type {string}
 */
gNBlocklist.serp.DEFINITION_RESULT_LOWER_LINKS_CLASS = 'a';

/**
 * Class of book search result table cell, used to identify book search results.
 * @type {string}
 */
gNBlocklist.serp.BOOK_SEARCH_RESULT_SELECTOR = 'bkst';

/**
 * Class of the search results block div.
 * @type {string}
 */
gNBlocklist.serp.SEARCH_RESULT_TOP_SELECTOR = 'c-wiz > div > div > h1';

/**
 * Id of the div that displays the result removal notification.
 * @type {string}
 */
gNBlocklist.serp.NOTIFICATION_DIV_ID = 'gNBlocklistNotification';

/**
 * Class name that identifies gws-side block links.
 * @type {string}
 */
gNBlocklist.serp.GWS_BLOCK_LINK_CLASS = 'kob';

/**
 * Class name that identifies showed gws-side block links.
 * @type {string}
 */
gNBlocklist.serp.SHOWED_GWS_BLOCK_LINK_CLASS = 'kobb';

/**
 * The interval between attempts to apply gNBlocklist feats to SERP, in millisecs.
 * @type {number}
 */
gNBlocklist.serp.REPEAT_INTERVAL_IN_MS = 3000;

// TODO(manuelh): Use CSS file for styles instead.
/**
 * Style of the notification for removed search results.
 * @type {string}
 */
gNBlocklist.serp.NOTIFICATION_STYLE = 'margin: 10px;margin-bottom: 10px;position: fixed;right: 0px;bottom: 0px;z-index: 1050;background-color: #d9edf7;border-color: #bcdff1;color: #31708f;padding: 8px 35px 8px 14px;text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);border: 1px solid #bcdff1;-webkit-border-radius: 4px;-moz-border-radius: 4px;border-radius: 4px;white-space: nowrap;';

/**
 * Style for block links. Prevents the word "Block" from appearing on a separate
 * line to the domain being blocked.
 */
gNBlocklist.serp.BLOCK_LINK_STYLE = 'white-space:nowrap;';

/**
 * Type of refresh request.
 * @type {string}
 */
gNBlocklist.serp.REFRESH_REQUEST = 'refresh';

/**
 * Type of export to google request.
 * @type {string}
 */
gNBlocklist.serp.EXPORTTOGOOGLE_REQUEST = 'export';

/**
 * Style of blocked search results that are shown on request.
 * @type {string}
 */
gNBlocklist.serp.BLOCKED_VISIBLE_STYLE = 'display:block;background-color:#FFD2D2';

/**
 * A regular expression to deal with redirections through Google services,
 * e.g. for translated results like
 * http://translate.google.com/translate?u=http://example.com
 * @type {RegExp}
 */
gNBlocklist.serp.REDIRECT_REGEX = new RegExp(
    '^(https?://[a-z.]+[.]?google([.][a-z]{2,4}){1,2})?/' +
    '[a-z_-]*[?]((img)?u|.*&(img)?u)(rl)?=([^&]*[.][^&]*).*$');

/**
 * A regular expression to check if personalized web search is disabled in url.
 * @type {RegExp}
 */
gNBlocklist.serp.PWS_REGEX = new RegExp('(&|[?])pws=0');

/**
 * Matches the kEI javascript property defined in the header of the Google SRP.
 * @type {RegExp}
 */
gNBlocklist.serp.EVENT_ID_REGEX = new RegExp('kEI\\:"([^"]+)"');

/**
 * The gNBlocklisted patterns. Call gNBlocklist.serp.refreshBlocklist to populate.
 * @type {Array.<string>}
 */
gNBlocklist.serp.gNBlocklist = [];

/**
 * The vale that indicates if the message box should be shown at the top of the screen once items have been blocked. Call gNBlocklist.serp.refreshBlocklist to populate.
 * @type {boolean}}
 */
gNBlocklist.serp.gNIsSilent = false;


/**
 * The event id of the search result page.
 * @type {string}
 */
gNBlocklist.serp.eventId = '';

/**
 * Whether the current search result page is https page.
 * The extension will not send info back to google via gen204 request if user is
 * under https page.
 * @type {bool}
 */
gNBlocklist.serp.isHttps = false;

/**
 * Whether the search result alterations (block links etc) need to be reapplied.
 * Used by gNBlocklist.serp.modifySearchResults_ that constitutes what happens in
 * the main process loop of the extension. This variable primarily helps with
 * efficiency, because it avoids unnecessary repetitions.
 *
 * @type {bool}
 */
gNBlocklist.serp.needsRefresh = false;

/**
 * Creates a DOM element containing a "block domain" or "unblock domain" link.
 * @param {function} handler The function to bind to a click.
 * @param {string} pattern The domain pattern to send to the handler on click.
 * @param {string} className Name of the message string and span class.
 * @return {Element} A div element with the block link.
 * @private
 */
gNBlocklist.serp.createLink_ = function(handler, pattern, className) {
    var blockLink = document.createElement('a');
    blockLink.setAttribute('dir', chrome.i18n.getMessage('textDirection'));
    blockLink.className = gNBlocklist.serp.BLOCK_LINK_CLASS;
    blockLink.setAttribute('style', gNBlocklist.serp.BLOCK_LINK_STYLE);
    blockLink.href = 'javascript:;'; // Do nothing, no refresh.
    blockLink.addEventListener(
        'click',
        function() {
            handler(pattern)
        }, false);

    // Separate spans to avoid mixing latin chars with Arabic/Hebrew.
    var prefixSpan = document.createElement('span');
    prefixSpan.appendChild(document.createTextNode(
        chrome.i18n.getMessage(className + 'Prefix')));
    var patternSpan = document.createElement('span');
    patternSpan.appendChild(document.createTextNode(pattern));
    var suffixSpan = document.createElement('span');
    suffixSpan.appendChild(document.createTextNode(
        chrome.i18n.getMessage(className + 'Suffix')));

    blockLink.appendChild(prefixSpan);
    blockLink.appendChild(patternSpan);
    blockLink.appendChild(suffixSpan);

    var blockLinkDiv = document.createElement('div');
    blockLinkDiv.className = className;
    blockLinkDiv.appendChild(blockLink);
    return blockLinkDiv;
};

/**
 * Adds a block or unblock link to a search result.
 * @param {Element} searchResult Search result list element, including children.
 * @param {Object} linkDiv Div element with the link to add.
 */
gNBlocklist.serp.addLink = function(searchResult, linkDiv) {
    var regularResultSpan = searchResult.querySelector(
        'div.' + gNBlocklist.serp.SEARCH_RESULT_CITE_DIV_CLASS);
    var definitionResultSpan = searchResult.querySelector(
        'span.' + gNBlocklist.serp.DEFINITION_RESULT_LOWER_LINKS_CLASS);
    var shortResultDiv = searchResult.querySelector(
        'div.' + gNBlocklist.serp.SEARCH_RESULT_BODY_CLASS +
        ' span.' + gNBlocklist.serp.SEARCH_RESULT_SHORT_LINKS_CLASS);
    if (regularResultSpan !== null) {
        regularResultSpan.appendChild(linkDiv);
    } else if (definitionResultSpan !== null) {
        definitionResultSpan.parentNode.parentNode.appendChild(linkDiv);
    } else if (shortResultDiv !== null) {
        shortResultDiv.parentNode.parentNode.appendChild(linkDiv);
    }
};

/**
 * Adds a DOM element containing a notification for removed results.
 * @private
 */
gNBlocklist.serp.addBlockListNotification_ = function() {
    var showBlockedLink = document.createElement('a');
    showBlockedLink.href = 'javascript:;'; // Do nothing, no refresh.
	showBlockedLink.setAttribute('style', 'font-weight: bold;color: #2d6987;');
    showBlockedLink.appendChild(document.createTextNode(
        chrome.i18n.getMessage('showBlockedLink')));
    showBlockedLink.addEventListener(
        'click',
        function() {
            gNBlocklist.serp.showBlockedResults_()
        }, false);
		
	var closeButton = document.createElement('button');
    closeButton.setAttribute('style', 'position: relative; top: -2px; right: -21px; line-height: 20px;    padding: 0;cursor: pointer;background: transparent;border: 0;-webkit-appearance: none;float: right;font-size: 20px;font-weight: bold;color: #000000;text-shadow: 0 1px 0 #ffffff;opacity: 0.2;');
    closeButton.setAttribute('type', 'button');
    closeButton.addEventListener(
		'click',
        function() {
            gNBlocklist.serp.hideBlockListNotification_()
        }, false);
    closeButton.appendChild(document.createTextNode('×'));

    var gNBlocklistNotification = document.createElement('c-wiz');
    gNBlocklistNotification.id = gNBlocklist.serp.NOTIFICATION_DIV_ID;
    gNBlocklistNotification.setAttribute(
        'dir', chrome.i18n.getMessage('textDirection'));
    
    gNBlocklistNotification.appendChild(closeButton);
    var thisp = document.createElement('p');
    thisp.appendChild(document.createTextNode(chrome.i18n.getMessage('blocklistNotification') + ' ('));
    thisp.appendChild(showBlockedLink);
    thisp.appendChild(document.createTextNode(').'));
    gNBlocklistNotification.appendChild(thisp);
    //gNBlocklistNotification.setAttribute('class', gNBlocklist.serp.SEARCH_RESULT_CLASS);

    gNBlocklistNotification.setAttribute('style', gNBlocklist.serp.NOTIFICATION_STYLE);

    //var searchResultBlock = document.querySelector(gNBlocklist.serp.SEARCH_RESULT_TOP_SELECTOR);
    document.body.appendChild(gNBlocklistNotification);
};

/**
 * Makes blocked search results visible again.
 * @private
 */
gNBlocklist.serp.showBlockedResults_ = function() {
    var blockedResultList = Array.prototype.slice.call(document.querySelectorAll(gNBlocklist.serp.SEARCH_RESULT_SELECTOR));
    blockedResultList = blockedResultList.concat(Array.prototype.slice.call(document.querySelectorAll(gNBlocklist.serp.SEARCH_RESULT_SELECTOR_SECONDARY)));
    blockedResultList = blockedResultList.concat(Array.prototype.slice.call(document.querySelectorAll(gNBlocklist.serp.SEARCH_RESULT_SELECTOR_THIRD)));
    var searchResult;
    for (var i = 0; i < blockedResultList.length; i++) {

        searchResult = blockedResultList[i];
        if (searchResult.style.display != '') {
            searchResult.style.display = '';
        }
    }
    gNBlocklist.serp.hideBlockListNotification_();
    window.clearInterval(gNBlocklist.serp.timerID);
};

/**
 * Adds a pattern to the gNBlocklist.
 * @param {string} pattern The pattern to gNBlocklist.
 * @private
 */
gNBlocklist.serp.addBlocklistPattern_ = function(pattern) {
    chrome.runtime.sendMessage({
            type: gNBlocklist.common.ADDTOBLOCKLIST,
            pattern: pattern,
            ei: gNBlocklist.serp.eventId,
            enc: gNBlocklist.serp.isHttps
        },
        gNBlocklist.serp.handleAddToBlocklistResponse);
};

/**
 * Set the gNIsSilent value
 * @param {bool} value to set.
 * @private
 */
gNBlocklist.serp.setIsSilent_ = function(value) {
    chrome.runtime.sendMessage({
            type: gNBlocklist.common.SETISSILENT,
            gNIsSilent: value,
            ei: gNBlocklist.serp.eventId,
            enc: gNBlocklist.serp.isHttps
        },
        gNBlocklist.serp.handleSetIsSilentResponse);
};

/**
 * Removes a pattern from the gNBlocklist.
 * @param {string} pattern The pattern to remove from the gNBlocklist.
 * @private
 */
gNBlocklist.serp.removeBlocklistPattern_ = function(pattern) {
    chrome.runtime.sendMessage({
            type: gNBlocklist.common.DELETEFROMBLOCKLIST,
            pattern: pattern,
            ei: gNBlocklist.serp.eventId,
            enc: gNBlocklist.serp.isHttps
        },
        gNBlocklist.serp.handleDeleteFromBlocklistResponse);
};

/**
 * Parses the domain out of a Google search result page.
 * @param {Object} searchResult Search result list element (including children).
 * @return {string} A domain if found; or an empty string.
 * @private
 */
gNBlocklist.serp.parseDomainFromSearchResult_ = function(searchResult) {
    var searchResultAnchor = searchResult.querySelector('h3 > a');
    if (searchResultAnchor === null) {
        return '';
    }
    var url = searchResultAnchor.getAttribute('href');
    // Sometimes, the link is an intermediate step through another google service,
    // for example Google Translate. This regex parses the target url, so that we
    // don't block translate.google.com instead of the target host.
    url = url.replace(gNBlocklist.serp.REDIRECT_REGEX, '$7');
    // Identify domain by stripping protocol and path.
    return url.replace(gNBlocklist.common.HOST_REGEX, '$2');
};

/**
 * Determines if and in which way a result result needs to be modified.
 * @param {Element} searchResult Search result list element, including children.
 * @private
 */
gNBlocklist.serp.alterSearchResultNode_ = function(searchResult) {
    var host = gNBlocklist.serp.parseDomainFromSearchResult_(searchResult);
    if (!host) {
        return;
    }

    // Skip if there is already a gws-side block link, this is a book search
    // vertical results, or an internal url that was not resolved.
    if (searchResult.querySelector(
            '.' + gNBlocklist.serp.GWS_BLOCK_LINK_CLASS) !== null ||
        searchResult.querySelector(
            'td.' + gNBlocklist.serp.BOOK_SEARCH_RESULT_SELECTOR) !== null ||
        host[0] == '/') {
        // Mark search result as processed.
        searchResult.className = gNBlocklist.common.addClass(
            searchResult.className, gNBlocklist.serp.PERSONAL_BLOCKLIST_CLASS);
        return;
    }

    // Any currently appended block/unblock links need to be replaced.
    blockLink = searchResult.querySelector('div.blockLink');
    unblockLink = searchResult.querySelector('div.unblockLink');

    // Two main cases where we need to take action:
    // 1. search result should have a block link and doesn't have one already.
    // 2. search result should have an unblock link and doesn't have one already.
    if (blockLink === null &&
        (gNBlocklist.common.hasClass(
            searchResult.className,
            gNBlocklist.serp.BLOCKED_VISIBLE_SEARCH_RESULT_SELECTOR) == false)) {
        var blockLinkDiv = gNBlocklist.serp.createLink_(
            gNBlocklist.serp.addBlocklistPattern_, host, 'blockLink');

        // Replace existing link, or append.
        if (unblockLink !== null) {
            unblockLink.parentNode.replaceChild(blockLinkDiv, unblockLink);
        } else {
            gNBlocklist.serp.addLink(searchResult, blockLinkDiv);
        }
    } else if (unblockLink === null &&
        gNBlocklist.common.hasClass(
            searchResult.className,
            gNBlocklist.serp.BLOCKED_VISIBLE_SEARCH_RESULT_SELECTOR)) {
        // Use the pattern that caused the block, which might differ from host.
        var blockPattern = gNBlocklist.serp.findBlockPatternForHost_(host);
        if (!blockPattern) {
            return;
        }
        var unblockLinkDiv = gNBlocklist.serp.createLink_(
            gNBlocklist.serp.removeBlocklistPattern_, blockPattern, 'unblockLink');

        // Replace existing link, or append.
        if (blockLink !== null) {
            blockLink.parentNode.replaceChild(unblockLinkDiv, blockLink);
        } else {
            gNBlocklist.serp.addLink(searchResult, unblockLinkDiv);
        }
    }
    // Mark search result as processed.
    searchResult.className = gNBlocklist.common.addClass(
        searchResult.className, gNBlocklist.serp.PERSONAL_BLOCKLIST_CLASS);
};

/**
 * Removes a search result from the page.
 * @param {Object} searchResult Search result list element (including children).
 */
gNBlocklist.serp.hideSearchResult = function(searchResult) {
    searchResult.setAttribute('style', 'display:none;');
    searchResult.className = gNBlocklist.common.addClass(
        searchResult.className, gNBlocklist.serp.BLOCKED_SEARCH_RESULT_SELECTOR);
};

/**
 * Return a list of subdomains. for example, a.d.c.d will return
 * c.d, d.c.d and a.b.c.d
 * @param {string} pattern The domains pattern to extract subdomains.
 * @return {Array.<string>} Suddomain list.
 * @private
 */
gNBlocklist.serp.extractSubDomains_ = function(pattern) {
    var subdomains = [];
    var parts = pattern.split('.');
    for (var i = parts.length - 2; i >= 0; --i) {
        subdomains.push(parts.slice(i).join('.'));
    }
    return subdomains;
};

/**
 * Checks a hostname against the gNBlocklist patterns.
 * @param {string} hostName Host of a search result link.
 * @return {string} A gNBlocklist pattern that matched the host (or empty string).
 * @private
 */
gNBlocklist.serp.findBlockPatternForHost_ = function(hostName) {
    var matchedPattern = '';
    // Match each level of subdomains against the gNBlocklist. For example, if
    // a.com is blocked, b.a.com should be hidden from search result.
    var subdomains = gNBlocklist.serp.extractSubDomains_(hostName);
    for (var j = 0; j < subdomains.length; ++j) {
        if (gNBlocklist.serp.gNBlocklist.indexOf(subdomains[j]) != -1) {
            matchedPattern = subdomains[j];
            break;
        }
    }
    return matchedPattern;
};

/**
 * Removes all search results that match the gNBlocklist.
 */
gNBlocklist.serp.hideSearchResults = function() {
    var searchResultList = Array.prototype.slice.call(document.querySelectorAll(gNBlocklist.serp.SEARCH_RESULT_SELECTOR));
	searchResultList = searchResultList.concat(Array.prototype.slice.call(document.querySelectorAll(gNBlocklist.serp.SEARCH_RESULT_SELECTOR_SECONDARY)));

    gNBlocklist.serp.SEARCH_RESULT_CLASS = searchResultList[0].className;
    var foundOne = false;
    var searchResult = searchResultList[i];
    var j = 0;
    var safety = 0;
    var prnt;
    var blockMe = false;
    var pattern = '';

	console.log('gN-Searching');
	
    for (var i = 1; i < searchResultList.length; i++) {
        searchResult = searchResultList[i];
        j = 0;
        safety = 0;
        blockMe = false;
        pattern = '';

        for (j = 0; j < gNBlocklist.serp.gNBlocklist.length; j++) {
            //ignore '"' and casing
			if(searchResult.hasAttribute("data-n-et") && searchResult.getAttribute("data-n-et") == "200") //group of kid articles
			{
				continue;
			}
            pattern = gNBlocklist.serp.gNBlocklist[j].toLowerCase().replace('"', '').trim();
            if (pattern.length > 1 && searchResult.textContent.toLowerCase().indexOf(pattern) >= 0) {
                blockMe = true;
                foundOne = true;
                break;
            }
        }
        prnt = searchResult.parentNode;
		searchResult.style.display = blockMe ? 'none' : '';
    }

    var gNBlocklistNotification = document.querySelector('c-wiz#' + gNBlocklist.serp.NOTIFICATION_DIV_ID);
    if (foundOne && !gNBlocklist.serp.gNIsSilent) {
        if (!gNBlocklistNotification) {
            gNBlocklist.serp.addBlockListNotification_();
        } else {
            //gNBlocklistNotification.setAttribute('style',gNBlocklist.serp.NOTIFICATION_STYLE);
        }
    } else if (gNBlocklistNotification != null) {
        gNBlocklist.serp.hideBlockListNotification_();

    }
};

/**
 * hides notification window
 * @private
 */
gNBlocklist.serp.hideBlockListNotification_ = function() {
    var gNBlocklistNotification = document.querySelector('c-wiz#' + gNBlocklist.serp.NOTIFICATION_DIV_ID);
    if (gNBlocklistNotification != null) {
        gNBlocklistNotification.style.display = 'none';
    }
}

/**
 * Iterates through search results, adding links and applying gNBlocklist filter.
 * @private
 */
gNBlocklist.serp.modifySearchResults_ = function() {
	// Skip if personalized web search was explicitly disabled (&pws=0).
    if (gNBlocklist.serp.IsPwsDisabled_() == true) {
        return;
    }
    // Apply gNBlocklist filter.
    if (gNBlocklist.serp.gNBlocklist.length > 0 || gNBlocklist.serp.needsRefresh) {
        gNBlocklist.serp.hideSearchResults();
    }
    var searchResultList = Array.prototype.slice.call(document.querySelectorAll(gNBlocklist.serp.SEARCH_RESULT_SELECTOR));
    searchResultList = searchResultList.concat(Array.prototype.slice.call(document.querySelectorAll(gNBlocklist.serp.SEARCH_RESULT_SELECTOR_SECONDARY)));
    searchResultList = searchResultList.concat(Array.prototype.slice.call(document.querySelectorAll(gNBlocklist.serp.SEARCH_RESULT_SELECTOR_THIRD)));
    var processedSearchResultList = document.querySelectorAll('li.' + gNBlocklist.serp.PERSONAL_BLOCKLIST_CLASS);

    // Add gNBlocklist links to search results until all have been processed.
    if (gNBlocklist.serp.needsRefresh || processedSearchResultList.length < searchResultList.length) {
        for (var i = 1; i < searchResultList.length; i++) {
            gNBlocklist.serp.alterSearchResultNode_(searchResultList[i]);
        }

        // Add/hide/show notification for removed results.

        gNBlocklist.serp.needsRefresh = false;
    }
};

/**
 * Starts an infinite loop that applies the gNBlocklist features to the page.
 * @private
 */
gNBlocklist.serp.applyBlocklistFeatures_ = function() {
	gNBlocklist.serp.modifySearchResults_();
    gNBlocklist.serp.timerID = window.setInterval(function() {
        gNBlocklist.serp.modifySearchResults_();
    }, gNBlocklist.serp.REPEAT_INTERVAL_IN_MS);
};

/**
 * Callback that handles the response of the local storage request.
 * @param {Array} response Response from the background page listener.
 */
gNBlocklist.serp.handleAddToBlocklistResponse = function(response) {
    if (response.success) {
        gNBlocklist.serp.refreshBlocklist();
        gNBlocklist.serp.needsRefresh = true;
    }
};

/**
 * Callback that handles the response of the local storage request.
 * @param {Array} response Response from the background page listener.
 */
gNBlocklist.serp.handleSetIsSilentResponse = function(response) {
    if (response.success) {
        gNBlocklist.serp.refreshBlocklist();
        gNBlocklist.serp.needsRefresh = true;
    }
};


/**
 * Callback that handles the response of the local storage request.
 * @param {Array} response Response from the background page listener.
 */
gNBlocklist.serp.handleDeleteFromBlocklistResponse = function(response) {
    if (response.success) {
        // Reset blocked results and refresh.
        var searchResultList = document.querySelectorAll(gNBlocklist.serp.SEARCH_RESULT_SELECTOR);
        searchResultList = searchResultList.concat(Array.prototype.slice.call(document.querySelectorAll(gNBlocklist.serp.SEARCH_RESULT_SELECTOR_SECONDARY)));
        searchResultList = searchResultList.concat(Array.prototype.slice.call(document.querySelectorAll(gNBlocklist.serp.SEARCH_RESULT_SELECTOR_THIRD)));
        for (var i = 1; i < searchResultList.length; i++) {
            var pattern = gNBlocklist.serp.parseDomainFromSearchResult_(searchResultList[i]);
            var subdomains = gNBlocklist.serp.extractSubDomains_(pattern);
            if (gNBlocklist.common.hasClass(
                    searchResultList[i].className,
                    gNBlocklist.serp.BLOCKED_VISIBLE_SEARCH_RESULT_SELECTOR) &&
                subdomains.indexOf(response.pattern) != -1) {
                searchResultList[i].className = gNBlocklist.common.removeClass(
                    searchResultList[i].className,
                    gNBlocklist.serp.BLOCKED_VISIBLE_SEARCH_RESULT_SELECTOR);
                searchResultList[i].className = gNBlocklist.common.removeClass(
                    searchResultList[i].className,
                    gNBlocklist.serp.BLOCKED_SEARCH_RESULT_SELECTOR);
                // Clear the search result's background.
                searchResultList[i].setAttribute('style', 'background-color:inherit;');
            }
        }
        gNBlocklist.serp.refreshBlocklist();
        gNBlocklist.serp.needsRefresh = true;
    }
};

/**
 * Callback that handles the response of the local storage request.
 * @param {Array} response Response from the background page listener.
 */
gNBlocklist.serp.handleGetBlocklistResponse = function(response) {
    if (response != undefined) {
        if (response.gNBlocklist != undefined) {
            gNBlocklist.serp.gNBlocklist = response.gNBlocklist;
        }
        gNBlocklist.serp.gNIsSilent = response.gNIsSilent;
    }
};

/**
 * Retrieves gNBlocklisted domains from localstorage.
 */
gNBlocklist.serp.refreshBlocklist = function() {
    chrome.runtime.sendMessage({
            type: gNBlocklist.common.GETBLOCKLIST
        },
        gNBlocklist.serp.handleGetBlocklistResponse);
};

/**
 * Get if the current page is using https protocol.
 * @private
 */
gNBlocklist.serp.getIsHttpsPage_ = function() {
    gNBlocklist.serp.isHttps =
        (document.URL.indexOf('https://') == 0);
};

/**
 * Check if personalized web search is disabled (pws parameter is 0).
 * @return {boolean} True if url indicates personalized web search was disabled.
 * @private
 */
gNBlocklist.serp.IsPwsDisabled_ = function() {
    return document.URL.match(gNBlocklist.serp.PWS_REGEX) !== null;
};

/**
 * Get event id of this search result page.
 * @private
 */
gNBlocklist.serp.getEventId_ = function() {
    gNBlocklist.serp.eventId = 'null';
    try {
        var head = document.getElementsByTagName('head')[0];
        var scripts = head.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++) {
            var script = scripts[i];
            var match = script.text.match(gNBlocklist.serp.EVENT_ID_REGEX);
            if (match) {
                gNBlocklist.serp.eventId = match[1];
            }
        }
    } catch (e) {}
};

/**
 * Exposes a listener, so that it can accept refresh request from manager.
 */
gNBlocklist.serp.startBackgroundListeners = function() {
    chrome.runtime.onMessage.addListener(
	
		function(request, sender, sendResponse) {
			console.log('content.startBackgroundListeners-' + request.type);
            if (request.type == gNBlocklist.serp.REFRESH_REQUEST) {
                gNBlocklist.serp.refreshBlocklist();
                gNBlocklist.serp.needsRefresh = true;
            } else if (request.type == gNBlocklist.serp.EXPORTTOGOOGLE_REQUEST) {
                document.write(request.html);
                chrome.runtime.sendMessage({
                    type: gNBlocklist.common.FINISHEXPORT
                });
            }
        });
};
if (location.href.indexOf("news.google.") >= 7 && location.href.indexOf("news.google.") < 10) {

    gNBlocklist.serp.getIsHttpsPage_();
    gNBlocklist.serp.getEventId_();
    gNBlocklist.serp.refreshBlocklist();
    gNBlocklist.serp.applyBlocklistFeatures_();
    gNBlocklist.serp.startBackgroundListeners();
}