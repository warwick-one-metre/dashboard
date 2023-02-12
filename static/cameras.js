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

function selectCamera(element) {
  const thumb = $(element).children('img');
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
    $('#video-button-text').html('Play');
    $('#video-button-container').show()
  } else {
    $('#video-button-container').hide();
  }

  stopAudioStream();
  if (audioUrl) {
    $('#audio-button-text').html('Play');
    $('#audio-button-container').show();
  } else {
    $('#audio-button-container').hide();
  }

  if (lightUrl) {
    $('#light-button-container').show();
  } else {
    $('#light-button-container').hide();
  }

  if (infraredUrl) {
    $('#ir-button-container').show();
  } else {
    $('#ir-button-container').hide();
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
      $('#video-button-text').html('Play');
      $('#video').attr('src', cameraUrl + '?' + Date.now());
      videoPlaying = false;
    } else {
      $('#spinner').show();
      $('#video-button-text').html('Stop');
      $('#video').attr('src', videoUrl + '?' + Date.now());
      videoPlaying = true;
    }
  });

  const audioVolume = $('#audio-volume');
  audioVolume.slider()
  audioVolume.on('slide', function(ev) {
    setAudioStreamVolume(ev.value);
  });

  $('#audio-button').click(function() {
    if (audioPlaying) {
      $('#audio-button-text').html('Play');
      stopAudioStream();
      audioPlaying = false;
    } else {
      $('#audio-button-text').html('Stop');
      const gain = $('#audio-volume').data('slider').getValue();
      startAudioStream(audioUrl, 22050, 0.2, gain);
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

  selectCamera(match.first());
  window.setInterval(reloadImages, 30000);
});