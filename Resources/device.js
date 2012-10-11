SNS.Device = {};

SNS.Device.register = function()
{
	Network.cache.asyncPost(SNS.url + 'device', {
		duid: Ti.Platform.id
	}, SNS.Device.onSuccess, SNS.Device.onError);
};

SNS.Device.onSuccess = function(data, date, status, user, xhr) 
{
	try {
		data = JSON.parse(data);
	} catch (excep) {
		SNS.Device.onError(Network.PARSE_ERROR, 0);
		return;
	}

	if (data.error) {
		Ti.API.info("Failed to register device. ["+data.error.code+"]");
		SNS.Device.onError(data.error, 0);
		return;
	}
	
	Ti.App.Properties.setString('duid', Ti.Platform.id);
	SNS.duid = Ti.Platform.id;
	SNS.Main.render(); // render me maybe?
	SNS.Push.register(); // see if we can get a push_key!
};

SNS.Device.onError = function(status, httpStatus) 
{
	Ti.API.info("Network error has occured. ["+status+"]");
};
