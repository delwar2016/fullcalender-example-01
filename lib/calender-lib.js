/**
 * Created by delwar on 5/21/17.
 */

var calenderElement;
var availabilityData;
var dataURL;
var JSToken;
var GuestID;
$(document).ready(function () {

  $('body').append(getDocumentHelper);
  // set the data url
  dataURL = 'http://dev.fitb.buziit.com.au/wp-admin/admin-ajax.php';
  JSToken = jQuery("#JSToken").val();
  GuestID = jQuery("#GuestID").val();

  //Favourites Scripts
  jQuery(document).on('click', '.addfavourite', function(ev){
    alert(jQuery(this).attr('name') + ' | ' + jQuery("#GuestID").val());

    var itemID = jQuery(this).attr('name');

    $.ajax({
      url: '/wp-admin/admin-ajax.php',
      type: 'post',
      data : {
        action: 'add_favourite',
        JSToken: jQuery("#JSToken").val(),
        GuestID: jQuery("#GuestID").val(),
        itemID: itemID
      }
    })
      .fail(function(r, status, jqXHR) {
        alert('failed');
      })
      .done(function(r, status, jqXHR){
        alert('sent');
      });
    ev.preventDefault();
  });

  $('#external-events .fc-event').each(function() {

    // create an Event Object (http://arshaw.com/fullcalendar/docs/event_data/Event_Object/)
    // it doesn't need to have a start or end
    var eventObject = {
      title: $.trim($(this).text()), // use the element's text as the event title
      duration: '05:00:00'
    };

    // store the Event Object in the DOM element so we can get to it later
    $(this).data('eventObject', eventObject);
    // make the event draggable using jQuery UI
    $(this).draggable({
      zIndex: 999,
      revert: true,      // will cause the event to go back to its
      revertDuration: 0  //  original position after the drag
    });

  });

  // initialize full-calendar
  calenderInit($('#fitb_itinerary_calendar'));
  populateCustomViewTImePeriod();
  populateEvent();

});

var getDocumentHelper = function(){
  var htmlData = '<div style="display: none" id="add-event-dialog"> ' +
    '<h1>Event</h1>' +
    '<div><label>Start time</label> <input id="start-time"  readonly style="width: 55px;"></div>' +
    '<br>' +
    '<div><label>End time</label> <input id="end-time"   readonly  style="width: 55px;"></div>' +
    '<br>' +
    '<div><label>Event Name</label> <input id="event-name"  ></div>' +
    '<br>' +
    '<button type="button" id="btnAddEvent">Save</button>' +
    '<button type="button" id="btnCancelAddEvent">Cancel</button>' +
    '</div>' ;

  return htmlData;

};

var populateEvent = function(){
  // populate Calender event from server
  var paramData = {
    action: 'get_itinerary_events',
    JSToken: JSToken,
    GuestID: GuestID
  };

  var startDate = moment(calenderElement.fullCalendar('getView').start._d).format('YYYY-MM-DD');
  var endDate = moment(calenderElement.fullCalendar('getView').end._d).format('YYYY-MM-DD');
  paramData.start = startDate;
  paramData.end = endDate;
  ajaxRequest(dataURL, paramData, function (err, response) {
    if (!err) {
      //initialize event
      availabilityData = response;
      // then load the event into calender
      calenderUpdateEvent();
    }
  });
};

var calenderInit = function (element) {

  var calendarObj = {
    availabilityData: [
      {
        title: 'All Day Event',
        start: moment().format('YYYY-MM-DD')
      }
    ],
    listeners: {
      select: function (star, end, jsEvent, view) {
        calenderAddEvent(star, end, jsEvent, view);

      },
      eventDrop: function (event, delta, revertFunc) {
        var tmpEvent = _.find(availabilityData, function (a) {
          return a.id === event.id;
        });
        tmpEvent.date = moment(event.start).format('YYYY-MM-DD');
        tmpEvent.start_time = moment(event.start).format('HH:mm:ss');
        tmpEvent.end_time = moment(event.end).format('HH:mm:ss');
        tmpEvent.start = moment(event.start).format('YYYY-MM-DD') + 'T' + moment(event.start).format('HH:mm:ss');
        tmpEvent.end = moment(event.end).format('YYYY-MM-DD') + 'T' + moment(event.end).format('HH:mm:ss');

        updateEvent(tmpEvent);

      },
      eventResize: function (event, delta, revertFunc) {
        var tmpEvent = _.find(availabilityData, function (a) {
          return a.id === event.id;
        });
        tmpEvent.date = moment(event.start).format('YYYY-MM-DD');
        tmpEvent.start_time = moment(event.start).format('HH:mm:ss');
        tmpEvent.end_time = moment(event.end).format('HH:mm:ss');
        tmpEvent.start = moment(event.start).format('YYYY-MM-DD') + 'T' + moment(event.start).format('HH:mm:ss');
        tmpEvent.end = moment(event.end).format('YYYY-MM-DD') + 'T' + moment(event.end).format('HH:mm:ss');
        updateEvent(tmpEvent);
      },
      eventRender: function (event, element, view) {
        if (view.name == 'listDay') {
          element.find(".fc-list-item-time").prepend('<span class="closeon" style="float: right">X</span>');
        } else {
          element.find(".fc-content").prepend('<span class="closeon" style="float: right">X</span>');
        }
        element.find(".closeon").on('click', function () {

          deleteEvent(event, function(err){
            if(!err){
              // filter event without delete event then re-render calender
              availabilityData = _.filter(availabilityData, function (a) {
                return a.id !== event.id;
              });
              calenderUpdateEvent();
            }
          });

        });
      },
      eventClick: function (calEvent, jsEvent, view) {
        calenderEditEvent(calEvent, jsEvent, view);
      },
      /*
       Triggered when something is dropped
       */
      drop: function(date) {
        // retrieve the dropped element's stored Event Object
        var originalEventObject = $(this).data('eventObject');
        // we need to copy it, so that multiple events don't have a reference to the same object
        var copiedEventObject = $.extend({}, originalEventObject);
// assign it the date that was reported
        copiedEventObject.start = date;
        // HERE I force the end date based on the start date + duration
        var duration = moment.duration(copiedEventObject.duration);
        copiedEventObject.end = moment(date).add(duration);
        var start = moment(copiedEventObject.start).format();
        var end = moment(copiedEventObject.end).format();
        var requestData = {
          action: 'add_itinerary_event',
          JSToken: JSToken,
          GuestID: GuestID,
          Title: copiedEventObject.title,
          Start: start,
          End: end,
          AllDay: false
        };
        ajaxRequest(dataURL, requestData, function (err, response) {
          if(!err){
            populateEvent();
          }
        });
      }
    }
  };
  var options = calendarObj;
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
  //
  //calenderElement.fullCalendar('removeEvents');

  calenderElement.fullCalendar('changeView', 'customRange', {
    start: fromDate.format('YYYY-MM-DD'),
    end: toDate.format('YYYY-MM-DD')
  });
  //calenderElement.fullCalendar('addEventSource', availabilityData);
  //calenderElement.fullCalendar('refetchEvents');
};



var calenderAddEvent = function (start, end, jsEvent, view) {


  $('#event-name').val('');
  $('#btnAddEvent').unbind('click');
  $('#btnAddEvent').on('click', function (e) {

    var newEvent = {
      date: start.format('YYYY-MM-DD'),
      start_time: moment(start).format('HH:mm:ss'),
      end_time: moment(end).format('HH:mm:ss'),
      title: $('#event-name').val(),
      start: moment(start).format('YYYY-MM-DD') + 'T' + moment(start).format('HH:mm:ss'),
      end: moment(end).format('YYYY-MM-DD') + 'T' + moment(end).format('HH:mm:ss'),
      action: 'add_itinerary_event',
      JSToken: JSToken,
      GuestID: GuestID
    };

    ajaxRequest(dataURL, newEvent, function (err, response) {
      if(!err){
        populateEvent();
        $("#add-event-dialog").dialog("close");
      }
    });
  });
  $('#btnCancelAddEvent').unbind('click');
  $('#btnCancelAddEvent').on('click', function (e) {
    $("#add-event-dialog").dialog("close");
  });

  $("#add-event-dialog").dialog({
    open: function (event, ui) {
      $('#start-time').timepicker({showCloseButton: true, showOn: 'button'});
      $('#end-time').timepicker({showCloseButton: true, showOn: 'button'});
      $('#start-time').timepicker('setTime', moment(start).format('HH:mm'));
      $('#end-time').timepicker('setTime', moment(end).format('HH:mm'));
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
    tmpEvent.end_time = $('#end-time').val() + ":00";
    tmpEvent.title = $('#event-name').val();
    tmpEvent.start = moment(tmpEvent.date).format('YYYY-MM-DD') + 'T' + tmpEvent.start_time;
    tmpEvent.end = moment(tmpEvent.date).format('YYYY-MM-DD') + 'T' + tmpEvent.end_time;

    updateEvent(tmpEvent, function(err){
      if(!err){
        populateEvent();
        $("#add-event-dialog").dialog("close");
      }
    });

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

var updateEvent = function (paramEvent, paramCallBack) {
  paramEvent.action = 'update_itinerary_event';
  paramEvent.JSToken = JSToken;
  paramEvent.GuestID = GuestID;
  ajaxRequest(dataURL, paramEvent, function (err, response) {
    if(!err){
      paramCallBack();
    }
    else{
      paramCallBack(err);
    }
  });
};

var deleteEvent = function(paramEvent, paramCallBack){
  paramEvent.action = 'delete_itinerary_event';
  paramEvent.JSToken = JSToken;
  paramEvent.GuestID = GuestID;
  paramEvent.EventID = paramEvent.id;
  ajaxRequest(dataURL, paramEvent, function (err, response) {
    if(!err){
      paramCallBack();
    }
    else{
      paramCallBack(err);
    }
  });
};

var populateCustomViewTImePeriod = function(){
  var ItineraryID = 'xxx';
  var requestData = {
    action: 'get_itinerary_date_range',
    JSToken: JSToken,
    GuestID: GuestID,
    ItineraryID: ItineraryID
  };
  ajaxRequest(dataURL,requestData, function(err, response){
    if(!err){
      var range = JSON.parse(response);
      calenderElement.fullCalendar('changeView', 'customRange', {
        start: range.start,
        end: range.end
      });
    }
  });
};

var ajaxRequest = function (paramURL, paramData, paramCallBack) {
  $.ajax({
    url: paramURL,
    data: paramData,
    type: 'post',
    success: function (response) {
      if(paramCallBack){
        paramCallBack(null, response);
      }

    },
    error: function (error) {
      if(paramCallBack){
        paramCallBack(error, 'error');
      }

    }
  });
};
