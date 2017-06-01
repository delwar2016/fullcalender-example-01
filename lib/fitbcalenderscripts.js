/**
 * Created by delwar on 5/21/17.
 */

var calenderElement;
var dataURL;
var JSToken;
var GuestID;
var ItineraryID;
var customDateFrom;
var customDateTo;
var allowedList = ['HIRE', 'TRANSPORT', 'ACCOMM'];
var availabilityData = [];

$(document).ready(function () {

  $('body').append(getDocumentHelper);
  $('body').append(getDocumentHelperForWarning);

  // set the data url
  dataURL = '/wp-admin/admin-ajax.php';
  JSToken = jQuery("#JSToken").val();
  GuestID = jQuery("#GuestID").val();
  ItineraryID = $('input[name=ItineraryID]').attr('value');

  // no need to execute the bellow code if no calender element found
  if($('#fitb_itinerary_calendar').length <= 0) return;


  //Favourites Scripts for dragging the product
  $('#itinerary-favourites .event_favourite').each(function () {

    // create an Event Object (http://arshaw.com/fullcalendar/docs/event_data/Event_Object/)
    // it doesn't need to have a start or end
    var eventObject = {
      title: $.trim($(this).attr('product-name')), // use the element's text as the event title
      "product-name":$.trim($(this).attr('product-name')),
      "product-id":$.trim($(this).attr('product-id')),
      "product-type" : $.trim($(this).attr('product-type')),
      duration: '05:00:00'
    };

    //check whether the product is in allowed list
    var productType = $.trim($(this).attr('product-type'));
    if(allowedList.indexOf(productType)>=0){
      //get the duration here and updated
      //eventObject.duration = customDateTo - customDateFrom;
    }

    // store the Event Object in the DOM element so we can get to it later
    $(this).data('eventObject', eventObject);
    // make the event draggable using jQuery UI
    $(this).draggable({
      zIndex: 999,
      revert: true,      // will cause the event to go back to its
      revertDuration: 0  //  original position after the drag
    });

  });

  // for dropping the product to categories
  $( "#itinerary-gettinghere" ).droppable({
    tolerance: 'pointer',
    drop: function( event, ui ) {
      var originalEventObject = ui.helper.data('eventObject');

      if(allowedList.indexOf(originalEventObject['product-type'])<0){
        showWarningDialog();
        return false;
      }
      else{
        // we need to copy it, so that multiple events don't have a reference to the same object
        var copiedEventObject = $.extend({}, originalEventObject);
        addDropEvent(copiedEventObject, copiedEventObject['product-type']);
      }
    }
  });

  $( "#itinerary-gettingaround" ).droppable({
    tolerance: 'pointer',
    drop: function( event, ui ) {
      var originalEventObject = ui.helper.data('eventObject');
      if(allowedList.indexOf(originalEventObject['product-type'])<0){
        showWarningDialog();
        return false;
      }
      else{
        // we need to copy it, so that multiple events don't have a reference to the same object
        var copiedEventObject = $.extend({}, originalEventObject);
        addDropEvent(copiedEventObject, copiedEventObject['product-type']);
      }

    }
  });

  $( "#itinerary-stay" ).droppable({
    tolerance: 'pointer',
    drop: function( event, ui ) {
      var originalEventObject = ui.helper.data('eventObject');
      if(allowedList.indexOf(originalEventObject['product-type'])<0){
        showWarningDialog();
        return false;
      }
      else{
        // we need to copy it, so that multiple events don't have a reference to the same object
        var copiedEventObject = $.extend({}, originalEventObject);
        addDropEvent(copiedEventObject, copiedEventObject['product-type']);
      }
    }
  });

  // initialize full-calendar
  populateCustomViewTImePeriod(function(err, dateRange){

    var dateFrom = moment().add(-1, 'days').format('YYYY-MM-DD');
    var dateTo = moment().add(6, 'days').format('YYYY-MM-DD');
    if(!err && dateRange && dateRange.Start){
      dateFrom = moment(dateRange.Start).format('YYYY-MM-DD');
      dateTo = moment(dateRange.End).add(1, 'days').format('YYYY-MM-DD');
    }
    customDateFrom = dateFrom;
    customDateTo = dateTo;
    calenderInit($('#fitb_itinerary_calendar'), dateFrom, dateTo);
  });

});

var validationEventAdd = function(paramEvent){

  var checkEvent = _.find(availabilityData, function(ad){
    return ad.ProductID === paramEvent["product-id"];
  });

  if(checkEvent){
    return true; // add ready added this product
  }

  return false ; // no problem to add event
};

var addDropEvent = function(paramEvent, paramProductType){

  if(validationEventAdd(paramEvent)) return;

  var newEvent = {
    Title: paramEvent.title,
    action: 'add_itinerary_event',
    JSToken: JSToken,
    ItineraryID: ItineraryID,
    ProductID: paramEvent["product-id"],
    GuestID: GuestID,
    Type: paramProductType
  };

    if(allowedList.indexOf(paramProductType) !== -1){
      newEvent.Start = moment(customDateFrom).format('YYYY-MM-DD') + 'T' + moment(customDateFrom).format('HH:mm:ss');
      newEvent.End = moment(customDateTo).format('YYYY-MM-DD') + 'T' + moment(customDateTo).format('HH:mm:ss');
      newEvent.AllDay = true;
    }else{
      newEvent.Start = moment(paramEvent.start).format('YYYY-MM-DD') + 'T' + moment(paramEvent.start).format('HH:mm:ss');
      newEvent.End = moment(paramEvent.end).format('YYYY-MM-DD') + 'T' + moment(paramEvent.end).format('HH:mm:ss');
      newEvent.AllDay = false;
    }


  ajaxRequest(dataURL, newEvent, function (err, response) {
    if (!err) {
      paramEvent.id= response.event_id;
      var event = {
        title: newEvent.Title,
        start: newEvent.Start,
        end: newEvent.End,
        allDay: newEvent.AllDay,
        ProductID: newEvent.ProductID,
        type: newEvent.Type,
        id: response.event_id
      };
      availabilityData.push(event);
      calenderElement.fullCalendar('renderEvent', event,false);

      if(paramProductType === "HIRE"){
        renderHireEvent(paramEvent);
      }
      if(paramProductType === "TRANSPORT"){
        renderTransportEvent(paramEvent);
      }
      if(paramProductType === "ACCOMM"){
        renderAccommodationEvent(paramEvent);
      }
    }
  });
};

var renderHireEvent = function(paramEvent){
  if($('#' + 'event-id-' + paramEvent.id).length ===0){
    $( "#itinerary-gettingaround .droplet-padding").append('<li class="ui-state-default ui-sortable-handle" id="event-id-'+ paramEvent.id +'" >' + paramEvent.title + '</li>');
  }

};

var renderTransportEvent = function(paramEvent){
  if($('#' + 'event-id-' + paramEvent.id).length ===0){
    $( "#itinerary-gettinghere .droplet-padding" ).append('<li class="ui-state-default ui-sortable-handle" id="event-id-'+ paramEvent.id +'">' + paramEvent.title + '</li>');
  }
};

var renderAccommodationEvent = function(paramEvent){
  if($('#' + 'event-id-' + paramEvent.id).length ===0) {
    $("#itinerary-stay .droplet-padding").append('<li class="ui-state-default ui-sortable-handle" id="event-id-' + paramEvent.id + '">' + paramEvent.title + '</li>');
  }
};

var getDocumentHelper = function () {
  var htmlData = '<div style="display: none" id="add-event-dialog"> ' +
    '<h3>Event</h3>' +
    '<div><label>Start time</label> <input id="start-time"  readonly style="width: 88px;margin-right: 10px;"></div>' +
    '<br>' +
    '<div><label>End time</label> <input id="end-time"   readonly  style="width: 88px;margin-right: 10px;"></div>' +
    '<br>' +
    '<div><label>Event Name</label> <input id="event-name"  placeholder="Enter Event Name" ></div>' +
    '<br>' +
    '<button type="button" id="btnAddEvent" style=" width: 43%;margin-left: 10px;">Save</button>' +
    '<button type="button" id="btnCancelAddEvent" style=" width: 43%;margin-left: 10px;">Cancel</button>' +
    '</div>';

  return htmlData;

};

var getDocumentHelperForWarning = function () {
  var htmlData = '<div style="display: none" id="event-warning-dialog"> ' +
    '<h4>You can not drop the selected event!<h4/>' +
      '<p>Please choose calendar instead to drop events which are not Flights, Accommodation  or Car hire</p>' +
    '</div>';

  return htmlData;

};

var calenderInit = function (element, paramDateFrom, paramDateTo) {

  var config = {
    header: {
      center: 'customRange, agendaWeek, month'
    },
    defaultView: 'customRange',
    views: {
      customRange: {
        type: 'agenda',
        buttonText: 'My Trip',
        "visibleRange": {
          "start": paramDateFrom,
          "end": paramDateTo
        }
      }
    },
    displayEventEnd: true,
    defaultDate: moment().format('YYYY-MM-DD'),
    selectable: true,
    editable: true,
    eventLimit: true, // allow "more" link when too many events
    droppable: true,
    timezone: 'local',
    events: function (start, end, timezone, callback) {
      var paramData = {
        action: 'get_itinerary_events',
        JSToken: JSToken,
        GuestID: GuestID,
        ItineraryID: ItineraryID,
        start: moment(start).format('YYYY-MM-DD'),
        end: moment(end).format('YYYY-MM-DD')
      };
      ajaxRequest(dataURL, paramData, function (err, responses) {
        if (!err) {
          var tmpEvents = responses;
          if (_.isArray(tmpEvents)) {
            availabilityData = _.uniq(tmpEvents, 'id');
            loadExternalEvents(availabilityData);
            callback(availabilityData);
          } else {
            callback([]);
          }

        } else {
          callback([]);
        }
      });
    },
    select: function (star, end, jsEvent, view) {
      calenderAddEvent(star, end, jsEvent, view);

    },
    eventDrop: function (event, delta, revertFunc) {
      updateEvent(event);

    },
    eventResize: function (event, delta, revertFunc) {
      updateEvent(event);
    },
    eventRender: function (event, element, view) {
      if (view.name == 'listDay') {
        element.find(".fc-list-item-time").prepend('<span class="closeon" style="float: right">X</span>');
      } else {
        element.find(".fc-content").prepend('<span class="closeon" style="float: right">X</span>');
      }
      element.find(".closeon").on('click', function () {

        deleteEvent(event, function (err) {
          if (!err) {
            calenderElement.fullCalendar('removeEvents', event.id);
          }
        });

      });
    },
    eventClick: function (calEvent, jsEvent, view) {
      if(jsEvent.target.className !== 'closeon'){
        calenderEditEvent(calEvent, jsEvent, view);
      }
    },
    /*
     Triggered when something is dropped
     */
    drop: function (date) {
      // retrieve the dropped element's stored Event Object
      var originalEventObject = $(this).data('eventObject');
      // we need to copy it, so that multiple events don't have a reference to the same object
      var copiedEventObject = $.extend({}, originalEventObject);

      copiedEventObject.start = date;
      // HERE I force the end date based on the start date + duration
      var duration = moment.duration(copiedEventObject.duration);
      copiedEventObject.end = moment(date).add(duration);


      addDropEvent(copiedEventObject, copiedEventObject['product-type']);

    }
  };

  //initialize the calender
  element.fullCalendar(config);
  calenderElement = element;
};

var loadExternalEvents = function(paramEvents){
  var allowedList = ['HIRE', 'TRANSPORT', 'ACCOMM'];
  var hireEvents = _.filter(paramEvents, function(event){
    return event.type === 'HIRE';
  });

  _.each(hireEvents, function(event){
    renderHireEvent(event);
  });

  var transportEvents = _.filter(paramEvents, function(event){
    return event.type === 'TRANSPORT';
  });
  _.each(transportEvents, function(event){
    renderTransportEvent(event);
  });
  var accommodationEvents = _.filter(paramEvents, function(event){
    return event.type === 'ACCOMM';
  });

  _.each(accommodationEvents, function(event){
    renderAccommodationEvent(event);
  });
};


var calenderAddEvent = function (start, end, jsEvent, view) {


  $('#event-name').val('');
  $('#btnAddEvent').unbind('click');
  $('#btnAddEvent').on('click', function (e) {
    if($('#event-name').val().trim() === ''){
      alert('Enter Event name');
      return;
    }
    var newEvent = {
      date: start.format('YYYY-MM-DD'),
      Title: $('#event-name').val(),
      Start: moment(start).format('YYYY-MM-DD') + 'T' + moment(start).format('HH:mm:ss'),
      End: moment(end).format('YYYY-MM-DD') + 'T' + moment(end).format('HH:mm:ss'),
      AllDay: false,
      action: 'add_itinerary_event',
      JSToken: JSToken,
      ItineraryID: ItineraryID,
      GuestID: GuestID
    };

    ajaxRequest(dataURL, newEvent, function (err, response) {
      if (!err) {
        calenderElement.fullCalendar('renderEvent', {
          title: newEvent.Title,
          start: newEvent.Start,
          end: newEvent.End,
          allDay: newEvent.AllDay,
          id: response.event_id
        },false);

        $("#add-event-dialog").dialog("close");
      }
    });
  });
  $('#btnCancelAddEvent').unbind('click');
  $('#btnCancelAddEvent').on('click', function (e) {
    $("#add-event-dialog").dialog("close");
  });

  $("#add-event-dialog").dialog({
    width: 550,
    height: 400,
    resizable: false,
    draggable: false,
    modal: true,
    my: "center",
    at: "center",
    of: window,
    open: function (event, ui) {
      $('#start-time').timepicker({showCloseButton: true, showOn: 'button'});
      $('#end-time').timepicker({showCloseButton: true, showOn: 'button'});
      $('#start-time').timepicker('setTime', moment(start).format('HH:mm'));
      $('#end-time').timepicker('setTime', moment(end).format('HH:mm'));
    }
  });
};

var calenderEditEvent = function (calEvent, jsEvent, view) {

  var tmpEvent = calEvent;
  $('#event-name').val(tmpEvent.title);
  $('#btnAddEvent').unbind('click');
  $('#btnAddEvent').on('click', function (e) {
    if($('#event-name').val().trim() === ''){
      alert('Enter Event name');
      return;
    }
    var start_time = $('#start-time').val() + ":00";
    var end_time = $('#end-time').val() + ":00";
    tmpEvent.title = $('#event-name').val();
    tmpEvent.start = moment(tmpEvent.start).format('YYYY-MM-DD') + 'T' + start_time;
    tmpEvent.end = moment(tmpEvent.end).format('YYYY-MM-DD') + 'T' + end_time;

    updateEvent(tmpEvent, function (err) {
      if (!err) {
        calenderElement.fullCalendar('removeEvents', tmpEvent.id);

        calenderElement.fullCalendar('renderEvent', {
          title: tmpEvent.title,
          start: tmpEvent.start,
          end: tmpEvent.end,
          allDay: tmpEvent.allDay,
          id: tmpEvent.id
        },false);

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
    width: 550,
    height: 400,
    resizable: false,
    draggable: false,
    modal: true,
    my: "center",
    at: "center",
    of: window,
    open: function (event, ui) {
      $('#start-time').timepicker({showCloseButton: true, showOn: 'button'});
      $('#end-time').timepicker({showCloseButton: true, showOn: 'button'});
      $('#start-time').timepicker('setTime', moment(tmpEvent.start).format('HH:mm'));
      $('#end-time').timepicker('setTime', moment(tmpEvent.end).format('HH:mm'));

    }
  });
};

var updateEvent = function (paramEvent, paramCallBack) {
  var tmpParam = {};
  tmpParam.action = 'update_itinerary_event';
  tmpParam.JSToken = JSToken;
  tmpParam.GuestID = GuestID;
  tmpParam.ItineraryID = ItineraryID;
  tmpParam.EventID = paramEvent.id;
  tmpParam.AllDay = false;
  tmpParam.Start = paramEvent.start;
  tmpParam.End = paramEvent.end;
  tmpParam.Title = paramEvent.title;
  ajaxRequest(dataURL, tmpParam, function (err, response) {
    if (!err) {
      var event = _.find(availabilityData, function(ad){
        return ad.id === paramEvent.id;
      });
      event.start = paramEvent.start;
      event.end = paramEvent.end;
      event.title = paramEvent.title;

      if (paramCallBack) {
        paramCallBack();
      }

    }
    else {
      if (paramCallBack) {
        paramCallBack(err);
      }
    }
  });
};

var deleteEvent = function (paramEvent, paramCallBack) {
  var tmpParam = {};
  tmpParam.action = 'delete_itinerary_event';
  tmpParam.JSToken = JSToken;
  tmpParam.GuestID = GuestID;
  tmpParam.ItineraryID = ItineraryID;
  tmpParam.EventID = paramEvent.id;
  ajaxRequest(dataURL, tmpParam, function (err, response) {
    if (!err) {
      $('#' + "event-id-" + paramEvent.id).remove();
      availabilityData = _.filter(availabilityData, function(ad){
        return ad.id === paramEvent.id;
      });
      paramCallBack();
    }
    else {
      paramCallBack(err);
    }
  });
};

var populateCustomViewTImePeriod = function (paramCallBack) {
  var requestData = {
    action: 'get_itinerary_dates',
    JSToken: JSToken,
    GuestID: GuestID,
    ItineraryID: ItineraryID
  };
  ajaxRequest(dataURL, requestData, function (err, response) {
    if (!err) {
      var range = response;
      paramCallBack(null, range);
    }else{
      if (paramCallBack) {
        paramCallBack(err);
      }
    }

  });
};

var ajaxRequest = function (paramURL, paramData, paramCallBack) {
  $.ajax({
    url: paramURL,
    data: paramData,
    type: 'post',
    success: function (response) {
      if (paramCallBack) {
        paramCallBack(null, JSON.parse(response));
      }
    },
    error: function (error) {
      if (paramCallBack) {
        paramCallBack(error, 'error');
      }

    }
  });
};

var showWarningDialog = function () {
  $("#event-warning-dialog").dialog({
    title: 'Warning!',
    autoOpen : true,
    width: 400,
    height: 300,
    resizable: false,
    draggable: false,
    modal: true,
    my: "center",
    at: "center",
    of: window,
    open: function (event, ui) {
    },
    close: function () {
      $("#event-warning-dialog").dialog('destroy');
    }
  });
};
