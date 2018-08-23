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
      $('#rasa-clip').attr('src', $('#rasa-clip').data('url') + '?' + date);
    }
  });

  window.setTimeout(queryPreviews, 10000);
}

$(document).ready(function () {
  queryPreviews();
});

