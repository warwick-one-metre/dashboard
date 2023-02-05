function reductionFrameDate(data) {
  if (!data || !('date' in data))
    return ['ERROR', 'text-danger'];

  var date = parseUTCDate(data['date']);
  return [formatUTCDate(date)];
}

function reductionFrameExptime(data) {
  if (!data || !('exptime' in data))
    return ['ERROR', 'text-danger'];
  return [data['exptime'].toFixed(2) + ' s'];
}

function reductionFrameFilename(data) {
  if (!data || !('filename' in data) || !('saved' in data))
    return ['ERROR', 'text-danger'];

  if (!data['saved'])
    return ['NOT SAVED', 'text-danger'];

  return [data['filename'], 'filename']
}

var cameraFields = {
  'date': reductionFrameDate,
  'exptime': reductionFrameExptime,
  'filename': reductionFrameFilename,
}

var sourceSize = {
  1: [0, 0],
  2: [0, 0]
};

var clipSize = {
  1: 0,
  2: 0
};

function queryPreviews() {
  for (let i = 1; i < 3; i++) {
    $.ajax({
      type: 'GET',
      dataType: 'json',
      url: '/data/clasp/cam' + i,
      statusCode: {
        404: function () {
          updateListGroup(i, cameraFields);

          // Remove previews
          $('#' + i + '-thumb').attr('src', '');
          $('#' + i + '-clip').attr('src', '');

          sourceSize[i] = [0, 0];
          clipSize[i] = 0;
        }
      }
    }).done(function (data) {
      updateListGroup(i, cameraFields, data);

      // Update thumbnail if required
      if (data && 'date' in data) {
        // Date is for cache-busting only.
        var date = parseUTCDate(data['date']).getTime();
        $('#' + i + '-thumb').attr('src', $('#' + i + '-thumb').data('url') + '?' + date);
        $('#' + i + '-clip').css('background-image', "url('" + $('#' + i + '-clip').data('url') + '?' + date + "')");

        sourceSize[i] = data['size'];
        clipSize[i] = data['clipsize'];
      }
    });
  }

  window.setTimeout(queryPreviews, 10000);
}

$(document).ready(function () {
  for (let i = 1; i < 3; i++) {
    var clip = $('#' + i + '-clip');
    $('#' + i + '-thumb').mousemove(function(e) {
      e.preventDefault();
      a = this.getBoundingClientRect();
      x = sourceSize[i][0] * (e.pageX - a.left - window.pageXOffset) / a.width + (clipSize[i] - sourceSize[i][0] - clip.width()) / 2;
      y = sourceSize[i][1] * (e.pageY - a.top - window.pageYOffset) / a.height + (clipSize[i] - sourceSize[i][1] - clip.height()) / 2;
      $('#' + i + '-clip').css('background-position', -x + 'px ' + -y + 'px');
    });
  }

  queryPreviews();
});