// // background.js
// console.log('background loaded!')

chrome.runtime.onInstalled.addListener(function(details) {
    chrome.storage.sync.set({reset_timer: true});
    console.log('reset_timer stored as true');
	// var myAudio = new Audio(chrome.runtime.getURL("./notification.mp3"));
	// myAudio.play();
});


chrome.runtime.onMessage.addListener(function(request, sender, response) {
	switch (request.message) {
    case 'compare':

      chrome.storage.sync.get(['activeTab'], function(result) {
        var activeTab = result.activeTab;
        if (activeTab !== undefined ) {

          chrome.tabs.captureVisibleTab(
            null,
            {format: 'png', quality: 100},
            function(data) {

              chrome.storage.local.get(['example_image'], function(result) {
                if (result.example_image === undefined ) {
                  chrome.storage.local.set({example_image: data});
                } else {
                  chrome.storage.local.set({comparison_image: data});
                }
              });
            }
          );
        }
      });
      break;
	  case 'reload':
      chrome.storage.sync.get(['activeTab'], function(result) {
        var activeTab = result.activeTab;
        if (activeTab !== undefined ) {
          chrome.tabs.reload(activeTab.id);
        };
      });
      break;
	}
});
  
