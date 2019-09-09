function opsHeaderRoof(row, cell, data) {
  var status = [
    ['UNKNOWN', 'list-group-item-danger'],
    ['UNKNOWN', 'list-group-item-danger'],
    ['OPENING', 'list-group-item-warning'],
    ['CLOSING', 'list-group-item-warning'],
    ['OPEN', 'list-group-item-success'],
    ['CLOSED', 'list-group-item-danger']
  ];

  if (!data in status) {
    cell.html('ERROR');
    row.addClass('list-group-item-danger');
  } else {
    cell.html(status[data][0]);
    row.addClass(status[data][1]);
  }
}

function opsHeaderEnvironment(row, cell, data) {
  if (('safe' in data) && ('conditions' in data)) {
    cell.html(data['safe'] ? 'SAFE' : 'NOT SAFE');
    row.addClass(data['safe'] ? 'list-group-item-success' : 'list-group-item-danger');

    // Build the conditions tooltip
    var conditions = {
        'wind': 'Wind',
        'temperature': 'Temperature',
        'humidity': 'Humidity',
        'internal_temperature': 'Int.&nbsp;Temperature',
        'internal_humidity': 'Int.&nbsp;Humidity',
        'dewpt': 'Dew&nbsp;Point',
        'sun': 'Sun'
    };

    var status_classes = ['', 'text-success', 'text-warning', 'text-danger'];
    var status_labels = ['UNKNOWN', 'SAFE', 'WARNING', 'UNSAFE'];

    var tooltip = '<table style="margin: 5px">';
    for (var c in conditions) {
        if (!(c in data['conditions']))
          continue;

        tooltip += '<tr><td style="text-align: right;">' + conditions[c] + ':</td>';
        tooltip += '<td style="padding: 0 5px; text-align: left" class="' + status_classes[data['conditions'][c]] + '">' + status_labels[data['conditions'][c]] + '</td>';
        tooltip += '</tr>';
    }
    tooltip += '</table>';

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

function opsTarget(row, cell, data) {
  cell.html(data);
  if (!data || !('status' in data)  || !('target_name' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else if (data['status'] == 0) {
    cell.html('N/A');
  } else {
    cell.html(data['target_name']);
  }
}

function opsPointing(row, cell, data) {
  if (!data || !('status' in data)  || !('current_pointing' in data) || !('total_pointings' in data)) {
    cell.html('ERROR');
    cell.addClass('text-danger');
  } else if (data['total_pointings'] == 0 || data['status'] == 0) {
    cell.html('N/A');
  } else {
    cell.html(data['current_pointing'] + ' / ' + data['total_pointings']);
  }
}

function opsStatus(row, cell, data) {
  var status = [
    ['IDLE', ''],
    ['WAITING', 'text-warning'],
    ['SLEWING', 'text-warning'],
    ['OBS. TARGET', 'text-success'],
    ['OBS. REFERENCE', 'text-success'],
    ['OBS. FAILED', 'text-danger'],
  ];

  var s = data in status ? status[data] : status[0];
  cell.html(s[0]);
  cell.addClass(s[1]);
}

function opsTelStatus(row, cell, data) {
  var status = [
    ['UNKNOWN', 'text-danger'],
    ['STOPPED', ''],
    ['SLEWING', 'text-warning'],
    ['TRACKING', 'text-success'],
  ];

  var s = data in status ? status[data] : status[0];
  cell.html(s[0]);
  cell.addClass(s[1]);
}

function opsCamStatus(row, cell, data) {
  var status = [
    ['IDLE', ''],
    ['WAITING', ''],
    ['PREPARING', 'text-warning'],
    ['EXPOSING', 'text-success'],
    ['READING', 'text-warning'],
  ];

  var s = data in status ? status[data] : status[0];
  cell.html(s[0]);
  cell.addClass(s[1]);
}
