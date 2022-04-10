function roofBattery(row, cell, data) {
  if (data != null) {
    var display = data.toFixed(2);
    var units = row.data('units');
    if (units)
      display += units;
    cell.html(display);
  } else {
    cell.html('NO DATA');
    cell.addClass('text-danger');
  }
}

function powerInstrAircon(row, cell, data) {
  status = 'ERROR';
  style = 'text-danger';

  if (data && 'enabled' in data) {
    if (data['enabled']) {
      status = 'AUTO';
      style = 'text-success';
    }
    else {
      status = 'DISABLED';
      style = 'text-warning';
    }
  }

  cell.html(status);
  cell.addClass(style);
}

function powerCompAircon(row, cell, data) {
  status = 'ERROR';
  style = 'text-danger';

  if (data && 'active' in data) {
    if (data['active'] == 1) {
      status = 'ACTIVE';
      style = 'text-success';
    }
    else {
      status = 'INACTIVE';
      style = 'text-warning';
    }
  }

  cell.html(status);
  cell.addClass(style);
}

function telState(row, cell, data) {
  var state = [
    ['DISABLED', 'text-danger'],
    ['STOPPED', 'text-danger'],
    ['HUNTING', 'text-warning'],
    ['TRACKING', 'text-success'],
    ['SLEWING', 'text-warning'],
    ['HOMING', 'text-warning'],
    ['LIMITING', 'text-warning'],
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

function roofState(row, cell, data) {
  var state = [
    ['ABSENT', 'text-danger'],
    ['UNKNOWN', 'text-danger'],
    ['OPENING', 'text-warning'],
    ['CLOSING', 'text-warning'],
    ['OPEN', 'text-success'],
    ['CLOSED', 'text-danger']
  ];

  if (data >= 0 && data < state.length) {
    cell.html(state[data][0]);
    cell.addClass(state[data][1]);
  } else {
    cell.html('ERROR');
    cell.addClass('text-danger');
  }
}

function roofHeartbeat(row, cell, data) {
  var state = [
    ['DISABLED', 'text-warning'],
    ['ENABLED', 'text-success'],
    ['TRIPPED', 'text-danger'],
  ];

  status = 'ERROR';
  style = 'text-danger';

  if ('roof_heartbeat_state' in data && 'roof_heartbeat_remaining' in data) {
    if (data['roof_heartbeat_state'] == 1) {
      status = data['roof_heartbeat_remaining'] + 's remaining';
      if (data['roof_heartbeat_remaining'] < 10)
        style = 'text-danger'
      else if (data['roof_heartbeat_remaining'] < 30)
        style = 'text-warning';
      else
        style = 'text-success';
    } else {
      status = state[data['roof_heartbeat_state']][0];
      style = state[data['roof_heartbeat_state']][1];
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

  cam_status = getData(data, ["superwasp_cam_" + cam_number, "state"]);
  cam_overlapped = getData(data, ["superwasp_cam_" + cam_number, "sequence_overlapped"]);
  if (cam_status === undefined) {
    status = 'ERROR';
    style = 'text-danger';
  } else {
    // Show overlapped readout as exposing
    if (cam_status == 5 && cam_overlapped)
      cam_status = 4;

    status = state[cam_status][0];
    style = state[cam_status][1];
  }

  cell.html(status);
  cell.addClass(style);
}

function camExposure(row, cell, data) {
  var cam_number = row.data('cam');
  cam_exposure = getData(data, ["superwasp_cam_" + cam_number, "exposure_time"]);
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
  cam_temperature = getData(data, ["superwasp_cam_" + cam_number, "temperature"]);
  cam_temperature_locked = getData(data, ["superwasp_cam_" + cam_number, "temperature_locked"]);
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
  var cam_number = row.data('cam');
  cam_cooler_power = getData(data, ["superwasp_cam_" + cam_number, "cooler_power"]);
  cam_cooler_enabled = getData(data, ["superwasp_cam_" + cam_number, "cooler_enabled"]);
  if (cam_cooler_power === undefined || cam_cooler_enabled === undefined) {
    status = 'ERROR';
    style = 'text-danger';
  } else {
    status = cam_cooler_enabled ? cam_cooler_power.toFixed(0) + '%'  : 'DISABLED';
    style = cam_cooler_enabled ? '' : 'text-danger';
  }

  cell.html(status);
  cell.addClass(style);
}