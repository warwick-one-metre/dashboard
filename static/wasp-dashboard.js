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
    ['PARTIALLY OPEN', 'text-info'],
    ['CLOSED', 'text-danger'],
    ['OPEN', 'text-success'],
    ['CLOSING', 'text-warning'],
    ['OPENING', 'text-warning'],
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

  if ('heartbeat_status' in data && 'heartbeat_remaining' in data) {
    if (data['heartbeat_status'] == 1) {
      status = data['heartbeat_remaining'] + 's remaining';
      if (data['heartbeat_remaining'] < 10)
        style = 'text-danger'
      else if (data['heartbeat_remaining'] < 30)
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
  const cam = row.data('cam');
  const cam_state = getData(data, ["superwasp_cam_" + cam, "state"]);
  const cam_power = getData(data, ["superwasp_power", "cam" + cam]);
  const state = [
    ['OFFLINE', 'text-danger'],
    ['INITIALIZING', 'text-danger'],
    ['IDLE'],
    ['WAITING', 'text-warning'],
    ['EXPOSING', 'text-success'],
    ['READING', 'text-warning'],
    ['ABORTING', 'text-danger'],
  ];

  let label, style;
  if (cam_state === undefined || cam_power === undefined) {
    label = 'ERROR';
    style = 'text-danger';
  } else if (cam_power == 0) {
    label = 'POWER OFF';
    style = 'text-danger';
  } else {
    label = state[cam_state][0];
    style = state[cam_state][1];
  }

  cell.html(label);
  cell.addClass(style);
}

function camExposure(row, cell, data) {
  const cam = row.data('cam');
  const cam_state = getData(data, ["superwasp_cam_" + cam, "state"]);
  const cam_exposure = getData(data, ["superwasp_cam_" + cam, "exposure_time"]);
  let label, style;
  if (cam_state === 0) {
    label = 'N/A';
    style = '';
  } else if (cam_exposure === undefined) {
    label = 'ERROR';
    style = 'text-danger';
  } else {
    label = cam_exposure.toFixed(3) + ' s';
    style = '';
  }

  cell.html(label);
  cell.addClass(style);
}

function camTemp(row, cell, data) {
  const cam = row.data('cam');
  const cam_state = getData(data, ["superwasp_cam_" + cam, "state"]);
  const cam_temperature = getData(data, ["superwasp_cam_" + cam, "cooler_temperature"]);
  const cam_temperature_locked = getData(data, ["superwasp_cam_" + cam, "temperature_locked"]);

  let label, style;
  if (cam_state === 0) {
    label = 'N/A';
    style = '';
  } else if (cam_temperature === undefined || cam_temperature_locked === undefined) {
    label = 'ERROR';
    style = 'text-danger';
  } else {
    label = cam_temperature.toFixed(0) + ' &deg;C';
    style = cam_temperature_locked ? 'text-success' : 'text-danger';
  }

  cell.html(label);
  cell.addClass(style);
}

function camCool(row, cell, data) {
  const state = [
    ['UNKNOWN', 'text-danger'],
    ['WARM', 'text-danger'],
    ['WARMING', 'text-warning'],
    ['COOLING', 'text-info'],
    ['LOCKING', 'text-warning'],
    ['LOCKED', 'text-success'],
  ];

  const cam = row.data('cam');
  const cam_state = getData(data, ["superwasp_cam_" + cam, "state"]);
  const cam_cooler_power = getData(data, ["superwasp_cam_" + cam, "cooler_pwm"]);
  const cam_cooler_mode = getData(data, ["superwasp_cam_" + cam, "cooler_mode"]);

  let label, style;
  if (cam_state === 0) {
    label = 'N/A';
    style = '';
  } else if (cam_cooler_power === undefined || cam_cooler_mode === undefined) {
    label = 'ERROR';
    style = 'text-danger';
  } else {
    label = state[cam_cooler_mode][0]
    if (cam_cooler_mode !== 1)
      label += ' (' + cam_cooler_power.toFixed(0) + '%)';

    style = state[cam_cooler_mode][1];
  }

  cell.html(label);
  cell.addClass(style);
}

function camLensTemp(row, cell, data) {
  var cam_number = row.data('cam');
  lens_temperature = getData(data, ["superwasp_lensheater", "temp_" + cam_number]);
  if (lens_temperature === undefined) {
    status = 'ERROR';
    style = 'text-danger';
  } else {
    status = lens_temperature.toFixed(0) + ' &deg;C';
    style = '';
  }

  cell.html(status);
  cell.addClass(style);
}

function camDiskSpace(row, cell, data){
  const cam = row.data('cam');
  const diskspace = getData(data, ["superwasp_diskspace_cam" + cam, "data_fs_available_bytes"]);
  diskSpaceGB(row, cell, diskspace);
}
