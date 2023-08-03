function updateGroups(data) {
  $('[data-generator]').each(function() {
    // Remove old content
    $(this).children('span.pull-right').remove();

    if (!$(this).is("td"))
    $(this).attr('class', 'list-group-item');

    // Add new content
    const generator = $(this).data('generator');
    const index = $(this).data('index');

    let fieldData = data;
    for (var i in index) {
      fieldData = fieldData && index[i] in fieldData ? fieldData[index[i]] : undefined;
      if (fieldData === undefined)
        break;
    }

    const cell = $('<span class="pull-right">');
    if (fieldData === undefined) {
      cell.html('ERROR');
      cell.addClass('text-danger');
    } else if (window[generator])
      window[generator]($(this), cell, fieldData);

    $(this).append(cell);
  });

  const date = 'date' in data ? parseUTCDate(data['date']) : new Date();
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
  for (let i in index) {
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
    let precision = row.data('precision');
    if (precision === undefined)
      precision = 1;

    let display = data['latest'].toFixed(precision);
    const units = row.data('units');
    if (units)
      display += units;
    cell.html(display);
    cell.addClass(fieldLimitsColor(data, data['latest']));
  } else {
    cell.html('NO DATA');
    cell.addClass('text-danger');
  }

  if ('max' in data && 'min' in data) {
    const maxValue = $('<span>');
    maxValue.html(data['max'].toFixed(1));
    maxValue.addClass(fieldLimitsColor(data, data['max']));

    const minValue = $('<span>');
    minValue.html(data['min'].toFixed(1));
    minValue.addClass(fieldLimitsColor(data, data['min']));

    const maxMinValue = $('<span class="pull-right data-minmax">');
    maxMinValue.append(maxValue);
    maxMinValue.append('<br>');
    maxMinValue.append(minValue);
    cell.append(maxMinValue);
  }
}

function diskSpaceGB(row, cell, data) {
  if (data && 'latest' in data) {
    let display = +(data['latest'] / 1073741824).toFixed(1);
    const units = row.data('units');
    if (units)
      display += units;
    cell.html(display);
    cell.addClass(fieldLimitsColor(data, data['latest']));
  }
}

function seeingIfAvailable(row, cell, data) {
  if ('latest' in data && data['latest'] > 0) {
    let display = data['latest'].toFixed(2);
    const units = row.data('units');
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
  let label = 'ERROR';
  let style = 'text-danger';
  let row_style = 'list-group-item-danger';

  if (data === 1) {
    label = 'OFFLINE';
  } else if (data === 2) {
    label = 'ONLINE';
    style = 'text-success';
    row_style = 'list-group-item-success';
  }

  cell.html(label);
  cell.addClass(style);
  row.addClass(row_style);
}

function opsHeaderDome(row, cell, data) {
  let label = 'ERROR';
  let style = 'text-danger';
  let row_style = 'list-group-item-danger';

  if (data === 1) {
    label = 'CLOSED';
  } else if (data === 2) {
    label = 'OPEN';
    style = 'text-success';
    row_style = 'list-group-item-success';
  }

  cell.html(label);
  cell.addClass(style);
  row.addClass(row_style);
}

function opsHeaderMode(row, cell, data) {
  const modes = [
    ['ERROR', 'list-group-item-danger'],
    ['AUTO', 'list-group-item-success'],
    ['MANUAL', 'list-group-item-warning'],
  ];

  const mode = data in modes ? modes[data] : mode[0];
  cell.html(mode[0]);
  row.addClass(mode[1]);
}

function opsHeaderDehumidifier(row, cell, data) {
  const modes = [
    ['MANUAL', 'list-group-item-warning'],
    ['AUTO', 'list-group-item-success'],
  ];

  const mode = data in modes ? modes[data] : modes[0];
  cell.html(mode[0]);
  row.addClass(mode[1]);
}

function opsHeaderEnvironment(row, cell, data) {
  if (('safe' in data) && ('conditions' in data)) {
    cell.html(data['safe'] ? 'SAFE' : 'NOT SAFE');
    row.addClass(data['safe'] ? 'list-group-item-success' : 'list-group-item-danger');

    const status_classes = ['', 'text-success', 'text-warning', 'text-danger'];
    let tooltip = '<table style="margin: 5px">';
    for (let c in data['conditions']) {
      if (!(c in data['conditions']))
        continue;

      tooltip += '<tr><td style="text-align: right;">' + c + ':</td>';
      const params = data['conditions'][c];
      for (let p in params)
        tooltip += '<td style="padding: 0 5px" class="' + status_classes[params[p]] + '">' + p + '</td>';

      tooltip += '</tr>';
    }
    tooltip += '</table>';

    const tooltip_active = row.data()['bs.tooltip'].tip().hasClass('in');
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

function opsStatus(row, cell, data) {
  if (!('safe' in data) || !('conditions' in data) || !('dome_closed' in data) || !('dome_auto' in data)) {
    cell.html('NO DATA');
    cell.addClass('text-danger');
    return;
  }

  let mode_class = data['dome_auto'] ? 'text-success' : 'text-warning';
  let mode_label = data['dome_auto'] ? 'AUTO' : 'MANUAL';
  let dome_class = data['observable'] ^ data['dome_closed'] ? 'text-success' : 'text-danger';
  let dome_label = data['dome_closed'] ? 'CLOSED' : 'OPEN';
  let label = '<span class="' + mode_class + '">' + mode_label + '</span>&nbsp;/&nbsp;<span class="' + dome_class + '">' + dome_label + '</span>';

  if (!data['safe'])
    label += '&nbsp;(<span class="text-danger">ENV</span>)';

  cell.html(label);

  if (('safe' in data) && ('conditions' in data)) {
    const status_classes = ['', 'text-success', 'text-warning', 'text-danger'];
    let tooltip = '<table style="margin: 5px">';
    let rows = 0;
    for (let c in data['conditions']) {
      if (!(c in data['conditions']))
        continue;

      tooltip += '<tr><td style="text-align: right;">' + c + ':</td>';
      const params = data['conditions'][c];
      for (let p in params)
        tooltip += '<td style="padding: 0 5px" class="' + status_classes[params[p]] + '">' + p + '</td>';

      tooltip += '</tr>';
      rows += 1;
    }

    if (rows === 0)
      tooltip += '<tr><td style="text-align: center;">NO DATA</td></tr>'
    tooltip += '</table>';

    row.tooltip({ html: true, title: tooltip });
  } else {
    cell.html('NO DATA');
    cell.addClass('text-danger');
  }
}

function powerUPS(row, cell, data) {
  const prefix = row.data('prefix');
  let label = 'ERROR';
  let style = 'text-danger';

  const status_field = prefix + '_status';
  const remaining_field = prefix + '_battery_remaining';
  const load_field = prefix + '_load';
  const battery_healthy = prefix + '_battery_healthy';
  if (battery_healthy in data && !data[battery_healthy])
      row.addClass('list-group-item-danger');

  if (data && status_field in data && remaining_field in data && load_field in data) {
    if (data[status_field] === 2) {
      label = 'ONLINE';
      style = 'text-success';
    }
    else if (data[status_field] === 3) {
      label = 'BATTERY';
      style = 'text-warning';
    }

    label += ' (' + data[remaining_field] + '%&nbsp;/&nbsp;' + Math.round(data[load_field]) + '%)';
  }

  cell.html(label);
  cell.addClass(style);
}

function powerATS(row, cell, data) {
  let label, style;
  if (data > 0) {
    label = 'SOURCE ' + data;
    style = '';
  } else {
    label = 'ERROR';
    style = 'text-danger';
  }

  cell.html(label);
  cell.addClass(style);
}

function powerOnOff(row, cell, data) {
  if (data === 2) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else if (data === 1) {
    cell.html('POWER ON');
    cell.addClass('text-success');
  } else {
    cell.html('POWER OFF');
    cell.addClass('text-danger');
  }
}

function powerOffOn(row, cell, data) {
  if (data === 2) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else if (data === 1) {
    cell.html('POWER ON');
    cell.addClass('text-danger');
  } else {
    cell.html('POWER OFF');
    cell.addClass('text-success');
  }
}

function powerOnOffMixed(row, cell, data) {
  const switches = row.data('switches');
  let error = false;
  let enabled = 0;

  for (let i in switches) {
    if (!(switches[i] in data) || data[switches[i]] === 2)
      error = true;
    else if (data[switches[i]] === 1)
      enabled += 1;
  }

  let status = 'POWER MIXED';
  let style = 'text-warning';
  if (error) {
    status = 'ERROR';
    style = 'text-danger';
  } else if (enabled === switches.length) {
    status = 'POWER ON';
    style = 'text-success';
  } else if (enabled === 0) {
    status = 'POWER OFF';
    style = 'text-danger';
  }

  cell.html(status);
  cell.addClass(style);
}

function switchClosedOpen(row, cell, data) {
  if ('latest' in data)
    cell.html(data['latest'] ? 'CLOSED' : 'OPEN');
  else {
    cell.html('NO DATA');
    cell.addClass('text-danger');
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
  } else if (data['mode'] === 2) {
    cell.html('MANUAL');
    cell.addClass('text-warning');
  } else if ('action_name' in data) {
    let label = data['action_name'];
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
  } else if (data['mode'] === 2) {
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
  } else if (data['frame_type'] === 'SCIENCE')
    cell.html(data['frame_object']);
  else
    cell.html(data['frame_type']);
}

function pipelinePrefix(row, cell, data) {
  cell.html(data);
}
