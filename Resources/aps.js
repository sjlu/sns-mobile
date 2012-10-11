APS = {};

APS.Callback = {};

APS.open = function(onSuccess, onError, onReceive)
{
	this.Callback.success = onSuccess;
	this.Callback.error = onError;
	this.Callback.receive = onReceive; 
	
	Titanium.Network.registerForPushNotifications({
		types: [
			Titanium.Network.NOTIFICATION_TYPE_BADGE,
			Titanium.Network.NOTIFICATION_TYPE_ALERT,
			Titanium.Network.NOTIFICATION_TYPE_SOUND
		],
		
		success: APS.success,
		error: APS.error,
		callback: APS.receive
	});
};

APS.success = function(e)
{	
	if (typeof APS.Callback.success === 'function')
		APS.Callback.success(e.deviceToken);
};

APS.error = function(e)
{
	Ti.API.info(e);
	
	if (typeof APS.Callback.error === 'function')
		APS.Callback.error(e);
};

APS.receive = function(e) {
	if (typeof APS.Callback.receive === 'function')
		APS.Callback.receive(e.data); 
};
