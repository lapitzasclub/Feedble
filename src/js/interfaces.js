var UI = require('ui');

var Interfaces = (function(){
   
  var loading = new UI.Card({
    status: {
      color: 'white',
      backgroundColor: 'white',
      separator: 'none',
    },
    title: 'Feedble',
    icon: 'images/icon.png',
    subtitle: 'The RSS reader for Pebble',
    body: 'Loading...',
    subtitleColor: 'indigo',
    bodyColor: '#9a0036'
  });
  
  var mainMenu = new UI.Menu({
    status: {
      color: '#ffcccc',
      backgroundColor: '#ffcccc',
      separator: 'none',
    },
    backgroundColor: '#ffcccc',
    highlightBackgroundColor: '#990000',
    highlightTextColor: 'white',
    sections: []
  });
  
  var entryMenu = new UI.Menu({
    status: {
      color: '#ffcccc',
      backgroundColor: '#ffcccc',
      separator: 'none',
    },
    backgroundColor: '#ffcccc',
    highlightBackgroundColor: '#990000',
    highlightTextColor: 'white',
    sections: []
  });
  
  var entryCard = new UI.Card({
    status: false,
    scrollable: true,
    title: '',
    subtitle: '',
    subtitleColor: 'indigo',
    body: '',
    bodyColor: '#9a0036',
  });
  
  var errorCard = new UI.Card({
    status: false,
    scrollable: true,
    title: 'ERROR',
    titleColor: '	#8B0000',
    subtitle: '',
    subtitleColor: '#FF0000',
    body: '',
    bodyColor: '#CD5C5C',
  });
  
  var entryCardOptionsMenu = new UI.Menu({
    status: {
      color: '#ffcccc',
      backgroundColor: '#ffcccc',
      separator: 'none',
    },
    backgroundColor: '#ffcccc',
    highlightBackgroundColor: '#990000',
    highlightTextColor: 'white',
    sections: [{
      items: [
        {title: 'Read entire entry'},
        {title: 'Star'},
        {title: 'Mark as unread'}
      ]
    }]
  });
  
  var noEntriesCard = new UI.Card({
    status: {
      color: 'white',
      backgroundColor: 'white',
      separator: 'none',
    },
    title: 'Feedble',
    icon: 'images/icon.png',
    subtitle: 'No unread entries',
    body: 'Try again later',
    subtitleColor: 'indigo',
    bodyColor: '#9a0036'
  });
  
  var playEntryCard = new UI.Card({
    status: false,
    title: '',
    subtitle: '',
    body: '',
  });
  
  return {
    loading: loading,
    mainMenu: mainMenu,
    entryMenu: entryMenu,
    entryCard: entryCard,
    errorCard: errorCard,
    entryCardOptionsMenu: entryCardOptionsMenu,
    noEntriesCard: noEntriesCard,
    playEntryCard: playEntryCard
  };
})();

if (typeof module !== 'undefined') {
  module.exports = Interfaces;
}