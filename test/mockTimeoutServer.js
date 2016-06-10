var http = require('http');
var timeout = 10000;

http.createServer(function (req, res) {
	setTimeout((function() {
		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.end("Hello I am awake");
	}), timeout);
}).listen(8082);
