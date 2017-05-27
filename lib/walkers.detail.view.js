/**
 * Created by sohel on 5/21/17.
 */

window.App.fitb.views.WalkersDetailView = Backbone.View.extend({

  template: _.template(window.App.fitb.Templates().templateDetail),
  templateOtherDetails : _.template(window.App.fitb.Templates().templateOtherDetails),

  id: '',

  className: '',

  events: {
  },

  initialize: function (options) {
    if(!this.options){
      this.options = options;
    }
  },

  render: function () {
    var me = this;
    var JSToken = jQuery("#JSToken").val();
    var GuestID = jQuery("#GuestID").val();

    var data = {
      action: 'fitb_get_product_details',
      JSToken : JSToken,
      GuestID : GuestID,
      ProductID : me.options.ProductID
    };

    window.App.fitb.util.ajaxApiWraper('/wp-admin/admin-ajax.php', data, function (error, JSONData) {
      if(error){
        console.log(error);
      }
      else{
        $('#ProductRow1').slideDown();
        $('#ProductRow2').slideDown();

        $('#ProductImage1 img').attr('src', JSONData.Image);
        $('#ProductInformation1 .et_pb_blurb_container').html(me.template({ product : JSONData}));
        $('#ProductInformation2 .et_pb_blurb_container').html(me.templateOtherDetails({ product : JSONData}));
        $('#map').empty();


          var uluru = {lat: parseFloat( JSONData.Latitude), lng: parseFloat( JSONData.Longitude)};
          var map = new google.maps.Map(document.getElementById('map'), {
            zoom: 4,
            center: uluru
          });
          var marker = new google.maps.Marker({
            position: uluru,
            map: map
          });



        console.log(JSONData)
      }
    });
  }
});