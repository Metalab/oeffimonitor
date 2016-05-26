#!/usr/bin/env node

var fs = require('fs');
var http = require('http');
var settings = require(__dirname + '/settings.js');

var contentTypes = {
	'html' : 'text/html;charset=UTF-8',
	'js'   : 'application/javascript',
	'json' : 'application/json;charset=UTF-8',
	'svg'  : 'image/svg+xml',
	'ico'  : 'image/vnd.microsoft.icon',
	'txt'  : 'text/plain;charset=UTF-8',
	'css'  : 'text/css',
};

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
		sendResponse(response, arc.bufferedResponse, arc.contentType, 200);
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
				console.log('API: update failed: ' + e);
				arc.updating = false;
			});

		}).on('error', function(e) {
			console.log('API: update failed: ' + e);
			arc.updating = false;
		});
	},
};

function sendResponse(response, body, contentType, statusCode)
{
	response.writeHead(statusCode, {
		'Content-Length': body.length,
		'Content-Type': contentType
	});
	response.end(body);
}

function sendError(response, code)
{
	var m = code + ' ' + http.STATUS_CODES[code];
	var html = '<!DOCTYPE html>\n<html>\n<head>\n<title>' + m +
		'</title>\n</head>\n<body>\n<h1>' + m + '</h1>\n</body>\n</html>\n';
	sendResponse(response, html, 'text/html', code);
}

function tryStaticFile(response, path)
{
	try {
		var extension = path.split('.').pop();
		var ct = contentTypes[extension];
		ct = ct !== undefined ? ct : 'application/octet-stream';
		var buf = fs.readFileSync(__dirname + '/../site/' + path);
		sendResponse(response, buf, ct, 200);
		console.log("Hit: " + path);
	} catch (e) {
		console.log("Miss: " + path + ": " + e);
		sendError(response, 404);
	}
}

function handleRequest(request, response)
{
	var path = request.url.split('?')[0];

	if (path === "/favicon.ico" || path === "/robots.txt")
		return sendError(response, 404); // don't log these

	if (path[path.length-1] === "/")
		path += "index.html";

	if (path === "/api") {
		var r = arc.add(response) ? ' (cached)' : '';
		console.log("Hit: " + path + r);

	// deadsimple directory traversal prevention
	} else if (path.indexOf('..') === -1) {
		tryStaticFile(response, path);
	} else {
		console.log("Miss: " + path + " (possible directory traversal)");
		sendError(response, 403);
	}
}

var server = http.createServer(handleRequest);
server.listen(settings.listen_port);
console.log("Server started at port "+settings.listen_port);
