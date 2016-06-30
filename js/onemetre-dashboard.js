var environmentFields = {
  '#external-humidity': ['vaisala_relative_humidity', round],
  '#internal-humidity': ['roomalert_internal_humidity', round],
  '#external-temperature': ['vaisala_temperature', round],
  '#internal-temperature': ['roomalert_internal_temp', round],
  '#truss-temperature': ['roomalert_truss_temp', round],
  '#peak-wind': ['vaisala_wind_speed', round],
  '#median-wind': ['vaisala_median_wind_speed', round],
  '#diskspace': ['diskspace_data_fs_available_bytes', bytesToGB],
  '#dust': ['tng_dust', round],
  '#sky-temperature': ['superwasp_sky_temp', round],
  '#dewpoint': ['superwasp_dew_point_delta', round],
  '#accumulated-rain': ['vaisala_accumulated_rain', round],
  '#pressure': ['vaisala_pressure', round],
  '#trapdoor': ['roomalert_trap_closed', closedOrOpen],
  '#hatch': ['roomalert_hatch_closed', closedOrOpen],
  '#power': ['power_main_ups_status', powerStatus],
  '#light': ['power_light', onOrOff]
};

function fieldLimitsColor(field, value) {
  if (!('limits' in field))
    return null;

  if (value >= field['limits'][0] && value <= field['limits'][1])
    return 'text-success';
  return 'text-danger';
}

function round(field, value) {
  return [value.toFixed(1), fieldLimitsColor(field, value)];
}

function closedOrOpen(field, value) {
  return [value ? 'CLOSED' : 'OPEN', null];
}

function onOrOff(field, value) {
  return [value ? 'ON' : 'OFF', null];
}

function powerStatus(field, value) {
  return value == 2 ? ['ONLINE', 'text-success'] : ['WARNING', 'text-warning'];
}

function bytesToGB(field, value) {
  return [+(value / 1073741824).toFixed(1), fieldLimitsColor(field, value)]
}

function updateEnvironment(data) {
  for (var key in environmentFields) {
    var row = $(key);
    var units = row.data('units');
    if (!units)
    	units = '';

    row.children('span.pull-right').remove();
    var value = $('<span class="pull-right">');
    var transform = environmentFields[key][1];
    if (!data || !(environmentFields[key][0] in data)) {
      value.html('ERROR');
      value.addClass('text-danger');
    } else {

      var field = data[environmentFields[key][0]];
      if ('error' in field) {
        value.html(field['error']);
        value.addClass('text-danger');
      } else if ('latest' in field) {
        var valueDisplay = transform(field, field['latest']);
        value.html(valueDisplay[0] + units);

        if ('max' in field && 'min' in field) {
          var maxField = $('<span>');
          var maxFieldDisplay = transform(field, field['max']);
          maxField.html(maxFieldDisplay[0]);
          if (maxFieldDisplay[1])
            maxField.addClass(maxFieldDisplay[1]);

          var minField = $('<span>');
          var minFieldDisplay = transform(field, field['min']);
          minField.html(minFieldDisplay[0]);
          if (minFieldDisplay[1])
            minField.addClass(minFieldDisplay[1]);

          var maxMinField = $('<span class="pull-right data-minmax">');
          maxMinField.append(maxField);
          maxMinField.append('<br>');
          maxMinField.append(minField);
          row.append(maxMinField);
        }

        if (valueDisplay[1])
          value.addClass(valueDisplay[1]);
      }
    }

    row.append(value);
  }
}

var cameraFields = {
  'status': camStatus,
  'temperature': camTemperature,
  'shutter': camShutter,
  'exposure': camExposure,
  'saving': camSaving
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
  if (!data || !('state' in data) || !('sequence_frame_count' in data) || !('sequence_frame_limit' in data))
    return ['ERROR', 'text-danger'];

  if (data['state'] == 3 || data['state'] == 4) {
    if (data['sequence_frame_limit'] > 0)
      return ['Acquiring (' + (data['sequence_frame_count'] + 1) + ' / ' + data['sequence_frame_limit'] + ')', 'text-success'];
    return ['Acquiring (until stopped)', 'text-success'];
  }

  return cameraStatus[data['state']];
}

function camTemperature(data) {
  if (!data || !('temperature' in data))
    return ['ERROR', 'text-danger'];

  status = +data['temperature'].toFixed(0) + ' ºC';
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

function camSaving(data) {
  if (!data || !('save_enabled' in data))
    return ['ERROR', 'text-danger'];

  if (data['save_enabled'])
    return [data['next_filename']];

  return ['NOT SAVING', 'text-danger'];
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

function updateLog(messages) {
  $('#log-table').children().remove();
  if (messages) {
    if (!messages.length) {
        var row = $('<tr>');
        row.append($('<td>').html('No log messages in the last 24 hours'));
        row.addClass('text-danger');
        $('#log-table').prepend(row);
    } else {
      for (var i in messages) {
        var message = messages[i];
        var row = $('<tr>');
        if (message['type'] == 'warning')
           row.addClass('text-warning');
        if (message['type'] == 'error')
           row.addClass('text-danger');
        row.append($('<td class="log-date">').html(formatUTCDate(parseUTCDate(message['date'])) + '<span class="visible-xs">' + message['table'] + '</span>'));
        row.append($('<td class="log-table hidden-xs">').html(message['table']));
        row.append($('<td class="log-message">').html(message['message']));
        $('#log-table').prepend(row);
      }
    }
  } else {
    var row = $('<tr>');
    row.append($('<td>').html('Error querying log'));
    row.addClass('text-danger');
    $('#log-table').prepend(row);
  }
}

function updateGroups(data) {
  updateEnvironment(data['environment']);
  updateListGroup('blue', cameraFields, data['blue']);
  updateListGroup('red', cameraFields, data['red']);
  updateListGroup('telescope', telescopeFields, data['telescope']);
  updateListGroup('ops', opsFields, data['ops']);
  updateLog(data['log']);
  var date = 'date' in data ? parseUTCDate(data['date']) : new Date();
  $('#data-updated').html('Updated ' + formatUTCDate(date) + ' UTC');
}

function queryData() {
  $.ajax({
    type: "GET",
    url: "/dashboard/onemetre",
    statusCode: {
      404: function() {
        updateGroups({});
      }
    }
  }).done(function(msg) {
    updateGroups(jQuery.parseJSON(msg));
  });

  window.setTimeout(queryData, 10000);
}

$(document).ready(queryData);
