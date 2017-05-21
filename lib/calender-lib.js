/**
 * Created by delwar on 5/21/17.
 */

var calenderElement;
var availabilityData;

var calenderInit = function (element, options) {

  availabilityData = options.data;
  var config = {
      header: {
        center: 'agendaWeek, customRange'
      },
      defaultView: 'agendaWeek',
      views: {
        customRange: {
          type: 'agenda',
          buttonText: 'customRange'
        }
      },
      displayEventEnd: true,
      defaultDate: moment().format('YYYY-MM-DD'),
      selectable: true,
      editable: true,
      eventLimit: true, // allow "more" link when too many events
      events: availabilityData
    } || options.config;

  //set the events if exists
  if (options.listeners) {
    _.each(options.listeners, function (listener, key) {
      config[key] = listener;
    });
  }
  //initialize the calender
  element.fullCalendar(config);
  calenderElement = element;
};

var calenderUpdateEvent = function () {
  calenderElement.fullCalendar('removeEvents');
  calenderElement.fullCalendar('addEventSource', availabilityData);
  calenderElement.fullCalendar('rerenderEvents');
};

var calenderUpdateEventNineDays = function (dateFrom, dateTo) {

  var fromDate = moment(dateFrom);
  var toDate = moment(dateTo).add(1, 'days');

  calenderElement.fullCalendar('removeEvents');

  calenderElement.fullCalendar('changeView', 'customRange',{
    start: fromDate.format('YYYY-MM-DD'),
    end: toDate.format('YYYY-MM-DD')
  });
  calenderElement.fullCalendar('addEventSource', availabilityData);
  calenderElement.fullCalendar('refetchEvents');
};

var calenderAddEvent = function (start, end, jsEvent, view) {


  $('#event-name').val('');
  $('#btnAddEvent').unbind('click');
  $('#btnAddEvent').on('click', function (e) {

    var newEvent = {
      id: new Date().getTime() + '',
      date: start.format('YYYY-MM-DD'),
      start_time: moment(start).format('HH:mm:ss'),
      end_time: moment(end).format('HH:mm:ss'),
      title: $('#event-name').val(),
      start: moment(start).format('YYYY-MM-DD') + 'T' + moment(start).format('HH:mm:ss'),
      end: moment(end).format('YYYY-MM-DD') + 'T' + moment(end).format('HH:mm:ss')
    };
    if (!availabilityData) {
      availabilityData = [];
    }
    availabilityData.push(newEvent);
    calenderUpdateEvent();
    $("#add-event-dialog").dialog("close");
  });
  $('#btnCancelAddEvent').unbind('click');
  $('#btnCancelAddEvent').on('click', function (e) {
    $("#add-event-dialog").dialog("close");

  });

  $("#add-event-dialog").dialog({
    open: function (event, ui) {

      $('#start-time').timepicker({showCloseButton: true, showOn: 'button'});
      $('#end-time').timepicker({showCloseButton: true, showOn: 'button'});
      $('#start-time').timepicker('setTime',moment(start).format('HH:mm'));
      $('#end-time').timepicker('setTime',moment(end).format('HH:mm'));

    }
  });
};

var calenderEditEvent = function (calEvent, jsEvent, view) {
  var tmpEvent = _.find(availabilityData, function (a) {
    return a.id === calEvent.id;
  });

  $('#event-name').val(tmpEvent.title);
  $('#btnAddEvent').unbind('click');
  $('#btnAddEvent').on('click', function (e) {


    tmpEvent.start_time = $('#start-time').val() + ":00";
    tmpEvent.end_time = $('#end-time').val()+ ":00";
    tmpEvent.title = $('#event-name').val();
    tmpEvent.start = moment(tmpEvent.date).format('YYYY-MM-DD') + 'T' + tmpEvent.start_time;
    tmpEvent.end = moment(tmpEvent.date).format('YYYY-MM-DD') + 'T' + tmpEvent.end_time;

    calenderUpdateEvent();
    $("#add-event-dialog").dialog("close");
  });
  $('#btnCancelAddEvent').unbind('click');
  $('#btnCancelAddEvent').on('click', function (e) {
    $("#add-event-dialog").dialog("close");

  });

  $('#event-name').focus();
  $("#add-event-dialog").dialog({
    open: function (event, ui) {
      $('#start-time').timepicker({showCloseButton: true, showOn: 'button'});
      $('#end-time').timepicker({showCloseButton: true, showOn: 'button'});
      $('#start-time').timepicker('setTime', tmpEvent.start_time);
      $('#end-time').timepicker('setTime', tmpEvent.end_time);

    }
  });
};


