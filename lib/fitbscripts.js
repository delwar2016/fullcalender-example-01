

$(document).ready(function () {

  var dataURL;
  var JSToken;
  var GuestID;

  // set the data url
  dataURL = '/wp-admin/admin-ajax.php';
  JSToken = jQuery("#JSToken").val();
  GuestID = jQuery("#GuestID").val();

  //Favourites Scripts
  jQuery(document).on('click', '.addfavourite', function (ev) {
    alert(jQuery(this).attr('name') + ' | ' + jQuery("#GuestID").val());

    var ProductID = jQuery(this).attr('product-id');

    $.ajax({
      url: '/wp-admin/admin-ajax.php',
      type: 'post',
      data: {
        action: 'add_favourite',
        JSToken: jQuery("#JSToken").val(),
        GuestID: jQuery("#GuestID").val(),
        ProductID: ProductID
      }
    })
      .fail(function (r, status, jqXHR) {
        alert('failed');
      })
      .done(function (r, status, jqXHR) {
        alert('sent');
      });
    ev.preventDefault();
  });

});

