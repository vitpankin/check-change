// popup.js
//  persistence when out of focus but terminated when closed

// variables to represent items from html doc
var input = document.getElementById("input-time");
var checkbox = document.getElementById("compare");
var timer_button = document.getElementById("timer_button");
var dismiss_button = document.getElementById("dismiss_button");
var alert = document.getElementById("alert");
var logger = document.getElementById("logger");
logger.innerHTML = "Idle...";

// logic specific variables
var refresh_interval = 0;
var reload_state = undefined;
var comparison_state = false;
var injected_status = false;
var loaded_status = false;
var alert_state = false;

chrome.storage.sync.get(['reload_state'], function(result) {
  if (result.reload_state) {
    reload_state = result.reload_state;
  } else {
    reload_state = false;
    chrome.storage.sync.set({reload_state: false});
  }
});

var myAudio = new Audio(chrome.runtime.getURL("./notification_.mp3"));

// passes message to background.js with the message to reload 
function reload() {
  injected_status = false;
  loaded_status = false;

  chrome.runtime.sendMessage({message: "reload"}, function () {
    document.dispatchEvent(new Event("reload"));
  });
}

// button mouseover logic := display hover images
function timer_mouseoverHandler(e) {
  timer_button.classList.add('hover');
}

// button mouseleave logic := display non-hover images
function timer_mouseleaveHandler(e) {
  timer_button.classList.remove('hover');
}

// button mouseleave logic := display non-hover images
function allow_check_clickHandler(e) {
  if (e.currentTarget.checked) {
    //ss_button.disabled = false;
    comparison_state = true;
    logger.classList.add("active");
  } else{
    //ss_button.disabled = true;
    comparison_state = false;
    logger.classList.remove("active");
  }
}
// button mouseleave logic := display non-hover images
function take_example_ss_clickHandler(e) {
  captureExample();
}
// button mouseleave logic := display non-hover images
function dismiss_clickHandler(e) {
  myAudio.pause(0);
  myAudio.currentTime = 0;
  alert_state = false;
  alert.classList.remove("active");
}
document.addEventListener('alert', function (e) {
  alert_state = true;
  alert.classList.add("active");
  myAudio.play(1);
});

function timer_clickHandler(e) {

  if(reload_state === false){

    if(input.value) {

      // retrieve interval value from input fields
      refresh_interval = parseInt(input.value);
      // value must be greater than 0 to continue
      if(refresh_interval !== 0 && typeof refresh_interval === "number") {
        // change image to represent new state
        timer_button.classList.add('active');

        input.disabled = true;
        checkbox.disabled = true;
        // ss_button.disabled = true;

        timer_button.innerHTML = "Stop";
        // initiate countdown

        chrome.runtime.sendMessage({message: "compare"});
        countdown(refresh_interval);
        // set state flag to true
        reload_state = true;
        chrome.storage.sync.set({reload_state: true});

        chrome.tabs.query({
          active: true,
          currentWindow: true
        }, function(tabs) {
          if (tabs.length < 1) {
            console.warn('Expected at least 1 tab');
            return;
          }
          chrome.storage.sync.set({activeTab: tabs[0]});
        });
      } 
      else {
        alert('Enter an amoung greater than zero to start');
      }
    } else {
      alert('Enter value');
    }
  } 
  else{
    // replace image
    timer_button.classList.remove('active');
    timer_button.innerHTML = "Start";
    // set state to false to keep page from refreshing
    reload_state = false;
    chrome.storage.sync.set({reload_state: false});
    chrome.storage.local.remove(['example_image', 'comparison_image']);
    chrome.storage.sync.remove(['activeTab']);
    // erase badge
    chrome.action.setBadgeText({text:''});
    // refresh extension to erase previous intervals (which will trigger 'resetAll()')
    window.location.reload(true);
  }
}

// use to reset all relevant vars
function resetAll(){
 input.innerHTML = 0;
 refresh_interval = 0;
 reload_state = false;
 chrome.storage.sync.set({reload_state: false});
 if (chrome.action)
  chrome.action.setBadgeText({text:''});

}

// countdown logic := count to zero, when zero is met reset timer and refresh page
function countdown(time){
  var t = time;
  function tick() {
    // only carry on if in active state
    if(reload_state === true){
      // set badge text
      chrome.action.setBadgeText({text:''+t});
      // decerement time
      t--;
      // if time is below zero reset counter and refresh page
      if(t<0){
        reload();
        t = time;
      }
    }
    else { // reload_state == false
      // clear previously set timing interval
      clearInterval(x);
      // remove badge from icon
      chrome.action.setBadgeText({text:''});
    }
  }

  var x = //setInterval((function(){
    setInterval(tick, 1000);  
  //})(), 0);
}

// add event listeners after DOM has fully loaded (`DOMContentLoaded`)
document.addEventListener('DOMContentLoaded', function () {

  // start-stop button click listener
  //ss_button.addEventListener('click', take_example_ss_clickHandler);
  // start-stop button click listener
  checkbox.addEventListener('change', allow_check_clickHandler);
  input.addEventListener('keyup', (e)=>{});
  // start-stop button click listener
  dismiss_button.addEventListener('click', dismiss_clickHandler);
  // start-stop button click listener
  timer_button.addEventListener('click', timer_clickHandler);
  // start-stop button mouseover listener
  timer_button.addEventListener('mouseover', timer_mouseoverHandler);
  // start-stop button mouseleave listener
  timer_button.addEventListener('mouseleave', timer_mouseleaveHandler);
  
});

resetAll();
// var isScriptLoad = false;
// chrome.tabs.query({
//   active: true,
//   currentWindow: true
// }, function(tabs) {
//   if (tabs.length < 1) {
//     console.warn('Expected at least 1 tab');
//     return;
//   }
//   var tab = tabs[0];
//   if (tab.url && (tab.url.indexOf('chrome') == 0 || tab.url.indexOf('about') == 0)) {
//     return;
//   }
//   function injection(callback) {
//     chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['js/page.js'] }, _ => {
//       chrome.tabs.sendMessage(tab.id, {message: 'is_page_capturable'},
//       response => {
//         console.log("Injected");
//         isScriptLoad = true;
//         if (callback && typeof callback === 'function') callback();
//         if (response.message == 'capturable') {
//         } else if (response.message == 'uncapturable') {
//         } else {
//         }
//       });
//     });
//   }
//   injection();
//   document.addEventListener("reload", injection);
// });
//chrome.runtime.onConnect.addListener((port) => {alert(1)});

document.addEventListener('injected', function (e) {
  injected_status = true;
  console.log('injected!');
  if (loaded_status) document.dispatchEvent(new Event("capture"));
});
document.addEventListener('loaded', function (e) {
  loaded_status = true;
  console.log('loaded!');
  if (injected_status) document.dispatchEvent(new Event("capture"));
});
document.addEventListener('capture', function (e) {
  if (injected_status && loaded_status) {
    console.log('capture!');
    chrome.runtime.sendMessage({message: "compare"});
  }
});

function InitInjection (activeTab) {
  if (activeTab.url && (activeTab.url.indexOf('chrome') == 0 || activeTab.url.indexOf('about') == 0)) {
    return;
  }
  function injection(callback) {
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, function(tabs) {
      if (tabs.length < 1) {
        console.warn('Expected at least 1 tab');
        return;
      }

    chrome.scripting.executeScript({ target: { tabId: tabs[0].id }, files: ['js/page.js'] }, _ => {
      chrome.tabs.sendMessage(tabs[0].id, {message: 'is_page_capturable'},
      response => {
        isScriptLoad = true;
        if (callback && typeof callback === 'function') callback();
        if (response.message == 'capturable') {
          document.dispatchEvent(new Event("injected"));
        } else if (response.message == 'uncapturable') {
          document.dispatchEvent(new Event("injected"));
        } else {
        }
      });
    });
  });
  }
  injection();
  document.addEventListener("reload", injection);
}

chrome.storage.sync.get(['activeTab'], function(result) {
  var activeTab = result.activeTab;
  if (activeTab !== undefined ) {
    InitInjection(activeTab);
  };
});

chrome.tabs.onUpdated.addListener(function (tabId , info) {
  chrome.storage.sync.get(['activeTab'], function(result) {
    var activeTab = result.activeTab;
    if (comparison_state === true && activeTab && activeTab.id === tabId && info.status === 'complete') {
      document.dispatchEvent(new Event("loaded"));
    };
  });
});

chrome.storage.onChanged.addListener(function (changes, namespace) {

  if ('example_image' in changes) {
    var example_image = changes.example_image.newValue;
    if (example_image !== undefined ) {
      console.log("example_image loaded!");
    }
  }
  console.log(1);
  if ('comparison_image' in changes) {
    console.log(2);
    var comparison_image = changes.comparison_image.newValue;
    if (comparison_image !== undefined ) {
      console.log(3);
      chrome.storage.local.get(['example_image', 'comparison_image'], function(result) {
        console.log(4);
        if (result.example_image !== undefined && result.comparison_image !== undefined && result.example_image === result.comparison_image) {
          logger.innerHTML = "Brothers";
        } else {
          logger.innerHTML = "Buy!";
          document.dispatchEvent(new Event("alert"));
        }
      });
    }
  }

  if ('activeTab' in changes) {
    var activeTab = changes.activeTab.newValue;
    if (activeTab !== undefined ) {
      InitInjection(activeTab);
    }
  }
});
