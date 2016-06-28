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

  return [data['filename']]
}

var cameraFields = {
  'date': reductionFrameDate,
  'exposure': reductionFrameExposure,
  'saved': reductionFrameFilename
}

function queryCamera(id) {
  $.ajax({
    type: "GET",
    url: "/dashboard/onemetre/" + id + "/json",
    statusCode: {
      404: function() {
        updateListGroup(id, cameraFields);
        $('#' + id + '-updated').html(formatUTCDate(new Date()) + ' UTC');

        // Remove thumbnail
        $('#' + id + '-thumb').attr('src', '');
      }
    }
  }).done(function(msg) {
    var data = jQuery.parseJSON(msg);
    updateListGroup(id, cameraFields, data);
    $('#' + id + '-updated').html(formatUTCDate(new Date()) + ' UTC');

    // Update thumbnail if required
    if (data && 'date' in data) {
      // Date is for cache-busting only.
      var date = parseUTCDate(data['date']).getTime()
      var url = $('#' + id + '-thumb').data('url');
      $('#' + id + '-thumb').attr('src', url + '?' + date);
    }
  });

  window.setTimeout(function() { queryCamera(id) }, 10000);
}

$(document).ready(function () {
  queryCamera('blue');
  queryCamera('red');
});

