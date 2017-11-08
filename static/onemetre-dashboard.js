// Power generators
function powerUPS(row, cell, data, status_field, remaining_field) {
  status = 'ERROR';
  style = 'text-danger';

  if (data && status_field in data && remaining_field in data) {
    if (data[status_field] == 2) {
      status = 'ONLINE';
      style = 'text-success';
    }
    else if (data[status_field] == 3) {
      status = 'BATTERY';
      style = 'text-warning';
    }

    status += ' (' + data[remaining_field] + '%)';
  }

  cell.html(status);
  cell.addClass(style);
}

function powerMainUPS(row, cell, data) {
  powerUPS(row, cell, data, 'main_ups_status', 'main_ups_battery_remaining');
}

function powerDomeUPS(row, cell, data) {
  powerUPS(row, cell, data, 'dome_ups_status', 'dome_ups_battery_remaining');
}

function powerInstrument(row, cell, data) {
  fields = ['blue_camera', 'red_camera', 'red_focus_controller', 'red_focus_motor'];
  error = false;

  var enabled = 0;
  for (i in fields) {
    if (!(fields[i] in data))
      error = true;
    else if (data[fields[i]])
      enabled += 1;
  }

  status = 'POWER MIXED';
  style = 'text-warning';
  if (error) {
    status = 'ERROR';
    style = 'text-danger';
  } else if (enabled == fields.length) {
    status = 'POWER ON';
    style = 'text-success';
  } else if (enabled == 0) {
    status = 'POWER OFF';
    style = 'text-danger';
  }

  cell.html(status);
  cell.addClass(style);
}

function powerOnOff(row, cell, data) {
  if (data) {
    cell.html('POWER ON');
    cell.addClass('text-success');
  } else {
    cell.html('POWER OFF');
    cell.addClass('text-danger');
  }
}

var cameraStatus = [
  ['OFFLINE', 'text-danger'],
  ['INITIALIZING', 'text-danger'],
  ['IDLE'],
  ['EXPOSING', 'text-success'],
  ['READING', 'text-warning'],
  ['ABORTING', 'text-danger']
];

// Camera generators
function camStatus(row, cell, data) {
  if (!data || !('state' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
    return;
  }

  if (data['state'] == 3 || data['state'] == 4) {
    if (!('sequence_frame_count' in data) || !('sequence_frame_limit' in data)) {
      cell.html('ERROR');
      cell.addClass('text-danger');
      return;
    }

    cell.addClass('text-success');
    if (data['sequence_frame_limit'] > 0)
      cell.html('ACQUIRING (' + (data['sequence_frame_count'] + 1) + ' / ' + data['sequence_frame_limit'] + ')');
    else
      cell.html('ACQUIRING (until stopped)');
    return;
  }

  cell.html(cameraStatus[data['state']][0]);
  cell.addClass(cameraStatus[data['state']][1]);
}

function camTemperature(row, cell, data) {
  if (!data || !('temperature' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else {
    cell.html(+data['temperature'].toFixed(0) + ' &deg;C');
    cell.addClass(data['temperature_locked'] ? 'text-success' : 'text-danger');
  }
}

function camShutter(row, cell, data) {
  if (data) {
    cell.html('AUTO');
    cell.addClass('text-success');
  } else {
    cell.html('DARK');
    cell.addClass('text-danger');
  }
}

function camExposure(row, cell, data) {
  cell.html(data.toFixed(2) + ' s');
}

function camGeometry(row, cell, data) {
  if (!data || !('geometry_x' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else {
    x = data['geometry_x'];
    y = data['geometry_y'];
    width = data['geometry_width'];
    height = data['geometry_height'];
    bin_x = data['geometry_bin_x'];
    bin_y = data['geometry_bin_y'];
    cell.html(bin_x + 'x' + bin_y + ' in [' + x + ':' + (x + width - 1) + ',' + y + ':' + (y + height - 1) + ']');
  }
}

// Telescope generators

var telescopeStatus = [
  ['DISABLED', 'text-danger', 'list-group-item-danger'],
  ['NOT HOMED', 'text-danger', 'list-group-item-danger'],
  ['IDLE'],
  ['TRACKING', 'text-success', 'list-group-item-success'],
  ['GUIDING', 'text-success', 'list-group-item-success']
];

function telStatus(row, cell, data) {
  if (!data || !('state' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
    row.addClass('list-group-item-danger');
  } else {
    var s = telescopeStatus[data['state']];
    cell.html(s[0]);
    cell.addClass(s[1]);
    row.addClass(s[2]);
  }
}

function telRA(row, cell, data) {
  cell.html(sexagesimal(data * 12 / Math.PI));
}

function telDec(row, cell, data) {
  cell.html(sexagesimal(data * 180 / Math.PI));
}

function telAlt(row, cell, data) {
  cell.html((data * 180 / Math.PI).toFixed(1) + '&deg;');
}

function telFocus(row, cell, data) {
  cell.html(data.toFixed(1) + ' um');
}

function telInstrumentFocus(row, cell, data) {
  cell.html(data.toFixed(0));
}

function opsTelescopeControl(row, cell, data) {
  cell.html('MANUAL');
  row.addClass('list-group-item-warning');
}

// Ops generators
function opsDomeControl(row, cell, data) {
  var modes = [
    ['ERROR', 'list-group-item-danger'],
    ['AUTO', 'list-group-item-success'],
    ['MANUAL', 'list-group-item-warning'],
  ];

  var mode = data in modes ? modes[data] : mode[0];
  cell.html(mode[0]);
  row.addClass(mode[1]);
}

function opsDomeStatus(row, cell, data) {
  var status = [
    ['CLOSED', 'list-group-item-danger'],
    ['OPEN', 'list-group-item-success'],
    ['MOVING', 'list-group-item-warning'],
  ];

  if (!data in status) {
    cell.html('ERROR');
    row.addClass('list-group-item-danger');
  } else {
    cell.html(status[data][0]);
    row.addClass(status[data][1]);
  }
}

function opsStatus(row, cell, data) {
  cell.html(data ? 'ONLINE' : 'OFFLINE');
  row.addClass(data ? 'list-group-item-success' : 'list-group-item-danger');
}

function opsEnvironment(row, cell, data) {
  cell.html(data ? 'SAFE' : 'NOT SAFE');
  row.addClass(data ? 'list-group-item-success' : 'list-group-item-danger');
}

// Pipeline generators
function pipelineGuiding(row, cell, data) {
  if (data) {
    cell.html(data);
  } else {
    cell.html('NOT GUIDING');
    cell.addClass('text-danger');
  }
}

function pipelineFrameType(row, cell, data) {
  if (!('frame_type' in data) || !('frame_object' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else if (data['frame_type'] == 'SCIENCE')
    cell.html('SCIENCE (' + data['frame_object'] + ')');
  else
    cell.html(data['frame_type']);
}

function pipelineSaveDir(row, cell, data) {
  cell.html(data);
}

function pipelineNextCamera(row, cell, data, camera) {
  if (!data || !('next_filename' in data) || !(camera in data['next_filename'])
        || !('archive_enabled' in data) || !(camera in data['archive_enabled'])) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else if (!data['archive_enabled'][camera]) {
    cell.html('NOT SAVING');
    cell.addClass('text-danger');
  } else {
    cell.html(data['next_filename'][camera]);
    cell.addClass('filename');
  }
}

function pipelineNextBlue(row, cell, data) {
  pipelineNextCamera(row, cell, data, 'BLUE');
}

function pipelineNextRed(row, cell, data) {
  pipelineNextCamera(row, cell, data, 'RED');
}

function pipelineProcess(row, cell, data) {
  if (!data || !('wcs_enabled' in data) || !('fwhm_enabled' in data) || !('intensity_stats_enabled' in data)
        || !('compression_enabled' in data) || !('dashboard_enabled' in data)) {
    return ['ERROR', 'text-danger'];
  } else {
    steps = {
      'wcs_enabled': 'WCS',
      'fwhm_enabled': 'FWHM',
      'intensity_stats_enabled': 'IntStats',
      'compression_enabled': 'Compress',
      'dashboard_enabled': 'Dashboard'
    };

    active = [];
    for (var s in steps)
      if (s in data && data[s])
        active.push(steps[s]);

    cell.html(active.join(', '));
  }
}

// Environment generators
function fieldLimitsColor(field, value) {
  if (!('limits' in field))
    return null;

  if (field['disabled'])
    return 'text-info';

  if (value >= field['limits'][0] && value <= field['limits'][1])
    return 'text-success';

  return 'text-danger';
}

function switchClosedOpen(row, cell, data) {
  if ('latest' in data)
    cell.html(data['latest'] ? 'CLOSED' : 'OPEN');
  else {
    cell.html('NO DATA');
    cell.addClass('text-danger');
  }
}

function switchSafeTripped(row, cell, data) {
  if ('latest' in data) {
    if (data['latest']) {
      cell.html('SAFE');
      cell.addClass('text-success');
    } else {
      cell.html('TRIPPED');
      cell.addClass('text-danger');
    }
  }
  else {
    cell.html('NO DATA');
    cell.addClass('text-danger');
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

function envLatestMinMax(row, cell, data) {
  if ('latest' in data) {
    var display = data['latest'].toFixed(1);
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

function updateGroups(data) {
  $('[data-generator]').each(function() {
    // Remove old content
    $(this).children('span.pull-right').remove();
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

function pollDashboard() {
  $.ajax({
    type: 'GET',
    dataType: 'json',
    url: '/data/onemetre',
    statusCode: {
      404: function() {
        updateGroups({});
      }
    }
  }).done(function(msg) {
    updateGroups(msg);
  });

  window.setTimeout(pollDashboard, 10000);
}

