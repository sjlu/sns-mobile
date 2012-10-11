SNS.Main = {};

SNS.Main.init = function()
{
	this.win = Ti.UI.createWindow({
		title : 'SNS',
		barColor : SNS.winBarColor,
		barImage : SNS.winBarImage,
		orientationModes : [Titanium.UI.PORTRAIT],
		backgroundColor : '#d6d8de',
   	});
   	
   	this.tableview = Ti.UI.createTableView();
   	this.win.add(this.tableview);
};

SNS.Main.open = function()
{	
	if (!SNS.duid)
	{
		SNS.Login.open();
		return;
	}
	
	SNS.Push.register();
	SNS.Main.render();
};

SNS.Main.render = function()
{
	Network.cache.run (
		SNS.url + 'notifications/duid/'+SNS.duid,
		Network.CACHE_INVALIDATE,
		this.onSuccess,
		this.onError
	);
	
	cleanNotificationCenter();
};

SNS.Main.onSuccess = function(data, date, status, user, xhr)
{
	try {
		data = JSON.parse(data);
	} catch (excep) {
		SNS.Device.onError(Network.PARSE_ERROR, 0);
		return;
	}

	if (data.error) {
		Ti.API.info("Failed to get notifications. ["+data.error.code+"]");
		SNS.Device.onError(data.error, 0);
		return;
	}
	
	var rows = [];
	
	for (var i in data)
	{
		rows.push(SNS.Main.generateRow(data[i]));
	}
		
	SNS.Main.tableview.setData(rows);
};

SNS.Main.onError = function(status, httpStatus)
{
	Ti.API.info("Network error has occured. ["+status+"]");
};

SNS.Main.generateRow = function(data)
{
	var row = Ti.UI.createTableViewRow({
		className: 'row',
		height: 'auto',
		width: '100%',
		layout: 'vertical',
		selectionStyle: 'none'
	});
	row.add(Ti.UI.createLabel({
		text: data.subject,
		height: 'auto',
		top: 10, left: 15, right: 40,
		font: { fontWeight: 'bold', fontSize: 16 }
	}));
	row.add(Ti.UI.createLabel({
		text: getTimeAgo(data.timestamp*1000),
		height: 'auto',
		top: -17, right: 15,
		color: 'gray',
		font: {fontWeight: 'bold', fontSize: 12 }
	}))
	row.add(Ti.UI.createLabel({
		text: data.message,
		height: 'auto',
		left: 15, bottom: 10, right: 15,
		font: { fontSize: 13 }
	}));
	
	return row;
};
