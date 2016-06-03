const http = require('http');
const debug = require('debug')('server:api');
const settings = require("../settings");
const Arc = require('../lib/arc.js');
var arc = new Arc({ apiUrl: settings.api_urls.realtime });

module.exports = function(app, route) {
  app.get(route, function (req, res, next) {
		arc.add(res);
  });

  // Return middleware
  return function(req, res, next) {
    next();
  };
}
