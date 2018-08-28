function reductionFrameDate(data) {
  if (!data || !('date' in data))
    return ['ERROR', 'text-danger']

  var date = parseUTCDate(data['date']);
  return [formatUTCDate(date)]
}

function reductionFrameExposure(data) {
  if (!data || !('exptime' in data))
    return ['ERROR', 'text-danger']
  return [data['exptime'].toFixed(2) + ' s']
}

function reductionFrameFilename(data) {
  if (!data || !('saved' in data) || !('filename' in data))
    return ['ERROR', 'text-danger']

  if (!data['saved'])
    return ['NOT SAVED', 'text-danger']

  return [data['filename'], 'filename']
}

function reductionFrameHFD(data) {
  if (!data || !('hfd' in data))
    return ['ERROR', 'text-danger']

  if (data['hfd'] < 0)
    return ['N/A']

  return [data['hfd'] + ' arcsec']
}

function reductionFrameMedianCounts(data) {
  if (!data || !('medcnts' in data))
    return ['ERROR', 'text-danger']

  if (data['medcnts'] < 0)
    return ['N/A']

  return [data['medcnts'] + ' counts']
}

function reductionFrameObject(data) {
  if (!data || !('object' in data))
    return ['ERROR', 'text-danger']

  return [data['object']]
}

var cameraFields = {
  'object': reductionFrameObject,
  'date': reductionFrameDate,
  'exposure': reductionFrameExposure,
  'saved': reductionFrameFilename,
  'hfd': reductionFrameHFD,
  'medcnts': reductionFrameMedianCounts,
}

var sourceSize = [0, 0];
var clipSize = 0;

function queryPreviews() {
  $.ajax({
    type: 'GET',
    dataType: 'json',
    url: '/data/rasa/rasa',
    statusCode: {
      404: function() {
        updateListGroup('rasa', cameraFields);
        $('#rasa-updated').html(formatUTCDate(new Date()) + ' UTC');

        // Remove previews
        $('#rasa-thumb').attr('src', '');
        $('#rasa-clib').attr('src', '');

        sourceSize = [0, 0];
        clipSize = 0;
      }
    }
  }).done(function(data) {
    updateListGroup('rasa', cameraFields, data);
    $('#rasa-updated').html(formatUTCDate(new Date()) + ' UTC');

    // Update thumbnail if required
    if (data && 'date' in data) {
      // Date is for cache-busting only.
      var date = parseUTCDate(data['date']).getTime();
      $('#rasa-thumb').attr('src', $('#rasa-thumb').data('url') + '?' + date);
      $('#rasa-clip').css('background-image', "url('" + $('#rasa-clip').data('url') + '?' + date + "')");

      sourceSize = data['size'];
      clipSize = data['clipsize'];
    }
  });

  window.setTimeout(queryPreviews, 10000);
}

$(document).ready(function () {
  var clip = $('#rasa-clip');
  $('#rasa-thumb')
  .mousemove(function(e) {
    e.preventDefault();
    a = this.getBoundingClientRect();
    x = sourceSize[0] * (e.pageX - a.left - window.pageXOffset) / a.width + (clipSize - sourceSize[0] - clip.width()) / 2;
    y = sourceSize[1] * (e.pageY - a.top - window.pageYOffset) / a.height + (clipSize - sourceSize[1] - clip.height()) / 2;
    $('#rasa-clip').css('background-position', -x + 'px ' + -y + 'px');
  });

  queryPreviews();
});

