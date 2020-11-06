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

function opsHeaderEnvironment(row, cell, data) {
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

// Power generators
function powerUPS(row, cell, data) {
  status = 'ERROR';
  style = 'text-danger';

  var status_field = 'ups_status';
  var remaining_field = 'ups_battery_remaining';
  var load_field = 'ups_load';
  var battery_healthy = 'ups_battery_healthy';
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
  } else if (data['state'] == 3 || data['state'] == 4 || data['state'] == 5) {
    if (!('sequence_frame_count' in data) || !('sequence_frame_limit' in data)) {
      cell.html('ERROR');
      cell.addClass('text-danger');
    } else {
      cell.addClass('text-success');
      if (data['sequence_frame_limit'] > 0)
        cell.html('ACQUIRING (' + (data['sequence_frame_count'] + 1) + ' / ' + data['sequence_frame_limit'] + ')');
      else
        cell.html('ACQUIRING (until stopped)');
    }
  } else {
    cell.html(cameraStatus[data['state']][0]);
    cell.addClass(cameraStatus[data['state']][1]);
  }
}

function camTimer(row, cell, data) {
  if (!data || !('timer' in data) || !('fix_type' in data['timer']) || !('satellites' in data['timer'])) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else {
    cell.html(cameraTimerStatus[data['timer']['fix_type']][0] + ' (' + data['timer']['satellites'] + ' SATS)');
    cell.addClass(cameraTimerStatus[data['timer']['fix_type']][1]);
  }
}

function camTemperature(row, cell, data) {
  if (data && 'state' in data && data['state'] < 2)
    cell.html('N/A')
  else if (!data || !('temperature' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else {
    cell.html(+data['temperature'].toFixed(0) + ' &deg;C');
    cell.addClass(data['temperature_locked'] ? 'text-success' : 'text-danger');
  }
}

function camExposure(row, cell, data) {
  var exposure = $('<span>');
  cell.append(exposure);
  if (data && 'state' in data && data['state'] < 2)
    exposure.html('N/A')
  else if (!data || !('exposure_time' in data)) {
    exposure.html('ERROR');
    exposure.addClass('text-danger');
  } else {
    exposure.html(data['exposure_time'].toFixed(2) + ' s');
  }

  var shutter = $('<span>');
  cell.append('&nbsp;/&nbsp;');
  cell.append(shutter);

  if (data && 'state' in data && data['state'] < 2)
    shutter.html('N/A')
  else if (!data || !('shutter_enabled' in data)) {
    shutter.html('ERROR');
    shutter.addClass('text-danger');
  } else if (data['shutter_enabled']) {
    shutter.html('AUTO');
    shutter.addClass('text-success');
  } else {
    shutter.html('DARK');
    shutter.addClass('text-danger');
  }
}

function camGeometry(row, cell, data) {
  if (data && 'state' in data && data['state'] < 2)
    cell.html('N/A')
  else if (!data || !data.length || data.length < 4) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else {
    cell.html('[' + data[0] + ':' + data[1] + ',' + data[2] + ':' + data[3] + ']');
  }
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
  ['OFFLINE', 'text-danger'],
  ['DISCONNECTED', 'text-danger'],
  ['ERROR', 'text-danger'],
  ['INITIALIZING', 'text-warning'],
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

function telRADec(row, cell, data) {
  if (data && 'state' in data && data['state'] < 2)
    cell.html('N/A')
  else if (!data || !('ra' in data) || !('dec' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else
    cell.html(sexagesimal(data['ra'] * 12 / Math.PI) + '&nbsp;/&nbsp;' + sexagesimal(data['dec'] * 180 / Math.PI));
}

function telAltAz(row, cell, data) {
  if (data && 'state' in data && data['state'] < 2)
    cell.html('N/A')
  else if (!data || !('alt' in data) || !('az' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else
    cell.html((data['alt'] * 180 / Math.PI).toFixed(1) + '&deg;&nbsp;/&nbsp;' + (data['az'] * 180 / Math.PI).toFixed(1) + '&deg;');
}

function telFocus(row, cell, data) {
  if (!('status' in data) || !('current_steps' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else if (data['status'] == 4) {
    cell.html(data['current_steps'] + ' steps');
  } else {
    cell.html(focusStatus[data['status']][0]);
    if (focusStatus[data['status']].length > 1)
        cell.addClass(focusStatus[data['status']][1]);
  }
}

function telMoonSep(row, cell, data) {
  if (data && 'state' in data && data['state'] < 2)
    cell.html('N/A')
  else if (!data || !('moon_separation' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else
    cell.html((data['moon_separation'] * 180 / Math.PI).toFixed(1) + '&deg;');
}

// Dome generators
function domeTime(row, cell, data) {
  if (data == null)
    cell.html('N/A');
  else {
    cell.html(data);
    cell.addClass('text-warning');
  }
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
  ['DISABLED', 'text-warning'],
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
  if (!data || !('wcs_enabled' in data) || !('hfd_enabled' in data) || !('intensity_stats_enabled' in data)
        || !('compression_enabled' in data) || !('dashboard_enabled' in data)) {
    return ['ERROR', 'text-danger'];
  } else {
    steps = {
      'wcs_enabled': 'WCS',
      'hfd_enabled': 'HFD',
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

function switchClosedOpen(row, cell, data) {
  if ('latest' in data)
    cell.html(data['latest'] ? 'CLOSED' : 'OPEN');
  else {
    cell.html('NO DATA');
    cell.addClass('text-danger');
  }
}
