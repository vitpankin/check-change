// Copyright (c) 2010 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
var page = {
  startX: 150,
  startY: 150,
  endX: 400,
  endY: 300,
  moveX: 0,
  moveY: 0,
  pageWidth: 0,
  pageHeight: 0,
  visibleWidth: 0,
  visibleHeight: 0,
  dragging: false,
  moving: false,
  resizing: false,
  isMouseDown: false,
  scrollXCount: 0,
  scrollYCount: 0,
  scrollX: 0,
  scrollY: 0,
  captureWidth: 0,
  captureHeight: 0,
  isSelectionAreaTurnOn: false,
  fixedElements_ : [],
  marginTop: 0,
  marginLeft: 0,
  modifiedBottomRightFixedElements: [],
  originalViewPortWidth: document.documentElement.clientWidth,
  defaultScrollBarWidth: 17, // Default scroll bar width on windows platform.


  getOriginalViewPortWidth: function() {
    page.originalViewPortWidth = document.documentElement.clientWidth;
  },

  getViewPortSize: function() {
    var result = {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight
    };

    if (document.compatMode == 'BackCompat') {
      result.width = document.body.clientWidth;
      result.height = document.body.clientHeight;
    }

    return result;
  },

  /**
   * Check if the page is only made of invisible embed elements.
   */
  checkPageIsOnlyEmbedElement: function() {
    var bodyNode = document.body.children;
    var isOnlyEmbed = false;
    for (var i = 0; i < bodyNode.length; i++) {
      var tagName = bodyNode[i].tagName;
      if (tagName == 'OBJECT' || tagName == 'EMBED' || tagName == 'VIDEO' ||
          tagName == 'SCRIPT' || tagName == 'LINK') {
        isOnlyEmbed = true;
      } else if (bodyNode[i].style.display != 'none'){
        isOnlyEmbed = false;
        break;
      }
    }
    return isOnlyEmbed;
  },


  /**
  * Send Message to background page
  */
  sendMessage: function(message) {
    chrome.runtime.sendMessage(message);
  },

  getWindowSize: function() {
    var docWidth = document.body.clientWidth;
    var docHeight = document.body.clientHeight;
    return {'message':'capture_window',
            'docWidth': docWidth,
            'docHeight': docHeight};
  },

  /**
  * Remove an element
  */
  init: function() {
    if (document.body.hasAttribute('screen_capture_injected')) {
      return;
    }
    document.body.setAttribute('screen_capture_injected', true);
    if (isPageCapturable()) {
      chrome.runtime.sendMessage({message: 'page_capturable'});
    } else {
      chrome.runtime.sendMessage({message: 'page_uncapturable'});
    }
    //this.injectJavaScriptResource("js/page_context.js");

    // Retrieve original width of view port and cache.
    page.getOriginalViewPortWidth();
  }
};

/**
 * Indicate if the current page can be captured.
 */
var isPageCapturable = function() {
  return !page.checkPageIsOnlyEmbedElement();
};

function $(id) {
  return document.getElementById(id);
}

page.init();

window.addEventListener('resize', function() {

  // Reget original width of view port if browser window resized or page zoomed.
  page.getOriginalViewPortWidth();
}, false);


chrome.runtime.onMessage.addListener(function(request, sender, response) {
  switch (request.message) {
    case 'capture_window': 
      response(page.getWindowSize());
      break;

    case 'is_page_capturable': 
      try {
        if (isPageCapturable()) {
          response({message: 'capturable'});
        } else {
          response({message: 'uncapturable'});
        }
      } catch(e) {
        response({message: 'loading'});
      }
      break;
  }
});