/**
 * Welcome to Feedble!
 *
 * This is the definitive RSS reader app for Pebble.
 **/



/**
 * Libraries
 **/
var UI = require('ui');
//var Vector2 = require('vector2');
var ajax = require('ajax');
var Base64 = require('base64');
var Settings = require('settings');
var Interfaces = require('interfaces');




/**
 * Global variables
 **/
var loginAuth = Settings.option('loginAuth');
var readSpeed = 300; //milliseconds
var apiKey = '0c1161681e889da2bb4ae8eb3fe76417dc9fedac';
var visibleEntry;
var setPebbleVersion = 'DMBU';
var playing = false;




/**
 * Save settings changes to localstorage
 **/
Settings.config(
  {
    url: 'http://x.SetPebble.com/' + setPebbleVersion + '/' + Pebble.getAccountToken(),
    autoSave: false
  },
  function(e) {
    console.log('Settings opened');
  },
  function(e) {
    console.log('Settings closed');
    
    // Show the raw response if parsing failed
    if (e.failed) {
      console.log('Settings parsing failed: ' + e.response);
    } else {    
      var options = Settings.option();
      options.loginAuth = {'user': e.options['1'], 'pass': e.options['2']};
      loginAuth = options.loginAuth;
      
      if(e.options['3']){
        options.readSpeed = e.options['3'];
        readSpeed = options.readSpeed;
      }
      
      Settings.option(options);
    }
    
    Interfaces.loading.show();
    Interfaces.mainMenu.hide();
    Interfaces.entryMenu.hide();
    Interfaces.entryCard.hide();
    Interfaces.errorCard.hide();

    init();
  }
);




/**
 * Interface events
 */
Interfaces.mainMenu.on('select', selectCatFeed);

Interfaces.entryMenu.on('select', function(e) {
  var cleanBody =  e.item.cfObj.content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, " ");
  
  var body = 
    cleanBody.length > 350?
      cleanBody.substring(0, 350) + '...\n\nRead all in your paired device.'
      :
      cleanBody;
  body = 'Date: ' + dateShort((new Date(e.item.cfObj.date))) + '\n\n' + body;
  
  
  Interfaces.entryCard.title(e.item.title);
  Interfaces.entryCard.subtitle(e.item.cfObj.feedName);  
  Interfaces.entryCard.body(body);
  
  visibleEntry = e.item.cfObj;
  readEntry(true, visibleEntry);
  
  Interfaces.entryCard.show();
});

Interfaces.entryCard.on('click', 'select', function(e){
  Interfaces.entryCardOptionsMenu.show();
});

Interfaces.entryCardOptionsMenu.on('select', function(e) {
  switch (e.itemIndex) {
    case 0:
      console.log('Playing entry: '+visibleEntry.id);
      playEntry(visibleEntry);
      break;
    case 1:
      console.log('Star entry in CommaFeed server: '+visibleEntry.id);
      starEntry(visibleEntry);
      break;
    case 2:
      console.log('Mark entry as unread in CommaFeed server: '+visibleEntry.id);
      readEntry(false, visibleEntry);
  }
});

Interfaces.playEntryCard.on('show', function(){
  playing = true;
});
Interfaces.playEntryCard.on('hide', function(){
  playing = false;
});




/**
 * Functions
 */
function dateShort(date) {
  var mm = date.getMonth() + 1; // getMonth() is zero-based
  var dd = date.getDate();

  return [
    date.getFullYear(),
    (mm>9 ? '' : '0') + mm,
    (dd>9 ? '' : '0') + dd
  ].join('/');
}

function showError(msg, trace, callback){
  console.log(msg + ': ' + trace);   
  Interfaces.errorCard.subtitle(msg);
  Interfaces.errorCard.body(trace.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, " "));
  callback();
}

function playEntry(entry){
  var cleanBody =  entry.content
    .replace(/<[^>]*>/g, '')
    .replace(/\n/g, ' ')
    .replace(/&nbsp;/g, " ")
    .replace(/ +/g, " ");
  console.log(cleanBody);
  
  Interfaces.playEntryCard.show();
  
  var loop = function (i,array) {
    setTimeout(function () {
      if (playing && i < array.length) {
        Interfaces.playEntryCard.title(array.substring(i,i+55));
        loop(i+3,array);
      } else {
        Interfaces.playEntryCard.hide();
      }
    }, readSpeed);
  };
  
  loop(0,cleanBody/*.split(' ')*/);
}

function starEntry(entry){
  ajax(
    { 
      url: 'https://www.commafeed.com/rest/entry/star', 
      method: 'post',
      headers: {
        Authorization: 'Basic ' + Base64.encode(loginAuth.user+':'+loginAuth.pass)
      },
      type: 'json',
      data: {
        id: entry.id,
        feedId: entry.feedId,
        starred: true
      }
    },
    function(data) {
      console.log('Entry starred in CommaFeed server: '+entry.id);
      Interfaces.entryCardOptionsMenu.hide();
    },
    function(data) {
      if(data.length>0){
        console.log('Error starring entry ' + entry.id + ' in CommaFeed server: ' + data);
      }
      Interfaces.entryCardOptionsMenu.hide();
    }
  );
}

function readEntry(read, entry){
  ajax(
    {
      url: 'https://www.commafeed.com/rest/entry/mark', 
      method: 'post',
      headers: {
        Authorization: 'Basic ' + Base64.encode(loginAuth.user+':'+loginAuth.pass)
      },
      type: 'json',
      data: {
        id: entry.id,
        read: read
      }
    },
    function(data) {
      console.log('Entry read in CommaFeed server: '+entry.id);
      Interfaces.entryCardOptionsMenu.hide();
    },
    function(data) {
      if(data.length>0){
        console.log('Error reading entry ' + entry.id + ' in CommaFeed server: ' + data);
      }
      Interfaces.entryCardOptionsMenu.hide();
    }
  );
}

function selectCatFeed(child){
  console.log('Selected category #' + child.itemIndex + ' of section #' + child.sectionIndex);
  console.log('The category is titled "' + child.item.title + '"');

  if(!child.item.cfObj){
    getEntries('category', child.item.root);
  } else if(child.item.cfObj.feedUrl){
    getEntries('feed', child.item.cfObj.id);
  } else {
    getCategoriesFeeds(child);
  }
}

function getCategoriesFeeds(parent){
  var catFeeds = [{
    title: 'All entries',
    root: parent.item.cfObj.id
  }];
  parent.item.cfObj.children.forEach(function(category){    
    catFeeds.push({
      title: category.name,
      cfObj: category
    });
  });
  parent.item.cfObj.feeds.forEach(function(feed){
    if(feed.unread>0){
      catFeeds.push({
        title: feed.name + ' (' + feed.unread + ')',
        cfObj: feed
      });
    }
  });
  
  if(catFeeds.length > 1){
    if(!parent.itemIndex){
      Interfaces.mainMenu.section(
        0,
        { title: parent.item.title,
          backgroundColor: 'black',
          textColor: 'white',
          items: catFeeds
        }
      );
      Interfaces.mainMenu.show();
      Interfaces.loading.hide();
    } else {
      var catFeedMenu = new UI.Menu({
        status: {
          color: '#ffcccc',
          backgroundColor: '#ffcccc',
          separator: 'none',
        },
        backgroundColor: '#ffcccc',
        highlightBackgroundColor: '#990000',
        highlightTextColor: 'white',
        sections: [{ 
          title: parent.item.title,
          backgroundColor: 'black',
          textColor: 'white',
          items: catFeeds
        }]
      });
      catFeedMenu.on('select', selectCatFeed);
      catFeedMenu.selection(0, 0);
      catFeedMenu.show();
    }
  } else {
    Interfaces.noEntriesCard.show();
    if(!parent.itemIndex){
      Interfaces.loading.hide();
    }
  }
}

function init(){
  ajax(
    { 
      url: 'https://www.commafeed.com/rest/category/get?apiKey=' + apiKey, 
      method: 'get',
      headers: {
        Authorization: 'Basic ' + Base64.encode(loginAuth.user+':'+loginAuth.pass)
      },
      type: 'json',
      cache: false
    },
    function(data) {
      console.log('Categories getted');

      var root = {
        item: {
          title: 'Unread',
          cfObj: data,
        }
      };

      getCategoriesFeeds(root);
    },
    function(data) {
      if(data.length>0){
        showError(
          'Error getting categories',
          data, 
          function(){
            Interfaces.errorCard.show();
            Interfaces.loading.hide();
          }
        );
      }
    }
  );
}

function getEntries(type, id){
  Interfaces.loading.show();
  
  ajax(
    { 
      url: 'https://www.commafeed.com/rest/' + type + '/entries' + 
              '?id=' + id + 
              '&readType=unread' + 
              '&offset=0' + 
              '&limit=1000' + 
              '&order=desc' + 
              '&onlyIds=false', 
      method: 'get',
      headers: {
        Authorization: 'Basic ' + Base64.encode(loginAuth.user+':'+loginAuth.pass)
      },
      type: 'json',
      cache: false
    },
    function(data) {
      console.log('Entries getted');
      
      var entries = [];
      if(data.entries.length > 0){
        data.entries.forEach(function(entry){
          entries.push({
            title: entry.title,
            cfObj: entry
          });
        });
        
        Interfaces.entryMenu.section(
          0,
          { title: data.name,
            backgroundColor: 'black',
            textColor: 'white',
            items: entries
          }
        );
        
        Interfaces.entryMenu.selection(0, 0);
        Interfaces.entryMenu.show();
      } else {
        Interfaces.noEntriesCard.show();
      }
      Interfaces.loading.hide();
    },
    function(data) {
      if(data.length>0){
        showError(
          'Error getting entries',
          data, 
          function(){
            Interfaces.errorCard.show();
            Interfaces.loading.hide();
          }
        );
      }
    }
  );
}

if(loginAuth === null || loginAuth === undefined ||
     !loginAuth.user ||
     !loginAuth.pass){
  showError(
    'Error getting credentials',
    'Pleasse fill in app settings your CommaFeed credentials', 
    function(){
      Interfaces.errorCard.show();
    }
  );
} else {
  if(Settings.option('readSpeed')){
    readSpeed = Settings.option('readSpeed');
  }
  
  Interfaces.loading.show();
  init();
}
