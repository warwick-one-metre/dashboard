// Global variables that are updated when switching camera
// This allows us to avoid re-binding event handlers for video/lights/etc

let cameraUrl = undefined;
let videoUrl = undefined;
let videoPlaying = false;

let audioUrl = undefined;
let audioClient = null;
let audioVolumeController = null;
let audioPlaying = false;

let infraredUrl = undefined;
let lightUrl = undefined;

function selectCamera(name) {
  const thumb = $('#thumb-' + name).children('img');
  const display = $('#video');
  const sourceUrl = thumb.data('source-url');
  const sourceLabel = thumb.attr('alt');

  cameraUrl = thumb.data('camera-url');
  videoUrl = thumb.data('video-url');
  audioUrl = thumb.data('audio-url');
  lightUrl = thumb.data('light-url');
  infraredUrl = thumb.data('infrared-url');

  $('#spinner').show();
  display.data('url', cameraUrl);
  $(display).attr('src', cameraUrl + '?' + Date.now());

  if (videoUrl) {
    $('#video-button').show()
  } else {
    $('#video-button').hide();
  }

  stopAudioStream();
  if (audioUrl) {
    $('#audio-button-container').css('display', 'inline-block');
  } else {
    $('#audio-button-container').css('display', 'none');
  }

  if (lightUrl) {
    $('#light-button').show()
  } else {
    $('#light-button').hide()
  }

  if (infraredUrl) {
    $('#ir-button').show()
  } else {
    $('#ir-button').hide()
  }

  if (sourceUrl) {
    const source = $('#source');
    source.attr('href', sourceUrl);
    source.text(sourceLabel);
    source.show();
    $('#source-container').show();
  } else {
    $('#source-container').hide();
  }
}

function reloadImages() {
  $('img').each(function() {
    // Only refresh images tagged with data-ural
    const url = $(this).data('url');
    if (url)
      $(this).attr('src', url + '?' + Date.now());
  });
}

function startAudioStream(websocketAddress, sampleRate, latency, gain) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const context = new AudioContext();
  
  audioVolumeController = context.createGain();
  let nextTime = 0;

  audioVolumeController.gain.value = gain;
  function update(array) {
    if (audioVolumeController === null)
      return;

    let buffer = context.createBuffer(1, array.byteLength / 4, sampleRate);

    if (typeof buffer.copyToChannel === "function")
      buffer.copyToChannel(array, 0);
    else
      buffer.getChannelData(0).set(array);

    const source = context.createBufferSource();
    source.buffer = buffer;

    if (nextTime === 0)
      nextTime = context.currentTime + latency;

    source.start(nextTime);
    source.connect(audioVolumeController);
    audioVolumeController.connect(context.destination);
    nextTime += buffer.duration;
  }

  audioClient = new BinaryClient(websocketAddress);
  audioClient.on('stream', function(stream, meta) {
    stream.on('data', function(data) {
      update(new Float32Array(data));
    });
  });
}

function stopAudioStream() {
  if (audioClient != null)
    audioClient.close();

  audioClient = null;
  audioVolumeController = null;
}

function setAudioStreamVolume(gain) {
  if (audioVolumeController != null)
    audioVolumeController.gain.value = gain;
}

$(document).ready(function () {
  $('#video-button').click(function() {
    if (videoPlaying) {
      $('#video-button span').text('Video');
      $('#video').attr('src', cameraUrl + '?' + Date.now());
      videoPlaying = false;
    } else {
      $('#spinner').show();
      $('#video-button span').text('Stop');
      $('#video').attr('src', videoUrl + '?' + Date.now());
      videoPlaying = true;
    }
  });

  const audioVolume = $('#audio-volume');
  audioVolume.on('input', function(ev) {
    setAudioStreamVolume(ev.target.value);
  });

  $('#audio-button').click(function() {
    if (audioPlaying) {
      $('#audio-button span').text('Audio');
      stopAudioStream();
      audioPlaying = false;
    } else {
      $('#audio-button span').text('Stop');
      startAudioStream(audioUrl, 22050, 0.2, audioVolume[0].value);
      audioPlaying = true;
    }
  });

  $('#enable-light-button').click(function() {
    $.ajax({ type: 'GET', url: lightUrl + '/on' });
  });

  $('#disable-light-button').click(function() {
    $.ajax({ type: 'GET', url: lightUrl + '/off' });
  });

  $('#enable-irleds-button').click(function() {
    $.ajax({ type: 'GET', url: infraredUrl + '/on' });
  });

  $('#disable-irleds-button').click(function() {
    $.ajax({ type: 'GET', url: infraredUrl + '/off' });
  });

  $('#video').on('load', function() {
    $('#spinner').hide();
  });

  // Select requested image, fall back to first
  let match = $("#thumb-" + $(location).attr('hash').substr(1));
  if (match.length == 0)
    match = $(".thumb-panel");

  selectCamera(match.first().attr('id').substr(6));
  window.setInterval(reloadImages, 30000);
});