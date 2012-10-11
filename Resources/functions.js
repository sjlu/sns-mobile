function getTimeAgo(time)
{
	var date = time;
		diff = (((new Date()).getTime() - date) / 1000),
		day_diff = Math.floor(diff / 86400);

	if (isNaN(day_diff) || day_diff < 0)
		return '0m';

	return (day_diff == 0 && (
			diff < 3600 && Math.floor( diff / 60 ) + "m" ||
			diff < 86400 && Math.floor( diff / 3600 ) + "h") ||
		day_diff < 7 && day_diff + "d" ||
		day_diff < 365 && Math.ceil( day_diff / 7 ) + "w");
}

function cleanNotificationCenter()
{
	Titanium.UI.iPhone.appBadge = 0;
	// Ti.App.iOS.cancelAllLocalNotifications();	
}
