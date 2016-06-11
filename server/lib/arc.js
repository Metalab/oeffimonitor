"use strict";
const http = require('http');
const debugFactory = require('debug');
const EventEmitter = require('events');
const settings = require("../settings");
const _ = require('lodash');
var arcInstanceCounter = 0;

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
class Arc extends EventEmitter {
	constructor(options) {
		super();
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
		this.on('apiResponseReceived',() =>{
			debug("#apiResponseReceived");
			this.apiResponseReceived();
		});
	}
		// 	this.isExpired = isExpired;
		// 	this.add = add;
		// 	this.apiResponseReceived = apiResponseReceived;
		// 	this.sendResponse = sendResponse;
		// 	this.update = update;

		/**
		* isExpired - checks if the currently cached result is already expired
		*
		* @return {bool} true if expired
		*/
		isExpired() {
			var isExpired = Date.now() - this.lastUpdate > this.options.maxAgeMilliSeconds;
			debug("Response expired: %s",isExpired);
			return isExpired;
		}

		/**
		* add - register a response to be completed when a result is received from the web api
		*
		* @param  {Response} response Node HTTP Response object to receive the web api result
		*/
		add(response) {
			let removeFromPending = () => {
				debug('Removing response object from pending');
				this.pending.delete(response);
			}

			// cached API response not yet expired? Deliver it right away.
			if (this.isExpired()) {
				debug("Add response handle to pending");
				this.pending.add(response);
				response.on('finish', removeFromPending);
				this.update();
				return;
			}
			debug("Send cached response");
			this.sendResponse(response);
		}

		/**
		* apiResponseReceived - flush all pending response objects with the buffered response
		*/
		apiResponseReceived() {
			this.lastUpdate = Date.now();
			this.updating = false;
			this.pending.forEach(this.sendResponse, this);
		};

		/**
		* sendResponse - deliver a cached web api result to a response and remove the response handle
		*
		* @param  {Response} responseHandle response handle to send result to
		*/
		sendResponse(responseHandle) {
			responseHandle.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
			responseHandle.header('Expires', '-1');
			responseHandle.header('Pragma', 'no-cache');
			if (this.contentType) responseHandle.type(this.contentType);
			responseHandle.status(this.statusCode);
			responseHandle.send(this.bufferedResponse); // TODO what happens if this timed out?
			// this.pending.delete(responseHandle); --> moved to finish-Event of response
		}

		/**
		* update - send a request to the web api place received data in bufferedResponse
		*/
		update(){
			if (this.updating) {
				return; // Update already in progress
			}

			var receivedChunks = [];

			var onChunkReceived = (chunk) => {
				receivedChunks.push(chunk);
			};

			var onResponseCompletelyReceived = () => {
				debug("Response completely received");
				this.statusCode = response.statusCode;
				this.contentType = response.headers['content-type'];
				if (response.statusCode !== 200) {
					this.bufferedResponse = new Buffer(JSON.stringify({
						statusCode: response.statusCode,
						statusMessage: response.statusMessage,
						text: 'Error while trying to receive a result from the web api'
					}));
				} else {
					this.bufferedResponse = Buffer.concat(receivedChunks);
				}
				this.emit('apiResponseReceived');
			};

			var onError = (error, reason) => {
				debug('api request to URL('+this.options.apiUrl+') failed:');
				debug(error);
				this.statusCode = 500;
				this.contentType = 'text/plain';
				this.bufferedResponse = new Buffer(JSON.stringify({
					statusCode: this.statusCode,
					statusMessage: 'Internal Server Error',
					text: (reason ? reason : 'Error while trying to receive a result from the web api. More details available in debug log for component server:lib:arc')
				}));
				this.emit('apiResponseReceived');
			};

			var onTimeout = () => {
				debug("api request timed out, aborting request");
				request.abort();
			}

			var attachResponseEventHandlers = (response) => {
				response
					.on('data', onChunkReceived)
					.on('end', onResponseCompletelyReceived)
					.on('error', onError);
			};

			this.updating = true;
			debug("Send web api request");
			var request = http.get(this.options.apiUrl, attachResponseEventHandlers);
			request
				.on('error', onError)
				.setTimeout(this.options.timeout,onTimeout);
		}
}

module.exports = Arc;
