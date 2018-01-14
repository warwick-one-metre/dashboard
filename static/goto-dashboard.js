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
  if (data == 'On') {
    cell.html('POWER ON');
    cell.addClass('text-success');
  } else if (data == 'Off') {
    cell.html('POWER OFF');
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
      cell.addClass('text-success');
    } else {
      cell.html('POWER OFF');
      cell.addClass('text-danger');
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

function telRA(row, cell, data) {
  cell.html(sexagesimal(data));
}

function telDec(row, cell, data) {
  cell.html(sexagesimal(data));
}

function telImageType(row, cell, data) {
  status = 'current_imgtype' in data ? data['current_imgtype'].toUpperCase() : 'NONE';
  cell.html(status);
}

function telCamStatus(row, cell, data, index) {
  status = 'ERROR';
  style = 'text-danger';
  if (data && 'status'+index in data) {
    status = data['status'+index].toUpperCase();
    if (status == 'READY')
      style = '';
    else if (status == 'EXPOSING')
      style = 'text-success';
    else if (status == 'READING')
      style = 'text-warning';
  }

  cell.html(status);
  cell.addClass(style);
}

function telCamStatus1(row, cell, data) {
  telCamStatus(row, cell, data, 1);
}

function telCamStatus2(row, cell, data) {
  telCamStatus(row, cell, data, 2);
}

function telCamStatus3(row, cell, data) {
  telCamStatus(row, cell, data, 3);
}

function telCamStatus4(row, cell, data) {
  telCamStatus(row, cell, data, 4);
}

function telCamTemp(row, cell, data, index) {
  status = 'ERROR';
  style = 'text-danger';
  if (data && 'ccd_temp'+index in data) {
    status = data['ccd_temp'+index].toFixed(0) + '&deg;C';
    style = '';
  }

  cell.html(status);
  cell.addClass(style);
}

function telCamTemp1(row, cell, data) {
  telCamTemp(row, cell, data, 1);
}

function telCamTemp2(row, cell, data) {
  telCamTemp(row, cell, data, 2);
}

function telCamTemp3(row, cell, data) {
  telCamTemp(row, cell, data, 3);
}

function telCamTemp4(row, cell, data) {
  telCamTemp(row, cell, data, 4);
}

function telFilt(row, cell, data, index) {
  status = 'ERROR';
  style = 'text-danger';
  filters = ['L', 'R', 'G', 'B'];
  if (data && 'current_filter_num'+index in data && data['current_filter_num'+index] < 4 ) {
    if (data['homed'+index]) {
      status = filters[data['current_filter_num'+index]];
      style = '';
    } else if (data['status'+index] == 'Moving') {
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

function telFilt1(row, cell, data) {
  telFilt(row, cell, data, 1);
}

function telFilt2(row, cell, data) {
  telFilt(row, cell, data, 2);
}

function telFilt3(row, cell, data) {
  telFilt(row, cell, data, 3);
}

function telFilt4(row, cell, data) {
  telFilt(row, cell, data, 4);
}

function telFans(row, cell, data) {
  status = 'ERROR';
  style = 'text-danger';
  if (data) {
    status = data == 'On' ? 'ENABLED' : 'DISABLED';
    style = data == 'On' ? 'text-success' : 'text-danger';
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

function conditionFlags(row, cell, data) {
  if (data) {

    // Build the conditions tooltip
    var conditions = {
        'dark': 'Sun',
        'diskspace': 'Disk&nbsp;Space',
        'hatch': 'Dome&nbsp;Hatch',
        'humidity': 'Humidity',
        'link': 'Network',
        'low_battery': 'UPS&nbsp;Battery',
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
