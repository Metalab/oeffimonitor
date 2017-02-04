/***
 * Öffimonitor - display the Wiener Linien timetable for nearby bus/tram/subway
 * lines on a screen in the Metalab Hauptraum
 *
 * Copyright (C) 2015-2016   Moritz Wilhelmy
 * Copyright (C) 2015-2016   Bernhard Hayden
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */
// vim: set ts=8 noet: Use tabs, not spaces!
"use strict";

var cached_json = {};

function capitalizeFirstLetter(str) {
  return str.replace(/\w[^- ]*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function addZeroBefore(n) {
  return (n < 10 ? '0' : '') + n;
}

function showError(error) {
  document.querySelector('tbody').innerHTML = '';
  var last_update_string = '–';
  if (cached_json.data) {
    cached_json.data.forEach(function (departure) {
      addDeparture(departure);
    });
    last_update_string = new Date(cached_json.last_update).toTimeString();
  }

  document.getElementById("error").style.display = "block";
  document.getElementById("error_msg").innerHTML = error;
  document.getElementById("error_last_update").innerHTML = last_update_string;
  console.log(error);
}

function clock() {
  var currentTime = new Date();
  document.getElementById('currentTime').innerHTML = addZeroBefore(currentTime.getHours()) + ":"
    + addZeroBefore(currentTime.getMinutes()) + ":"
    + addZeroBefore(currentTime.getSeconds());
}

function update() {
  document.getElementById("error").style.display = "none";

  var req = new XMLHttpRequest();
  req.open('GET', '/api');
  req.onreadystatechange = function () {
    if (req.readyState !== 4) {	return }

    if (req.status !== 200) {
      showError('No connection to server');
      return;
    }

    try {
      var json = JSON.parse(req.responseText);
      if (json.status && json.status === 'error') {
        throw(json.error);
      }

      document.querySelector('tbody').innerHTML = '';
      json.forEach(function (departure) {
        addDeparture(departure);
      });
      cached_json.data = json;
      cached_json.last_update = new Date().toString();
    } catch (e) {
      showError(e);
    }
  };
  req.send();
}

function addDeparture(departure) {
  var departureRow = document.createElement('tr');
  var now = new Date();
  var departureTime = new Date(departure.timeReal);
  var difference = new Date(departureTime - now);
  var differenceToNow = (departureTime.getTime() - now.getTime()) / 1000;
  var walkDuration = departure.walkDuration;
  var walkStatus = departure.walkStatus;

  if (walkDuration * 0.9 > differenceToNow) {
    walkStatus = 'too late';
  } else if (walkDuration + 2 * 60 > differenceToNow) {
    walkStatus = 'hurry';
  } else if (walkDuration + 5 * 60 > differenceToNow) {
    walkStatus = 'soon';
  }

  if (walkStatus === 'too late') {
    return false;
  }

  var line = departure.line;
  var type = departure.type;

  if (type === 'ptMetro') {
    line = '<img src="assets/u' + line.charAt(1) + '.svg" width="40" height="40" />';
  } else if (type === 'ptTram') {
    line = '<span class="tram">' + line + '</span>';
  } else if (type === 'ptBusCity') {
    line = '<span class="bus">' + line + '</span>';
  } else if (type === 'ptBusNight') {
    line = '<span class="nightline">' + line + '</span>';
  }

  var timeString = '<b>' + addZeroBefore(departureTime.getHours()) +
    ':' + addZeroBefore(departureTime.getMinutes()) +
    '</b>&nbsp;';

  if (difference.getHours() > 1) {
    var differenceString = '+' + (difference.getHours() - 1) +
      'h' + addZeroBefore(difference.getMinutes()) +
      'm' + parseInt(difference.getSeconds() / 10) + '0s';
  } else {
    var differenceString = '+' + addZeroBefore(difference.getMinutes()) +
      'm' + parseInt(difference.getSeconds() / 10) + '0s';
  }

  departureRow.innerHTML = '<tr><td class="time ' + walkStatus +
    '">' + timeString + differenceString + '</td>' +
    '<td>' + line + '</td><td>' + departure.stop +
    '</td><td>' + capitalizeFirstLetter(departure.towards) +
    '</td>';
  document.querySelector('tbody').appendChild(departureRow);
}

window.onload = function () {
  clock();
  update();
  window.setInterval(clock, 1000);
  window.setInterval(update, 10000);
};
