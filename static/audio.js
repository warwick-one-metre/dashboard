var audioClient = null;
var audioVolumeController = null;

function startAudioStream(websocketAddress, sampleRate, latency, gain) {
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  var context = new AudioContext();
  audioVolumeController = context.createGain();
  var nextTime = 0;

  audioVolumeController.gain.value = gain;
  function update(array) {
    buffer = context.createBuffer(1, array.byteLength / 4, sampleRate);

    if (typeof buffer.copyToChannel === "function")
      buffer.copyToChannel(array, 0);
    else
      buffer.getChannelData(0).set(array);

    var source = context.createBufferSource();
    source.buffer = buffer;

    if (nextTime == 0)
      nextTime = context.currentTime + latency;

    source.start(nextTime);
    source.connect(audioVolumeController);
    audioVolumeController.connect(context.destination);
    nextTime += buffer.duration;
  }

  audioClient = new BinaryClient(websocketAddress);
  audioClient.on('stream', function(stream, meta) {
    stream.on('data', function(data){
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

