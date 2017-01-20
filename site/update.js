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

function capitalizeFirstLetter(str)
{
    return str.replace(/\w[^- ]*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function addZeroBefore(n) {
  return (n < 10 ? '0' : '') + n;
}

function clock() {
	var currentTime = new Date();
	document.getElementById('currentTime').innerHTML = addZeroBefore(currentTime.getHours()) + ":"
		+ addZeroBefore(currentTime.getMinutes()) + ":"
		+ addZeroBefore(currentTime.getSeconds());
}

function update()
{
	document.getElementById("error").style.display = "none";
	document.getElementById("container").style.opacity = "1";

	var req = new XMLHttpRequest();
	req.open('GET', api_url);
	req.onreadystatechange = function () {

		if (req.readyState !== 4)
			return;

		// req.status == 0 in case of a local file (e.g. json file saved for testing)
		if (req.status !== 200 && req.status !== 0) {
			console.log('no connection to api');
			return;
		}

		try {
			var json = JSON.parse(req.responseText);
			printData(json);
		} catch (e) {
			if (e instanceof SyntaxError) // invalid json document received
				document.getElementById("error").style.display = "block";
				document.getElementById("container").style.opacity = "0.2";
				console.log('api returned invalid json')/*TODO*/;
			throw e;
		}
	};
	req.send();
}

function printData(json) {

	json.forEach(function (departure) {
		console.log(departure)
		var departureRow = document.createElement('tr');
		var now = new Date();
		var departureTime = new Date(departure.timeReal);
		var difference = new Date(departureTime - now);

		var line = departure.line;

		if (line.indexOf("U") > -1) {
			line = '<img src="assets/u' + line.charAt(1)+ '.svg" width="40" height="40" />';
		} else if (line.indexOf("D") > -1 || line.match(/^[0-9]+$/) != null) {
			line = '<span class="tram">' + line + '</span>';
		} else if (line.indexOf("A") > -1) {
			line = '<span class="bus">' + line + '</span>';
		} else if (line.indexOf("N") > -1) {
			line = '<span class="nightline">' + line + '</span>';
		}

		var timeString = '<b>' + addZeroBefore(departureTime.getHours()) +
			':' + addZeroBefore(departureTime.getMinutes()) +
			'</b>&nbsp;+' + addZeroBefore(difference.getMinutes()) +
			'm' + addZeroBefore(difference.getSeconds()) + 's';
		departureRow.innerHTML = '<tr><td class="time ' + departure.timeClass +
			'">' + timeString + '</td>' +
			'<td>' + line + '</td><td>' + departure.stop +
			'</td><td>' + capitalizeFirstLetter(departure.towards) +
			'</td>';
		document.querySelector('tbody').appendChild(departureRow);
	})

}

window.onload = function () {
	update();
	clock();
	window.setInterval(clock, 1000);
	//window.setInterval(update, 10000);
};
