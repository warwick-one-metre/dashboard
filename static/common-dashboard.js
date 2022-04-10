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
      fieldData = fieldData && index[i] in fieldData ? fieldData[index[i]] : undefined;
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

function getData(data, index) {
  for (var i in index) {
    data = data && index[i] in data ? data[index[i]] : undefined;
    if (data === undefined)
      break;
  }

  return data;
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

// Header generators
function opsHeaderTel(row, cell, data) {
  status = 'ERROR';
  style = 'text-danger';
  rowstyle = 'list-group-item-danger';

  if (data == 1) {
    status = 'OFFLINE';
  } else if (data == 2) {
    status = 'ONLINE';
    style = 'text-success';
    rowstyle = 'list-group-item-success';
  }

  cell.html(status);
  cell.addClass(style);
  row.addClass(rowstyle);
}

function opsHeaderDome(row, cell, data) {
  status = 'ERROR';
  style = 'text-danger';
  rowstyle = 'list-group-item-danger';

  if (data == 1) {
    status = 'CLOSED';
  } else if (data == 2) {
    status = 'OPEN';
    style = 'text-success';
    rowstyle = 'list-group-item-success';
  }

  cell.html(status);
  cell.addClass(style);
  row.addClass(rowstyle);
}



function opsHeaderMode(row, cell, data) {
  var modes = [
    ['ERROR', 'list-group-item-danger'],
    ['AUTO', 'list-group-item-success'],
    ['MANUAL', 'list-group-item-warning'],
  ];

  var mode = data in modes ? modes[data] : mode[0];
  cell.html(mode[0]);
  row.addClass(mode[1]);
}

function opsHeaderDehumidifier(row, cell, data) {
  var modes = [
    ['MANUAL', 'list-group-item-warning'],
    ['AUTO', 'list-group-item-success'],
  ];

  var mode = data in modes ? modes[data] : mode[0];
  cell.html(mode[0]);
  row.addClass(mode[1]);
}

function opsHeaderEnvironment(row, cell, data) {
  if (('safe' in data) && ('conditions' in data)) {
    cell.html(data['safe'] ? 'SAFE' : 'NOT SAFE');
    row.addClass(data['safe'] ? 'list-group-item-success' : 'list-group-item-danger');

    var status_classes = ['', 'text-success', 'text-warning', 'text-danger']
    var tooltip = '<table style="margin: 5px">';
    for (var c in data['conditions']) {
      if (!(c in data['conditions']))
        continue;

      tooltip += '<tr><td style="text-align: right;">' + c + ':</td>';
      var params = data['conditions'][c];
      for (var p in params)
        tooltip += '<td style="padding: 0 5px" class="' + status_classes[params[p]] + '">' + p + '</td>';

      tooltip += '</tr>';
    }
    tooltip += '</table>';

    var tooltip_active = row.data()['bs.tooltip'].tip().hasClass('in');
    if (tooltip_active)
      row.tooltip('hide');

    row.data('bs.tooltip', false);
    row.tooltip({ html: true, title: tooltip });

    if (tooltip_active)
      row.tooltip('show');
  } else {
    cell.html('NO DATA');
    cell.addClass('text-danger');
  }
}

function powerUPS(row, cell, data) {
  var prefix = row.data('prefix');
  status = 'ERROR';
  style = 'text-danger';

  var status_field = prefix + '_status';
  var remaining_field = prefix + '_battery_remaining';
  var load_field = prefix + '_load';
  var battery_healthy = prefix + '_battery_healthy';
  if (battery_healthy in data && !data[battery_healthy])
      row.addClass('list-group-item-danger');

  if (data && status_field in data && remaining_field in data && load_field in data) {
    if (data[status_field] == 2) {
      status = 'ONLINE';
      style = 'text-success';
    }
    else if (data[status_field] == 3) {
      status = 'BATTERY';
      style = 'text-warning';
    }

    status += ' (' + data[remaining_field] + '%&nbsp;/&nbsp;' + Math.round(data[load_field]) + '%)';
  }

  cell.html(status);
  cell.addClass(style);
}

function powerOnOff(row, cell, data) {
  if (data == 2) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else if (data == 1) {
    cell.html('POWER ON');
    cell.addClass('text-success');
  } else {
    cell.html('POWER OFF');
    cell.addClass('text-danger');
  }
}

function powerOffOn(row, cell, data) {
  if (data == 2) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else if (data == 1) {
    cell.html('POWER ON');
    cell.addClass('text-danger');
  } else {
    cell.html('POWER OFF');
    cell.addClass('text-success');
  }
}

function domeTime(row, cell, data) {
  if (data == null)
    cell.html('N/A');
  else {
    cell.html(data);
    cell.addClass('text-warning');
  }
}

function opsActionName(row, cell, data) {
  if (!('mode' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else if (data['mode'] == 2) {
    cell.html('MANUAL');
    cell.addClass('text-warning');
  } else if ('action_name' in data) {
    label = data['action_name'];
    if ('action_number' in data && data['action_number'] > 0)
      label += ' (' + data['action_number'] + ' / ' + data['action_count'] + ')';
    cell.html(label);
  }
  else
    cell.html('IDLE');
}

function opsActionTask(row, cell, data) {
  if (!('mode' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else if (data['mode'] == 2) {
    cell.html('MANUAL');
    cell.addClass('text-warning');
  } else if ('action_task' in data)
    cell.html(data['action_task']);
  else
    cell.html('IDLE');
}

function pipelineObject(row, cell, data) {
  if (!('frame_type' in data) || !('frame_object' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else if (data['frame_type'] == 'SCIENCE')
    cell.html(data['frame_object']);
  else
    cell.html(data['frame_type']);
}

function pipelinePrefix(row, cell, data) {
  cell.html(data);
}