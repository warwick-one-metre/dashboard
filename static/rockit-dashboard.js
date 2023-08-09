function diskSpaceGB(row, cell, data) {
  if (data && 'latest' in data) {
    let display = +(data['latest'] / 1073741824).toFixed(1);
    const units = row.data('units');
    if (units)
      display += units;
    cell.html(display);
    cell.addClass(fieldLimitsColor(data, data['latest']));
  }
}

// Header generators
function opsHeaderTel(row, cell, data) {
  let label = 'ERROR';
  let style = 'text-danger';
  let row_style = 'list-group-item-danger';

  if (data === 1) {
    label = 'OFFLINE';
  } else if (data === 2) {
    label = 'ONLINE';
    style = 'text-success';
    row_style = 'list-group-item-success';
  }

  cell.html(label);
  cell.addClass(style);
  row.addClass(row_style);
}

function opsHeaderDome(row, cell, data) {
  let label = 'ERROR';
  let style = 'text-danger';
  let row_style = 'list-group-item-danger';

  if (data === 1) {
    label = 'CLOSED';
  } else if (data === 2) {
    label = 'OPEN';
    style = 'text-success';
    row_style = 'list-group-item-success';
  }

  cell.html(label);
  cell.addClass(style);
  row.addClass(row_style);
}

function opsHeaderMode(row, cell, data) {
  const modes = [
    ['ERROR', 'list-group-item-danger'],
    ['AUTO', 'list-group-item-success'],
    ['MANUAL', 'list-group-item-warning'],
  ];

  const mode = data in modes ? modes[data] : mode[0];
  cell.html(mode[0]);
  row.addClass(mode[1]);
}

function opsHeaderDehumidifier(row, cell, data) {
  const modes = [
    ['MANUAL', 'list-group-item-warning'],
    ['AUTO', 'list-group-item-success'],
  ];

  const mode = data in modes ? modes[data] : modes[0];
  cell.html(mode[0]);
  row.addClass(mode[1]);
}

function opsConditions(row, cell, data) {
  if ('safe' in data && 'conditions' in data) {
    cell.html(data['safe'] ? 'SAFE' : 'NOT SAFE');
    cell.addClass(data['safe'] ? 'text-success' : 'text-danger');
    opsConditionsTooltip(row, data);
  } else {
    cell.html('NO DATA');
    cell.addClass('text-danger');
  }
}

function powerUPS(row, cell, data) {
  const prefix = row.data('prefix');
  const status = getData(data, [prefix + '_status']);
  const load = getData(data, [prefix + '_load']);
  const battery_remaining = getData(data, [prefix + '_battery_remaining']);
  const battery_healthy = getData(data, [prefix + '_battery_healthy']);

  if (battery_healthy === false)
    row.addClass('list-group-item-danger');

  if (status === undefined || battery_remaining === undefined || load === undefined) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else {
    let label = '<span class="text-danger">UNKNOWN</span>';
    if (status === 2) {
      label = '<span class="text-success">ONLINE</span>';
    } else if (status === 3) {
      label = '<span class="text-warning">BATTERY</span>';
    }

    label += ' (' + Math.round(battery_remaining) + '%&nbsp;/&nbsp;' + Math.round(load) + '%)';
    cell.html(label);
  }
}

function powerATS(row, cell, data) {
  let label, style;
  if (data > 0) {
    label = 'SOURCE ' + data;
    style = '';
  } else {
    label = 'ERROR';
    style = 'text-danger';
  }

  cell.html(label);
  cell.addClass(style);
}

function powerOnOff(row, cell, data) {
  if (data === 2) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else if (data === 1) {
    cell.html('POWER ON');
    cell.addClass('text-success');
  } else {
    cell.html('POWER OFF');
    cell.addClass('text-danger');
  }
}

function powerOffOn(row, cell, data) {
  if (data === 2) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else if (data === 1) {
    cell.html('POWER ON');
    cell.addClass('text-danger');
  } else {
    cell.html('POWER OFF');
    cell.addClass('text-success');
  }
}

function powerOnOffMixed(row, cell, data) {
  const switches = row.data('switches');
  let error = false;
  let enabled = 0;

  for (let i in switches) {
    if (!(switches[i] in data) || data[switches[i]] === 2)
      error = true;
    else if (data[switches[i]] === 1)
      enabled += 1;
  }

  let status = 'POWER MIXED';
  let style = 'text-warning';
  if (error) {
    status = 'ERROR';
    style = 'text-danger';
  } else if (enabled === switches.length) {
    status = 'POWER ON';
    style = 'text-success';
  } else if (enabled === 0) {
    status = 'POWER OFF';
    style = 'text-danger';
  }

  cell.html(status);
  cell.addClass(style);
}

function switchClosedOpen(row, cell, data) {
  if ('latest' in data)
    cell.html(data['latest'] ? 'CLOSED' : 'OPEN');
  else {
    cell.html('NO DATA');
    cell.addClass('text-danger');
  }
}

function dehumidifierState(row, cell, data) {
  const mode = getData(data, row.data('mode-index'));
  const powered = getData(data, row.data('power-index'));

  if (mode === undefined || powered === undefined) {
    cell.html('NO DATA');
    cell.addClass('text-danger');
  } else {
    const mode_class = mode === 1 ? 'text-success' : 'text-warning';
    const mode_label = mode === 1 ? 'AUTO' : 'MANUAL';
    const power_class = powered === 1 ? 'text-danger' : 'text-success';
    const power_label = powered === 1 ? 'ON' : 'OFF';
    let label = '<span class="' + mode_class + '">' + mode_label + '</span>&nbsp;/&nbsp;<span class="' + power_class + '">' + power_label + '</span>';
    cell.html(label);
  }
}


function opsDomeTime(row, cell, data) {
  const mode = getData(data, ['mode']);
  const time = getData(data, ['requested_' + row.data('type') + '_date']);

  if (mode === 2) {
    cell.html('MANUAL');
    cell.addClass('text-warning');
  }
  else if (time) {
    cell.html(time);
    cell.addClass('text-success');
  } else {
    cell.html('NOT SCHEDULED');
  }
}

function opsActionsQueue(container, data) {
  const ops_data = getData(data, container.data('index'));
  const schedule = getData(ops_data, ['schedule']);
  const mode = getData(ops_data, ['mode']);

  container.empty();
  if (schedule && schedule.length > 0) {
    function formatList(entries) {
      const parent = $('<ul />');
      $.each(entries, function (i) {
        if (Array.isArray(entries[i]))
          formatList(entries[i]).appendTo(parent);
        else
          $('<li />').text(entries[i]).appendTo(parent);
      });
      return parent;
    }

    const parent = $('<ul />');
    $.each(schedule, function (i) {
      const action = $('<li />').text(schedule[i].name);
      formatList(schedule[i].tasks).appendTo(action);
      action.appendTo(parent);
    });

    container.append(parent);
  } else if (mode === 2) {
    container.append($('<p class="text-center">Telescope mode is <span class="text-warning">MANUAL</span></p>'));
  } else {
    container.append($('<p class="text-center">No actions are scheduled</p>'));
  }
}

function opsActionName(row, cell, data) {
  if (!('mode' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else if (data['mode'] === 2) {
    cell.html('MANUAL');
    cell.addClass('text-warning');
  } else if ('action_name' in data) {
    let label = data['action_name'];
    if ('action_number' in data && data['action_number'] > 0)
      label += ' (' + data['action_number'] + ' / ' + data['action_count'] + ')';
    cell.html(label);
  } else
    cell.html('IDLE');
}

function opsActionTask(row, cell, data) {
  if (!('mode' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else if (data['mode'] === 2) {
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
  } else if (data['frame_type'] === 'SCIENCE')
    cell.html(data['frame_object']);
  else
    cell.html(data['frame_type']);
}

function pipelinePrefix(row, cell, data) {
  cell.html(data);
}

function mountState(row, cell, data) {
  const mount_data = getData(data, row.data('mount-index'));
  const powered = getData(data, row.data('power-index'));

  const state = [
    ['DISABLED', 'text-danger'],
    ['PARKED', ''],
    ['STOPPED', 'text-danger'],
    ['SLEWING', 'text-warning'],
    ['TRACKING', 'text-success'],
  ];

  if (!powered) {
    cell.html('POWER OFF');
    cell.addClass('text-danger');
  } else if (mount_data && 'state' in mount_data) {
    if ('axes_homed' in mount_data && !mount_data['axes_homed']) {
      cell.html('NOT HOMED');
      cell.addClass('text-danger');
    } else {
      cell.html(state[mount_data['state']][0]);
      cell.addClass(state[mount_data['state']][1]);
    }
  } else {
    cell.html('ERROR');
    cell.addClass('text-danger');
  }
}

function mountRADec(row, cell, data) {
  if (data && (('state' in data && (data['state'] < 2 || data['state'] > 4)) || ('axes_homed' in data && !data['axes_homed'])))
    cell.html('N/A')
  else if (!data || !('ra' in data) || !('dec' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else
    cell.html(sexagesimal(data['ra'] / 15) + '&nbsp;/&nbsp;' + sexagesimal(data['dec']));
}

function mountAltAz(row, cell, data) {
  if (data && (('state' in data && (data['state'] < 2 || data['state'] > 4)) || ('axes_homed' in data && !data['axes_homed'])))
    cell.html('N/A')
  else if (!data || !('alt' in data) || !('az' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else
    cell.html((data['alt']).toFixed(1) + '&deg;&nbsp;/&nbsp;' + (data['az']).toFixed(1) + '&deg;');
}

function mountSunMoon(row, cell, data) {
  if (data && (('state' in data && (data['state'] < 2 || data['state'] > 4)) || ('axes_homed' in data && !data['axes_homed'])))
    cell.html('N/A')
  else if (!data || !('sun_separation' in data) || !('moon_separation' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else
    cell.html((data['sun_separation']).toFixed(1) + '&deg;&nbsp;/&nbsp;' + (data['moon_separation']).toFixed(1) + '&deg;');
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

function focusState(row, cell, data) {
  const focuser_data = getData(data, row.data('focuser-index'));
  const powered = getData(data, row.data('power-index'));
  let temperature = undefined;
  if (row.data('temperature-index'))
    temperature = getData(data, row.data('temperature-index'));

  const focuser = row.data('focuser');
  const status = getData(focuser_data, ['status']);
  const current_steps = getData(focuser_data, ['current_steps_' + focuser]);
  const moving = getData(focuser_data, ['moving_' + focuser]);

  let label, style;
  if (powered === 0) {
    label = 'POWER OFF';
    style = 'text-danger';
  } else if (status === 0) {
    label = 'OFFLINE';
    style = 'text-danger';
  } else if (status === 1 && moving) {
    label = 'MOVING';
    style = 'text-warning';
  } else if (status === 1 && current_steps !== undefined) {
    label = current_steps + ' steps';
    style = '';
  } else {
    label = 'ERROR';
    style = 'text-danger';
  }

  if (temperature !== undefined) {
    label = '<span class="' + style + '">' + label + '</span>&nbsp;/&nbsp;' + temperature.toFixed(1) + '&deg;C';
    style = '';
  }

  cell.html(label);
  cell.addClass(style);
}

function qhyState(row, cell, data) {
  const cam_state = getData(data, row.data('cam-index'));
  const powered = getData(data, row.data('power-index'));

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
  if (cam_state === undefined || powered === undefined) {
    label = 'ERROR';
    style = 'text-danger';
  } else if (powered === 0) {
    label = 'POWER OFF';
    style = 'text-danger';
  } else {
    label = state[cam_state][0];
    style = state[cam_state][1];
  }

  cell.html(label);
  cell.addClass(style);
}

function qhyExposure(row, cell, data) {
  const state = getData(data, ["state"]);
  const exposure = getData(data, ["exposure_time"]);
  let label, style;
  if (state === 0) {
    label = 'N/A';
    style = '';
  } else if (exposure === undefined) {
    label = 'ERROR';
    style = 'text-danger';
  } else {
    label = exposure.toFixed(3) + ' s';
    style = '';
  }

  cell.html(label);
  cell.addClass(style);
}

function qhyTemperature(row, cell, data) {
  const state = getData(data, ["state"]);
  const temperature = getData(data, ["cooler_temperature"]);
  const cooler_power = getData(data, ["cooler_pwm"]);
  const cooler_mode = getData(data, ["cooler_mode"]);

  const cooler_labels = [
    ['UNKNOWN', 'text-danger'],
    ['WARM', 'text-danger'],
    ['WARMING', 'text-warning'],
    ['COOLING', 'text-info'],
    ['LOCKING', 'text-warning'],
    ['LOCKED', 'text-success'],
  ];

  let label = 'ERROR';
  let style = 'text-danger';
  if (state === 0) {
    label = 'N/A';
    style = '';
  } else if (cooler_power !== undefined && cooler_mode !== undefined && temperature !== undefined) {
    label = '<span class="' + cooler_labels[cooler_mode][1] + '">' + cooler_labels[cooler_mode][0] + '</span>'
    label += ' (' + temperature.toFixed(0) + '&nbsp;&deg;C';
    if (cooler_mode !== 1)
      label += '&nbsp;/&nbsp;' + cooler_power.toFixed(0) + '%';
    label += ')';
    style = '';
  }

  cell.html(label);
  cell.addClass(style);
}

function swirState(row, cell, data) {
  // SWIR uses the same state dictionary as QHY
  qhyState(row, cell, data);
}

function swirExposure(row, cell, data) {
  // SWIR uses the same state dictionary as QHY
  qhyExposure(row, cell, data);
}

function swirTemperature(row, cell, data) {
  const state = getData(data, ["state"]);
  const temperature = getData(data, ["sensor_temperature"]);
  const cooler_mode = getData(data, ["cooler_mode"]);

  const cooler_labels = [
    ['UNKNOWN', 'text-danger'],
    ['OFF', 'text-danger'],
    ['LOCKING', 'text-warning'],
    ['LOCKED', 'text-success'],
  ];

  let label = 'ERROR';
  let style = 'text-danger';
  if (state === 0) {
    label = 'N/A';
    style = '';
  } else if (cooler_mode !== undefined && temperature !== undefined) {
    label = '<span class="' + cooler_labels[cooler_mode][1] + '">' + cooler_labels[cooler_mode][0] + '</span>'
    label += ' (' + temperature.toFixed(0) + '&nbsp;&deg;C)';
    style = '';
  }

  cell.html(label);
  cell.addClass(style);
}

function lensTemperature(row, cell, data) {
  if (data === undefined) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else {
    cell.html(data.toFixed(0) + ' &deg;C');
  }
}

function previewHeader(row, data) {
  row.html('Preview: ' + row.data('cam').toUpperCase());
}

function previewTimestamp(row, cell, data) {
  const cam = row.data('cam');
  const date = getData(data, [cam, 'date']);
  const src = getData(data, [cam, 'src']);
  const has_gps = row.data('gps').includes(cam);

  if (date === undefined) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else {
    let label = date;
    if (src && has_gps) {
      label += ' (<span class="' + (src === 'GPS' ? 'text-success' : 'text-danger') + '">' + src + '</span>)';
    }
    cell.html(label);
  }
}

function previewExposure(row, cell, data) {
  const exptime = getData(data, [row.data('cam'), 'exptime']);
  if (exptime === undefined) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else {
    cell.html(exptime.toFixed(3) + ' s');
  }
}

function previewType(row, cell, data) {
  const type = getData(data, [row.data('cam'), 'type']);
  const object = getData(data, [row.data('cam'), 'object']);
  if (type === undefined) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else {
    let label = type;
    if (object) {
      label += ' (' + object + ')';
    }
    cell.html(label);
  }
}

function previewOverheads(row, cell, data) {
  const steps = getData(data, [row.data('cam'), 'process_steps']);
  const time = getData(data, [row.data('cam'), 'process_time']);
  if (steps === undefined || time === undefined) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else {
    cell.html(time.toFixed(1) + ' s (' + steps.join(', ') + ')');
  }
}

function previewFilename(row, cell, data) {
  const cam = row.data('cam');
  const info = getData(data, [cam]);
  let label = 'ERROR';
  let style = 'text-danger';
  if (info && 'saved' in info && !info['saved']) {
    label = 'NOT SAVED';
  } else if (info && 'filename' in info) {
    label = info['filename'];
    style = 'd-inline-block text-truncate';
  }

  cell.html(label);
  cell.addClass(style);
  cell.css('max-width', '250px');
}

function previewImage(img, data) {
  if (data && 'previews' in data) {
    img.data('data', {'previews': data['previews']});
  }
  previewRefresh(img, data);
}

function previewRefresh(img, data) {
  const info = getData(data, ['previews', img.data('cam')]);
  if (info && 'date' in info) {
    let date = parseUTCDate(info['date']).getTime();
    img.attr('src', img.data('url') + '?' + date);
  }
}

function selectPreview(cam) {
  const display = $('#preview-image');
  const data = display.data('data');

  display.data('cam', cam);
  display.data('url', $('#thumb-' + cam).data('url'));

  $('#preview-info [data-cam]').each(function () {
    $(this).data('cam', cam);
  });

  updateGroups(data, '#preview-container');
}
