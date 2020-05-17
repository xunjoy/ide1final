// Copyright 2011 Google Inc. All Rights Reserved.

/**
 * @fileoverview Google search result page pattern blocking management
 * functionalities.
 * @author zhonglei@google.com (Ray Zhong)
 * @tweaker mrsetht@gmail.com (Seth Thompson)
 */

/**
 * Namespace for the gNBlocklist management.
 * @const
 */
gNBlocklist.manager = {};

/**
 * Number of gNBlocklist item fetched each time.
 * @type {Num}
 */
gNBlocklist.manager.BL_NUM = 20;
/**
 * Regular expression to validate host/domain pattern.
 * @type {RegExp}
 */
gNBlocklist.manager.VALID_HOST_REGEX =
    new RegExp('^([^.:;/*!?\'\" ()#$@<>]+[.])+[^.:;/*!?\'\" ()#$@<>]{2,4}$');

/**
 * Trim text which is too long to fit in the element. Use title to show complete
 * text.
 * @param {Object} element The element where the text shows.
 * @param {string} text The text to show.
 * @param {Num} length The length limitation for the text.
 * @private
 */
gNBlocklist.manager.showLongInfo_ = function(element, text, length) {
  if (text && element) {
    if (text.length > length) {
      var subText = text.substring(0, length) + '...';
      element.text(subText);
      element.attr('title', text);
    } else {
      element.text(text);
    }
  }
};

/**
 * Extract main domain from pattern.
 * @param {string} pattern The pattern where domain is extracted from.
 * @return {string} Main domain.
 * @private
 */
gNBlocklist.manager.extractDomain_ = function(pattern) {
  // Matches the longest suffix against the tld list.
  var parts = pattern.split('.');
  for (var i = 0; i < parts.length; ++i) {
    var dm = parts.slice(i).join('.');
    if (gNBlocklist.TLD_LIST.indexOf(dm) != -1) {
      return parts.slice(i - 1).join('.');
    }
  }
  // Not found, just return the whole pattern.
  return pattern;
};

/**
 * Basic check and correction of the subdomain.
 * @param {string} subdomain The subdomain to be checked and corrected.
 * @return {string} The corrected subdomain.
 * @private
 */
gNBlocklist.manager.uniformSubDomain_ = function(subdomain) {
  // Trim left and right spaces and '.',
  // replace continues '.' with single '.'
  return subdomain.trim()
      .replace(/^\.+|\.+$/g, '')
      .replace(/\.+/g, '.');
};

/**
 * Assembles pattern with subdomain and domain.
 * @param {string} subdomain The subdomain part.
 * @param {string} domain The domain part.
 * @return {string} The assembled pattern.
 * @private
 */
gNBlocklist.manager.assemblePattern_ = function(subdomain, domain) {
  var sd = gNBlocklist.manager.uniformSubDomain_(subdomain);
  var res = sd ? sd + '.' + domain : domain;
  return res;
};


/**
 * Create an gNBlocklist pattern to add patterns.
 * @return {Element} A tr element with the pattern and operation.
 */
gNBlocklist.manager.createAddBlocklistPattern = function(table) {
  // Constructs layout.
  var patRow = $('<tr></tr>');
  var operTd = $('<th style="text-align:center"></th>')
                .appendTo(patRow);

  var addBtn = $('<button type="button" class="ui-button ui-widget ui-corner-all"></button>')
      .appendTo(operTd);

  var patTd = $('<th></th>').appendTo(patRow);
  var patShowDiv = $('<div></div>').appendTo(patTd);
  //var patPreSub = $('<input type="hidden" />').appendTo(patShowDiv);
  //var patPreDom = $('<input type="hidden" />').appendTo(patShowDiv);
  var patEditInput = $('<input class="pat-edit-input-text" type="text" />')
        .appendTo(patShowDiv);
  
  addBtn.text(chrome.i18n.getMessage('add'));


  // Manual edit patterns, only subdomains` part is available for editing.
  // For example, if the pattern is a.b.c.d. Assuming d is TLD, then a.b is
  // editable.

  
  // Bind events.
  addBtn.click(function() {
    // Add pattern
   
      //$(this).text(chrome.i18n.getMessage('unblock'));
	  var curPat = patEditInput.val();//gNBlocklist.manager.assemblePattern_(patPreSub.val(),patPreDom.val());
	  
	  if (!gNBlocklist.manager.validateHost_(curPat)) 
	  {
		  gNBlocklist.manager.showMessage(chrome.i18n.getMessage('invalidPattern'), '#FFAAAA');
		  
	  }
	  else
	  {
	  
	  var patNewRow = gNBlocklist.manager.createBlocklistPattern(curPat);
      patNewRow.insertBefore(patRow);
	  patEditInput.val('');
	  console.log(gNBlocklist.manager.handleAddBlocklistResponse);      
      chrome.runtime.sendMessage({type: gNBlocklist.common.ADDTOBLOCKLIST,
        pattern: curPat},
        gNBlocklist.manager.handleAddBlocklistResponse);
    }
  });
  // Save manual edit.
  // Delete the previous pattern and add current one.
  // Press enter in the input field or click OK.
  patEditInput.keyup(function(event) {
    switch (event.keyCode) {
      case 13:
        addBtn.click();
        break;
    }
  });
  
  return patRow;
};

/**
 * Create an editable gNBlocklist url pattern.
 * @param {string} pattern The url pattern to gNBlocklist.
 * @return {Element} A tr element with the pattern and operation.
 */
gNBlocklist.manager.createBlocklistPattern = function(pattern) {
  // Constructs layout.
  var patRow = $('<tr></tr>');
  var operTd = $('<td style="text-align:center"></td>')
                .appendTo(patRow);

  var deleteBtn = $('<a href="javascript:;" class="manager-btn"></a>')
      .appendTo(operTd);

  var patTd = $('<td></td>').appendTo(patRow);
  var patShowDiv = $('<div></div>').appendTo(patTd);
  var patPreSub = $('<input type="hidden" />').appendTo(patShowDiv);
  var patPreDom = $('<input type="hidden" />').appendTo(patShowDiv);

  var patEditTable = $('<table class="manager-edit-table">' +
                       '<col width=100%>' +
                       '</table>').appendTo(patTd);
  var patEditRow = $('<tr></tr>').appendTo(patEditTable);
  var patEditTd = $('<td></td>').appendTo(patEditRow);
  //var patBtnTd = $('<td style="text-align:right"></td>').appendTo(patEditRow);

  // Dive the pattern into subdomain and domain parts.

  // Initialize values.
  gNBlocklist.manager.showLongInfo_(patShowDiv, pattern, 60);
  patEditTable.hide();

  //var domain = gNBlocklist.manager.extractDomain_(pattern);
  //var subDomain = pattern.substring(0, pattern.indexOf(domain));
  patPreSub.val(pattern);
  //patPreDom.val(domain);

  deleteBtn.text(chrome.i18n.getMessage('unblock'));


  // Manual edit patterns, only subdomains` part is available for editing.
  // For example, if the pattern is a.b.c.d. Assuming d is TLD, then a.b is
  // editable.

  var editBtn = $('<a href="javascript:;" class="manager-btn"></a>')
      .appendTo(operTd);
  var divEditBtns = $('<div style="display:inline-block;"></div>')
	.appendTo(operTd);
  var patEditInput = $('<input class="pat-edit-input-text" type="text" />')
        .appendTo(patEditTd);
  var patEditInputOK = $('<a href="javascript:;" class="manager-btn"></a>')
        .appendTo(divEditBtns);
  var patEditInputCancel =
      $('<a href="javascript:;" class="manager-btn"></a>')
        .appendTo(divEditBtns);
  editBtn.text(chrome.i18n.getMessage('edit'));
  patEditInputOK.text(chrome.i18n.getMessage('ok'));
  patEditInputCancel.text(chrome.i18n.getMessage('cancel'));

  divEditBtns.hide();
  
  patEditInput.val(pattern);
  // Change to manual edit mode.
  editBtn.click(function() {
    patShowDiv.hide();
    divEditBtns.show();
	patEditTable.show();
	editBtn.hide();
    patEditInput.select();
  });

  // Bind events.
  deleteBtn.click(function() {
    // Delete pattern
    if ($(this).text() == chrome.i18n.getMessage('unblock')) {
      chrome.runtime.sendMessage({type: gNBlocklist.common.DELETEFROMBLOCKLIST,
        pattern: pattern},
        gNBlocklist.manager.handleDeleteBlocklistResponse);
      // grey out the input, disable edit button.
      patShowDiv.show();
      editBtn.hide();
      patEditTable.hide();
      patRow.addClass('deleted-pattern');
      $(this).text(chrome.i18n.getMessage('block'));
    } else {
      // Restore pattern
      $(this).text(chrome.i18n.getMessage('unblock'));
      editBtn.show();
      patRow.removeClass('deleted-pattern');
      // Add pattern back to local storage.
      var curPat = patPreSub.val();//gNBlocklist.manager.assemblePattern_(patPreSub.val(),patPreDom.val());
      chrome.runtime.sendMessage({type: gNBlocklist.common.ADDTOBLOCKLIST,
        pattern: curPat},
        gNBlocklist.manager.handleAddBlocklistResponse);
    }
  });
  // Save manual edit.
  // Delete the previous pattern and add current one.
  // Press enter in the input field or click OK.
  patEditInput.keyup(function(event) {
    switch (event.keyCode) {
      case 13:
        patEditInputOK.click();
        break;
    }
  });
  patEditInputOK.click(function() {
    var prePat = patPreSub.val(); //gNBlocklist.manager.assemblePattern_(patPreSub.val(), patPreDom.val());
    // Check current pattern first, if it is not a valid pattern,
    // return without changing the previous pattern.
    var curPat = patEditInput.val();//gNBlocklist.manager.assemblePattern_(patEditInput.val(), patPreDom.val());
    if (!gNBlocklist.manager.validateHost_(curPat)) {
      gNBlocklist.manager.showMessage(chrome.i18n.getMessage('invalidPattern'),'#FFAAAA');
    } 
	else 
	{
      chrome.runtime.sendMessage({type: gNBlocklist.common.DELETEFROMBLOCKLIST,
                                  pattern: prePat},
                            gNBlocklist.manager.handleDeleteBlocklistResponse);
      gNBlocklist.manager.showLongInfo_(patShowDiv, curPat, 60);
      chrome.runtime.sendMessage({type: gNBlocklist.common.ADDTOBLOCKLIST,
                                  pattern: curPat},
                            gNBlocklist.manager.handleAddBlocklistResponse);
      patPreSub.val(patEditInput.val());
    }
    patEditTable.hide();
	divEditBtns.hide();
	editBtn.show();
    patShowDiv.show();
  });

  // Resume the change
  patEditInputCancel.click(function() {
    patEditInput.val(patPreSub.val());
    patEditTable.hide();
	divEditBtns.hide();
	editBtn.show();
    patShowDiv.show();
  });

  return patRow;
};

/**
 * Validates a host.
 * @param {string} host The host to be validated.
 * @return {boolean} true if the host is valid.
 * @private
 */
gNBlocklist.manager.validateHost_ = function(host) {
	return host && host.trim().length > 1;
};

/**
 * Callback that handles the response of the local storage request.
 * @param {Array} response Response from the background page listener.
 */
gNBlocklist.manager.handleDeleteBlocklistResponse = function(response) {
	if (response.success) {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {type: 'refresh'});
    });
  }
};

/**
 * Callback that handles the response of the local storage request.
 * @param {Array} response Response from the background page listener.
 */
gNBlocklist.manager.handleAddBlocklistResponse = function(response) {
  if (response.success) {
	  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {type: 'refresh'});
    });
  }
};

/**
 * Retrieves gNBlocklists and refreshes the management page.
 * @param {int} start Offset index for the gNBlocklist.
 * @param {int} num Amount of patterns to fetch from gNBlocklist.
 */
gNBlocklist.manager.refresh = function(start, num) {
  if (start < 0) start = 0;
  chrome.runtime.sendMessage({'type': gNBlocklist.common.GETBLOCKLIST,
                                'start': start,
                                'num': num},
                               gNBlocklist.manager.handleRefreshResponse);
};

/**
 * Imports patterns from the import textarea.
 */
gNBlocklist.manager.importPatterns = function() {
  var raw_patterns = $('#manager-import-area').val().split('\n');
  var patterns = raw_patterns;
  if (patterns.length) {
    chrome.runtime.sendMessage({type: gNBlocklist.common.ADDBULKTOBLOCKLIST,
                                  patterns: patterns},
                                 gNBlocklist.manager.handleImportResponse);
  } else {
    gNBlocklist.manager.hideImportExport();
    gNBlocklist.manager.showMessage(
        '0' + chrome.i18n.getMessage('validPatternsMessage'), '#FFAAAA');
  }
};

/**
 * Sanitizes domain/host patterns provided by users.
 * @param {Array<string>} rawPatterns Patterns to sanitize.
 * @return {Array<string>} Sanitized, validated patterns.
 * @private
 */
gNBlocklist.manager.sanitizePatterns_ = function(rawPatterns) {
  var patterns = new Array();
  for (var i = 0; i < rawPatterns.length; ++i) {
    candidate = rawPatterns[i];
    candidate = candidate.replace(/^\s*|\s*$/g, '');  // strip whitespace
    candidate = candidate.replace(/\s.*$/, '');  // slice after whitespace
    candidate = candidate.replace(/^https?:\/\//, '');  // slice off protocol
    candidate = candidate.replace(/^www\./, '');  // slice off www.
    candidate = candidate.replace(/\/.*$/, '');  // slice off folders
    candidate = candidate.replace(/:.*$/, '');  // slice off port
    if (gNBlocklist.manager.validateHost_(candidate)) {
      patterns.push(candidate);
    }
  }
  return patterns;
};

/**
 * Hide import/export area and show default table.
 */
gNBlocklist.manager.hideImportExport = function() {
  $('#manager-import-export-div').hide();
  gNBlocklist.manager.refresh(0, gNBlocklist.manager.BL_NUM);
};

/**
 * Callback that handles the response for an import request.
 * @param {Array} response Response from the background page listener.
 */
gNBlocklist.manager.handleImportResponse = function(response) {
  gNBlocklist.manager.showMessage(
      response.count + chrome.i18n.getMessage('validPatternsMessage'),
      '#CCFF99');
  gNBlocklist.manager.hideImportExport();
};

/**
 * Callback that handles the response for a change to silent mode.
 * @param {Array} response Response from the background page listener.
 */
gNBlocklist.manager.handleSetIsSilentResponse = function(response) {
  if (response.success) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {type: 'refresh'});
    });
  }
};


/**
 * Fades in message for user, fades out.
 * @param {string} message Message to show.
 * @param {string} colorDef Html color code for message background.
 */
gNBlocklist.manager.showMessage = function(message, colorDef) {
  $('#manager-message').text(message);
  $('#manager-message').css({'background-color': colorDef,
                             'font-weight': 'bold',
                             'position': 'absolute',
                             'z-index': '1000',
                             'top': '35',
                             'left': '200'});
  $('#manager-message').fadeIn(2500).fadeOut(2500);
};


/**
 * Shows textarea for gNBlocklist pattern import.
 */
gNBlocklist.manager.showImportArea = function() {
  var importDiv = $('#manager-import-export-div');
  importDiv.css('display', 'none');
  importDiv.html('<p id="manager-import-instruction">' +
                 chrome.i18n.getMessage('importInstructions') + '</p>' +
                 '<textarea id="manager-import-area"></textarea><br />');
  importDiv.append($('<button id="import-btn" class="ui-button ui-widget ui-corner-all"></button>'));
  importDiv.append($('<button id="import-cancel-btn" class="ui-button ui-widget ui-corner-all"></button>'));
  $('#import-btn').text(chrome.i18n.getMessage('import'));
  $('#import-cancel-btn').text(chrome.i18n.getMessage('cancel'));
  $('#import-btn').click(gNBlocklist.manager.importPatterns);
  $('#import-cancel-btn').click(gNBlocklist.manager.hideImportExport);
  $('#manager-import-area').attr('rows', '10');
  $('#manager-import-area').attr('cols', '50');
  $('#manager-block-current').hide();
  $('#manager-functions').hide();
  $('#manager-pattern-list').slideUp();
  importDiv.slideDown();
};

/**
 * Shows textarea with plain text gNBlocklist patterns for export.
 */
gNBlocklist.manager.showExportArea = function() {
  chrome.runtime.sendMessage({'type': gNBlocklist.common.GETBLOCKLIST},
                               gNBlocklist.manager.handleExportListRequest);
};
gNBlocklist.manager.toggleIsSilent = function() {
	chrome.runtime.sendMessage({'type': gNBlocklist.common.SETISSILENT,
								'gNIsSilent': $('#cbIsSilent').is(':checked'),
                                'start': 0,
                                'num': 0},
                               gNBlocklist.manager.handleSetIsSilentResponse);
  
};
/**
 * Callback that handles a request to show plain text gNBlocklist for export.
 * @param {Array} response Response from the background page listener.
 */
gNBlocklist.manager.handleExportListRequest = function(response) {
  if (response.gNBlocklist != undefined && response.gNBlocklist.length > 0) {
    var gNBlocklistPatternString = '';
    for (var i = 0; i < response.gNBlocklist.length; ++i) {
      gNBlocklistPatternString += response.gNBlocklist[i] + '\n';
    }
    var exportDiv = $('#manager-import-export-div');
    exportDiv.css('display', 'none');
    exportDiv.html('<p id="manager-export-instruction">' +
                   chrome.i18n.getMessage('exportInstructions') + '</p>' +
                   '<textarea readonly="true" id="manager-export-area">' +
                   gNBlocklistPatternString + '</textarea><br />' +
                   '<button id="export-done-btn" class="ui-button ui-widget ui-corner-all"></button>');
    $('#export-done-btn').text(chrome.i18n.getMessage('ok'));
    $('#export-done-btn').click(gNBlocklist.manager.hideImportExport);
    $('#manager-export-area').attr('rows', '10');
    $('#manager-export-area').attr('cols', '50');
    $('#manager-block-current').hide();
    $('#manager-functions').hide();
    $('#manager-pattern-list').slideUp();
    exportDiv.slideDown();
  } else {
    gNBlocklist.manager.showMessage(chrome.i18n.getMessage('noPatterns'),
                                  '#FFAAAA');
    gNBlocklist.manager.hideImportExport();
  }
};


/**
 * Initiates a confirm dialog box which provides an option to disable the
 * extension after exporting.
 */
gNBlocklist.manager.initExportDialog = function() {
  $('#manager-dialog-message').text(
      chrome.i18n.getMessage('exportDialogMessage'));
  var yesButton = chrome.i18n.getMessage('exportDialogYes');
  var noButton = chrome.i18n.getMessage('exportDialogNo');
  var title = chrome.i18n.getMessage('exportDialogTitle');
  var buttons = {};
  buttons[noButton] = function() {
    localStorage['disabled'] = false;
    gNBlocklist.manager.sendExportToGoogleRequest();
  };
  buttons[yesButton] = function() {
    localStorage['disabled'] = true;
    gNBlocklist.manager.sendExportToGoogleRequest();
  };
  $('#manager-dialog').dialog(
      {
        title: title,
        modal: true,
        width: 500,
        buttons: buttons
      });
};

/**
 * Sends export request.
 */
gNBlocklist.manager.sendExportToGoogleRequest = function() {
  gNBlocklist.manager.busyExporting(true);
  chrome.runtime.sendMessage({'type': gNBlocklist.common.EXPORTTOGOOGLE},
                               gNBlocklist.manager.handleExportToGoogleRequest);
};

/**
 * Shows busy status when exporting block list to google.
 * Hides busy status when finish exporting.
 * @param {boolean} busy if the status busy or not.
 */
gNBlocklist.manager.busyExporting = function(isBusy) {
  if (isBusy) {
    $('#export-to-google-btn').attr('disabled', 'true');
    $('#manager-message').text(chrome.i18n.getMessage('exportToGoogle'));
    $('#manager-message').css({'background-color': '#FF9',
                             'font-weight': 'bold',
                             'position': 'absolute',
                             'z-index': '1000',
                             'top': '35',
                             'left': '200'});
    $('#manager-message').show();
  } else {
    $('#export-to-google-btn').removeAttr('disabled');
    $('#manager-message').hide();
  }
};

/**
 * Callback that handles a export request.
 * If request is success, the extension will open a new tab which is already
 * integrated imported list. Otherwise, will redirect to the management page.
 * @param {Object} response the response from common.js.
 */
gNBlocklist.manager.handleExportToGoogleRequest = function(response) {
  gNBlocklist.manager.busyExporting(false);
  if (response.success) {
    chrome.tabs.create({'url': GOOGLE_BLOCKLIST_URL,
      'selected' : false}, function(tab) {
        chrome.tabs.executeScript(tab.id, {code: ';'}, function() {
          chrome.tabs.sendMessage(tab.id, {type: 'export',
            tabid: tab.id, html: response.responseText});
          chrome.tabs.update(tab.id, {'selected': true});
        });
      });
  } else {
    // Should redirect to login page.
    chrome.tabs.create({'url': GOOGLE_BLOCKLIST_URL,
      'selected' : true});
  }
};


/**
 * Callback that handles the refresh request.
 * @param {Array} response Response from the background page listener.
 */
gNBlocklist.manager.handleRefreshResponse = function(response) {
  $('#manager-functions').fadeIn('fast');
  $('#manager-pattern-list').fadeIn('fast');
  $('#manager-title').text(chrome.i18n.getMessage('popupTitle'));

  var listDiv = $('#manager-pattern-list');
  listDiv.empty();
  // Floating direction depends on text direction.
  var importExportPosition = 'right';
  if (chrome.i18n.getMessage('textDirection') == 'rtl') {
    importExportPosition = 'left';
  }

  if (response.gNBlocklist != undefined ) {
    //gNBlocklist.manager.addBlockCurrentHostLink(response.gNBlocklist);
    var table = $('<table class="manager-table" cellspacing="0"><col width=35%>' +
                  '<col width=65%></table>');
    var header = $('<tr><th>' + chrome.i18n.getMessage('operation') + '</th>' +
                   '<th>' + chrome.i18n.getMessage('domain') +
                   '</th></tr>').appendTo(table);
    for (var i = 0; i < response.gNBlocklist.length; ++i) {
      var patRow =
          gNBlocklist.manager.createBlocklistPattern(response.gNBlocklist[i]);
      patRow.appendTo(table);
    }
	var patEndRow = gNBlocklist.manager.createAddBlocklistPattern(table);
      patEndRow.appendTo(table);
    gNBlocklist.manager.constructHintMessage(response.start, response.num,
                                           response.total);
    listDiv.append(table);
	
    $('#manager-import-export-links').html(
        '<a id="manager-import-link" href="#">' +
        chrome.i18n.getMessage('import') + '</a> / ' +
        '<a id="manager-export-link" href="#">' +
        chrome.i18n.getMessage('export') + '</a>');
    $('#manager-import-export-links').css({'float': importExportPosition});
    $('#manager-export-link').click(gNBlocklist.manager.showExportArea);
    $('#manager-import-link').click(gNBlocklist.manager.showImportArea);
	
  } else {
    gNBlocklist.manager.constructHintMessage(0, 0, 0);
	
    $('#manager-import-export-links').html(
      '<a id="manager-import-link" href="#">' +
      chrome.i18n.getMessage('import') + '</a>');
    $('#manager-import-export-links').css({'float': importExportPosition});
    $('#manager-import-link').click(gNBlocklist.manager.showImportArea);
  }
  $('#manager-silent').html('<label for="cbIsSilent" title="'+chrome.i18n.getMessage('silentModeInfo')+'"><input id="cbIsSilent" type="checkbox" />'+ chrome.i18n.getMessage('silentMode') + '</label>').click(gNBlocklist.manager.toggleIsSilent);
  
	  $('#cbIsSilent').prop('checked',response.gNIsSilent);
};

/**
 * Adds host of active tab to gNBlocklist.
 */
gNBlocklist.manager.hideCurrentHost = function() {
  var pattern = $('#current-host').text();
  if (gNBlocklist.manager.validateHost_(pattern)) {
    chrome.runtime.sendMessage({type: gNBlocklist.common.ADDTOBLOCKLIST,
                                  pattern: pattern},
                                 gNBlocklist.manager.handleAddBlocklistResponse);
  }
  gNBlocklist.manager.showMessage(
      '1' + chrome.i18n.getMessage('validPatternsMessage'), '#CCFF99');
  $('#manager-block-current').hide();
  gNBlocklist.manager.refresh(0, gNBlocklist.manager.BL_NUM);
};


/**
 * Creates a link to block host of url in currently active tab.
 * @param {Array.<string>} blockListPatterns Patterns from the gNBlocklist.
 */
gNBlocklist.manager.addBlockCurrentHostLink = function(blockListPatterns) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      pattern = tabs[0].url.replace(gNBlocklist.common.HOST_REGEX, '$2');
      if (gNBlocklist.manager.validateHost_(pattern) &&
          blockListPatterns.indexOf(pattern) == -1) {
        $('#manager-block-current').html(
            '<a href="#">' + chrome.i18n.getMessage('blockCurrent') +
            '<span id="current-host">' + pattern + '</span></a>');
        $('#manager-block-current').css({'padding-top': '1em',
                                         'padding-bottom': '1em'});
        $('#manager-block-current').click(gNBlocklist.manager.hideCurrentHost);
      }
  });
};

/**
 * Construct hint message for management page.
 * @param {number} start The start index of gNBlocklist.
 * @param {number} num The number of list show.
 * @param {number} total The total size of gNBlocklist.
 */
gNBlocklist.manager.constructHintMessage = function(start, num, total) {
  $('#manager').attr('dir', chrome.i18n.getMessage('textDirection'));
  var hintDiv = $('#manager-pattern-hint');
  var instructionDiv = $('#manager-instruction');
  var preBtn = hintDiv.find('.prev-btn');
  var nextBtn = hintDiv.find('.next-btn');
  var end = start + num;
  if (end >= total) {
    end = total;
  }
  instructionDiv.hide();
  if (start > 0) {
    preBtn.show();
    preBtn.click(function() {
      gNBlocklist.manager.refresh(
          start - gNBlocklist.manager.BL_NUM, gNBlocklist.manager.BL_NUM);
    });
  } else {
    preBtn.hide();
  }
  if (end < total) {
    nextBtn.show();
    nextBtn.click(function() {
      var deleteCount = $('tr.deleted-pattern').length;
      gNBlocklist.manager.refresh(
          start + gNBlocklist.manager.BL_NUM - deleteCount,
          gNBlocklist.manager.BL_NUM);
    });
  } else {
    nextBtn.hide();
  }
  var str = '';
  str += (start + 1) + ' - ' + end + ' of ' + total;
  hintDiv.find('#manager-pattern-hint-msg').text(str);
  hintDiv.attr('dir', 'ltr');  // No translation, always left-to-right.
};

document.addEventListener('DOMContentLoaded', function() {
	
  gNBlocklist.manager.refresh(0, gNBlocklist.manager.BL_NUM);
});
