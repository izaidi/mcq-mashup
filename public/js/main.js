var socket = null;
var era = null;
var instruments = [];
var tracks = [];
var loadedTracks = [];
var activeTracks = [];
var musicRoot = 'music/';
var defaultParams = {
  mute: true,
  loop: true,
  html5: true,
  buffer: true
}

function shuffle(arrayToShuffle) {
  var array = arrayToShuffle.slice(0);
    let counter = array.length;
    while (counter > 0) {
        let index = Math.floor(Math.random() * counter);
        counter--;
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }
    return array;
}

function initMusic() {
  if (era == '70s') {
    instruments = [
      '1970drums',
      '1970bass',
      '1970guitar',
      '1970piano'
    ]
  }

  if (era == '90s') {
    instruments = [
      '1990drums',
      '1990bass',
      '1990guitar',
      '1990trumpet'
    ]
  }

  $.each(instruments, function(index, instrument) {
    var src = musicRoot + instrument + '.mp3';
    var params = jQuery.extend(true, {}, defaultParams);
    params['src'] = src;
    params['onload'] = function() {
      trackLoaded(instrument);
    }
    var track = new Howl(params);
    tracks.push(track);
  });
}

function trackLoaded(instrument) {
  loadedTracks.push(instrument);
  if (loadedTracks.length == instruments.length) {
    finishLoading();
  }
}

function beginMusic() {
  $.each(tracks, function(index, track) {
    track.play();
  });
}

function insertInstruments() {
  var hSize = ($(window).width() / 2) - 10;
  var vSize = ($(window).height() / 2) - 10;
  var size = Math.min(hSize, vSize);
  var shuffled = shuffle(instruments);
  $.each(shuffled, function(newIndex, instrument) {
    var index = instruments.indexOf(instrument);
    var div = $('<div></div>');
    div.addClass('instrument');
    div.attr('id', 'instrument'+index);
    div.css({
      width: size+'px',
      height: size+'px',
      backgroundImage: 'url(style/images/'+instrument+'.png)'
    });
    $('.instruments').append(div);
  });
}

function wiggle(div, index, code, direction) {
  if (activeTracks.indexOf(code) < 0) {
    return false;
  }
  var nextDirection;
  if (direction == 'left') {
    nextDirection = 'right';
  } else {
    nextDirection = 'left';
  }
  div.removeClass('rotate-left rotate-right');
  div.addClass('rotate-'+direction);
  setTimeout(function() {
    wiggle(div, index, code, nextDirection);
  }, 180);
}

function indexFromCode(code) {
  var index = code;
  if (code >= instruments.length) {
    index -= instruments.length;
  }
  return index;
}

function activateInstrument(code) {
  if (!validInstrument(code) || activeTracks.indexOf(code) > -1) {
    return false;
  }
  activeTracks.push(code);
  var index = indexFromCode(code);
  console.log('activating ' + index);
  var div = $('#instrument'+index);
  div.addClass('active');
  wiggle(div, index, code);
  tracks[index].mute(false);
}

function muteInstrument(code) {
  if (!validInstrument(code)) {
    return false;
  }
  var activeIndex = activeTracks.indexOf(code);
  if (activeIndex > -1) {
    activeTracks.splice(activeIndex, 1);
  } else {
    return false;
  }
  var index = indexFromCode(code);
  var div = $('#instrument'+index);
  div.removeClass('active');
  tracks[index].mute(true);
}

function validInstrument(code) {
  if (code >= instruments.length && era == '90s') {
    return true;
  } else if (code < instruments.length && era == '70s') {
    return true;
  } else {
    return false;
  }
}

function initSocket() {
  var url = $(location).attr('origin');
  socket = io.connect(url);
  socket.on('play', function (data) {
    console.log('Data received!');
    console.log(data);
    activateInstrument(data.instrument);
  });
  socket.on('stop', function (data) {
    muteInstrument(data.instrument);
  });
  socket.on('allLoaded', function (data) {
    console.log('all loaded!');
    $('.waiting').hide();
    beginMusic();
  });
  socket.on('reload', function (data) {
    location.reload();
  });
}

function preloadImages() {
  $.each(instruments, function(index, instrument) {
    var url = 'style/images/'+instrument+'.png';
    var img = new Image();
    img.src = url;
  });
}

function finishLoading() {
  $('.spinner').hide();
  $('.bg').show();
  insertInstruments();
  initSocket();
  //beginMusic();
  $('.waiting').show();
  socket.emit('loaded', { screen: era });
}

$(document).keydown(function(e) {
  if ((e.keyCode >= 48 && e.keyCode <= 55)) { 
    var code = e.keyCode - 48;
    if (activeTracks.indexOf(code) > -1) {
      muteInstrument(code);
    } else {
      activateInstrument(code);
    }
  }
});

$(document).ready(function() {
  initMusic();
  preloadImages();
  //setTimeout(finishLoading, 3000);
});