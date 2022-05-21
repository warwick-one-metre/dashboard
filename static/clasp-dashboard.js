function powerInstrument(row, cell, data) {
  fields = ['cam1', 'cam2', 'focuser'];
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

function telState(row, cell, data) {
  var state = [
    ['DISABLED', 'text-danger'],
    ['PARKED', ''],
    ['STOPPED', 'text-danger'],
    ['SLEWING', 'text-warning'],
    ['TRACKING', 'text-success'],
  ];

  if (data && 'state' in data) {
    if ('axes_homed' in data && !data['axes_homed']) {
      cell.html('NOT HOMED');
      cell.addClass('text-danger');
    } else {
      cell.html(state[data['state']][0]);
      cell.addClass(state[data['state']][1]);
    }
  } else {
    cell.html('ERROR');
    cell.addClass('text-danger');
  }
}

function telRADec(row, cell, data) {
  if (data && (('state' in data && (data['state'] < 1 || data['state'] > 3)) || ('axes_homed' in data && !data['axes_homed'])))
    cell.html('N/A')
  else if (!data || !('ra' in data) || !('dec' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else
    cell.html(sexagesimal(data['ra'] / 15) + '&nbsp;/&nbsp;' + sexagesimal(data['dec']));
}

function telAltAz(row, cell, data) {
  if (data && (('state' in data && (data['state'] < 1 || data['state'] > 3)) || ('axes_homed' in data && !data['axes_homed'])))
    cell.html('N/A')
  else if (!data || !('alt' in data) || !('az' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else
    cell.html((data['alt']).toFixed(1) + '&deg;&nbsp;/&nbsp;' + (data['az']).toFixed(1) + '&deg;');
}

function telSunMoon(row, cell, data) {
  if (data && (('state' in data && (data['state'] < 1 || data['state'] > 3)) || ('axes_homed' in data && !data['axes_homed'])))
    cell.html('N/A')
  else if (!data || !('sun_separation' in data) || !('moon_separation' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else
    cell.html((data['sun_separation']).toFixed(1) + '&deg;&nbsp;/&nbsp;' + (data['moon_separation']).toFixed(1) + '&deg;');
}

function domeShutter(row, cell, data) {
  var state = [
    ['CLOSED', 'text-danger'],
    ['OPEN', 'text-success'],
    ['PARTIALLY OPEN', 'text-info'],
    ['OPENING', 'text-warning'],
    ['CLOSING', 'text-warning'],
    ['FORCE CLOSING', 'text-danger']
  ];

  if (data >= 0 && data < state.length) {
    cell.html(state[data][0]);
    cell.addClass(state[data][1]);
  } else {
    cell.html('ERROR');
    cell.addClass('text-danger');
  }
}

function domeHeartbeat(row, cell, data) {
  var state = [
    ['DISABLED', 'text-warning'],
    ['ACTIVE', 'text-success'],
    ['CLOSING DOME', 'text-danger'],
    ['TRIPPED', 'text-danger'],
    ['UNAVAILABLE', 'text-warning']
  ];

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
      status = state[data['heartbeat_status']][0];
      style = state[data['heartbeat_status']][1];
    }
  }

  cell.html(status);
  cell.addClass(style);
}

function camStatus(row, cell, data) {
  var cam_number = row.data('cam');
  var state = [
    ['OFFLINE', 'text-danger'],
    ['INITIALIZING', 'text-danger'],
    ['IDLE'],
    ['WAITING', 'text-warning'],
    ['EXPOSING', 'text-success'],
    ['READING', 'text-warning'],
    ['ABORTING', 'text-danger'],
  ];

  cam_status = getData(data, ["clasp_cam" + cam_number, "state"]);
  if (cam_status === undefined) {
    status = 'ERROR';
    style = 'text-danger';
  } else {
    status = state[cam_status][0];
    style = state[cam_status][1];
  }

  cell.html(status);
  cell.addClass(style);
}

function camExposure(row, cell, data) {
  var cam_number = row.data('cam');
  cam_exposure = getData(data, ["clasp_cam" + cam_number, "exposure_time"]);
  if (cam_exposure === undefined) {
    status = 'ERROR';
    style = 'text-danger';
  } else {
    status = cam_exposure.toFixed(3) + ' s';
    style = '';
  }

  cell.html(status);
  cell.addClass(style);
}

function camTemp(row, cell, data) {
  var cam_number = row.data('cam');
  cam_temperature = getData(data, ["clasp_cam" + cam_number, "cooler_temperature"]);
  cam_temperature_locked = getData(data, ["clasp_cam" + cam_number, "temperature_locked"]);
  if (cam_temperature === undefined || cam_temperature_locked === undefined) {
    status = 'ERROR';
    style = 'text-danger';
  } else {
    status = cam_temperature.toFixed(0) + ' &deg;C';
    style = cam_temperature_locked ? 'text-success' : 'text-danger';
  }

  cell.html(status);
  cell.addClass(style);
}

function camCool(row, cell, data) {
  var state = [
    ['UNKNOWN', 'text-danger'],
    ['WARM', 'text-danger'],
    ['WARMING', 'text-warning'],
    ['COOLING', 'text-info'],
    ['LOCKING', 'text-warning'],
    ['LOCKED', 'text-success'],
  ];

  var cam_number = row.data('cam');
  cam_cooler_power = getData(data, ["clasp_cam" + cam_number, "cooler_pwm"]);
  cam_cooler_mode = getData(data, ["clasp_cam" + cam_number, "cooler_mode"]);
  if (cam_cooler_power === undefined || cam_cooler_mode === undefined) {
    status = 'ERROR';
    style = 'text-danger';
  } else {
    status = state[cam_cooler_mode][0]
    if (cam_cooler_mode !== 1)
      status += ' (' + cam_cooler_power.toFixed(0) + '%)';

    style = state[cam_cooler_mode][1];
  }

  cell.html(status);
  cell.addClass(style);
}

function telFocus(row, cell, data) {
  var focuser_number = row.data('focuser');
  var state = [
    ['OFFLINE', 'text-danger'],
    ['DISCONNECTED', 'text-danger'],
    ['ERROR', 'text-danger'],
    ['INITIALIZING', 'text-warning'],
    ['IDLE'],
    ['MOVING', 'text-warning']
  ];

  if (data && 'current_steps_' + focuser_number in data && 'status_' + focuser_number in data) {
    var s = data['status_' + focuser_number];
    status = state[s][0];
    style = state[s][1];
    if (s == 4)
      status = data['current_steps_' + focuser_number] + ' steps';
  } else {
    status = 'ERROR';
    style = 'text-danger';
  }

  cell.html(status);
  cell.addClass(style);
}