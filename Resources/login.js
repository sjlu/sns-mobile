SNS.Login = {};

SNS.Login.init = function() 
{
	this.win = Ti.UI.createWindow({
		title : 'Login',
		barColor : SNS.winBarColor,
		barImage : SNS.winBarImage,
		orientationModes : [Titanium.UI.PORTRAIT],
		backgroundColor : '#d6d8de',
		modal : true
	});

	this.navButtonBar = Ti.UI.createButtonBar({
		labels : ['Login'],
		height: 30,
		style : Ti.UI.iPhone.SystemButtonStyle.DONE,
		backgroundColor : '#5383e4'
	});

	this.navButtonBar.addEventListener('click', function(e) {
		SNS.Login.onSubmit();
	});

	this.win.rightNavButton = this.navButtonBar;

	/*
	 * View elements
	 */
	this.tableview = Ti.UI.createTableView({
		style : Ti.UI.iPhone.TableViewStyle.GROUPED,
		scrollable: false
	});

	this.headerView = Ti.UI.createView({height: 72});
	this.headerView.add(Ti.UI.createLabel({
		text: "SNS",
		width: 280,
		color: '#4c566c',
		shadowOffset:{x:0,y:1},
		font: { 
			fontSize: 24,
			fontWeight: 'bold'
		}
	}));
	this.headerView.add(Ti.UI.createLabel({
		text: "A simple notification service.",
		width: 280,
		color: '#4c566c',
		top: 48,
		shadowOffset:{x:0,y:1},
		font: { 
			fontSize: 16,
		}
	}));
	this.tableview.headerView = this.headerView;

	this.row_email = Ti.UI.createTableViewRow({
		selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
		height: 44
	});

	this.label_email = Ti.UI.createLabel({
		text : 'Email',
		left : 10,
		font : {
			fontSize : 14,
			fontWeight : 'bold'
		}
	});

	this.textarea_email = Ti.UI.createTextField({
		hintText : '',
		left : 100,
		width : '190',
		height : 24,
		editable : true,
		color : '#385487',
		font : {
			fontSize : 14,
		},
		clearButtonMode : Titanium.UI.INPUT_BUTTONMODE_ONFOCUS,
	});

	this.row_email.add(this.textarea_email);
	this.row_email.add(this.label_email);

	this.row_pw = Ti.UI.createTableViewRow({
		selectionStyle : Ti.UI.iPhone.TableViewCellSelectionStyle.NONE,
		height: 44
	});

	this.label_pw = Ti.UI.createLabel({
		text : 'Password',
		left : 10,
		font : {
			fontSize : 14,
			fontWeight : 'bold'
		}
	});

	this.textarea_pw = Ti.UI.createTextField({
		hintText : '',
		left : 100,
		width : '190',
		height : 24,
		editable : true,
		passwordMask : true,
		color : '#385487',
		font : {
			fontSize : 14,
		},
		autocapitalization : Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
		clearButtonMode : Titanium.UI.INPUT_BUTTONMODE_ONFOCUS,
	});

	this.row_pw.add(this.textarea_pw);
	this.row_pw.add(this.label_pw);

	this.tableview.appendRow(this.row_email);
	this.tableview.appendRow(this.row_pw);
	this.win.add(this.tableview);

	/*
	 * All other elements
	 * Elements that don't show intially
	 * but are invoked by sections of code
	 */
	this.titleControlView = Ti.UI.createView({
		width : 100,
		height : 60,
	});
	this.titleControlIndicator = Ti.UI.createActivityIndicator({
		left : 40
	});
	this.titleControlIndicator.show();
	this.titleControlView.add(this.titleControlIndicator);
};

SNS.Login.open = function() 
{
	this.win.open();
};

SNS.Login.close = function() 
{
	this.win.close();
};

SNS.Login.reset = function() 
{
	this.textarea_email.value = "";
	this.textarea_pw.value = "";
};

SNS.Login.showLoading = function() 
{
	var fakeButton = Ti.UI.createView();

	this.win.titleControl = this.titleControlView;
	this.win.leftNavButton = fakeButton;
	this.win.rightNavButton = fakeButton;
	this.textarea_email.enabled = false;
	this.textarea_pw.enabled = false;
};

SNS.Login.hideLoading = function() 
{
	this.win.titleControl = null;
	this.win.leftNavButton = this.closeButton;
	this.win.rightNavButton = this.navButtonBar;
	this.textarea_email.enabled = true;
	this.textarea_pw.enabled = true;
};

SNS.Login.onSubmit = function() 
{
	if (this.textarea_email.value == "" || this.textarea_pw.value == "") {
		alert("Please fill in all fields.");
		return;
	}
	
	this.showLoading();

	Network.cache.asyncPost(SNS.url + 'session', {
		email : this.textarea_email.value,
		password : this.textarea_pw.value
	}, SNS.Login.onSuccess, SNS.Login.onError);
};

SNS.Login.onError = function(status, httpStatus) 
{
	Ti.API.info("Network error has occured. ["+status+"]");
	this.hideLoading();
};

SNS.Login.onSuccess = function(data, date, status, user, xhr) 
{
	try {
		data = JSON.parse(data);
	} catch (excep) {
		SNS.Login.onError(Network.PARSE_ERROR, 0);
		return;
	}

	if (data.error) {
		SNS.Login.onError(data.error, 0);
		alert(data.error.message);
		Ti.API.info('Failed to login. ['+data.error.code+']');
		return;
	}
	
	SNS.Device.register();

	SNS.Login.hideLoading();
	SNS.Login.close();
	SNS.Login.reset();
}; 