var http = require('http');
var debug = require('debug')('server:api');
var settings = require("../settings");

var arc = { //api response cache
	pending          : new Set(), // set of pending response objects
	lastUpdate       : 0,  // Date.now() of the last completed update
	updating         : false, // currently running an update()?
	bufferedResponse : null, // the concatenated response
	contentType      : null, // the content-type that was sent by the server
	data             : null, // the data being cached (concatenated when sent)

	// deliver a cached response or add the response object to the set of
	// pending response handles and trigger an API update
	add     : function (response) {
		// cached API response not yet expired? Deliver it right away.
		if (Date.now() - arc.lastUpdate < settings.api_cache_msec) {
			debug("api response from cache");
			arc.deliver(response);
			return true;
		}
		arc.pending.add(response);
		arc.update();
		return false;
	},

	// flush all pending response objects with the buffered response
	flush : function()
	{
		arc.pending.forEach(arc.deliver);
	},

	// remove a response from the list of pending response handles
	remove  : function (response) {
		arc.pending.delete(response);
	},

	// deliver a response from the cache and remove the response handle
	// from pending if applicable
	deliver : function (response) {
		response.type(arc.contentType);
		response.status(200);
		response.send(arc.bufferedResponse);		
		arc.remove(response);
	},

	// send an API request, queue data in arc.data
	update  : function ()
	{
		// update already in progress?
		if (arc.updating)
			return;
		arc.updating = true;
		arc.data = [];

		var request = http.get(settings.api_url, function(response) {
			response.on('data', function(chunk) {
				if (response.statusCode !== 200)
					return response.emit('error');
				arc.contentType = response.headers['content-type'];
				arc.data.push(chunk);
			}).on('end', function() {
				arc.bufferedResponse = Buffer.concat(arc.data);
				arc.flush();
				arc.data = null;
				arc.lastUpdate = Date.now();
				arc.updating = false;
			}).on('error', function(e) {
				debug('update failed: ' + e);
				arc.updating = false;
			});

		}).on('error', function(e) {
			debug('update failed: ' + e);
			arc.updating = false;
		});
	},
};


module.exports = function(app, route) {
  app.get(route, function (req, res, next) {
		arc.add(res);
  });

  // Return middleware
  return function(req, res, next) {
    next();
  };
}

