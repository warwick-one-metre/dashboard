
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
  '#power': ['power_main_ups_status', powerStatus]
}


function fieldLimitsColor(field, value) {
  if (!('limits' in field))
    return null

  if (value >= field['limits'][0] && value <= field['limits'][1])
    return 'text-success'
  return 'text-danger'
}

function round(field, value) {
  return [value.toFixed(1), fieldLimitsColor(field, value)]
}

function closedOrOpen(field, value) {
  return [value ? 'CLOSED' : 'OPEN', null]
}

function powerStatus(field, value) {
  return value == 2 ? ['ONLINE', 'text-success'] : ['WARNING', 'text-warning']
}

function bytesToGB(field, value) {
  return [+(value / 1073741824).toFixed(1), fieldLimitsColor(field, value)]
}

function updateEnvironment(data) {
  // Simple cases
  for (var key in environmentFields) {
    var row = $(key);
    var units = row.data('units');
    if (!units)
    	units = '';

    row.children('span.pull-right').remove();
    var value = $('<span class="pull-right">');
    var transform = environmentFields[key][1];
    var field = data[environmentFields[key][0]];
    if ('error' in field)
      value.html(field['error']);
    else if ('latest' in field) {
      var valueDisplay = transform(field, field['latest']);
      value.html(valueDisplay[0] + units);
      
      if ('max' in field && 'min' in field) {
        var maxField = $('<span>');
	var maxFieldDisplay = transform(field, field['max']);
	maxField.html(maxFieldDisplay[0])
	if (maxFieldDisplay[1])
          maxField.addClass(maxFieldDisplay[1])

        var minField = $('<span>')
	var minFieldDisplay = transform(field, field['min']);
	minField.html(minFieldDisplay[0])
	if (minFieldDisplay[1])
          minField.addClass(minFieldDisplay[1])

        var maxMinField = $('<span class="pull-right data-minmax">')
	maxMinField.append(maxField)
	maxMinField.append('<br>')
	maxMinField.append(minField)
	row.append(maxMinField)
      }

      if (valueDisplay[1])
        value.addClass(valueDisplay[1])
    }

    row.append(value)
  }
}
      
var cameraFields = {
  'status': camStatus,
  'temperature': camTemperature,
  'shutter': camShutter,
  'exposure': camExposure,
  'saving': camSaving
}

var cameraStatus = [
  ['OFFLINE', 'text-danger'],
  ['INITIALIZING', 'text-danger'],
  ['IDLE'],
  ['EXPOSING', 'text-success'],
  ['READING', 'text-warning'],
  ['ABORTING', 'text-danger']
];

function camStatus(data) {
  if (data['state'] == 3 || data['state'] == 4) {
    if (data['sequence_frame_limit'] > 0)
      return ['Acquiring (' + (data['sequence_frame_count'] + 1) + ' / ' + data['sequence_frame_limit'] + ')', 'text-success']
    return ['Acquiring (until stopped)', 'text-success']
  }

  return cameraStatus[data['state']];
}

function camTemperature(data) {
  if (!('temperature' in data))
    return []
    
  status = +data['temperature'].toFixed(0) + ' ºC'
  return [status, data['temperature_locked'] ? 'text-success' : 'text-danger']
}

function camShutter(data) {
  if (!('shutter_enabled' in data))
    return []
  
  if (data['shutter_enabled'])
    return ['AUTO', 'text-success']
  return ['DARK', 'text-danger']
}

function camExposure(data) {
  if (!('exposure_time' in data))
    return []
    
  return [data['exposure_time'].toFixed(2) + ' s']
}

function camSaving(data) {
  if (!('save_enabled' in data))
    return []
  
  if (data['save_enabled'])
    return [data['next_filename']]
  return ['NOT SAVING', 'text-danger']
}

var telescopeFields = {
  'status': telStatus,
  'ra': telRA,
  'dec': telDec,
  'alt': telAlt,
  'az': telAz,
  'focus': telFocus
}

var telescopeStatus = [
  ['DISABLED', 'text-danger', 'list-group-item-danger'],
  ['NOT HOMED', 'text-danger', 'list-group-item-danger'],
  ['IDLE'],
  ['TRACKING', 'text-success', 'list-group-item-success'],
  ['GUIDING', 'text-success', 'list-group-item-success']
]

function telStatus(data) {
  return telescopeStatus[data['state']];
}

function sexagesimal(angle) {
  negative = angle < 0
  angle = Math.abs(angle)

  degrees = Math.floor(angle)
  angle = (angle - degrees) * 60
  minutes = Math.floor(angle)
  seconds = ((angle - minutes) * 60).toFixed(1)

  if (degrees < 10)
    degress = '0' + degrees
  if (minutes < 10)
    minutes = '0' + minutes
  if (seconds < 10)
    seconds = '0' + seconds

  if (negative)
    degrees = '-' + degrees

  return degrees + ':' + minutes + ':' + seconds
}

function telRA(data) {
  return [sexagesimal(data['ra'] * 12 / Math.PI)]
}

function telDec(data) {
  return [sexagesimal(data['dec'] * 180 / Math.PI)]
}

function telAlt(data) {
  return [(data['alt'] * 180 / Math.PI).toFixed(1) + 'º']
}

function telAz(data) {
  return [(data['az'] * 180 / Math.PI).toFixed(1) + 'º']
}

function telFocus(data) {
  return [data['telescope_focus_um'].toFixed(1) + ' um']
}

function updateDevice(prefix, fields, data) {
  for (var key in fields) {
    var row = $('#'+prefix+'-'+key);
    row.children('span.pull-right').remove();
    row.attr('class', 'list-group-item');
    var value = $('<span class="pull-right">');
    var valueDisplay = fields[key](data);
    
    if (valueDisplay.length > 0)
      value.html(valueDisplay[0]);
    if (valueDisplay.length > 1)
      value.addClass(valueDisplay[1])
    if (valueDisplay.length > 2)
      row.addClass(valueDisplay[2])
    row.append(value)
  }
}

var opsFields = {
  'telescope-control': opsTelescopeControl,
  'dome-control': opsDomeControl,
  'dome-status': opsDomeStatus,
  'status': opsStatus,
  'environment': opsEnvironment,
}

function opsTelescopeControl(data) {
  return ['MANUAL', null, 'list-group-item-warning']
}

var operationsModes = [
  ['ERROR', null, 'list-group-item-danger'],
  ['AUTO', null, 'list-group-item-success'],
  ['MANUAL', null, 'list-group-item-warning'],
]

var domeStatus = [
  ['CLOSED', null, 'list-group-item-danger'],
  ['OPEN', null, 'list-group-item-success'],
  ['MOVING', null, 'list-group-item-warning'],
]

function opsDomeControl(data) {
  return operationsModes[data['dome_mode']]
}

function opsDomeStatus(data) {
  return domeStatus[data['dome_status']]
}


function opsStatus(data) {
  if (data['observing'])
    return ['ONLINE', null, 'list-group-item-success']
  return ['OFFLINE', null, 'list-group-item-danger']
}

function opsEnvironment(data) {
  if (data['environment_safe'])
    return ['SAFE', null, 'list-group-item-success']
  return ['NOT SAFE', null, 'list-group-item-danger']
}

var updateDate = new Date()

function updateTables() {
  $.ajax({
    type: "GET",
    url: "http://localhost:8090/dashboard/data",
    statusCode: {
      404: function() { alert("Query failed!") }
    }
  }).done(function(msg) {
    var data = jQuery.parseJSON(msg);
    updateEnvironment(data['environment']);
    updateDevice('blue', cameraFields, data['blue']);
    updateDevice('red', cameraFields, data['red']);
    updateDevice('telescope', telescopeFields, data['telescope']);
    updateDevice('ops', opsFields, data['ops']);
    updateDate = new Date(data['date']);
    $('#data-updated').html(updateDate.toUTCString())
  });
  window.setTimeout(updateTables, 5000);
}

function updateTimer() {
  var age = Math.round((new Date().getTime() - updateDate) / 1000)
  $('#data-age').html(age)
}

$(document).ready(function () {
  updateTables();
  window.setInterval(updateTimer, 500)
});
