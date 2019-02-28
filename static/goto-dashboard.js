
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

function conditionsLockdown(row, cell, data) {
  if (data === true) {
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
        'dark': 'Sun',
        'dew_point': 'Dew&nbsp;Point',
        'diskspace': 'Disk&nbsp;Space',
        'hatch': 'Dome&nbsp;Hatch',
        'humidity': 'Humidity',
        'ice': 'Ice',
        'internal': 'Internal',
        'link': 'Network',
        'rain': 'Rain',
        'temperature': 'Temperature',
        'ups': 'UPS&nbsp;Status',
        'windspeed': 'Wind',
    }

    var status_classes = ['text-success', 'text-danger']

    var safe = true;
    var tooltip = '<table style="margin: 5px">';
    for (var c in conditions) {
        if (!(c in data)) {
          safe = false;
          continue;
        }

        if (data[c] == 1)
          safe = false;

        tooltip += '<tr><td style="text-align: right;">' + conditions[c] + ':</td>';
        tooltip += '<td style="padding: 0 5px; text-align: left" class="' + status_classes[data[c]] + '">' + (data[c] == 0 ? 'SAFE' : 'UNSAFE') + '</td>';
        tooltip += '</tr>';

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
  if (data && 'status' in data) {
    if (data['status'] == 'Normal') {
      status = 'ONLINE';
      style = 'text-success';
    }
    else if (data['status'] == 'ON BATTERY') {
      status = 'BATTERY';
      style = 'text-warning';
    }

    status += ' (' + data['percent'] + '%)';
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
  if (data && 'status_PDU1' in data && 'leds1' in data['status_PDU1'] && 'status_PDU2' in data && 'leds2' in data['status_PDU2']) {
    if (data['status_PDU1']['leds1'] == 'On' || data['status_PDU2']['leds2'] == 'On') {
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
  if (data && 'exq' in data && 'current_imgtype' in data['exq']) {
    status = data['exq']['current_imgtype'].toUpperCase();
    style = ''

    if (data && 'exq' in data && 'current_exptime' in data['exq'])
        status += ' (' + data['exq']['current_exptime'] + 's)';

    if (data && 'cam' in data && 'current_exposure' in data['cam'] &&
        'set_pos' in data['cam']['current_exposure'] && 'set_total' in data['cam']['current_exposure']) {
      status += ' &ndash; ' + data['cam']['current_exposure']['set_pos'] + ' / ' + data['cam']['current_exposure']['set_total'];
    }
  } else {
    status = 'NONE';
  }

  cell.html(status);
}

function camRunNumber(row, cell, data) {
  cell.html(data);
}

function camStatus(row, cell, data) {
  status = data.toUpperCase();
  if (status == 'EXPOSING')
    style = 'text-success';
  else if (status == 'READING')
    style = 'text-warning';

  cell.html(status);
  cell.addClass(style);
}

function camTemp(row, cell, data) {
  cell.html(data.toFixed(0) + '&deg;C');
}

function telFilt(row, cell, data, index) {
  status = 'ERROR';
  style = 'text-danger';
  filters = ['L', 'R', 'G', 'B'];
  if (data && 'current_filter_num' in data && data['current_filter_num'] < 4 ) {
    if (data['homed']) {
      status = filters[data['current_filter_num']];
      style = '';
    } else if (data['status'] == 'Moving') {
      status = 'MOVING';
      style = 'text-warning';
    } else {
      status = 'NOT HOMED';
      style = 'text-warning';
    }
  }

  cell.html(status);
  cell.addClass(style);
}

function telFoc(row, cell, data, index) {
  status = 'ERROR';
  style = 'text-danger';
  if (data && 'current_pos' in data) {
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

function onemetreParameter(row, cell, data) {
  status = 'ERROR';
  style = 'text-danger';

  var units = row.data('units');
  if (data && 'current' in data) {
    if ('latest' in data && data['current']) {
      style = '';
      status = data['latest'];
      if (units)
        status += units;
    } else
      status = 'NO DATA';
  }

  cell.html(status);
  cell.addClass(style);
}

function onemetreMoon(row, cell, data) {
  if ('latest' in data && 'current' in data && data['current']) {
    display = 'BRIGHT';
    if (data['latest'] < 25)
      display = 'DARK';
    else if (data['latest'] < 65)
      display = 'GRAY';

    display += ' (' + data['latest'].toFixed(1) + '%)';

    cell.html(display);
  } else {
    cell.html('NO DATA');
    cell.addClass('text-danger');
  }
}

function conditionSimple(row, cell, data) {
  status = data;
  var units = row.data('units');
  if (units)
    status += units;

  cell.html(status);
}
