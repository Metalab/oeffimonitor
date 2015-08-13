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

var api_key = 'XXXXXXXXXX';
//var api_url = 'http://www.wienerlinien.at/ogd_realtime/monitor?rbl=4205&rbl=4210&rbl=252&rbl=269&sender=' + api_key;
var api_url = '../test/response.json'; // local copy for testing

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

function make_row(table, entries)
{
	var tr = document.createElement("tr");

	for (var i = 0; i < entries.length; i++) {
		var td = document.createElement("td");
		td.appendChild(document.createTextNode(entries[i]));
		tr.appendChild(td);
	}

	table.lastChild.appendChild(tr);
}

function display_table(table)
{
	var overviewElement;

	// fall back to inserting into document.body if no previous "overview"
	// element was found
	var parentElement = document.body;

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
	var table = make_table(["Zeit", "Linie", "Ab", "Nach"]);
	var mon = json.data.monitors;

	// XXX This part particularly unfinished:
	// TODO sort by time
	for (var i = 0; i < mon.length; i++) {
		var lines = mon[i].lines;
		for (var l = 0; l < lines.length; l++) {
			var dep = mon[i].lines[l].departures.departure;
			for (var j = 0; j < dep.length; j++)
				make_row(table, [
					dep[j].departureTime.timePlanned,
					lines[l].name,
					mon[i].locationStop.properties.title,
					lines[l].towards
				]);
		}
	}

	display_table(table);
}

function update()
{
	var req = new XMLHttpRequest();
	req.open('GET', api_url);
	req.onreadystatechange = function () {

		if (req.readyState !== 4)
		       return;

		// req.status == 0 in case of a local file (e.g. json file saved for testing)
		if (req.status !== 200 && req.status !== 0)
			return; /* FIXME warning in case of multiple errors? */

		try {
			var json = JSON.parse(req.responseText);
			update_view(json);
		} catch (e) {
			if (e instanceof SyntaxError) // invalid json document received
				alert('wienerlinien returned invalid json')/*TODO*/;
			throw e;
		}
	};
	req.send();
}

window.onload = function () {
	update();
	window.setInterval(update, 15000);
};
