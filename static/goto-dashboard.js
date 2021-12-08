
function domeMode(row, cell, data) {
  if (data == 'robotic') {
    cell.html('ROBOTIC');
    cell.addClass('text-success');
    row.addClass('list-group-item-success');
  } else if (data == 'manual') {
    cell.html('MANUAL');
    cell.addClass('text-warning');
    row.addClass('list-group-item-warning');
  } else if (data == 'engineering') {
    cell.html('ENGINEERING');
    cell.addClass('text-danger');
    row.addClass('list-group-item-danger');
  } else {
    cell.html('ERROR');
    cell.addClass('text-danger');
    row.addClass('list-group-item-danger');
  }
}

function domeStatus(row, cell, data) {
  if (data == 'open') {
    cell.html('OPEN');
    cell.addClass('text-success');
    row.addClass('list-group-item-success');
  } else if (data == 'closed') {
    cell.html('CLOSED');
    cell.addClass('text-danger');
    row.addClass('list-group-item-danger');
  } else {
    cell.html('ERROR');
    cell.addClass('text-danger');
    row.addClass('list-group-item-danger');
  }
}

var domeShutterStatus = {
  'closed': ['CLOSED', 'text-danger'],
  'full_open': ['OPEN', 'text-success'],
  'part_open': ['PARTIALLY OPEN', 'text-info'],
  'opening': ['OPENING', 'text-warning'],
  'closing': ['CLOSING', 'text-warning']
};

function domeShutter(row, cell, data) {
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

function conditionsOverride(row, cell, data) {
  if (data) {
    cell.html('ENABLED');
    cell.addClass('text-danger');
    row.addClass('list-group-item-danger');
  } else {
    cell.html('DISABLED');
    cell.addClass('text-success');
    row.addClass('list-group-item-success');
  }
}

function conditionsLockdown(row, cell, data) {
  if (data) {
    cell.html('ENABLED');
    cell.addClass('text-danger');
    row.addClass('list-group-item-danger');
  } else {
    cell.html('DISABLED');
    cell.addClass('text-success');
    row.addClass('list-group-item-success');
  }
}

function conditionFlags(row, cell, data) {
  if (data) {
    // Build the conditions tooltip
    var conditions = {
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

    var status_classes = ['text-success', 'text-danger']
    var info_status_classes = ['text-success', 'text-warning']

    var safe = true;
    var tooltip = '<table style="margin: 15px">';
    var i = 0;
    for (var c in conditions) {
        if (!(c in data)) {
          safe = false;
          continue;
        }

        if (i++ == 0)
          tooltip += '<tr>';

        tooltip += '<td style="text-align: right;">' + conditions[c] + ':</td>';

        if (c == 'clouds' || c == 'dark' || c == 'dust') {
          tooltip += '<td style="padding: 0 5px; text-align: left" class="' + info_status_classes[data[c]] + '">' + (data[c] == 0 ? 'SAFE' : 'WARN') + '</td>';
        } else {
          if (data[c] == 1)
            safe = false;

          tooltip += '<td style="padding: 0 5px; text-align: left" class="' + status_classes[data[c]] + '">' + (data[c] == 0 ? 'SAFE' : 'UNSAFE') + '</td>';
        }

        if (i == 2) {
          tooltip += '</tr>';
          i = 0;
        }
    }

    tooltip += '</table>';

    cell.html(safe ? 'SAFE' : 'NOT SAFE');
    row.addClass(safe ? 'list-group-item-success' : 'list-group-item-danger');

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
function powerUPS(row, cell, data) {
  status = 'ERROR';
  style = 'text-danger';

  var ups = row.data('ups');

  if (data) {
    if (ups + '_battery_healthy' in data && 'latest' in data[ups + '_battery_healthy']
        && !data[ups + '_battery_healthy']['latest']) {
      status = 'BATT. FAIL';
    } else if (ups + '_status' in data && ups + '_battery_remaining' in data) {
      if ('latest' in data[ups + '_status']) {
        status_type = data[ups + '_status']['latest'];
        if (status_type == 2) {
          status = 'ONLINE';
          style = 'text-success';
        } else if (status_type == 3) {
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
  if (data == 'on' || data === true) {
    cell.html('POWER ON');
    cell.addClass('text-success');
  } else if (data == 'off' || data === false) {
    cell.html('POWER OFF');
    cell.addClass('text-danger');
  } else {
    cell.html('ERROR');
    cell.addClass('text-danger');
  }
}

function powerOffOn(row, cell, data) {
  if (data == 'on' || data === true) {
    cell.html('POWER ON');
    cell.addClass('text-danger');
  } else if (data == 'off' || data === false) {
    cell.html('POWER OFF');
    cell.addClass('text-success');
  } else {
    cell.html('ERROR');
    cell.addClass('text-danger');
  }
}

function hatchOpenClosed(row, cell, data) {
  if (data == 'closed') {
    cell.html('CLOSED');
    cell.addClass('text-success');
  } else if (data == 'open') {
    cell.html('OPEN');
    cell.addClass('text-danger');
  } else {
    cell.html('ERROR');
    cell.addClass('text-danger');
  }
}

function ledsOnOff(row, cell, data) {
  if (data && 'status_PDU1' in data && 'leds2' in data['status_PDU1'] && 'status_PDU2' in data && 'leds1' in data['status_PDU2']) {
    if (data['status_PDU1']['leds2'] == 'On' || data['status_PDU2']['leds1'] == 'On') {
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
  if (data && 'status' in data && data['status'] != 'Tracking')
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
  status = 'ERROR';
  style = 'text-danger';
  if (data && 'goto_exq' in data && 'current_imgtype' in data['goto_exq']) {
    status = data['goto_exq']['current_imgtype'].toUpperCase();
    style = ''

    if (data && 'goto_exq' in data && 'current_exptime' in data['goto_exq'])
        status += ' (' + data['goto_exq']['current_exptime'] + 's)';

    if (data && 'goto_cam' in data && 'current_exposure' in data['goto_cam'] &&
        'set_pos' in data['goto_cam']['current_exposure'] && 'set_total' in data['goto_cam']['current_exposure']) {
      status += ' &ndash; ' + data['goto_cam']['current_exposure']['set_pos'] + ' / ' + data['goto_cam']['current_exposure']['set_total'];
    }
  } else {
    status = 'NONE';
  }

  cell.html(status);
}

function camRunNumber(row, cell, data) {
  run_number = data;
  if (data == -1)
    run_number = 'GLANCE';

  cell.html(run_number);
}

function getData(data, index) {
  for (var i in index) {
    data = data && index[i] in data ? data[index[i]] : undefined;
    if (data === undefined)
      break;
  }

  return data;
}

function camStatus(row, cell, data) {
  var dome_number = row.data('dome');
  var power_side = row.data('power');
  var cam_number = row.data('cam');

  power_status = getData(data, ["goto_dome" + dome_number + "_power", "status_" + power_side, "cam" + cam_number]);
  cam_status = getData(data, ["goto_dome" + dome_number + "_cam", cam_number.toString(), "status"]);

  if (power_status === undefined || (power_status != "off" && cam_status === undefined)) {
    status = 'ERROR';
    style = 'text-danger';
  } else if (power_status == "off") {
    status = 'OFFLINE';
    style = 'text-danger';
  } else {
    status = cam_status.toUpperCase();
    style = '';
    if (status == 'EXPOSING')
      style = 'text-success';
    else if (status == 'READING')
      style = 'text-warning';
  }

  cell.html(status);
  cell.addClass(style);
}

function camTemp(row, cell, data) {
  var dome_number = row.data('dome');
  var power_side = row.data('power');
  var cam_number = row.data('cam');
  power_status = getData(data, ["goto_dome" + dome_number + "_power", "status_" + power_side, "cam" + cam_number]);
  cam_temp = getData(data, ["goto_dome" + dome_number + "_cam", cam_number.toString(), "ccd_temp"]);

  style = '';
  if (power_status === undefined || (power_status != "off" && cam_status === undefined)) {
    temp = 'ERROR';
    style = 'text-danger';
  } else if (power_status == "off") {
    temp = 'N/A';
  } else {
    temp = cam_temp.toFixed(0) + '&deg;C';
  }

  cell.html(temp);
  cell.addClass(style);
}

function telFilt(row, cell, data) {
  var dome_number = row.data('dome');
  var power_side = row.data('power');
  var filt_number = row.data('filt');

  power_status = getData(data, ["goto_dome" + dome_number + "_power", "status_" + power_side, "filt" + filt_number]);
  filt_data = getData(data, ["goto_dome" + dome_number + "_filt", filt_number.toString()]);
  if (power_status == "off") {
    status = 'OFFLINE';
    style = 'text-danger';
  } else {
    status = 'ERROR';
    style = 'text-danger';
    filters = ['L', 'R', 'G', 'B'];
    if (filt_data && 'current_filter_num' in filt_data && filt_data['current_filter_num'] < 4) {
      if (data['homed']) {
        status = filters[filt_data['current_filter_num']];
        style = '';
      } else if (filt_data['status'] == 'Moving') {
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
  var dome_number = row.data('dome');
  var foc_number = row.data('foc');
  power_status = getData(data, ["goto_dome" + dome_number + "_power", "status_MOUNT", "asa_gateways"]);
  data = getData(data, ["goto_dome" + dome_number + "_foc", foc_number.toString()]);

  status = 'ERROR';
  style = 'text-danger';

  if (power_status == "off") {
    status = 'OFFLINE';
    style = 'text-danger';
  } else if (data && 'current_pos' in data) {
    if (data['status'] == 'Moving') {
      status = 'MOVING';
      style = 'text-warning';
    } else {
      status = data['current_pos'];
      style = '';
    }
  }

  cell.html(status);
  cell.addClass(style);
}

function telCovers(row, cell, data, index) {
  var dome_number = row.data('dome');
  var cover_number = row.data('cover');
  power_status = getData(data, ["goto_dome" + dome_number + "_power", "status_MOUNT", "asa_gateways"]);
  data = getData(data, ["goto_dome" + dome_number + "_ota", cover_number.toString()]);

  status = 'ERROR';
  style = 'text-danger';

  if (power_status == "off") {
    status = 'OFFLINE';
    style = 'text-danger';
  } else if (data && 'position' in data) {
    if (data['position'] == 'full_open') {
      status = 'OPEN';
      style = 'text-success';
    } else if (data['position'] == 'part_open') {
      status = 'PART OPEN';
      style = 'text-warning';
    } else if (data['position'] == 'closed') {
      status = 'CLOSED';
    }
  }

  cell.html(status);
  cell.addClass(style);
}
