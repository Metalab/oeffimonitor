var fs = require('fs');
var http = require('http');
var settings = require(__dirname + '/settings.js');

var contentTypes = {
	'html' : 'text/html',
	'js'   : 'application/javascript',
	'json' : 'application/json',
	'svg'  : 'image/svg+xml',
	'ico'  : 'image/vnd.microsoft.icon',
	'txt'  : 'text/plain',
	'css'  : 'text/css',
};

var arc = { //api response cache
	pending          : new Set(), // set of pending response objects
	lastUpdate       : 0,  // Date.now() of the last completed update
	buf              : [], // the data being cached (concatenated when sent)
	updating         : false, // currently running an update()?
	bufferedResponse : undefined,
	contentType      : undefined,

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

	flush : function()
	{
		arc.pending.forEach(arc.deliver);
	},

	remove  : function (response) {
		arc.pending.delete(response);
	},

	deliver : function (response) {
		sendResponse(response, arc.bufferedResponse, arc.contentType, 200);
		arc.remove(response);
	},

	/* send an API request, queue data in arc.data */
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
					response.emit('end');
				arc.contentType = response.headers['content-type'];
				arc.data.push(chunk);
			}).on('end', function() {
				arc.bufferedResponse = Buffer.concat(arc.data);
				arc.flush();
				arc.data = undefined;
				arc.lastUpdate = Date.now();
				arc.updating = false;
			}).on('error', function(e) {
				console.log('API: update failed: '+e);
				arc.updating = false;
			});

		}).on('error', function(e) {
			console.log('API: update failed: '+e);
			arc.updating = false;
		});
	},
};

function sendResponse(response, body, contentType, statusCode)
{
	if (body === undefined || statusCode === undefined || contentType === undefined) {
		sendError(response, 500);
	}
	response.writeHead(statusCode, {
		'Content-Length': body.length,
		'Content-Type': contentType
	});
	response.end(body);
}

function sendError(response, code)
{
	var err = http.STATUS_CODES[code];
	sendResponse(response, '<h1>'+code+' '+err+'</h1>', 'text/html', code);
}

function tryStaticFile(response, path)
{
	try {
		var extension = path.split('.').slice(-1)[0];
		sendResponse(response, fs.readFileSync(__dirname+'/../site/'+path),
		             contentTypes[extension], 200);
		console.log("Hit: "+path);
	} catch (e) {
		console.log("Miss: "+path+": "+e);
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
		console.log("Hit: "+path+r);

	// deadsimple directory traversal prevention
	} else if (path.indexOf('..') === -1) {
		tryStaticFile(response, path);
	} else {
		console.log("Miss: "+path+' .. in filename prohibited');
		sendError(response, 403);
	}
}

var server = http.createServer(handleRequest);
server.listen(settings.listen_port);
