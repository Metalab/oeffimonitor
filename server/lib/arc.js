"use strict";
const http = require('http');
const debug = require('debug')('server:lib:Arc');
const EventEmitter = require('events');
const settings = require("../settings");
const _ = require('lodash');

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
    // Set  default options - TODO might be better to remove settings dependency
    this.options = {
      maxAgeMilliSeconds: settings.api_cache_msec,
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
    this.on('apiResponseReceived',() =>{
      debug("#apiResponseReceived");
      this.apiResponseReceived()
    });
  }

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
    // cached API response not yet expired? Deliver it right away.
		if (this.isExpired()) {
      debug("Add response handle to pending");
      this.pending.add(response);
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
    responseHandle.type(this.contentType);
		responseHandle.status(200);
		responseHandle.send(this.bufferedResponse); // TODO what happens if this timed out?
		this.pending.delete(responseHandle);
  };


  /**
   * update - send a request to the web api place received data in bufferedResponse
   */
  update(){
      if (this.updating) {
        return; // Update already in progress
      }
      this.updating = true;
      var _this = this;
      debug("Send web api request");
      http.get(this.options.apiUrl, processResponse).on('error', onError);

      function onError(error) {
        debug('api request to URL('+this.options.apiUrl+') failed: ' + error);
        _this.updating = false; // TODO better handling? Response Handles will only be completed next time someone asks and a result is received
      };

      function processResponse(response) {
        var receivedChunks = [];
        response
          .on('data', onChunkReceived)
          .on('end', onResponseCompletelyReceived)
          .on('error', onError);

        function onChunkReceived(chunk) {
          if (response.statusCode !== 200)
            return response.emit('error');
          _this.contentType = response.headers['content-type'];
          receivedChunks.push(chunk);
        }

        function onResponseCompletelyReceived(){
          _this.bufferedResponse = Buffer.concat(receivedChunks);
          _this.emit('apiResponseReceived');
        }
      };
  }
};

module.exports = Arc;
