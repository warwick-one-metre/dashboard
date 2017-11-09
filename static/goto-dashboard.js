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
