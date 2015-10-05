var fs = require('fs');
var http = require('http');
var settings = require(__dirname + '/settings.js');

var contentTypes = {
	'html' : 'text/html',
	'js'   : 'application/javascript',
	'json' : 'application/json',
	'svg'  : 'image/svg+xml',
	'txt'  : 'text/plain',
	'css'  : 'text/css',
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

function handleRequest(request, response)
{
	var path = request.url.split('?')[0];
	
	if (path[path.length-1] === "/")
		path += "index.html";

	if (path === "/api") {
		console.log("Hit: "+path);
		var head_sent = false;
		var apiRequest = http.get(settings.api_url, function(apiResponse) {
			console.log(apiResponse);
			return;
			if (res.statusCode !== 200) {
				apiResponse.emit('end');
				return sendError(response, 500);
			} else if (!head_sent) {
				var ct = apiResponse.getHeader('Content-Type');
				response.writeHead(200, {
					'Content-Type': ct ? ct : 'application/json'
				});
				head_sent = true;
			}
			apiResponse.on('data', function(chunk) {
				response.write(chunk);
			}).on('end', function() {
				response.end();
			}).on('error', function() {
				response.abort();
			});
		}).on('error', function(e) {
			console.log(e);
		});
	} else if (path.indexOf('..') === -1) {
		try {
			var extension = path.split('.').slice(-1)[0];
			sendResponse(response,
				fs.readFileSync(__dirname+'/../site/'+path),
				contentTypes[extension],
				200);
			console.log("Hit: "+path);
		} catch (e) {
			console.log("Miss: "+path+": "+e);
			sendError(response, 404);
			return;
		}
	} else {
		console.log("Miss: "+path+' .. in filename prohibited');
		sendError(response, 403);
	}
}

var server = http.createServer(handleRequest);
server.listen(settings.listen_port);
