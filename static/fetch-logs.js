var lastLogMessageId = 0;
function updateLog(messages) {
  if (messages) {
    var length = messages.length;
    for (var i in messages) {
      var message = messages[length - i - 1];
      var row = $('<tr>');
      if (message[2] == 'warning')
         row.addClass('text-warning');
      if (message[2] == 'error')
         row.addClass('text-danger');
      row.append($('<td class="log-date pe-2">').html(formatUTCDate(parseUTCDate(message[1]+'.0')) + '<span class="d-xl-none">' + message[3] + '</span>'));
      row.append($('<td class="log-table d-none d-xl-table-cell pe-2">').html(message[3]));
      row.append($('<td class="log-message text-wrap">').html(message[4]));
      $('#log-table').prepend(row);
      lastLogMessageId = message[0];
    }

    // Remove excess rows as new messages arrive
    var tbody = $('#log-table tbody');
    while (tbody.children().length > 250)
        tbody.children().last().remove();
  } else {
    $('#log-table').children().remove();
    var row = $('<tr>');
    row.append($('<td>').html('Error querying log'));
    row.addClass('text-danger');
    $('#log-table').prepend(row);
    lastLogMessageId = 0;
  }
}

function pollLog(logURL) {
    var localURL = logURL;
    if (lastLogMessageId > 0)
      localURL += '?from=' + lastLogMessageId;

   $.ajax({
      type: 'GET',
      dataType: 'json',
      url: localURL,
    }).done(function(data) {
       updateLog(data['messages']);
    });

  window.setTimeout(function() { pollLog(logURL); }, 10000);
}
