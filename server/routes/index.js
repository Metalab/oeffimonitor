var settings = require("../settings");

module.exports = function(app, route) {
	app.get(route, function indexPageController(req, res, next) {
		res.render('index', {
			title: settings.title,
			theme: settings.theme,
			showWeather: settings.api_urls.weather && settings.api_urls.forecast
		});
	});

	// Return middleware
	return function(req, res, next) {
		next();
	};
}
