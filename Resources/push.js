SNS.Push = {};

SNS.Push.register = function()
{
	APS.open(SNS.Push.apsSuccess, SNS.Push.apsError, SNS.Push.apsReceive);
};

SNS.Push.apsSuccess = function(token)
{
	Network.cache.asyncPost(SNS.url + 'device', {
		duid: Ti.Platform.id,
		push_key: token
	}, SNS.Push.networkSuccess, SNS.Push.networkError, token);
};

SNS.Push.apsError = function(d)
{
	// do nothing purposely
};

SNS.Push.apsReceive = function(d)
{
	Ti.API.info("Got a push receive, rendering.");
	SNS.Main.render();
};

SNS.Push.networkSuccess = function(data, date, status, user, xhr) 
{
	try {
		data = JSON.parse(data);
	} catch (excep) {
		SNS.Push.onError(Network.PARSE_ERROR, 0);
		return;
	}

	if (data.error) {
		Ti.API.info("Failed to register device. ["+data.error.code+"]");
		SNS.Push.onError(data.error, 0);
		return;
	}
	
	Ti.App.Properties.setString('push_key', user);
	SNS.push_key = user;
};

SNS.Push.networkError = function(status, httpStatus) {
	Ti.API.info("Network error has occured. ["+status+"]");
};
