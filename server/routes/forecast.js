var http = require('http');
var debug = require('debug')('server:api');
var settings = require("../settings");
var Arc = require('../lib/arc.js');
var arc = new Arc({ apiUrl: settings.api_urls.forecast });

module.exports = function(app, route) {
	app.get(route, function (req, res, next) {
		arc.add(res);
	});

	// Return middleware
	return function(req, res, next) {
		next();
	};
}
