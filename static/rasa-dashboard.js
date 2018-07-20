// Header generators
function telHeaderStatus(row, cell, data) {
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

function domeHeaderStatus(row, cell, data) {
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

// Power generators
function powerUPS(row, cell, data) {
  status = 'ERROR';
  style = 'text-danger';

  if (data && 'ups_status' in data && 'ups_battery_remaining' in data) {
    if (data['ups_status'] == 2) {
      status = 'ONLINE';
      style = 'text-success';
    }
    else if (data['ups_status'] == 3) {
      status = 'BATTERY';
      style = 'text-warning';
    }

    status += ' (' + data['ups_battery_remaining'] + '%)';
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

var cameraStatus = [
  ['OFFLINE', 'text-danger'],
  ['INITIALIZING', 'text-danger'],
  ['IDLE'],
  ['WAITING', 'text-success'],
  ['EXPOSING', 'text-success'],
  ['READING', 'text-warning'],
  ['ABORTING', 'text-danger']
];

var cameraTimerStatus = [
  ['NO FIX', 'text-danger'],
  ['DEAD RECKONING', 'text-danger'],
  ['2D FIX', 'text-danger'],
  ['3D FIX', 'text-success'],
  ['GPS + DEAD RECKONING', 'text-danger'],
  ['TIME ONLY FIX', 'text-danger']
];

// Camera generators
function camStatus(row, cell, data) {
  if (!data || !('state' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
    return;
  }

  if (data['state'] == 3 || data['state'] == 4 || data['state'] == 5) {
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

function camGPS(row, cell, data) {
  if (!data || !('fix_type' in data) || !('satellites' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
    return;
  }

  cell.html(cameraTimerStatus[data['fix_type']][0] + ' (' + data['satellites'] + ' SATS)');
  cell.addClass(cameraTimerStatus[data['fix_type']][1]);
}

// Telescope generators
var telescopeStatus = [
  ['DISABLED', 'text-danger'],
  ['INITIALIZING', 'text-warning'],
  ['SLEWING', 'text-warning'],
  ['STOPPED'],
  ['TRACKING', 'text-success'],
];

var focusStatus = [
  ['DISCONNECTED', 'text-danger'],
  ['ERROR', 'text-danger'],
  ['IDLE'],
  ['MOVING', 'text-warning']
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
  if (!('status' in data) || !('current_steps' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else if (data['status'] == 2) {
    cell.html(data['current_steps'] + ' steps');
  } else {
    cell.html(focusStatus[data][0]);
    if (focusStatus[data].length > 1)
        cell.addClass(focusStatus[data][1]);
  }
}

// Dome generators

function domeTime(row, cell, data) {
  if (data == null) {
    cell.html('Not Scheduled');
    cell.addClass('text-warning');
  } else 
    cell.html(data);
}

var domeShutterStatus = [
  ['CLOSED', 'text-danger'],
  ['OPEN', 'text-success'],
  ['PARTIALLY OPEN', 'text-info'],
  ['OPENING', 'text-warning'],
  ['CLOSING', 'text-warning'],
  ['FORCE CLOSING', 'text-danger']
];

function domeShutter(row, cell, data) {
  if (data >= 0 && data < domeShutterStatus.length) {
    cell.html(domeShutterStatus[data][0]);
    cell.addClass(domeShutterStatus[data][1]);
  } else {
    cell.html('ERROR');
    cell.addClass('text-danger');
  }
}

var domeHeartbeatStatus = [
  ['DISABLED', ''],
  ['ACTIVE', 'text-success'],
  ['CLOSING DOME', 'text-danger'],
  ['TRIPPED', 'text-danger'],
  ['UNAVAILABLE', 'text-warning']
];

function domeHeartbeat(row, cell, data) {
  status = 'ERROR';
  style = 'text-danger';

  if ('heartbeat_status' in data && 'heartbeat_remaining' in data) {
    if (data['heartbeat_status'] == 1) {
      status = data['heartbeat_remaining'] + 's remaining';
      if (data['heartbeat_remaining'] < 30)
        style = 'text-danger'
      else if (data['heartbeat_remaining'] < 60)
        style = 'text-warning';
      else
        style = 'text-success';
    } else {
      status = domeHeartbeatStatus[data['heartbeat_status']][0];
      style = domeHeartbeatStatus[data['heartbeat_status']][1];
    }
  }

  cell.html(status);
  cell.addClass(style);
}

// Ops generators
function opsTelDomeControl(row, cell, data) {
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
  if (('safe' in data) && ('conditions' in data)) {
    cell.html(data['safe'] ? 'SAFE' : 'NOT SAFE');
    row.addClass(data['safe'] ? 'list-group-item-success' : 'list-group-item-danger');

    // Build the conditions tooltip
    var conditions = data['conditions']
    var conditions = {
        'wind': 'Wind',
        'median_wind': 'Median&nbsp;Wind',
        'temperature': 'Temperature',
        'humidity': 'Humidity',
        'internal_humidity': 'Int.&nbsp;Humidity',
        'dewpt': 'Dew&nbsp;Point',
        'rain': 'Rain',
        'secsys': 'Sec.&nbsp;System',
        'netping': 'Network',
        'main_ups': 'Main&nbsp;UPS',
        'dome_ups': 'Dome&nbsp;UPS',
        'diskspace': 'Disk&nbsp;Space',
        'sun': 'Sun'
    }

    var status_classes = ['', 'text-success', 'text-warning', 'text-danger']

    var tooltip = '<table style="margin: 5px">';
    for (var c in conditions) {
        if (!(c in data['conditions']))
          continue;
        tooltip += '<tr><td style="text-align: right;">' + conditions[c] + ':</td>';
        var params = data['conditions'][c];
        for (var p in params) {
          tooltip += '<td style="padding: 0 5px" class="' + status_classes[params[p][1]] + '">' + params[p][0] + '</td>';
        }
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

// Pipeline generators

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

    cell.html(active.join(', ') || 'None');
  }
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
  if ('latest' in data && 'current' in data && data['current']) {
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

function envMoon(row, cell, data) {
  if ('latest' in data && 'current' in data && data['current']) {
    display = 'BRIGHT';
    if (data['latest'] < 25)
      display = 'DARK';
    else if (data['latest'] < 65)
      display = 'GRAY';

    display += ' (' + data['latest'].toFixed(1) + '%)';

    cell.html(display);
    cell.addClass(fieldLimitsColor(data, data['latest']));
  } else {
    cell.html('NO DATA');
    cell.addClass('text-danger');
  }
}
