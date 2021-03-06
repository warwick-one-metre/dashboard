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
function powerUPS(row, cell, data, prefix) {
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

function powerMainUPS(row, cell, data) {
  powerUPS(row, cell, data, 'main_ups');
}

function powerDomeUPS(row, cell, data) {
  powerUPS(row, cell, data, 'dome_ups');
}

function powerInstrument(row, cell, data) {
  fields = ['blue_camera', 'red_camera', 'red_focus_controller', 'red_focus_motor'];
  error = false;

  var enabled = 0;
  for (i in fields) {
    if (!(fields[i] in data) || data[fields[i]] == 2)
      error = true;
    else if (data[fields[i]] == 1)
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
