
var powerFields = {
  'mainups': powerMainUPS,
  'domeups': powerDomeUPS,
  'teldrive': powerTelDrive,
  'telcontroller': powerTelController,
  'instrument': powerInstrument,
};

function powerMainUPS(data) {
  if (!data || !('main_ups_status' in data) || !('main_ups_battery_remaining' in data))
    return ['ERROR', 'text-danger'];

  status = '';
  if (data['main_ups_status'] == 2) {
    status = 'ONLINE';
    style = 'text-success';
  }
  else if (data['main_ups_status'] == 3) {
    status = 'BATTERY';
    style = 'text-warning';
  }
  else
    return ['ERROR', 'text-danger'];

  status += ' (' + data['main_ups_battery_remaining'] + '%)';
  return [status, style];
}

function powerDomeUPS(data) {
  if (!data || !('dome_ups_status' in data) || !('dome_ups_battery_remaining' in data))
    return ['ERROR', 'text-danger'];

  status = '';
  if (data['dome_ups_status'] == 2) {
    status = 'ONLINE';
    style = 'text-success';
  }
  else if (data['dome_ups_status'] == 3) {
    status = 'BATTERY';
    style = 'text-warning';
  }
  else
    return ['ERROR', 'text-danger'];

  status += ' (' + data['dome_ups_battery_remaining'] + '%)';
  return [status, style];
}

function powerTelDrive(data) {
  if (!data || !('telescope_80v' in data))
    return ['ERROR', 'text-danger'];

  if (data['telescope_80v'])
    return ['POWER ON', 'text-success']

  return ['POWER OFF', 'text-danger']
}

function powerTelController(data) {
  if (!data || !('telescope_12v' in data))
    return ['ERROR', 'text-danger'];

  if (data['telescope_12v'])
    return ['POWER ON', 'text-success']

  return ['POWER OFF', 'text-danger']
}

function powerInstrument(data) {
  fields = ['blue_camera', 'red_camera', 'red_focus_controller', 'red_focus_motor'];
  if (!data)
    return ['ERROR', 'text-danger'];

  var enabled = 0;
  for (i in fields) {
    if (!(fields[i] in data))
      return ['ERROR', 'text-danger'];
    if (data[fields[i]])
      enabled += 1;
  }

  if (enabled == fields.length)
    return ['POWER ON', 'text-success']
  if (enabled == 0)
    return ['POWER OFF', 'text-danger']
  return ['POWER MIXED', 'text-warning']
}

function powerLight(data) {
  if (!data || !('light' in data))
    return ['ERROR', 'text-danger'];

  if (data['light'])
    return ['POWER ON', 'text-success']

  return ['POWER OFF', 'text-danger']
}

var cameraFields = {
  'status': camStatus,
  'temperature': camTemperature,
  'shutter': camShutter,
  'exposure': camExposure,
  'geometry': camGeometry,
};

var cameraStatus = [
  ['OFFLINE', 'text-danger'],
  ['INITIALIZING', 'text-danger'],
  ['IDLE'],
  ['EXPOSING', 'text-success'],
  ['READING', 'text-warning'],
  ['ABORTING', 'text-danger']
];

function camStatus(data) {
  if (!data || !('state' in data))
    return ['ERROR', 'text-danger'];

  if (data['state'] == 3 || data['state'] == 4) {
    if (!('sequence_frame_count' in data) || !('sequence_frame_limit' in data))
      return ['ERROR', 'text-danger'];

    if (data['sequence_frame_limit'] > 0)
      return ['ACQUIRING (' + (data['sequence_frame_count'] + 1) + ' / ' + data['sequence_frame_limit'] + ')', 'text-success'];

    return ['ACQUIRING (until stopped)', 'text-success'];
  }

  return cameraStatus[data['state']];
}

function camTemperature(data) {
  if (!data || !('temperature' in data))
    return ['ERROR', 'text-danger'];

  status = +data['temperature'].toFixed(0) + ' &deg;C';
  return [status, data['temperature_locked'] ? 'text-success' : 'text-danger'];
}

function camShutter(data) {
  if (!data || !('shutter_enabled' in data))
    return ['ERROR', 'text-danger'];

  if (data['shutter_enabled'])
    return ['AUTO', 'text-success'];

  return ['DARK', 'text-danger'];
}

function camExposure(data) {
  if (!data || !('exposure_time' in data))
    return ['ERROR', 'text-danger'];

  return [data['exposure_time'].toFixed(2) + ' s'];
}

function camGeometry(data) {
  if (!data || !('geometry_x' in data))
    return ['ERROR', 'text-danger'];

  x = data['geometry_x'];
  y = data['geometry_y'];
  width = data['geometry_width'];
  height = data['geometry_height'];
  bin_x = data['geometry_bin_x'];
  bin_y = data['geometry_bin_y'];

  desc = bin_x + 'x' + bin_y + ' in [' + x + ':' + (x + width - 1) + ',' + y + ':' + (y + height - 1) + ']'

  return [desc]
}

function camBinning(data) {
  if (!data || !('geometry_bin_x' in data))
    return ['ERROR', 'text-danger'];

  return [data['geometry_bin_x'] + 'x' + data['geometry_bin_y']]
}

var telescopeFields = {
  'status': telStatus,
  'ra': telRA,
  'dec': telDec,
  'alt': telAlt,
  'focus': telFocus,
  'red-focus': telRedFocus
};

var telescopeStatus = [
  ['DISABLED', 'text-danger', 'list-group-item-danger'],
  ['NOT HOMED', 'text-danger', 'list-group-item-danger'],
  ['IDLE'],
  ['TRACKING', 'text-success', 'list-group-item-success'],
  ['GUIDING', 'text-success', 'list-group-item-success']
];

function telStatus(data) {
  if (!data || !('state' in data))
    return ['ERROR', null, 'list-group-item-danger'];

  return telescopeStatus[data['state']];
}

function telRA(data) {
  if (!data || !('ra' in data))
    return ['ERROR', 'text-danger'];

  return [sexagesimal(data['ra'] * 12 / Math.PI)];
}

function telDec(data) {
  if (!data || !('dec' in data))
    return ['ERROR', 'text-danger'];

  return [sexagesimal(data['dec'] * 180 / Math.PI)];
}

function telAlt(data) {
  if (!data || !('alt' in data))
    return ['ERROR', 'text-danger'];

  return [(data['alt'] * 180 / Math.PI).toFixed(1) + 'º'];
}

function telFocus(data) {
  if (!data || !('telescope_focus_um' in data))
    return ['ERROR', 'text-danger'];

  return [data['telescope_focus_um'].toFixed(1) + ' um'];
}

function telRedFocus(data) {
  if (!data || !('telescope_red_focus' in data))
    return ['ERROR', 'text-danger'];

  return [data['telescope_red_focus'].toFixed(0)];
}

var opsFields = {
  'telescope-control': opsTelescopeControl,
  'dome-control': opsDomeControl,
  'dome-status': opsDomeStatus,
  'status': opsStatus,
  'environment': opsEnvironment,
};

function opsTelescopeControl(data) {
  return ['MANUAL', null, 'list-group-item-warning'];
}

var operationsModes = [
  ['ERROR', null, 'list-group-item-danger'],
  ['AUTO', null, 'list-group-item-success'],
  ['MANUAL', null, 'list-group-item-warning'],
];

var domeStatus = [
  ['CLOSED', null, 'list-group-item-danger'],
  ['OPEN', null, 'list-group-item-success'],
  ['MOVING', null, 'list-group-item-warning'],
];

function opsDomeControl(data) {
  if (!data || !('dome_mode' in data))
    return ['ERROR', null, 'list-group-item-danger'];

  return operationsModes[data['dome_mode']];
}

function opsDomeStatus(data) {
  if (!data || !('dome_status' in data))
    return ['ERROR', null, 'list-group-item-danger'];

  return domeStatus[data['dome_status']];
}

function opsStatus(data) {
  if (!data || !('observing' in data))
    return ['ERROR', null, 'list-group-item-danger'];

  if (data['observing'])
    return ['ONLINE', null, 'list-group-item-success'];

  return ['OFFLINE', null, 'list-group-item-danger'];
}

function opsEnvironment(data) {
  if (!data || !('environment_safe' in data))
    return ['ERROR', null, 'list-group-item-danger'];

  if (data['environment_safe'])
    return ['SAFE', null, 'list-group-item-success'];

  return ['NOT SAFE', null, 'list-group-item-danger'];
}

var pipelineFields = {
  'guiding': pipelineGuiding,
  'frametype': pipelineFrameType,
  'save-dir': pipelineSaveDir,
  'next-blue': pipelineNextBlue,
  'next-red': pipelineNextRed,
  'process': pipelineProcess
};

function pipelineGuiding(data) {
  if (!data || !('guide_camera_id' in data))
    return ['ERROR', 'text-danger'];

  if (!data['guide_camera_id'])
    return ['NOT GUIDING', 'text-danger']

  return [data['guide_camera_id']];
}

function pipelineFrameType(data) {
  if (!data || !('frame_type' in data) || !('frame_object' in data))
    return ['ERROR', 'text-danger'];

  if (data['frame_type'] == 'SCIENCE')
    return ['SCIENCE (' + data['frame_object'] + ')']

  return [data['frame_type']];
}

function pipelineSaveDir(data) {
  if (!data || !('archive_directory' in data))
    return ['ERROR', 'text-danger'];

  return [data['archive_directory']]
}

function pipelineNextBlue(data) {
  if (!data || !('next_filename' in data) || !('BLUE' in data['next_filename'])
        || !('archive_enabled' in data) || !('BLUE' in data['archive_enabled']))
    return ['ERROR', 'text-danger'];

  if (!data['archive_enabled']['BLUE'])
    return ['NOT SAVING', 'text-danger'];

  return [data['next_filename']['BLUE'], 'filename'];
}

function pipelineNextRed(data) {
  if (!data || !('next_filename' in data) || !('RED' in data['next_filename'])
        || !('archive_enabled' in data) || !('RED' in data['archive_enabled']))
    return ['ERROR', 'text-danger'];

  if (!data['archive_enabled']['RED'])
    return ['NOT SAVING', 'text-danger'];

  return [data['next_filename']['RED'], 'filename'];
}

function pipelineProcess(data) {
  if (!data || !('wcs_enabled' in data) || !('fwhm_enabled' in data) || !('intensity_stats_enabled' in data) 
        || !('compression_enabled' in data) || !('dashboard_enabled' in data))
    return ['ERROR', 'text-danger'];

  calculations = [];
  if (data['wcs_enabled'])
    calculations.push('WCS');

  if (data['fwhm_enabled'])
    calculations.push('FWHM');

  if (data['intensity_stats_enabled'])
    calculations.push('IntStats');

  if (data['compression_enabled'])
    calculations.push('Compress');

  if (data['dashboard_enabled'])
    calculations.push('Dashboard');

  return [calculations.join(', ')]
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

function powerOnOff(row, cell, data) {
  if (data) {
    cell.html('POWER ON');
    cell.addClass('text-success');
  } else {
    cell.html('POWER OFF');
    cell.addClass('text-danger');
  }
}

function switchClosedOpen(row, cell, data) {
  cell.html(data ? 'CLOSED' : 'OPEN');
}

function switchSafeTripped(row, cell, data) {
  if (data) {
    cell.html('SAFE');
    cell.addClass('text-success');
  } else {
    cell.html('TRIPPED');
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
  updateListGroup('power', powerFields, data['power']);
  updateListGroup('blue', cameraFields, data['blue']);
  updateListGroup('red', cameraFields, data['red']);
  updateListGroup('telescope', telescopeFields, data['telescope']);
  updateListGroup('ops', opsFields, data['ops']);
  updateListGroup('pipeline', pipelineFields, data['pipeline']);

  $('[data-generator]').each(function() {
    // Remove old content
    $(this).children('span.pull-right').remove();
    $(this).attr('class', 'list-group-item');

    // Add new content
    var generator = $(this).data('generator');
    var group = $(this).data('group');
    var field = $(this).data('field');
    var cell = $('<span class="pull-right">');

    if (!data || !group || !field || !(group in data) || !(field in data[group])) {
      cell.html('ERROR');
      cell.addClass('text-danger');
    } else if (window[generator])
      window[generator]($(this), cell, data[group][field]);

    $(this).append(cell);
  });

  var date = 'date' in data ? parseUTCDate(data['date']) : new Date();
  $('#data-updated').html('Updated ' + formatUTCDate(date) + ' UTC');
}

var lastLogMessageId = 0;
function updateLog(messages) {
  if (messages) {
    var length = messages.length;
    for (var i in messages) {
      var message = messages[length - i - 1];
      var row = $('<tr>');
      if (message[2] == 'warning')
         row.addClass('text-warning');
      if (message[2] == 'error')
         row.addClass('text-danger');
      row.append($('<td class="log-date">').html(formatUTCDate(parseUTCDate(message[1]+'.0')) + '<span class="visible-xs">' + message[3] + '</span>'));
      row.append($('<td class="log-table hidden-xs">').html(message[3]));
      row.append($('<td class="log-message">').html(message[4]));
      $('#log-table').prepend(row);
      lastLogMessageId = message[0];
    }

    // Remove excess rows as new messages arrive
    var tbody = $('#log-table tbody');
    while (tbody.children().length > 250)
        tbody.children().last().remove();
  } else {
    $('#log-table').children().remove();
    var row = $('<tr>');
    row.append($('<td>').html('Error querying log'));
    row.addClass('text-danger');
    $('#log-table').prepend(row);
    lastLogMessageId = 0;
  }
}

function queryData(includeLog) {
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

  if (includeLog) {
    var logURL = '/data/obslog';
    if (lastLogMessageId > 0)
      logURL += '?from=' + lastLogMessageId;

   $.ajax({
      type: 'GET',
      dataType: 'json',
      url: logURL,
    }).done(function(data) {
       updateLog(data['messages']);
    });
  }

  window.setTimeout(function() { queryData(includeLog); }, 10000);
}

