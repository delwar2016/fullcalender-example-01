<?PHP

	/*
	Plugin Name: FITB Booking Portal API Plugin
	Description: This plugin connects to the FITB Booking Portal to display data from its API and to allow bookings and itinerary plans to be fed back through to the API.
	Version: Dev 1
	Author: Matthew Presland - Buzi IT Pty Ltd
	Author URI: https://buziit.com.au
	*/

	//Wordpress does not enable sessions by default. Start session if one does not already exist.
	//Check if plugin is required (not required for admin pages)
	if(!is_admin()){
		add_action('init', 'set_session', 1);		
	}

	//Function to initialise session, also performs basic guest tracking functions
	function set_session(){
		if(!session_id()){
			session_start();
		}
		
		//Guest ID Server
		//If a guest id has not been set, we will generate a random temporary guest id
		if(!isset($_SESSION['GuestID'])){
			$_SESSION['GuestID'] = 'temp'.mt_rand();
		}
		
		//Set up javascript nonce token
		$_SESSION['JSToken'] = 'js'.mt_rand().'js'.mt_rand();
		echo '<input type="hidden" id="JSToken" value="'.$_SESSION['JSToken'].'" />';		
		
	}
	
	//Check if plugin is required to run, not required in admin pages
	if(!is_admin() OR wp_doing_ajax()){
		$FITBPortal = new FITBPortal();
	
		//Include Required Files
		include('settings.php');
		include('vendor/autoload.php');
		include('includes/password.php');
		define( 'BUZI_FITB_PATH', plugins_url().'/fitbbookingportal/' );
	}
	
	class FITBPortal {
		
		/**************************************
		
		Configuration/Settings
		
		**************************************/
	
		private $API;
		private $ATDWAPI;
		
		public function __construct(){
			$this->registerShortcodes();
		}
		
		private function setAPI(){
			if(!isset($this->API)){
				$this->API = new FITBApi();
			}
			return true;
		}

		//Function returns whether or not the Guest ID currently set is a temporary or registered guest
		public static function guestHasAccount(){
			if(substr($_SESSION['GuestID'], 0, 4) === "temp"){
				return false;
			} else{
				return true;
			}
		}
		
		private function registerShortcodes(){
			// Set up plugin environment
			add_action('wp_enqueue_scripts', array($this,'addZebraCSS'));
			add_action('wp_enqueue_scripts', array($this,'addZebraJS'));
			add_action('wp_enqueue_scripts', array($this, 'addCalendar'));
			add_action('wp_enqueue_scripts', array($this, 'addFITBScripts'));
      add_action('wp_enqueue_scripts', array($this, 'addFrontendScripts'));
			
			//Portal Shortcodes
			add_shortcode('fitb_guest_login_status', array($this, 'loginStatus'));
			add_shortcode('fitb_guest_signup', array($this, 'guestSignup'));

			//ATDW Shortcodes
			add_shortcode('fitb_all_accomm', array($this, 'listAllAccommodation'));
			
			//Page Features
			add_shortcode('fitb_walks_content', array($this, 'getWalksContent'));
			add_shortcode('fitb_wildlife_content', array($this, 'getWildlifeContent'));
			add_shortcode('fitb_adventure_content', array($this, 'getAdventureContent'));
			add_shortcode('fitb_retail_content', array($this, 'getRetailContent'));
			add_shortcode('fitb_refresh_content', array($this, 'getRefreshContent'));
			add_shortcode('fitb_galleries_content', array($this, 'getGalleriesContent'));
			add_shortcode('fitb_birds_content', array($this, 'getBirdsContent'));
			add_shortcode('fitb_history_content', array($this, 'getHistoryContent'));
			add_shortcode('fitb_tours_content', array($this, 'getToursContent'));
			add_shortcode('fitb_scenic_content', array($this, 'getScenicContent'));
			add_shortcode('fitb_agencies_content', array($this, 'getAgenciesContent'));
			add_shortcode('fitb_drives_content', array($this, 'getDrivesContent'));
			add_shortcode('fitb_boats_content', array($this, 'getBoatsContent'));
			add_shortcode('fitb_gettinghere_content', array($this, 'getGettingHereContent'));
			add_shortcode('fitb_gettingaround_content', array($this, 'getGettingAroundContent'));
			add_shortcode('fitb_houses_content', array($this, 'getHousesContent'));
			add_shortcode('fitb_cottages_content', array($this, 'getCottagesContent'));
			add_shortcode('fitb_hotels_content', array($this, 'getHotelsContent'));
			add_shortcode('fitb_hosted_content', array($this, 'getHostedContent'));
			add_shortcode('fitb_camping_content', array($this, 'getCampingContent'));
			add_shortcode('fitb_eateries_content', array($this, 'getEateriesContent'));
			add_shortcode('fitb_events_content', array($this, 'getEventsContent'));
			
			//Itinerary Features
			add_shortcode('fitb_itinerary_create', array($this, 'createItinerary'));
			add_shortcode('fitb_itinerary_list', array($this, 'guestItineraries'));
			add_shortcode('fitb_itinerary_details', array($this, 'itineraryDetails'));
			
			add_shortcode('fitb_itinerary_trip_categories', array($this, 'itineraryTripCategories'));
			
			add_shortcode('fitb_itinerary_status', array($this, 'itineraryStatus'));
			
			add_shortcode('fitb_itinerary_favourites', array($this, 'guestFavourites'));
			add_shortcode('fitb_itinerary_favourites_expanded', array($this, 'guestFavouritesExpanded'));
			
			//Calendar Features
			add_shortcode('fitb_itinerary_calendar', array($this, 'itineraryCalendar'));
			
			add_shortcode('fitb_test_modify_event', array($this, 'testModifyEvent'));
			
			//Register AJAX Handlers
			
			//Add Favourite
			add_action('wp_ajax_add_favourite', array($this, 'addFavourite'));
			add_action('wp_ajax_nopriv_add_favourite', array($this, 'addFavourite'));
			
			//Itinerary Calendar AJAX Handlers
			add_action('wp_ajax_get_itinerary_events', array($this, 'get_itinerary_events'));
			add_action('wp_ajax_nopriv_get_itinerary_events', array($this, 'get_itinerary_events'));
			
			add_action('wp_ajax_add_itinerary_event', array($this, 'add_itinerary_event'));
			add_action('wp_ajax_nopriv_add_itinerary_event', array($this, 'add_itinerary_event'));
			
			add_action('wp_ajax_update_itinerary_event', array($this, 'update_itinerary_event'));
			add_action('wp_ajax_nopriv_update_itinerary_event', array($this, 'update_itinerary_event'));
			
			add_action('wp_ajax_delete_itinerary_event', array($this, 'delete_itinerary_event'));
			add_action('wp_ajax_nopriv_delete_itinerary_event', array($this, 'delete_itinerary_event'));
			
			add_action('wp_ajax_details_itinerary_event', array($this, 'details_itinerary_event'));
			add_action('wp_ajax_nopriv_details_itinerary_event', array($this, 'details_itinerary_event'));
			
			add_action('wp_ajax_get_itinerary_dates', array($this, 'get_itinerary_dates'));
			add_action('wp_ajax_nopriv_get_itinerary_dates', array($this, 'get_itinerary_dates'));
			
			//Third-Party Content AJAX Handlers
			add_action('wp_ajax_fitb_get_product_list', array($this, 'get_atdw_product_list'));
			add_action('wp_ajax_nopriv_fitb_get_product_list', array($this, 'get_atdw_product_list'));
			
			add_action('wp_ajax_fitb_get_product_details', array($this, 'get_atdw_product_details'));
			add_action('wp_ajax_nopriv_fitb_get_product_details', array($this, 'get_atdw_product_details'));
			
			//AJAX Tester Shortcodes
			add_shortcode('fitb_atdw_ajax_test', array($this, 'testATDWAJAX'));
			add_shortcode('fitb_atdw_event_test', array($this, 'testEventFeed'));
		}
		
		public function addFITBScripts(){
      wp_register_script('fitb_favourites_jquery' ,  BUZI_FITB_PATH.'includes/fitbscripts.js', '', '', true);
			wp_enqueue_script('fitb_favourites_jquery');
		}

    public function addCalendar(){
      wp_enqueue_style('fitb_calendar_css', BUZI_FITB_PATH.'includes/fullcalendar/dist/fullcalendar.min.css');
      wp_enqueue_style('fitb_time_picker_css', BUZI_FITB_PATH.'includes/jquery-ui-timepicker/jquery.ui.timepicker.css');
      wp_enqueue_style('fitb_calendar_jquery_ui_css', BUZI_FITB_PATH.'includes/jquery-ui/themes/ui-lightness/jquery-ui.min.css');

      wp_enqueue_script('fitb_calendar_jquery_ui', BUZI_FITB_PATH.'includes/jquery-ui/jquery-ui.min.js');
      wp_enqueue_script('fitb_calendar_moment', BUZI_FITB_PATH.'includes/moment/moment.js');
      wp_enqueue_script('fitb_time_picker_js', BUZI_FITB_PATH.'includes/jquery-ui-timepicker/jquery.ui.timepicker.js');
      wp_enqueue_script('fitb_calendar_js', BUZI_FITB_PATH.'includes/fullcalendar/dist/fullcalendar.min.js');
      wp_enqueue_script('fitb_calendar_ui_front', BUZI_FITB_PATH.'includes/fitbcalenderscripts.js');
    }
    /**
     * function to load  front end scripts
     */
    public function addFrontendScripts(){
      wp_enqueue_style('fitb_style_css', BUZI_FITB_PATH.'includes/style.css');
      wp_enqueue_script('fitb_underscore', includes_url() . 'js/underscore.min.js');
      wp_enqueue_script('fitb_backbone', includes_url() . 'js/backbone.min.js');
      //pnotify
      wp_enqueue_script('fitb_pnotify_js', BUZI_FITB_PATH.'includes/pnotify/pnotify.custom.min.js');
      wp_enqueue_style('fitb_pnotify_css', BUZI_FITB_PATH.'includes/pnotify/pnotify.custom.min.css');


      wp_register_script('fitb_front_end_main', BUZI_FITB_PATH . 'includes/front-end/main.js', '', '', false);
      wp_register_script('fitb_front_end_walkers_view', BUZI_FITB_PATH . 'includes/front-end/walkers.view.js', '', '', false);
      wp_register_script('fitb_front_end_walkers_detail_view', BUZI_FITB_PATH . 'includes/front-end/walkers.detail.view.js', '', '', false);
      wp_register_script('fitb_front_end_retail_view', BUZI_FITB_PATH . 'includes/front-end/retail.view.js', '', '', false);
      wp_register_script('fitb_front_end_retail_detail_view', BUZI_FITB_PATH . 'includes/front-end/retail.detail.view.js', '', '', false);
      wp_register_script('fitb_front_end_tours_view', BUZI_FITB_PATH . 'includes/front-end/tours.view.js', '', '', false);
      wp_register_script('fitb_front_end_tours_detail_view', BUZI_FITB_PATH . 'includes/front-end/tours.detail.view.js', '', '', false);
      wp_register_script('fitb_front_end_drives_view', BUZI_FITB_PATH . 'includes/front-end/drives.view.js', '', '', false);
      wp_register_script('fitb_front_end_drives_detail_view', BUZI_FITB_PATH . 'includes/front-end/drives.detail.view.js', '', '', false);
      wp_register_script('fitb_front_end_agencies_view', BUZI_FITB_PATH . 'includes/front-end/agencies.view.js', '', '', false);
      wp_register_script('fitb_front_end_agencies_detail_view', BUZI_FITB_PATH . 'includes/front-end/agencies.detail.view.js', '', '', false);
      wp_register_script('fitb_front_end_boats_view', BUZI_FITB_PATH . 'includes/front-end/boats.view.js', '', '', false);
      wp_register_script('fitb_front_end_boats_detail_view', BUZI_FITB_PATH . 'includes/front-end/boats.detail.view.js', '', '', false);
      wp_register_script('fitb_front_end_house_view', BUZI_FITB_PATH . 'includes/front-end/house.view.js', '', '', false);
      wp_register_script('fitb_front_end_house_detail_view', BUZI_FITB_PATH . 'includes/front-end/house.detail.view.js', '', '', false);

      wp_register_script('fitb_front_end_common_view', BUZI_FITB_PATH . 'includes/front-end/common.view.js', '', '', false);
      wp_register_script('fitb_front_end_common_detail_view', BUZI_FITB_PATH . 'includes/front-end/common.detail.view.js', '', '', false);

      wp_register_script('fitb_google_maps' ,  'http://maps.googleapis.com/maps/api/js?key=AIzaSyDxmLrsPKy4XSwh86EQolnyh1xEUzutbfg', '', '3.28', true);



      wp_enqueue_script('fitb_front_end_main');
      wp_enqueue_script('fitb_front_end_walkers_view');
      wp_enqueue_script('fitb_front_end_walkers_detail_view');
      wp_enqueue_script('fitb_front_end_retail_view');
      wp_enqueue_script('fitb_front_end_retail_detail_view');
      wp_enqueue_script('fitb_front_end_tours_view');
      wp_enqueue_script('fitb_front_end_tours_detail_view');
      wp_enqueue_script('fitb_front_end_agencies_view');
      wp_enqueue_script('fitb_front_end_agencies_detail_view');
      wp_enqueue_script('fitb_front_end_drives_view');
      wp_enqueue_script('fitb_front_end_drives_detail_view');
      wp_enqueue_script('fitb_front_end_boats_view');
      wp_enqueue_script('fitb_front_end_boats_detail_view');

      wp_enqueue_script('fitb_front_end_house_view');
      wp_enqueue_script('fitb_front_end_house_detail_view');

      wp_enqueue_script('fitb_front_end_common_view');
      wp_enqueue_script('fitb_front_end_common_detail_view');

      wp_enqueue_script('fitb_fitb_utils', BUZI_FITB_PATH.'includes/front-end/utils.js');
      wp_enqueue_script('fitb_google_maps');


    }
		
		public function addZebraJS(){
			wp_enqueue_script('zebra_form_jquery', 'http://ajax.googleapis.com/ajax/libs/jquery/2.0.2/jquery.min.js');
			wp_enqueue_script('zebra_form', BUZI_FITB_PATH.'vendor/stefangabos/zebra_form/public/javascript/zebra_form.js');
		}
		
		public function addZebraCSS(){
			wp_enqueue_style('zebra_form_css', BUZI_FITB_PATH.'vendor/stefangabos/zebra_form/public/css/zebra_form.css' );
		}
		
		/**************************************
		
		ATDW Listing Endpoints
		
		**************************************/
		
		private function getATDWDataController(){
			return new ATDWDataController();
		}
		
		public function get_atdw_product_list(){
			$Controller = $this->getATDWDataController();
			$Result = $Controller->getProductList();
			echo $Result;
			exit;
		}
		
		public function get_atdw_product_details(){
			$Controller = $this->getATDWDataController();
			$Result = $Controller->getProductDetails();
			echo $Result;
			exit;
		}
		
		public function testATDWAJAX(){
			$Params = '?action=atdw_get_product_list&JSToken=test&Type=walks';
			$QueryURL = '/wp-admin/admin-ajax.php'.$Params;
			$Resource = new BuziCurl($QueryURL);
			
			try {
				$Response = $Resource->getResponse();
				
				return $Response;
			} catch (\RuntimeException $Error){
				echo 'Error: '.$Error->getCode().'. '.$Error->getMessage();
				return false;
			}
		}
		
		public function testEventFeed(){
			$Controller = $this->getATDWDataController();
			$IDs = $Controller->getEvents();
			$html = '<table>';
			foreach($IDs AS $ID){
				$html .= '<tr><td>'.$ID.'</td></tr>';
			}
			$html .= '</table>';
			return $html;
		}
		
		/**************************************
		
		Page Features
		
		**************************************/
		
		public function itineraryCalendar(){
			//Check $_GET for ItineraryID
			if(isset($_REQUEST['ItineraryID'])){
				$_SESSION['ItineraryID'] = filter_var($_REQUEST['ItineraryID'], FILTER_SANITIZE_STRING);
			}
			
			//Check $_GET for NewItinerary
			if(isset($_REQUEST['NewItinerary'])){
				unset($_SESSION['ItineraryID']);
			}
			
			
			if(!isset($_SESSION['ItineraryID'])){
				//If itineraryID not set, create/select itinerary.
				$html = $this->guestItineraries();
				$html .= $this->createItinerary();
			}
			
			//Check if $_SESSION['ItineraryID'] has been set
			if(isset($_SESSION['ItineraryID'])){
				//If ItineraryID Set, show calendar.
				
				//Set Itinerary Key for JS
				echo '<input type="hidden" name="ItineraryID" value="'.$_SESSION['ItineraryID'].'">';
				
				$html = $this->itineraryTripCategories();
        $html .= '<div id="fitb_itinerary_calendar" style="margin-top: 20px"></div>';
			}
						
			return $html;
		}
		
		public function testModifyEvent(){
			$this->setAPI();
			$Result = $this->API->testModifyEvent();
			return $Result;
		}
		
		/**************************************
		
		Itinerary Calendar AJAX Handlers
		
		**************************************/
		
		public function get_itinerary_events(){
			$this->setAPI();
			$Result = $this->API->getItineraryEvents();
			echo $Result;
			exit;
		}
		
		public function add_itinerary_event(){
			$this->setAPI();
			$Result = $this->API->addItineraryEvent();
			echo $Result;
			exit;	
		}
		
		public function update_itinerary_event(){
			$this->setAPI();
			$Result = $this->API->updateItineraryEvent();
			echo $Result;
			exit;
		}
		
		public function delete_itinerary_event(){
			$this->setAPI();
			$Result = $this->API->deleteItineraryEvent();
			echo $Result;
			exit;
		}
		
		public function details_itinerary_event(){
			$this->setAPI();
			$Result = $this->API->detailsItineraryEvent();
			echo $Result;
			exit;
		}
		
		public function get_itinerary_dates(){
			$this->setAPI();
			$Result = $this->API->getItineraryDates();
			echo $Result;
			exit;
		}
		
		/**************************************
		
		Guest Handling Features
		
		**************************************/
		
		public function loginStatus(){
			//Set up API Connection
			$this->setAPI();
			
			//If GuestID is a Member ID, load guest details
			if(self::guestHasAccount()){
				//Load Guest Details
				$this->loadGuestDetails();
				$html = $this->welcomeMessage();
			} else{
				//if GuestID is a temporary account, show/handle login form
				$LoginForm = $this->API->getGuestLoginForm();
				
				//if login form is valid, process login form and load guest details
				if($LoginForm->validate()){
					$this->API->processGuestLoginForm($LoginForm);
					if(self::guestHasAccount()){
						$this->loadGuestDetails();
						$html = $this->welcomeMessage();
					}
				} else{
					//else show login form, and set guest account settings
					$this->loadGuestDetails();
					$html = $this->welcomeMessage();
					$html .= '<hr /><p>Login or create an account to save and find your favourite activities and accommodation, trip plans and bookings.</p>';
					$html .= '<p><b>Login</b> | <a href="/book/create-an-account">Click Here to Create an Account</a></p>';
					$html .= $LoginForm->render('*horizontal', true);
					$html .= '<hr />';
					
				}
			}
			
			return $html;
		}
		
		private function loadGuestDetails(){
			//Confirm availability of non-temporary GuestID
			if(self::guestHasAccount()){
				$Guest = $this->API->getGuestById($_SESSION['GuestID']);
				if(!$Guest){
					$this->setDefaultUser();
				}
			} else{
				$this->setDefaultUser();
			}
			echo '<input type="hidden" id="GuestID" value="'.$_SESSION['GuestID'].'">';
		}
		
		private function setDefaultUser(){
			$_SESSION['Name'] = 'Guest';
			$_SESSION['Surname'] = 'User';
		}
		
		private function welcomeMessage(){
			if(isset($_SESSION['Name']) AND isset($_SESSION['Surname'])){
				$html = 'Welcome '.$_SESSION['Name'].' '.$_SESSION['Surname'];
			} else{
				$html = 'Welcome Guest User';
			}
			return $html;
		}
		
		public function guestSignup(){
			$this->setAPI();
			$SignupForm = $this->API->getGuestSignupForm();
			if($SignupForm->validate()){
				$this->API->processGuestSignupForm($SignupForm);
			}
			
			$html = '<h2>Sign Up</h4>';
			$html .= $SignupForm->render('*horizontal', true);
			
			return $html;
			
		}
		
		/**************************************
		
		Itinerary Features
		
		**************************************/
				
		public function createItinerary(){
			//Set up API Connection
			$this->setAPI();
			
			//Generate Form
			$Form = $this->API->getNewItineraryForm();
			
			//Validate Form
			if($Form->validate()){
				$this->API->processNewItineraryForm();
				$Form->add_error('error','Form Submitted');
			}
			
			$html = '<h2>Create an Itinerary</h2>';
			$html .= $Form->render('*horizontal', true);
			return $html;
		}
		
		public function guestItineraries(){
			//Set up API Connection
			$this->setAPI();
			
			//Get itineraries for the current Guest ID
			$Itineraries = $this->API->getGuestItineraries();
			$html = '<h2>My Itineraries</h2>';

			if(is_array($Itineraries)){
				$html .= $this->generateItineraryList($Itineraries);
			} else{
				$html .= '<p>No Itineraries Found.</p>';
			}
			$html .= '<p><a href="/book/itinerary-planner?NewItinerary=true">Create a New Itinerary</a></p>';
			return $html;
		}
		
		private function generateItineraryList($Itineraries){
			if(is_array($Itineraries)){
				$html = '<table>';
				$html .= '<tr><th>&nbsp</th><th>Arrive</th><th>Depart</th><th>Guests</th></tr>';
				foreach($Itineraries AS $Itinerary){
					$html .= '<tr>
					<td style="padding: 5px;"><a href="/book/itinerary-planner?ItineraryID='.$Itinerary->ItineraryKey.'">'.$Itinerary->PlanName.'</a></td>
					<td style="padding: 5px;">'.date('d/m/y', strtotime($Itinerary->StartDate)).'</td>
					<td style="padding: 5px;">'.date('d/m/y', strtotime($Itinerary->EndDate)).'</td>
					<td style="padding: 5px;">'.$Itinerary->Guests.'</td>
					</tr>';
				}
				$html .= '</table><hr>';
				return $html;
			} else{
				return '<p>No Itineraries Found.</p>';
			}
		}
		
		public function itineraryDetails(){
			
		}
		
		public function itineraryStatus(){
			
		}
		
		public function guestFavourites(){
			//Set up API Connection
			$this->setAPI();
			$DataController = new ATDWDataController();
			
			$html = '<h2>My Favourites</h2>';
			
			//Find Favourites
			$Favourites = $this->API->getGuestFavourites();
			if(is_array($Favourites)){
				$html .= '<div id="slide-favourites">';
				foreach($Favourites AS $Favourite){
					//Get ATDW Data for product
					$Product = $DataController->getProductInformation($Favourite->ATDWProductKey);
		
					$html .= '<div class="event_favourite" product-type="'.$Product['Type'].'" product-name="'.$Product['ProductName'].'" product-id="'.$Product['ProductID'].'" style="display: flex; margin: 10px; border: 1px solid #434343;">
						<div style="width: 25%; padding: 10px;"><img src="'.$Product['Image'].'"></div>
						<div class="tool-tip-desc" style="width: 70%; padding: 10px;" title="'.substr($Product['Description'], 0, 200).'"><h4>'.$Product['ProductName'].'</h4></div>
					</div>';
				}
				$html .= '</div>';
			} else{
				$html .= '<div id="slide-favourites"><p>You have not saved any favourites yet.</p></div>';
			}
			
			return $html;
		}
		
		public function guestFavouritesExpanded(){
			//Set up API Connection
			$this->setAPI();
			$DataController = new ATDWDataController();
			
			$html = '<h2>My Favourites</h2>';
			
			//Find Favourites
			$Favourites = $this->API->getGuestFavourites();
			if(is_array($Favourites)){
				$html .= '<div id="itinerary-favourites">';
				foreach($Favourites AS $Favourite){
					//Get ATDW Data for product
					$Product = $DataController->getProductInformation($Favourite->ATDWProductKey);
				
					$html .= '<div class="event_favourite" product-type="'.$Product['Type'].'" product-name="'.$Product['ProductName'].'" product-id="'.$Product['ProductID'].'" style="display: flex; margin: 10px; border: 1px solid #434343;">
						<div style="width: 25%; padding: 10px;"><img src="'.$Product['Image'].'"></div>
						<div class="tool-tip-desc" style="width: 70%; padding: 10px;" title="'.substr($Product['Description'], 0, 200).'"><h4>'.$Product['ProductName'].'</h4></div>
					</div>';
				}
				$html .= '</div>';
			} else{
				$html .= '<p>You have not saved any favourites yet.</p>';
			}
			
			return $html;
		}
				
		public function addFavourite(){
			$this->setAPI();
			//$this->trimItemID();
			$Result = $this->API->addFavourite();
			echo $Result;
			exit;
		}
		
		private function trimItemID(){
			if(isset($_POST['itemID'])){
				$ExplodeID = explode('-', $_POST['itemID']);
				$ItemID = $ExplodeID[1];
				$_POST['itemID'] = $ItemID;
			}
		}
		
		public function itineraryTripCategories(){
			$html = '<div id="itinerary-categories" style="display: flex;">
				<div id="itinerary-gettinghere" style="width: 33%;min-height: 200px;border: 1px solid #524444;">
					<h4 style="border-bottom: 1px solid;">Getting Here</h4>
				</div>
				<div id="itinerary-gettingaround" style="width: 33%;min-height: 200px;border: 1px solid #524444;">
					<h4 style="border-bottom: 1px solid;">Getting Around</h4>
				</div>
				<div id="itinerary-stay" style="width: 33%;min-height: 200px;border: 1px solid #524444;">
					<h4 style="border-bottom: 1px solid;">Stay</h4>
					<ul class="droplet-padding"></ul>
				</div>
			</div>';
			
			return $html;
		}
		
		/**************************************
		
		Page Features
		
		**************************************/
		
		public function getWalksContent(){
			//$WalksController = new WalksController();
			
			//$Content = $WalksController->render();
			//return $Content;

			echo "<script>new window.App.fitb.views.WalkersView().render();</script>";
		}
		
		public function getWildlifeContent(){
			
		}
		
		public function getAdventureContent(){
			
		}
		
		public function getRetailContent(){
			echo "<script>jQuery(document).ready(function() { new window.App.fitb.views.RetailView().render();})</script>";
		}
		
		public function getRefreshContent(){
			
		}
		
		public function getGalleriesContent(){
			
		}
		
		public function getBirdsContent(){
			
		}
		
		public function getHistoryContent(){
			
		}
		
		public function getToursContent(){
			echo "<script>new window.App.fitb.views.ToursView().render();</script>";
		}
		
		public function getScenicContent(){
      echo "<script>new window.App.fitb.views.CommonView({productType: 'scenic'}).render();</script>";
		}
		
		public function getAgenciesContent(){
      echo "<script>new window.App.fitb.views.AgenciesView().render();</script>";
		}
		
		public function getDrivesContent(){
      echo "<script>new window.App.fitb.views.DrivesView().render();</script>";
		}
		
		public function getBoatsContent(){
			echo "<script>new window.App.fitb.views.BoatsView().render();</script>";
		}
		
		public function getGettingHereContent(){
      echo "<script>new window.App.fitb.views.CommonView({productType: 'gettinghere'}).render();</script>";
		}
		
		public function getGettingAroundContent(){
      echo "<script>new window.App.fitb.views.CommonView({productType: 'gettingaround'}).render();</script>";
		}
		
		public function getHousesContent(){
      echo "<script>new window.App.fitb.views.HouseView().render();</script>";
		}
		
		public function getCottagesContent(){
      echo "<script>new window.App.fitb.views.CommonView({productType: 'cottages'}).render();</script>";
		}
		
		public function getHotelsContent(){
      echo "<script>new window.App.fitb.views.CommonView({productType: 'hotels'}).render();</script>";
		}
		
		public function getHostedContent(){
      echo "<script>new window.App.fitb.views.CommonView({productType: 'hosted'}).render();</script>";
		}
		
		public function getCampingContent(){
      echo "<script>new window.App.fitb.views.CommonView({productType: 'camping'}).render();</script>";
		}
		
		public function getEateriesContent(){
      echo "<script>new window.App.fitb.views.CommonView({productType: 'eateries'}).render();</script>";
		}
		
		public function getEventsContent(){
      echo "<script>new window.App.fitb.views.CommonView({productType: 'events'}).render();</script>";
		}
		
		/**************************************
		
		ATDW Components
		
		**************************************/
		
		private function setATDWAPI(){
			if(!isset($this->ATDWAPI)){
				$this->ATDWAPI = new ATDWAPI();
			}
		}
		
		public function listAllAccommodation(){
			$this->setATDWAPI();
			
			$Region = 'LGAFI';
			$Category = 'ACCOMM';
			
			$Result = $this->ATDWAPI->getAllProductsForRegionByCategory($Region, $Category);
			echo $this->ATDWAPI->renderProducts($Result);
			
		}
		
	}
	
	
	
	
	
?>