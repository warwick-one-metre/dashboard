function updateGroups(data) {
  $('[data-generator]').each(function() {
    // Remove old content
    $(this).children('span.pull-right').remove();

    if (!$(this).is("td"))
    $(this).attr('class', 'list-group-item');

    // Add new content
    var generator = $(this).data('generator');
    var index = $(this).data('index');

    var fieldData = data;
    for (var i in index) {
      fieldData = index[i] in fieldData ? fieldData[index[i]] : undefined;
      if (fieldData === undefined)
        break;
    }

    var cell = $('<span class="pull-right">');
    if (fieldData === undefined) {
      cell.html('ERROR');
      cell.addClass('text-danger');
    } else if (window[generator])
      window[generator]($(this), cell, fieldData);

    $(this).append(cell);
  });

  var date = 'date' in data ? parseUTCDate(data['date']) : new Date();
  $('#data-updated').html('Updated ' + formatUTCDate(date) + ' UTC');
}

function pollDashboard(url) {
  $.ajax({
    type: 'GET',
    dataType: 'json',
    url: url,
    statusCode: {
      404: function() {
        updateGroups({});
      }
    }
  }).done(function(msg) {
    updateGroups(msg);
  });

  window.setTimeout(function() { pollDashboard(url); }, 10000);
}

