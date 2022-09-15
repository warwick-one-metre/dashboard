
// Camera generators
function camStatus(row, cell, data) {
  const state = [
    ['OFFLINE', 'text-danger'],
    ['INITIALIZING', 'text-danger'],
    ['IDLE'],
    ['EXPOSING', 'text-success'],
    ['READING', 'text-warning'],
    ['ABORTING', 'text-danger']
  ];

  const cam = row.data('cam');
  const cam_power = getData(data, ["w1m_power", cam + '_camera']);
  const cam_state = getData(data, ["w1m_" + cam, 'state']);

  let label, style;
  if (cam_state === undefined || cam_power === undefined) {
    label = 'ERROR';
    style = 'text-danger';
  } else if (cam_power === 0) {
    label = 'POWER OFF';
    style = 'text-danger';
  } else {
    label = state[cam_state][0];
    style = state[cam_state][1];
  }

  cell.html(label);
  cell.addClass(style);
}

function camTemperature(row, cell, data) {
  const cam_state = getData(data, ["state"]);
  const cam_temperature = getData(data, ["temperature"]);
  const cam_temperature_locked = getData(data, ["temperature_locked"]);

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

function camShutter(row, cell, data) {
  const cam_state = getData(data, ["state"]);
  const cam_shutter = getData(data, ["shutter_enabled"]);

  let label, style;
  if (cam_state === 0) {
    label = 'N/A';
    style = '';
  } else if (cam_shutter === undefined) {
    label = 'ERROR';
    style = 'text-danger';
  } else {
    label = cam_shutter ? 'AUTO' : 'DARK';
    style = cam_shutter ? 'text-success' : 'text-danger';
  }

  cell.html(label);
  cell.addClass(style);
}

function camExposure(row, cell, data) {
  const cam_state = getData(data, ["state"]);
  const cam_exposure = getData(data, ["exposure_time"]);

  let label, style;
  if (cam_state === 0) {
    label = 'N/A';
    style = '';
  } else if (cam_exposure === undefined) {
    label = 'ERROR';
    style = 'text-danger';
  } else {
    label = cam_exposure.toFixed(2) + ' s'
    style = '';
  }

  cell.html(label);
  cell.addClass(style);
}

// Telescope generators
function telState(row, cell, data) {
  const state = [
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

function telFocus(row, cell, data) {
  const state = [
    ['ABSENT', 'text-danger'],
    ['NOT HOMED', 'text-danger'],
    ['HOMING', 'text-warning'],
    ['LIMITING', 'text-warning'],
    ['READY', 'text-success']
  ];

  const tel_state = getData(data, ["state"]);
  const focus_state = getData(data, ["telescope_focus_state"]);
  const focus = getData(data, ["telescope_focus_um"]);

  let label, style;
  if (tel_state === 0) {
    label = 'N/A';
    style = '';
  } else if (focus_state !== undefined && focus_state !== 4) {
    cell.html(state[data['telescope_focus_state']][0]);
    cell.addClass(state[data['telescope_focus_state']][1]);
  } else if (focus !== undefined) {
    cell.html(focus.toFixed(1) + ' um');
  }

  cell.html(label);
  cell.addClass(style);
}

function telRedFocus(row, cell, data) {
  cell.html('N/A');
}

function domeShutter(row, cell, data) {
  const state = [
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
  const state = [
    ['DISABLED', 'text-warning'],
    ['ACTIVE', 'text-success'],
    ['CLOSING DOME', 'text-danger'],
    ['TRIPPED', 'text-danger'],
    ['UNAVAILABLE', 'text-warning']
  ];

  let label = 'ERROR';
  let style = 'text-danger';

  if ('heartbeat_status' in data && 'heartbeat_remaining' in data) {
    if (data['heartbeat_status'] === 1) {
      label = data['heartbeat_remaining'] + 's remaining';
      if (data['heartbeat_remaining'] < 30)
        style = 'text-danger'
      else if (data['heartbeat_remaining'] < 60)
        style = 'text-warning';
      else
        style = 'text-success';
    } else {
      label = state[data['heartbeat_status']][0];
      style = state[data['heartbeat_status']][1];
    }
  }

  cell.html(label);
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
  } else if (data['frame_type'] === 'SCIENCE')
    cell.html('SCIENCE (' + data['frame_object'] + ')');
  else
    cell.html(data['frame_type']);
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
