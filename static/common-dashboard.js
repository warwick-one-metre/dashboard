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

// Environment generators
function fieldLimitsColor(field, value) {
  if (!('limits' in field))
    return null;

  if (field['disabled'])
    return 'text-info';

  if (value < field['limits'][0] || value > field['limits'][1])
    return 'text-danger';

  if ('warn_limits' in field && (value < field['warn_limits'][0] || value > field['warn_limits'][1]))
    return 'text-warning';

  return 'text-success';
}

function envLatestMinMax(row, cell, data) {
  if ('latest' in data) {
    var precision = row.data('precision');
    if (precision === undefined)
      precision = 1;

    var display = data['latest'].toFixed(precision);
    var units = row.data('units');
    if (units)
      display += units;
    cell.html(display);
    cell.addClass(fieldLimitsColor(data, data['latest']));
  } else {
    cell.html('NO DATA');
    cell.addClass('text-danger');
  }

  if ('max' in data && 'min' in data) {
    var maxValue = $('<span>');
    maxValue.html(data['max'].toFixed(1));
    maxValue.addClass(fieldLimitsColor(data, data['max']));

    var minValue = $('<span>');
    minValue.html(data['min'].toFixed(1));
    minValue.addClass(fieldLimitsColor(data, data['min']));

    var maxMinValue = $('<span class="pull-right data-minmax">');
    maxMinValue.append(maxValue);
    maxMinValue.append('<br>');
    maxMinValue.append(minValue);
    cell.append(maxMinValue);
  }
}

function diskSpaceGB(row, cell, data) {
  if ('latest' in data) {
    var display = +(data['latest'] / 1073741824).toFixed(1);
    var units = row.data('units');
    if (units)
      display += units;
    cell.html(display);
    cell.addClass(fieldLimitsColor(data, data['latest']));
  }
}

function seeingIfAvailable(row, cell, data) {
  if ('latest' in data && data['latest'] > 0) {
    var display = data['latest'].toFixed(2);
    var units = row.data('units');
    if (units)
      display += units;
    cell.html(display);
  } else {
    cell.html('NO DATA');
    cell.addClass('text-danger');
  }
}
