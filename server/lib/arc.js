"use strict";
var http = require('http');
var debugFactory = require('debug');
var events = require('events');
var settings = require("../settings");
var _ = require('lodash');
var util = require("util");
var arcInstanceCounter = 0;
// TODO deprecated in node > v0.12.0, leave for now to be compatible with older versions on ARM
// should be replaced by class ... extends ...
util.inherits(Arc, events.EventEmitter);
module.exports = Arc;


/**
* Arc - API Response Cache
* performs requests to a web api (e.g. WienerLinien Realtime Traffic data)
* and caches its responses. Register responses from node http server
* to be completed once the web api returns with a result
*
* @param  {Object} options for the Cache (see defaults)
* @fires Arc#apiResponseReceived
* @constructor
*/

function Arc(options) {
	// Super Constructor
	events.EventEmitter.call(this);

	// Set up instance specific logger
	var debug = debugFactory('server:lib:Arc:'+ arcInstanceCounter++ );
	this.instanceNumber = arcInstanceCounter;

	// Set  default options - TODO might be better to remove settings dependency
	this.options = {
		maxAgeMilliSeconds: settings.api_cache_msec,
		timeout: settings.api_cache_msec / 2,
		apiUrl: ''
	};
	// overwrite this.options-Properties with those that were explicitly set in options parameter of function
	if (options) {
		this.options = _.defaults(options, this.options);
	}
	debug("Creating new API Response Cache");
	debug(this.options);
	this.pending = new Set();
	this.lastUpdate = 0;
	this.updating = false;
	this.bufferedResponse = null;
	this.contentType = null;
	this.statusCode = null;
	this.on('apiResponseReceived',function onApiResponseReceived() {
		debug("#apiResponseReceived");
		this.apiResponseReceived()
	});

	this.isExpired = isExpired;
	this.add = add;
	this.apiResponseReceived = apiResponseReceived;
	this.sendResponse = sendResponse;
	this.update = update;

	/**
	* isExpired - checks if the currently cached result is already expired
	*
	* @return {bool} true if expired
	*/
	function isExpired() {
		var isExpired = Date.now() - this.lastUpdate > this.options.maxAgeMilliSeconds;
		debug("Response expired: %s",isExpired);
		return isExpired;
	}

	/**
	* add - register a response to be completed when a result is received from the web api
	*
	* @param  {Response} response Node HTTP Response object to receive the web api result
	*/
	function add(response) {
		// cached API response not yet expired? Deliver it right away.
		if (this.isExpired()) {
			debug("Add response handle to pending");
			this.pending.add(response);
			response.on('finish', removeFromPending.bind(this));
			this.update();
			return;
		}
		debug("Send cached response");
		this.sendResponse(response);

		function removeFromPending() {
			// Using the event handler makes sure this will also be removed if e.g. an
			// error in the code causes an error message to be sent before the API cache
			// received any results to transmit
			debug('Removing response object from pending');
			this.pending.delete(response);
		}

	}

	/**
	* apiResponseReceived - flush all pending response objects with the buffered response
	*/
	function apiResponseReceived() {
		this.lastUpdate = Date.now();
		this.updating = false;
		this.pending.forEach(this.sendResponse, this);
	};

	/**
	* sendResponse - deliver a cached web api result to a response and remove the response handle
	*
	* @param  {Response} responseHandle response handle to send result to
	*/
	function sendResponse(responseHandle) {
		responseHandle.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
		responseHandle.header('Expires', '-1');
		responseHandle.header('Pragma', 'no-cache');
		if (this.contentType) responseHandle.type(this.contentType);
			responseHandle.status(this.statusCode);
			responseHandle.send(this.bufferedResponse); // TODO what happens if this timed out?
			// this.pending.delete(responseHandle); --> moved to finish-Event of response
	};


	/**
	* update - send a request to the web api place received data in bufferedResponse
	*/
	function update(){
		if (this.updating) {
			return; // Update already in progress
		}
		this.updating = true;
		debug("Send web api request");
		var request = http.get(this.options.apiUrl, processResponse);
		request
			.on('error', onError.bind(this))
			.setTimeout(this.options.timeout,onTimeout);

		function onTimeout() {
		debug("api request timed out, aborting request");
		request.abort();
		}

		function onError(error, reason) {
			debug('api request to URL('+this.options.apiUrl+') failed:');
			debug(JSON.stringify(error));

			this.statusCode = 500;
			this.contentType = 'text/plain';
			this.bufferedResponse = new Buffer(JSON.stringify({
				statusCode: this.statusCode,
				statusMessage: 'Internal Server Error',
				text: (reason ? reason : 'Error while trying to receive a result from the web api. More details available in debug log for component server:lib:arc')
			}));
			this.emit('apiResponseReceived');
		};

			function processResponse(response) {
			var receivedChunks = [];
			response
				.on('data', onChunkReceived)
				.on('end', onResponseCompletelyReceived.bind(this))
				.on('error', onError.bind(this));

			function onChunkReceived(chunk) {
				receivedChunks.push(chunk);
			}

			function onResponseCompletelyReceived(){
				this.statusCode = response.statusCode;
				this.contentType = response.headers['content-type'];
				this.bufferedResponse = Buffer.concat(receivedChunks);
				if (response.statusCode !== 200) {
					this.bufferedResponse = new Buffer(JSON.stringify({
						statusCode: response.statusCode,
						statusMessage: response.statusMessage,
						text: 'Error while trying to receive a result from the web api'
					}));
				}
				this.emit('apiResponseReceived');
			}
		};
	}
};
