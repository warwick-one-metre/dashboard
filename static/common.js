function updateListGroup(prefix, fields, data) {
  for (var key in fields) {
    var row = $('#'+prefix+'-'+key);
    row.children('span.pull-right').remove();
    row.attr('class', 'list-group-item');
    var value = $('<span class="pull-right">');
    var valueDisplay = fields[key](data);

    if (valueDisplay.length > 0)
      value.html(valueDisplay[0]);
    if (valueDisplay.length > 1)
      value.addClass(valueDisplay[1])
    if (valueDisplay.length > 2)
      row.addClass(valueDisplay[2])
    row.append(value)
  }
}

function sexagesimal(angle) {
  negative = angle < 0
  angle = Math.abs(angle)

  degrees = Math.floor(angle)
  angle = (angle - degrees) * 60
  minutes = Math.floor(angle)
  seconds = ((angle - minutes) * 60).toFixed(1)

  if (degrees < 10)
    degress = '0' + degrees
  if (minutes < 10)
    minutes = '0' + minutes
  if (seconds < 10)
    seconds = '0' + seconds

  if (negative)
    degrees = '-' + degrees

  return degrees + ':' + minutes + ':' + seconds
}

function parseUTCDate(str) {
  var d = str.match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+).(\d+)/);
  while (d[7] > 1000)
    d[7] /= 10;

  var utc = Date.UTC(d[1], d[2] - 1, d[3], d[4], d[5], d[6], d[7]);
  return new Date(utc);
}

function formatUTCDate(date) {
  var d = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(),
    date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()];

  for (i = 0; i < d.length; i++)
    if (d[i] < 10)
      d[i] = '0' + d[i];

  return d[0] + '-' + d[1] + '-' + d[2] + ' ' + d[3] + ':' + d[4] + ':' + d[5];
}
