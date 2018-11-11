function reductionFrameDate(data) {
  if (!data || !('date' in data))
    return ['ERROR', 'text-danger']

  var date = parseUTCDate(data['date']);
  return [formatUTCDate(date)]
}

function reductionFrameExptime(data) {
  if (!data || !('exptime' in data))
    return ['ERROR', 'text-danger']
  return [data['exptime'].toFixed(2) + ' s']
}

function reductionFrameExposure(data) {
  if (!data || !('exposure_number' in data))
    return ['ERROR', 'text-danger']
  return [data['exposure_number']]
}

function reductionFrameObject(data) {
  if (!data || !('object' in data))
    return ['ERROR', 'text-danger']

  return [data['object']]
}

var cameraFields = {
  'object': reductionFrameObject,
  'exposure': reductionFrameExposure,
  'date': reductionFrameDate,
  'exptime': reductionFrameExptime,
}

var sourceSize = [0, 0];
var clipSize = 0;

function queryPreviews() {
  $.ajax({
    type: 'GET',
    dataType: 'json',
    url: '/data/wasp/wasp',
    statusCode: {
      404: function() {
        updateListGroup('wasp', cameraFields);
        $('#wasp-updated').html('Updated ' + formatUTCDate(new Date()) + ' UTC');

        // Remove previews
        $('#wasp-thumb').attr('src', '');
        $('#wasp-clib').attr('src', '');

        sourceSize = [0, 0];
        clipSize = 0;
      }
    }
  }).done(function(data) {
    updateListGroup('wasp', cameraFields, data);
    $('#wasp-updated').html('Updated ' + formatUTCDate(new Date()) + ' UTC');

    // Update thumbnail if required
    if (data && 'date' in data) {
      // Date is for cache-busting only.
      var date = parseUTCDate(data['date']).getTime();
      $('#wasp-thumb').attr('src', $('#wasp-thumb').data('url') + '?' + date);
      $('#wasp-clip').css('background-image', "url('" + $('#wasp-clip').data('url') + '?' + date + "')");

      sourceSize = data['size'];
      clipSize = data['clipsize'];
    }
  });

  window.setTimeout(queryPreviews, 10000);
}

$(document).ready(function () {
  var clip = $('#wasp-clip');
  $('#wasp-thumb')
  .mousemove(function(e) {
    e.preventDefault();
    a = this.getBoundingClientRect();
    x = sourceSize[0] * (e.pageX - a.left - window.pageXOffset) / a.width + (clipSize - sourceSize[0] - clip.width()) / 2;
    y = sourceSize[1] * (e.pageY - a.top - window.pageYOffset) / a.height + (clipSize - sourceSize[1] - clip.height()) / 2;
    $('#wasp-clip').css('background-position', -x + 'px ' + -y + 'px');
  });

  queryPreviews();
});

