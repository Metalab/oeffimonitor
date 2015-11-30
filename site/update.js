/***
 * Öffimonitor - display the Wiener Linien timetable for nearby bus/tram/subway
 * lines on a screen in the Metalab Hauptraum
 *
 * Copyright (C) 2015   Moritz Wilhelmy
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

/**** table functions ****/
/* these might be prettier in OO, but I really don't care enough right now */
function make_table(head)
{
	var table = document.createElement('table');
	var thead = document.createElement('thead');
	var tbody = document.createElement('tbody');
	var tr = document.createElement('tr');

	for (var i = 0; i < head.length; i++) {
		var td = document.createElement("td");
		td.appendChild(document.createTextNode(head[i]));
		tr.appendChild(td);
	}

	thead.appendChild(tr);
	table.appendChild(thead);
	table.appendChild(tbody);
	return table;
}

function make_row(table, entry)
{
	var currentTime = new Date().getTime();
	var waitTimeString = formatTime(entry.timestamp);
	var waitMs = entry.timestamp - currentTime;
	var waitMinutes = Math.floor(waitMs / 60000);
	var waitHours = Math.floor(waitMinutes / 60);
	if (waitHours) {
		waitMinutes -= 60;
	}
	var waitSeconds = ((waitMs % 60000) / 1000).toFixed(0);

	if (waitMs < 0 || waitMs < entry.unreachTime*1000) { return false; }

	var tr = document.createElement("tr");
	var tdTime = document.createElement("td");
	if (waitMs < entry.walkTime * 1000) {
		tdTime.className = "time supersoon";
	} else if (waitMs < (entry.walkTime + 180) * 1000) {
		tdTime.className = "time soon";
	} else {
		tdTime.className = "time";
	}

	var tdTimeString = document.createElement("b");
	tdTimeString.appendChild(document.createTextNode(waitTimeString));
	tdTime.appendChild(tdTimeString);

	tdTime.appendChild(document.createTextNode("\u00A0+" + (waitHours ? waitHours + 'h' : '') + (waitMinutes < 10 ? '0' : '') + waitMinutes + "m" + /*(waitSeconds < 10 ? '0' : '') + */Math.floor(waitSeconds / 10) + "0s"));
	tr.appendChild(tdTime);

	var tdLine = document.createElement("td");

	if (typeof entry.line === "object") {
		tdLine.appendChild(entry.line);
	} else {
		tdLine.appendChild(document.createTextNode(entry.line));
	}
	tr.appendChild(tdLine);

	var tdStop = document.createElement("td");
	tdStop.appendChild(document.createTextNode(entry.stop));
	tr.appendChild(tdStop);

	var tdTowards = document.createElement("td");
	console.log(capitalizeFirstLetter(entry.towards));
	tdTowards.appendChild(document.createTextNode(capitalizeFirstLetter(entry.towards)));
	tr.appendChild(tdTowards);

	table.lastChild.appendChild(tr);
}

function display_table(table)
{
	var overviewElement;

	// fall back to inserting into document.body if no previous "overview"
	// element was found
	var parentElement = document.getElementById('container');

	// dispose of the previous display table (if any)
       	if ((overviewElement = document.getElementById('overview'))) {
		parentElement = overviewElement.parentElement;
		parentElement.removeChild(overviewElement);
	}

	table.id = 'overview';
	parentElement.appendChild(table);
}
/**** end of table stuff ****/

function update_view(json)
{
	var table = make_table(["Fährt um/in", "Linie", "Ab", "Nach"]);
	var mon = json.data.monitors;

	var values = [];

	// XXX This part particularly unfinished:
	// TODO sort by time
	for (var i = 0; i < mon.length; i++) {
		var lines = mon[i].lines;
		var walkTime = walkTimes[mon[i].locationStop.properties.title] ? walkTimes[mon[i].locationStop.properties.title].walkTime : 480;
		var unreachTime = walkTimes[mon[i].locationStop.properties.title] ? walkTimes[mon[i].locationStop.properties.title].unreachTime : 0;

		for (var l = 0; l < lines.length; l++) {

			if (mon[i].lines[l].towards !== "BETRIEBSSCHLUSS ! BENÜTZEN SIE BITTE DIE NIGHTLINE" &&
				mon[i].lines[l].name !== "VRT") {
				var dep = mon[i].lines[l].departures.departure;
			} else {
				continue;
			}

			for (var j = 0; j < dep.length; j++) {
				if (dep[j].departureTime.timeReal === undefined && dep[j].departureTime.timePlanned === undefined) {
					console.log({"timestamp": dep[j].departureTime.timePlanned, "walkTime": walkTime, "unreachTime": unreachTime, "line": formatLines(lines[l].name), "stop": mon[i].locationStop.properties.title, "towards": lines[l].towards});
				} else if (dep[j].departureTime.timeReal === undefined) {
					values[values.length] = {"timestamp": formatTimestamp(dep[j].departureTime.timePlanned), "walkTime": walkTime, "unreachTime": unreachTime, "line": formatLines(lines[l].name), "stop": mon[i].locationStop.properties.title, "towards": lines[l].towards};
				} else {
					values[values.length] = {"timestamp": formatTimestamp(dep[j].departureTime.timeReal), "walkTime": walkTime, "unreachTime": unreachTime, "line": formatLines(lines[l].name), "stop": mon[i].locationStop.properties.title, "towards": lines[l].towards};
				}
			}
		}
	}

	values.sort(function(a, b) {
		return a.timestamp - b.timestamp;
		//return parseFloat(a.timestamp + a.walkTime * 60 * 1000) - parseFloat(b.timestamp + b.walkTime * 60 * 1000);
	});

	for (var i = 0; i < values.length; i++) {
		console.log(values[i]);
		make_row(table, values[i]);
	}

	display_table(table);
}

function formatTime(timestamp) {
	var date = new Date(timestamp);
	var hours = "0" + date.getHours();
	var minutes = "0" + date.getMinutes();

	var formattedTime = hours.substr(-2) + ':' + minutes.substr(-2);
	return formattedTime;
}

function capitalizeFirstLetter(str)
{
    return str.replace(/\w[^- ]*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function formatTimestamp(timestamp)
{
	var isoStamp = timestamp.split('.')[0] + '+' + timestamp.split('.')[1].split('+')[1].match(/.{2}/g)[0] + ':00';
	var depTime = new Date(isoStamp).getTime();
	return depTime;
}

function formatLines(line)
{
	if (line === "U2") {
		var img = document.createElement("img");
		img.src = "piktogramme/u2.svg";
		img.width = 40;
		img.height = 40;
		return img;
	} else if (line === "U3") {
		var img = document.createElement("img");
		img.src = "piktogramme/u3.svg";
		img.width = 40;
		img.height = 40;
		return img;
	} else if (line.indexOf("D") > -1 || line.match(/^[0-9]+$/) != null) {
		var element = document.createElement("span");
		element.className = "tram";
		element.innerHTML = line;
		return element;
	} else if (line.indexOf("A") > -1) {
		var element = document.createElement("span");
		element.className = "bus";
		element.innerHTML = line;
		return element;
	} else if (line.indexOf("N") > -1) {
		var element = document.createElement("span");
		element.className = "nightline";
		element.innerHTML = line;
		return element;
	} else {
		return line;
	}
}

function update()
{
	document.getElementById("error").style.display = "none";
	document.getElementById("container").style.opacity = "1";

	var currentTime = new Date();
	document.getElementById('currentTime').innerHTML = (currentTime.getHours() < 10 ? '0' : '') + currentTime.getHours() + ":" + (currentTime.getMinutes() < 10 ? '0' : '') + currentTime.getMinutes();
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
			update_view(json);
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

window.onload = function () {
	update();
	window.setInterval(update, 10000);
};
