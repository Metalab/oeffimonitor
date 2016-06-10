var express = require('express');
var path = require('path');
var debug = require('debug')('server:app');
var logger = require('morgan');
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');
var _ = require('lodash');

var routes = require('./routes');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(favicon(__dirname + '/../site/favicon.ico'));

_.each(routes, function(controller, route) {
	debug("Add route %s",route);
	app.use(route,controller(app, route));
});

app.use(express.static(path.join(__dirname, '../site')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

module.exports = app;
