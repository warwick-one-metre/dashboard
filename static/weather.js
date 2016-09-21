var data = {};
function redrawPlot() {
  if (!data.data)
    return;

  var d = [];
  var plot = $(this);

  var axis = 0;
  if (plot.data('column') == 'right')
    axis = 1;

  var series = plot.data('series');
  for (var s in series) {
    var sensor = data.data[series[s]];
    if (sensor)
      d.push(sensor);
  }

  var options = {
    lines: { show: true, lineWidth: 1 },
    points: { show: false },
    series: { shadowSize: 0 },
    axisLabels: { show: true },
    xaxis: { mode: 'time', minTickSize: [1, 'minute'], timeformat:'', min: data.start, max: data.end },
    grid: { margin: { left: axis == 0 ? 0 : 15, top: 0, right: axis == 1 ? 0 : 15, bottom: 0}, hoverable: true, autoHighlight: false },
    crosshair: { mode: "x", color: '#545454' },
    yaxis: { axisLabel: plot.data('axislabel'), axisLabelPadding: 9, labelWidth: 20 },
    legend: { container: $('#'+plot.data('labelcontainer')), noColumns: 4, labelBoxBorderColor: '#545454', units: plot.data('labelunits') },
    hooks: { bindEvents: bindHoverHooks }
  };

  if (plot.data('labelfudge') !== undefined)
    options.yaxis.labelFudge = plot.data('labelfudge');

  if (plot.data('min') !== undefined)
    options.yaxis.min = plot.data('min');

  if (plot.data('max'))
    options.yaxis.max = plot.data('max');

  if (axis == 1)
    options.yaxis.position = 'right';

  if (plot.data('hidetime') === undefined) {
    options.xaxis.timeformat = '%H:%M';
    options.xaxis.axisLabel = 'UTC Time';
  }

  $.plot(this, d, options);
}

function bindHoverHooks(plot, eventHolder) {
  var axes = plot.getAxes();
  var offset = plot.getPlotOffset();
  var dataset = plot.getData();
  var options = plot.getOptions();
  var legend = options.legend.container.find('.legendLabel');

  var start = axes.xaxis.p2c(axes.xaxis.min);
  var end = axes.xaxis.p2c(axes.xaxis.max);
  var recacheLegend = false;

  eventHolder.resize(function(e) {
    // Resizing wipes out the labels, so we need to recache this
    recacheLegend = true;
  });

  eventHolder.mouseout(function(e) {
    for (var i = 0; i < dataset.length; ++i) {
      var series = dataset[i];
      $(legend.eq(i)).html(dataset[i].label);
    }
  });

  eventHolder.mousemove(function(e) {
    var fractionalPos = (e.offsetX - offset.left) / (end - start);
    if (fractionalPos < 0 || fractionalPos > 1)
      return;

    if (recacheLegend) {
      recacheLegend = false;
      legend = options.legend.container.find('.legendLabel');
    }

    var x = axes.xaxis.min + (axes.xaxis.max - axes.xaxis.min) * fractionalPos;
    for (var i = 0; i < dataset.length; i++) {
      var series = dataset[i];

      var j = 0;
      for (; j < series.data.length; j++)
        if (series.data[j][0] < x)
          break;

      var p1 = series.data[j - 1];
      var p2 = series.data[j];

      if (p1 != null && p2 != null) {
        var y = (p1[1] + (p2[1] - p1[1]) * (x - p1[0]) / (p2[0] - p1[0])).toFixed(2);
        $(legend.eq(i)).text(y + options.legend.units);
      }
      else
        $(legend.eq(i)).html(dataset[i].label);
    }
  });
}

function redrawWindPlot() {
  var plot = $(this);
  var speeds = [data.data.vwindspeed, data.data.swwindspeed];

  var getMaxSpeed = function(a,b) { return Math.max(a, b[1]); };
  var maxVaisala = data.data.vwindspeed.data.reduce(getMaxSpeed, 0);
  var maxSWASP = data.data.vwindspeed.data.reduce(getMaxSpeed, 0);
  var maxRadius = 1.1 * Math.max(maxVaisala, maxSWASP, 15 / 1.1);

  function drawPoints(plot, ctx) {
    var axes = plot.getAxes();
    var offset = plot.getPlotOffset();

    // Clip to plot area to prevent overdraw
    var plotWidth = ctx.canvas.width - offset.right - offset.left;
    var plotHeight = ctx.canvas.height - offset.top - offset.bottom;
    var yScale = 1 / maxRadius;
    var xScale = yScale * plotHeight / plotWidth;

    ctx.save();
    ctx.rect(offset.left, offset.top, plot.width(), plot.height());
    ctx.clip();

    // Background axes
    var dl = offset.left + axes.xaxis.p2c(-maxRadius * xScale);
    var dt = offset.top + axes.yaxis.p2c(maxRadius * yScale);
    var dr = offset.left + axes.xaxis.p2c(maxRadius * xScale);
    var db = offset.top + axes.yaxis.p2c(-maxRadius * yScale);

    var hCenter = offset.left + axes.xaxis.p2c(0);
    var vCenter = offset.top + axes.yaxis.p2c(0);

    ctx.strokeStyle = '#545454';

    ctx.beginPath();
    ctx.moveTo(offset.left, vCenter);
    ctx.lineTo(offset.left + plotWidth, vCenter);
    ctx.moveTo(hCenter, offset.top);
    ctx.lineTo(hCenter, offset.top + plotHeight);
    ctx.stroke();

    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.moveTo(dl, dt);
    ctx.lineTo(dr, db);
    ctx.moveTo(dr, dt);
    ctx.lineTo(dl, db);
    ctx.stroke();

    // Background radial curves and tick labels
    $('#wind-plot .wind-labels').remove();
    for (var r = 0; r < maxRadius * 1.414 * plotWidth / plotHeight; r += 10) {
      var cr = axes.yaxis.p2c(-yScale * r) - axes.yaxis.p2c(0);

      if (r > 0) {
        ctx.beginPath();
        ctx.arc(hCenter, vCenter, cr, 0, 2 * Math.PI, true);
        ctx.stroke();
      }

      if (r * xScale < 0.975) {
        var label = r == 0 ? '&nbsp;&nbsp;&nbsp;' + r: r;
        var o = plot.pointOffset({ x: r * xScale, y: 0});
        $('#wind-plot').append('<div style="position:absolute;left:' + (o.left - 10) + 'px;top:' + o.top + 'px;font-size:smaller;width:20px" class="wind-labels axisLabels">' + label + '</div>');
        if (r > 0) {
          o = plot.pointOffset({ x: -r * xScale, y: 0});
          $('#wind-plot').append('<div style="position:absolute;left:' + (o.left - 10) + 'px;top:' + o.top + 'px;font-size:smaller;width:20px" class="wind-labels axisLabels">' + label + '</div>');
        }
      }
    }

    // Background compass indicators
    var labelHCenter = offset.left + plot.width() / 2;
    var labelVCenter = offset.top + plot.height() / 2;
    var labelPlotWidth = plot.width();
    var labelPlotHeight = plot.height();
    $('#wind-plot').append('<div style="left:' + (labelHCenter - 10) + 'px;top:' + (offset.top - 20) + 'px;" class="wind-labels axisLabels">N</div>');
    $('#wind-plot').append('<div style="left:' + (offset.left + labelPlotWidth) + 'px;top:' + (labelVCenter - 9) + 'px;" class="wind-labels axisLabels">E</div>');
    $('#wind-plot').append('<div style="left:' + (labelHCenter - 10) + 'px;top:' + (offset.top + labelPlotHeight + 5) + 'px;" class="wind-labels axisLabels">S</div>');
    $('#wind-plot').append('<div style="left:' + (offset.left - 20) + 'px;top:' + (labelVCenter - 9) + 'px;" class="wind-labels axisLabels">W</div>');

    // Historical data is drawn with constant opacity
    // This will be adjusted per-point if we are drawing live data
    ctx.globalAlpha = 0.4;

    // Data points
    var series = plot.getData();
    for (var i = 0; i < series.length; i++) {
      var dir = series[i];
      var speed = speeds[i];
      var r = series[i].points.radius;
      ctx.fillStyle = series[i].color;

      for (var j = dir.data.length - 1; j >= 0; j--) {
        var dy = speed.data[j][1] * Math.cos(dir.data[j][1] * Math.PI / 180);
        var dx = speed.data[j][1] * Math.sin(dir.data[j][1] * Math.PI / 180);
        var x = offset.left + axes.xaxis.p2c(xScale * dx);
        var y = offset.top + axes.yaxis.p2c(yScale * dy);

        // Opacity scales from full at 0 age to 1 at 1 hour, then stays constant
        if (!dateString)
            ctx.globalAlpha = Math.min(Math.max(0.1, 1 - (data.end - dir.data[j][0]) / 3600000), 1);

        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI, true);
        ctx.fill();
      }
    }

    // Add a border around the most recent point
    ctx.globalAlpha = 1.0;

    if (!dateString) {
      ctx.strokeStyle = '#fff';
      for (var i = 0; i < series.length; i++) {
        if (!speed.data[0])
          continue;

        var dir = series[i];
        var speed = speeds[i];
        var dy = speed.data[0][1] * Math.cos(dir.data[0][1] * Math.PI / 180);
        var dx = speed.data[0][1] * Math.sin(dir.data[0][1] * Math.PI / 180);
        var x = offset.left + axes.xaxis.p2c(xScale * dx);
        var y = offset.top + axes.yaxis.p2c(yScale * dy);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI, true);
        ctx.stroke();
      }
    }

    // HACK: restoring the context appears to invert the clipping area for the last drawing operation,
    // so we create a throwaway empty path to make sure our actual drawing is not affected
    ctx.beginPath();
    ctx.closePath();
    ctx.restore();
  };

  var options = {
    lines: { show: false },
    xaxis: { min: -1, max: 1, tickLength: 0, axisLabel: '&nbsp;', axisLabelPadding: 19, ticks: [] },
    yaxis: { min: -1, max: 1, tickLength: 0,  axisLabel: 'Wind (km/h)', axisLabelPadding: 29, ticks: [] },
    legend: { container: $('#'+plot.data('labelcontainer')), noColumns: 0, labelBoxBorderColor: '#545454'},
    grid: { margin: { left: 0, top: 0, right: 15, bottom: 0} },
    points: { show: false },
    hooks: { draw: [drawPoints] },
  };

  $.plot(this, [data.data.vwinddir, data.data.swwinddir], options);
}

var queryUpdate;
var dateString = null;

function queryData() {
  // Clear a queued refresh if this was triggered manually
  if (queryUpdate)
    window.clearTimeout(queryUpdate);

  var url = dataURL;
  if (dateString)
    url += '?date=' + dateString;

  $('#headerdesc').text('Loading...');
  $.ajax({
    url: url,
    type: 'GET',
    dataType: 'json',
    success: function(json) {
      data = json;
      $('.weather-plot').each(redrawPlot);
      $('.wind-plot').each(redrawWindPlot);

      if (dateString)
        $('#headerdesc').text('Weather archive for ' + dateString);
      else
        $('#headerdesc').text('Live weather data (updates every 30 seconds)');
    }
  });

  // Refresh live data every 30 seconds
  if (!dateString)
    queryUpdate = window.setTimeout(queryData, 30000);
}

function setup() {
  var init = true;

  // Automatically switch label side based on column layout
  $('.weather-plot').each(function() {
    var plot = $(this);
    var sensor = $(this).data('sidesensor');
    if (!sensor)
      return;

    var onResize = function() {
      var float = $('#'+sensor).css('float');
      var updated = false;
      if (float == 'none' && plot.data('column') != 'left') {
        plot.data('column', 'left');
        updated = true;
      }
      else if (float == 'left' && plot.data('column') != 'right') {
        plot.data('column', 'right');
        updated = true;
      }

      if (updated && !init)
        window.setTimeout(function() { plot.each(redrawPlot) }, 0);
    };

    $(this).resize(onResize);
    onResize();
  });

  var picker = $('#datepicker');
  var setDataSource = function() {
    // e.date is in local time, but we need UTC - fetch it directly from the picker.
    var date = picker.datepicker('getUTCDate');
    if (date) {
        var month = date.getMonth() + 1;
        if (month < 10)
            month = '0' + month;

        var day = date.getDate();
        if (day < 10)
            day = '0' + day;
        dateString = date.getFullYear() + '-' + month + '-' + day;
    }
    else
      dateString = null;

    queryData();
  }

  picker.datepicker().on('changeDate', setDataSource);

  init = false;
  setDataSource();
};

