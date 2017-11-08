var data = {};

function colorSeriesLabel(label, series) {
  return '<span style="color: ' + series.color + '">' + label + '</span>';
}

function redrawPlot() {
  if (!data.data)
    return;

  var d = [];
  var plot = $(this);

  var axis = 0;
  if (plot.data('column') == 'right')
    axis = 1;

  var series = plot.data('series');
  var range = [undefined, undefined];
  for (var s in series) {
    var sensor = data.data[series[s]];
    if (sensor) {
      d.push(sensor);
      range[0] = range[0] !== undefined ? Math.min(range[0], sensor['min']) : sensor['min'];
      range[1] = range[1] !== undefined ? Math.max(range[1], sensor['max']) : sensor['max'];
    }
  }

  var regenerateLinkedPlots = function(plot, options) {
    regenerateBindings = true;
    window.setTimeout(function() {
      if (!regenerateBindings)
        return;

      var plots = {};
      var getPlot = function(id) { return plots[id]; };

      $('.weather-plot').each(function() { plots[$(this).attr('id')] = $(this).data('plot'); });

      // Link the plot hover together only after all plots have been created
      for (var key in plots) {
        var plot = plots[key];
        var linkedPlots = plot.getPlaceholder().data('linkedplots');
        if (linkedPlots !== undefined)
          plot.getOptions().linkedplots = linkedPlots.map(getPlot);
      };

      regenerateBindings = false;
    });
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
    legend: { noColumns: 6, units: plot.data('labelunits'), backgroundColor: '#252830', backgroundOpacity: 0.5, margin: 1, labelFormatter: colorSeriesLabel },
    linkedplots: [],
    hooks: { bindEvents: bindHoverHooks, processOptions: regenerateLinkedPlots }
  };

  if (plot.data('ydecimals') !== undefined)
    options.yaxis.tickDecimals = plot.data('ydecimals');

  if (plot.data('labelfudge') !== undefined)
    options.yaxis.labelFudge = plot.data('labelfudge');

  if (plot.data('min') !== undefined)
    options.yaxis.min = plot.data('min');

  if (plot.data('max'))
    options.yaxis.max = plot.data('max');
  else
    options.yaxis.max = range[0] + 1.5 * (range[1] - range[0]);

  if (axis == 1)
    options.yaxis.position = 'right';

  if (plot.data('hidetime') === undefined) {
    options.xaxis.timeformat = '%H:%M';
    options.xaxis.axisLabel = 'UTC Time';
  }

  return $.plot(this, d, options);
}

function setHoverXPosition(plot, offsetX) {
  var axes = plot.getAxes();
  var offset = plot.getPlotOffset();
  var dataset = plot.getData();
  var options = plot.getOptions();
  var legend = plot.getPlaceholder().find('.legendLabel :first-child');

  var start = axes.xaxis.p2c(axes.xaxis.min);
  var end = axes.xaxis.p2c(axes.xaxis.max);
  var fractionalPos = (offsetX - offset.left) / (end - start);

  if (fractionalPos < 0 || fractionalPos > 1) {
    // Clear labels
    for (var i = 0; i < dataset.length; i++)
      $(legend.eq(i)).html(dataset[i].label);

    // Clear crosshair
    plot.setCrosshair();
    return;
  }

  var x = axes.xaxis.min + (axes.xaxis.max - axes.xaxis.min) * fractionalPos;
  plot.setCrosshair({ x: x });
  for (var i = 0; i < dataset.length; i++) {
    var series = dataset[i];

    var j = 0;
    for (; j < series.data.length; j++)
      if (series.data[j] !== null && series.data[j][0] < x)
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
}

function bindHoverHooks(plot, eventHolder) {
  var axes = plot.getAxes();
  var offset = plot.getPlotOffset();
  var dataset = plot.getData();
  var options = plot.getOptions();
  var start = axes.xaxis.p2c(axes.xaxis.min);
  var end = axes.xaxis.p2c(axes.xaxis.max);

  var linkedPlots = [];
  eventHolder.mousemove(function(e) {
    setHoverXPosition(plot, e.offsetX);
    for (var i = 0; i < options.linkedplots.length; i++)
        setHoverXPosition(options.linkedplots[i], e.offsetX);
  });

  eventHolder.mouseout(function(e) {
    setHoverXPosition(plot, -1);
    for (var i = 0; i < options.linkedplots.length; i++)
        setHoverXPosition(options.linkedplots[i], -1);
  });
}

function redrawWindPlot() {
  var plot = $(this);
  var speeds = [data.data.vwindspeed, data.data.gwindspeed, data.data.swwindspeed];

  var getMaxSpeed = function(a,b) {
    if (a === null && b === null)
      return 0;
    else if (a === null)
      return b;
    else if (b === null)
      return a;

    return Math.max(a, b[1]);
  };

  var maxVaisala = data.data.vwindspeed.data.reduce(getMaxSpeed, 0);
  var maxSWASP = data.data.swwindspeed.data.reduce(getMaxSpeed, 0);
  var maxGOTO = data.data.gwindspeed.data.reduce(getMaxSpeed, 0);
  var maxRadius = 1.1 * Math.max(maxVaisala, maxSWASP, maxGOTO, 15 / 1.1);

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
    $('#wind-plot').append('<div style="left:' + (labelHCenter - 17) + 'px;top:' + (offset.top - 1) + 'px;" class="wind-labels axisLabels">N</div>');
    $('#wind-plot').append('<div style="left:' + (offset.left + labelPlotWidth - 17) + 'px;top:' + (labelVCenter - 17) + 'px;" class="wind-labels axisLabels">E</div>');
    $('#wind-plot').append('<div style="left:' + (labelHCenter - 17) + 'px;top:' + (offset.top + labelPlotHeight - 17) + 'px;" class="wind-labels axisLabels">S</div>');
    $('#wind-plot').append('<div style="left:' + offset.left + 'px;top:' + (labelVCenter - 17) + 'px;" class="wind-labels axisLabels">W</div>');

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
        if (speed.data[j] === null)
          continue;

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

  var axis = 0;
  if (plot.data('column') == 'right')
    axis = 1;

  var options = {
    lines: { show: false },
    xaxis: { min: -1, max: 1, tickLength: 0, axisLabel: '&nbsp;', axisLabelPadding: 0, ticks: [] },
    yaxis: { min: -1, max: 1, tickLength: 0,  axisLabel: 'Wind (km/h)', axisLabelPadding: 29, ticks: [] },
    legend: { noColumns: 0, backgroundColor: '#252830', backgroundOpacity: 0.5, margin: 1, labelFormatter: colorSeriesLabel },
    grid: { margin: { left: axis == 0 ? 0 : 15, top: 0, right: axis == 1 ? 0 : 15, bottom: 0}, hoverable: true, autoHighlight: false },
    points: { show: false },
    hooks: { draw: [drawPoints] },
  };

  if (axis == 1)
    options.yaxis.position = 'right';

  $.plot(this, [data.data.vwinddir, data.data.gwinddir, data.data.swwinddir], options);
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
        $('#headerdesc').text('Archived data from ' + dateString);
      else
        $('#headerdesc').text('Live data (updates every 30 seconds)');
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
    var redraw = $(this).attr('id') == 'wind-plot' ? redrawWindPlot : redrawPlot;
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
        window.setTimeout(function() { plot.each(redraw) }, 0);
    };

    $(this).resize(onResize);
    onResize();
  });

  var picker = $('#datepicker');
  var setDataSource = function() {
    // e.date is in local time, but we need UTC - fetch it directly from the picker.
    dateString = picker.data('datepicker').getFormattedDate('yyyy-mm-dd');
    queryData();
  }

  picker.datepicker().on('changeDate', setDataSource);

  var incrementDate = function(increment) {
    if (dateString) {
      var date = new Date(dateString)
      date.setUTCDate(date.getUTCDate() + increment);
      picker.datepicker('setUTCDate', date);
    } else {
      // Change from Live to today
      picker.datepicker('update', new Date().toISOString().substr(0, 10));
    }

    setDataSource();
  }

  $('#prev-date').click(function() { incrementDate(-1); });
  $('#next-date').click(function() { incrementDate(+1); });

  init = false;
  setDataSource();
};

