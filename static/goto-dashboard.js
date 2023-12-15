function domeShutter(row, cell, data) {
  const domeShutterStatus = {
    'closed': ['CLOSED', 'text-danger'],
    'full_open': ['OPEN', 'text-success'],
    'part_open': ['PARTIALLY OPEN', 'text-info'],
    'opening': ['OPENING', 'text-warning'],
    'closing': ['CLOSING', 'text-warning']
  };

  if (data && data in domeShutterStatus) {
    cell.html(domeShutterStatus[data][0]);
    cell.addClass(domeShutterStatus[data][1]);
  } else {
    cell.html('ERROR');
    cell.addClass('text-danger');
  }
}

function domeEnabledSafe(row, cell, data) {
  if (data === true) {
    cell.html('ENABLED');
    cell.addClass('text-success');
  } else {
    cell.html('DISABLED');
    cell.addClass('text-danger');
  }
}

function domeWindshield(row, cell, data) {
  if (data === true) {
    cell.html('ENABLED');
    cell.addClass('text-warning');
  } else {
    cell.html('DISABLED');
    cell.addClass('text-success');
  }
}

function conditionsOverride(row, cell, data) {
  if (data) {
    cell.html('ENABLED');
    cell.addClass('text-danger');
  } else {
    cell.html('DISABLED');
    cell.addClass('text-success');
  }
}

function conditionsLockdown(row, cell, data) {
  if (data) {
    cell.html('ENABLED');
    cell.addClass('text-danger');
  } else {
    cell.html('DISABLED');
    cell.addClass('text-success');
  }
}

function conditionFlags(row, cell, data) {
  if (data && 'flags' in data && 'critical_flags' in data) {
    // Build the conditions tooltip
    const labels = {
      'windspeed': 'Wind&nbsp;Speed',
      'windgust': 'Wind&nbsp;Gust',
      'humidity': 'Humidity',
      'internal': 'Internal',
      'temperature': 'Temperature',
      'ice': 'Ice',
      'dew_point': 'Dew&nbsp;Point',
      'rain': 'Rain',
      'ups': 'UPS&nbsp;Status',
      'diskspace': 'Disk&nbsp;Space',
      'link': 'Network',
      'hatch': 'Dome&nbsp;Hatch',
      'override': 'Override',
      'clouds': 'Clouds',
      'dark': 'Dark',
      'dust': 'Dust'
    }

    const status_classes = ['text-success', 'text-danger']
    const info_status_classes = ['text-success', 'text-warning']

    let safe = true;
    let tooltip = '<table style="margin: 15px">';
    let i = 0;
    for (let c in data['flags']) {
        if (i++ === 0)
          tooltip += '<tr>';

        tooltip += '<td style="text-align: right;">' + (c in labels ? labels[c] : c) + ':</td>';
        if (c in data['critical_flags']) {
          if (data['flags'][c] === 1)
            safe = false;

          tooltip += '<td style="padding: 0 5px; text-align: left" class="' + status_classes[data['flags'][c]] + '">' + (data['flags'][c] === 0 ? 'SAFE' : 'UNSAFE') + '</td>';
        } else {
          tooltip += '<td style="padding: 0 5px; text-align: left" class="' + info_status_classes[data['flags'][c]] + '">' + (data['flags'][c] === 0 ? 'SAFE' : 'WARN') + '</td>';
        }

        if (i === 2) {
          tooltip += '</tr>';
          i = 0;
        }
    }

    tooltip += '</table>';

    cell.html(safe ? 'SAFE' : 'NOT SAFE');
    cell.addClass(safe ? 'text-success' : 'text-danger');

    row.tooltip({
      title: tooltip,
      html: true,
      sanitize: false,
      animation: false,
      container: 'body',
      customClass: 'ops-tooltip'
    });
  } else {
    cell.html('NO DATA');
    cell.addClass('text-danger');
  }
}

// Power generators
function powerUPS(row, cell, data) {
  let status = 'ERROR';
  let style = 'text-danger';
  const ups = row.data('ups');

  if (data) {
    if (ups + '_battery_healthy' in data && 'latest' in data[ups + '_battery_healthy']
        && !data[ups + '_battery_healthy']['latest']) {
      status = 'BATT. FAIL';
    } else if (ups + '_status' in data && ups + '_battery_remaining' in data) {
      if ('latest' in data[ups + '_status']) {
        let status_type = data[ups + '_status']['latest'];
        if (status_type === 2) {
          status = 'ONLINE';
          style = 'text-success';
        } else if (status_type === 3) {
          status = 'BATTERY';
          style = 'text-warning';
        }
      }

      if ('latest' in data[ups + '_battery_remaining'])
        status += ' (' + data[ups + '_battery_remaining']['latest'] + '%)';
    }
  }

  cell.html(status);
  cell.addClass(style);
}

function powerOnOff(row, cell, data) {
  if (data === 'on' || data === true) {
    cell.html('POWER ON');
    cell.addClass('text-success');
  } else if (data === 'off' || data === false) {
    cell.html('POWER OFF');
    cell.addClass('text-danger');
  } else {
    cell.html('ERROR');
    cell.addClass('text-danger');
  }
}

function powerOffOn(row, cell, data) {
  if (data === 'on' || data === true) {
    cell.html('POWER ON');
    cell.addClass('text-danger');
  } else if (data === 'off' || data === false) {
    cell.html('POWER OFF');
    cell.addClass('text-success');
  } else {
    cell.html('ERROR');
    cell.addClass('text-danger');
  }
}

function hatchOpenClosed(row, cell, data) {
  if (data === 'closed') {
    cell.html('CLOSED');
    cell.addClass('text-success');
  } else if (data === 'open') {
    cell.html('OPEN');
    cell.addClass('text-danger');
  } else {
    cell.html('ERROR');
    cell.addClass('text-danger');
  }
}

function ledsOnOff(row, cell, data) {
  if (data && 'status_PDU1' in data && 'leds2' in data['status_PDU1'] && 'status_PDU2' in data && 'leds1' in data['status_PDU2']) {
    if (data['status_PDU1']['leds2'] === 'on' || data['status_PDU2']['leds1'] === 'on') {
      cell.html('POWER ON');
      cell.addClass('text-danger');
    } else {
      cell.html('POWER OFF');
      cell.addClass('text-success');
    }
  } else {
    cell.html('ERROR');
    cell.addClass('text-danger');
  }
}

function telStatus(row, cell, data) {
  // TODO
  cell.html(data.toUpperCase());
}

function telRADec(row, cell, data) {
  if (data && 'status' in data && data['status'] !== 'Tracking')
    cell.html('N/A')
  else if (!data || !('mount_ra' in data) || !('mount_dec' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else
    cell.html(sexagesimal(data['mount_ra']) + '&nbsp;/&nbsp;' + sexagesimal(data['mount_dec']));
}

function telAltAz(row, cell, data) {
  if (!data || !('mount_alt' in data) || !('mount_az' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else
    cell.html((data['mount_alt']).toFixed(1) + '&deg;&nbsp;/&nbsp;' + (data['mount_az']).toFixed(1) + '&deg;');
}

function exqCamExposure(row, cell, data) {
  const dome_number = row.data('dome');
  const exq_data = getData(data, ["goto_dome" + dome_number + "_exq"]);
  const cam_data = getData(data, ["goto_dome" + dome_number + "_cam"]);

  let status = 'ERROR';
  if (exq_data && 'current_imgtype' in exq_data) {
    status = exq_data['current_imgtype'].toUpperCase();

    if ('current_exptime' in exq_data)
        status += ' (' + exq_data['current_exptime'] + 's)';

    if (cam_data && 'current_exposure' in cam_data &&
        'set_pos' in cam_data['current_exposure'] && 'set_total' in cam_data['current_exposure']) {
      status += ' &ndash; ' + cam_data['current_exposure']['set_pos'] + ' / ' + cam_data['current_exposure']['set_total'];
    }
  } else {
    status = 'NONE';
  }

  cell.html(status);
}

function camRunNumber(row, cell, data) {
  let run_number = data;
  if (data === -1)
    run_number = 'GLANCE';

  cell.html(run_number);
}

function camStatus(row, cell, data) {
  const dome_number = row.data('dome');
  const power_side = row.data('power');
  const cam_number = row.data('cam');

  const power_status = getData(data, ["goto_dome" + dome_number + "_power", "status_" + power_side, "cam" + cam_number]);
  const cam_status = getData(data, ["goto_dome" + dome_number + "_cam", cam_number.toString(), "status"]);

  let status;
  let style;
  if (power_status === undefined || (power_status !== "off" && cam_status === undefined)) {
    status = 'ERROR';
    style = 'text-danger';
  } else if (power_status === "off") {
    status = 'OFFLINE';
    style = 'text-danger';
  } else {
    status = cam_status.toUpperCase();
    style = '';
    if (status === 'EXPOSING')
      style = 'text-success';
    else if (status === 'READING')
      style = 'text-warning';
  }

  cell.html(status);
  cell.addClass(style);
}

function camTemp(row, cell, data) {
  const dome_number = row.data('dome');
  const power_side = row.data('power');
  const cam_number = row.data('cam');
  const power_status = getData(data, ["goto_dome" + dome_number + "_power", "status_" + power_side, "cam" + cam_number]);
  const cam_temp = getData(data, ["goto_dome" + dome_number + "_cam", cam_number.toString(), "ccd_temp"]);

  let temp;
  let style = '';
  if (power_status === undefined || (power_status !== "off" && cam_temp === undefined)) {
    temp = 'ERROR';
    style = 'text-danger';
  } else if (power_status === "off") {
    temp = 'N/A';
  } else {
    temp = cam_temp.toFixed(0) + '&deg;C';
  }

  cell.html(temp);
  cell.addClass(style);
}

function telFilt(row, cell, data) {
  const dome_number = row.data('dome');
  const power_side = row.data('power');
  const filt_number = row.data('filt');

  const power_status = getData(data, ["goto_dome" + dome_number + "_power", "status_" + power_side, "filt" + filt_number]);
  const filt_data = getData(data, ["goto_dome" + dome_number + "_filt", filt_number.toString()]);

  let status;
  let style;
  if (power_status === "off") {
    status = 'OFFLINE';
    style = 'text-danger';
  } else {
    status = 'ERROR';
    style = 'text-danger';
    const filters = ['L', 'R', 'G', 'B'];
    if (filt_data && 'current_filter_num' in filt_data && filt_data['current_filter_num'] < 4) {
      if (filt_data['homed']) {
        status = filters[filt_data['current_filter_num']];
        style = '';
      } else if (filt_data['status'] === 'Moving') {
        status = 'MOVING';
        style = 'text-warning';
      } else {
        status = 'NOT HOMED';
        style = 'text-warning';
      }
    }
  }

  cell.html(status);
  cell.addClass(style);
}

function telFoc(row, cell, data, index) {
  const dome_number = row.data('dome');
  const foc_number = row.data('foc');
  const power_status = getData(data, ["goto_dome" + dome_number + "_power", "status_MOUNT", "asa_gateways"]);
  const focus_data = getData(data, ["goto_dome" + dome_number + "_foc", foc_number.toString()]);

  let status = 'ERROR';
  let style = 'text-danger';

  if (power_status === "off") {
    status = 'OFFLINE';
    style = 'text-danger';
  } else if (focus_data && 'current_pos' in focus_data) {
    if (focus_data['status'] === 'Moving') {
      status = 'MOVING';
      style = 'text-warning';
    } else {
      status = focus_data['current_pos'];
      style = '';
    }
  }

  cell.html(status);
  cell.addClass(style);
}

function telCovers(row, cell, data, index) {
  const dome_number = row.data('dome');
  const cover_number = row.data('cover');
  const power_status = getData(data, ["goto_dome" + dome_number + "_power", "status_MOUNT", "asa_gateways"]);
  const cover_data = getData(data, ["goto_dome" + dome_number + "_ota", cover_number.toString()]);

  let status = 'ERROR';
  let style = 'text-danger';

  if (power_status === "off") {
    status = 'OFFLINE';
    style = 'text-danger';
  } else if (cover_data && 'position' in cover_data) {
    if (cover_data['position'] === 'full_open') {
      status = 'OPEN';
      style = 'text-success';
    } else if (cover_data['position'] === 'part_open') {
      status = 'PART OPEN';
      style = 'text-warning';
    } else if (cover_data['position'] === 'closed') {
      status = 'CLOSED';
    }
  }

  cell.html(status);
  cell.addClass(style);
}
