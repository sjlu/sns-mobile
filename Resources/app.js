SNS = {};

SNS.url = 'http://burst-sns.herokuapp.com/api/';
// SNS.url = 'http://local.sns.burst-dev.com/api/';

SNS.winBarImage = 'images/navbar-iphone.png';
SNS.winBarColor = '#333';

SNS.winHeight = Titanium.Platform.displayCaps.platformHeight;
SNS.winWidth = Titanium.Platform.displayCaps.platformWidth;

SNS.duid = Ti.App.Properties.getString('duid');
SNS.push_key = Ti.App.Properties.getString('push_key');

Ti.include(
	'aps.js',
	'network.js',
	'main.js',
	'login.js',
	'push.js',
	'device.js',
	'functions.js'
);

/*
 * The Tab controller.
 */
SNS.tabs = Ti.UI.createTabGroup({bottom: -50});
SNS.tab = Ti.UI.createTab();

SNS.open = function(window)
{
	SNS.tab.open(window, {animated: true});
};

/*
 * Start everything up.
 */
SNS.Main.init();
SNS.Login.init();

/*
 * Load interface when everything is finished loading.
 */
SNS.tab.window = SNS.Main.win;
SNS.tabs.addTab(SNS.tab);
SNS.tabs.open();

/*
 * Render the frontpage before flip.
 */
SNS.Main.open();

/**
 * Tell the app what to do when resuming.
 */
Ti.App.addEventListener('resume', function(e)
{
	SNS.Main.render();
});