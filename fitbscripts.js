	jQuery(document).ready(function(){ 
		
		//Define the ajax handler url
		var dataURL = '/wp-admin/admin-ajax.php';
		
		//Set GuestID and JSToken
		var JSToken = jQuery("#JSToken").val();
		var GuestID = jQuery("#GuestID").val();
		
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
					itemID: itemID,
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


		/*
			initialize fullcalendar object.
			element's id: calendar
		*/
		var itinerarycalendar = $('#fitb_itinerary_calendar').fullCalendar({
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
		editable: true,//Determines whether the events on the calendar can be modified.
		droppable: true,//Determines if jQuery UI draggables can be dropped onto the calendar.
		selectable: true,//Allows a user to highlight multiple days or timeslots by clicking and dragging.
		selectHelper: true,//Whether to draw a "placeholder" event while the user is dragging.
		forceEventDuration: true,//A flag to force calculation of an event's end if it is unspecified.
		defaultTimedEventDuration: '01:00:00',//A fallback duration for timed Event Objects without a specified end value.
		slotDuration: '00:30:00',//The frequency for displaying time slots.
	    events: {//get events from server with jQuery $.ajax options
			url: dataURL,
			type: 'post',
			data: {
				action: 'get_itinerary_events',
				JSToken: JSToken,
				GuestID: GuestID
			},
			error: function(){
				alert('No Data Found');
			}
		},
	    eventRender: function(event, element){
	    	/*
				Add delete button to event
	    	*/
	    	element.append("<span class='closeon'>X</span>");
	    	element.find('.closeon').click(function(e){
	    		e.preventDefault();
	    		var id = event.id;
	        	if (confirm("Are you sure delete?")) {
	        		/*
						Ajax POST request 
						@params action: delete_itinerary_event
								data:
								id: event to view more details
		        	*/
		        	var requestData = {
		        		action: 'delete_itinerary_event',
						EventID: id,
		        	};
		        	ajaxRequest(requestData, function(_response, _flag){
		        		console.log(response);
		        	});
		            itinerarycalendar.fullCalendar('removeEvents' ,id);
		        }
	    	});
	    },
	    /*
			Triggered when user select period of time
	    */
	    select: function( _start, _end, _jsEvent, _view){
	    	var start = moment(_start).format(); 
            var end = moment(_end).format(); 
            var allDay = !_start.hasTime() && !_end.hasTime();
            var title = prompt('Event Title: ');
            if(title != null && title != ''){
            	/*
					Ajax POST request 
					@params action: add_itinerary_event
							data:
							- JSToken(string)
							- GuestID(string)
							- Title(string)
							- Start (DateTime for start of event)
							- End (DateTime for end of event)
							- AllDay (boolean to indicate an all day event, happy to work with any better suggestions)
            	*/
            	var requestData = {
            		action: 'add_itinerary_event',
					JSToken: JSToken,
					GuestID: GuestID,
					Title: title,
					Start: start,
					End: end,
					AllDay: allDay
            	};
            	ajaxRequest(requestData, function(_response, _flag){
            		console.log(_response);
            	});
            	itinerarycalendar.fullCalendar('renderEvent', {
					title: title,
					start: start,
					end: end,
					allDay: allDay
				},false);
            }else{
            	itinerarycalendar.fullCalendar('unselect');
            }    
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
			/*
				Ajax POST request 
				@params action: add_itinerary_event
						data:
						- JSToken(string)
						- GuestID(string)
						- Title(string)
						- Start (DateTime for start of event)
						- End (DateTime for end of event)
						- AllDay (boolean to indicate an all day event, happy to work with any better suggestions)
        	*/
        	var requestData = {
        		action: 'add_itinerary_event',
				JSToken: JSToken,
				GuestID: GuestID,
				Title: copiedEventObject.title,
				Start: start,
				End: end,
				AllDay: false
        	};
        	ajaxRequest(requestData, function(_response, _flag){
        		console.log(_response);
        	});
			// render the event on the calendar
			// the last `true` argument determines if the event "sticks" (http://arshaw.com/fullcalendar/docs/event_rendering/renderEvent/)
			itinerarycalendar.fullCalendar('renderEvent', copiedEventObject, false);			
		},
		/*
			Triggered when dragging stops and the event has moved to a different day/time.
		*/
		eventDrop: function(event, delta, revertFunc) {
	        if (!confirm("Are you sure about this change?")) {
	            revertFunc();
	        }else{
	        	var start = event.start.format();
	        	var end = event.end.format();
	        	var title = event.title;
	        	var id = event.id;
	        	/*
					Ajax POST request 
					@params action: update_itinerary_event
							data:
							- JSToken
							- GuestID
							- EventID
							- Title
							- Start
							- End
	        	*/
	        	var requestData = {
	        		action: 'update_itinerary_event',
					JSToken: JSToken,
					GuestID: GuestID,
					EventID: id,
					Title: title,
					Start: start,
					End: end
	        	};
	        	ajaxRequest(requestData, function(_response, _flag){
	        		console.log(_response);
	        	});
	        }
	    },
	    /*
			Triggered when resizing stops and the event has changed in duration.
	    */
	    eventResize: function(event, delta, revertFunc) {
	        if (!confirm("Do you want to resize this event?")) {
	            revertFunc();
	        } else {
	        	var start = event.start.format();
	        	var end = event.end.format();
	        	var title = event.title;
	        	var id = event.id;
	        	/*
					Ajax POST request 
					@params action: update_itinerary_event
							data:
							- JSToken
							- GuestID
							- EventID
							- Title
							- Start
							- End
	        	*/
	        	var requestData = {
	        		action: 'update_itinerary_event',
					JSToken: JSToken,
					GuestID: GuestID,
					EventID: id,
					Title: title,
					Start: start,
					End: end
	        	};
	        	ajaxRequest(requestData, function(_response, _flag){
	        		console.log(_response);
	        	});
	        }
	    },
	    /*
			Triggered when the user clicks an event.
	    */
	    eventClick: function(calEvent, jsEvent, view) {
	        /*
				Ajax POST request 
				@params action: update_itinerary_event
						data:
						id: event to view more details
        	*/
        	var requestData = {
        		action: 'details_itinerary_event',
				EventID: calEvent.id,
        	};
        	ajaxRequest(requestData, function(_response, _flag){
        		console.log(_response);
        		$('.modal-title').html(calEvent.title);
        		$('.modal-info').html(_response);
        		$('#eventModal').modal();
        	});
		}
	});


	/* initialize the external events
		-----------------------------------------------------------------*/
	
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
	/*
		Triggered when user click event
	*/
	$('#range').on('click', function(){
		/*
			Ajax POST request 
			@params action: get_itinerary_date_range
					data: 
					- JSToken
					- GuestID
					- ItineraryID (I will make this available as per the JSToken and GuestID)
    	*/
    	var ItineraryID = 'xxx';
		var requestData = {
			action: 'get_itinerary_date_range',
			JSToken: JSToken,
			GuestID: GuestID,
			ItineraryID: ItineraryID
		};
		ajaxRequest(requestData, function(_response, _flag){
			var range = JSON.parse(_response);
			itinerarycalendar.fullCalendar('changeView', 'customRange', {
				start: range.start,
				end: range.end
			});
		});
	});
	/*
		Manage to ajax request.
		@param 	_data: request data
				_callback: callback function triggered when receive server response
	*/
	var ajaxRequest = function(_data, _callback){
		$.ajax({
			url: dataURL,
			data: _data,
			type: 'post',
			success: function(response){
				alert(_data.action + ' action has been done successfully');
				_callback(response, 'success');
			},
			error: function(error){
				_callback(error, 'error');
			}
		});
	};	}); 