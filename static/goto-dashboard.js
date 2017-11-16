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

function telAlt(row, cell, data) {
  cell.html(data.toFixed(1) + '&deg;');
}

function telFilt(row, cell, data, index) {
  status = 'ERROR';
  style = 'text-danger';
  if (data && 'current_filter_num'+index in data) {
    if (data['homed'+index]) {
      status = data['current_filter_num'+index];
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

function telFoc(row, cell, data, index) {
  status = 'ERROR';
  style = 'text-danger';
  if (data && 'current_pos'+index in data) {
    status = data['current_pos'+index];
    style = '';
  }

  cell.html(status);
  cell.addClass(style);
}

function telFoc1(row, cell, data) {
  telFoc(row, cell, data, 1);
}

function telFoc2(row, cell, data) {
  telFoc(row, cell, data, 2);
}

function telFoc3(row, cell, data) {
  telFoc(row, cell, data, 3);
}

function telFoc4(row, cell, data) {
  telFoc(row, cell, data, 4);
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

function conditionInner(row, cell, data, condition, flag) {
  status = 'ERROR';
  style = 'text-danger';

  var flag_valid = flag === undefined || (data && 'flags' in data && flag in data['flags'] && data['flags'][flag] != 2);
  var condition_valid = data && 'weather' in data;

  if (flag_valid && condition_valid) {
    if (flag === undefined) {
      style = '';
    } else if (data['flags'][flag] == 0) {
      style = 'text-success';
    }

    var minValue = undefined;
    var maxValue = undefined;
    for (var sensor in data['weather']) {
      if (!(condition in data['weather'][sensor])) {
        continue;
      }

      var sensorValue = data['weather'][sensor][condition];
      minValue = minValue === undefined ? sensorValue : Math.min(minValue, sensorValue);
      maxValue = maxValue === undefined ? sensorValue : Math.max(maxValue, sensorValue);
    }

    status = minValue + ' &mdash; ' + maxValue;
    var units = row.data('units');
    if (units)
      status += units;
  }

  cell.html(status);
  cell.addClass(style);
}

function conditionExtHumidity(row, cell, data) {
  conditionInner(row, cell, data, 'humidity', 'humidity');
}

function conditionIntHumidity(row, cell, data) {
  conditionInner(row, cell, data, 'int_humidity', 'humidity');
}

function conditionExtTemp(row, cell, data) {
  conditionInner(row, cell, data, 'temperature', 'temperature');
}

function conditionIntTemp(row, cell, data) {
  conditionInner(row, cell, data, 'int_temperature');
}

function conditionWind(row, cell, data) {
  conditionInner(row, cell, data, 'windspeed', 'windspeed');
}

function conditionNetwork(row, cell, data) {
  status = 'ERROR';
  style = 'text-danger';

  if (data && 'flags' in data && 'link' in data['flags'] && data['flags']['link'] != 2) {
    if (data['flags']['link'] == 0) {
      status = 'ONLINE';
      style = 'text-success';
    } else {
      status = 'OFFLINE';
    }
  }

  cell.html(status);
  cell.addClass(style);
}

function conditionSunElevation(row, cell, data) {
  status = 'ERROR';
  style = 'text-danger';

  if (data && 'flags' in data && 'dark' in data['flags'] && data['flags']['dark'] != 2) {
    if (data['flags']['dark'] == 0) {
      status = 'DARK';
      style = 'text-success';
    } else {
      status = 'BRIGHT';
    }
  }

  cell.html(status);
  cell.addClass(style);
}

