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
'use strict';

import settings from './settings';

/**** table functions ****/

class TableFactory {
  constructor(head) {
    this.table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    const tr    = document.createElement('tr');

    for (let i = 0; i < head.length; i++) {
      const td = document.createElement('td');
      td.appendChild(document.createTextNode(head[i]));
      tr.appendChild(td);
    }

    thead.appendChild(tr);
    this.table.appendChild(thead);
    this.table.appendChild(tbody);
  }

  row(entry) {
    const currentTime = new Date().getTime();
    const waitMs = entry.timestamp - currentTime;
    const waitMinutes = Math.floor(waitMs / 60000);
    const waitSeconds = ((waitMs % 60000) / 1000).toFixed(0);

    if (waitMs < 0 || waitMs < entry.unreachTime*1000) { 
      return false;
    }

    const tr = document.createElement('tr');
    const tdTime = document.createElement('td');
    if (waitMs < entry.walkTime * 1000) {
      tdTime.className = 'time supersoon';
    } else if (waitMs < (entry.walkTime + 180) * 1000) {
      tdTime.className = 'time soon';
    } else {
      tdTime.className = 'time';
    }

    const textNode = document.createTextNode([
      (waitMinutes < 10 ? '0' : ''),
      waitMinutes,
      'm',
      /*(waitSeconds < 10 ? '0' : '') + */
      (Math.floor(waitSeconds / 10) + '0s'),
    ].join(''));

    tdTime.appendChild();
    tr.appendChild(tdTime);

    const tdLine = document.createElement('td');

    if (typeof entry.line === 'object') {
      tdLine.appendChild(entry.line);
    } else {
      tdLine.appendChild(document.createTextNode(entry.line));
    }
    tr.appendChild(tdLine);

    const tdStop = document.createElement('td');
    tdStop.appendChild(document.createTextNode(entry.stop));
    tr.appendChild(tdStop);

    const tdTowards = document.createElement('td');
    tdTowards.appendChild(document.createTextNode(entry.towards));
    tr.appendChild(tdTowards);

    table.lastChild.appendChild(tr);
  }

  display() {
    let overviewElement;

    // fall back to inserting into document.body if no previous 'overview'
    // element was found
    let parentElement = document.getElementById('container');

    // dispose of the previous display table (if any)
    if (overviewElement = document.getElementById('overview')) {
      parentElement = overviewElement.parentElement;
      parentElement.removeChild(overviewElement);
    }

    this.table.id = 'overview';
    parentElement.appendChild(this.table);
  }
}

/**** end of table stuff ****/

function update_view(json) {
  const tableFactory = new TableFactory(['Zeit', 'Linie', 'Ab', 'Nach']);
  const {monitors} = json.data;

  let values = [];

  // XXX This part particularly unfinished:
  // TODO sort by time
  monitors.forEach(monitor => {
    const lines = monitor.lines;
    const walkTime = settings.walkTimes[monitor.locationStop.properties.title].walkTime;
    const unreachTime = settings.walkTimes[monitor.locationStop.properties.title].unreachTime;

    lines.forEach(line => {
      let departures = [];

      if (line.towards.indexOf('BETRIEBSSCHLUSS') < 0 && line.name !== 'VRT') {
        departures = line.departures.departure;
      }

      departures.forEach(dep => {
        const {timePlanned, timeReal} = dep.departureTime;
        if (timeReal === undefined && timePlanned === undefined) {
          console.log({
            timePlanned,
            walkTime,
            unreachTime,
            line: formatLines(line.name),
            stop: monitor.locationStop.properties.title,
            towards: line.towards,
          });
        } else if (timeReal === undefined) {
          values[values.length] = {
            timestamp: formatTimestamp(timePlanned),
            walkTime,
            unreachTime,
            line: formatLines(line.name),
            stop: monitor.locationStop.properties.title,
            towards: line.towards,
          };
        } else {
          values[values.length] = {
            timestamp: formatTimestamp(timeReal),
            walkTime,
            unreachTime,
            line: formatLines(line.name),
            stop: monitor.locationStop.properties.title,
            towards: line.towards,
          };
        }
      });
    });
  });

  values.sort(function(a, b) {
    return a.timestamp - b.timestamp;
    //return parseFloat(a.timestamp + a.walkTime * 60 * 1000) - parseFloat(b.timestamp + b.walkTime * 60 * 1000);
  });

  values.forEach(val => {
    console.log(val);
    tableFactory.row(val);
  });

  tableFactory.display();
}

function formatTimestamp(timestamp) {
  const timeStampArray = timestamp.split('.');
  const hours = timeStampArray[0];
  const minutes = timeStampArray[1].split('+')[1].match(/.{2}/g)[0];
  const isoStamp = `${hours}+${minutes}:00`;
  const depTime = new Date(isoStamp).getTime();
  return depTime;
}

function formatLines(line) {
  if (line === 'U2') {
    const img = document.createElement('img');
    img.src = 'piktogramme/u2.svg';
    img.width = 30;
    img.height = 30;
    return img;
  } else if (line === 'U3') {
    const img = document.createElement('img');
    img.src = 'piktogramme/u3.svg';
    img.width = 30;
    img.height = 30;
    return img;
  } else if (line.indexOf('D') > -1 || line.match(/^[0-9]+$/) != null) {
    const element = document.createElement('span');
    element.className = 'tram';
    element.innerHTML = line;
    return element;
  } else if (line.indexOf('A') > -1) {
    const element = document.createElement('span');
    element.className = 'bus';
    element.innerHTML = line;
    return element;
  } else if (line.indexOf('N') > -1) {
    const element = document.createElement('span');
    element.className = 'nightline';
    element.innerHTML = line;
    return element;
  } else {
    return line;
  }
}

function update() {
  document.getElementById('error').style.display = 'none';
  document.getElementById('container').style.opacity = '1';

  const currentTime = new Date();
	const currentTimeEle = document.getElementById('currentTime');
	const hours = (currentTime.getHours() < 10 ? '0' : '') + currentTime.getHours();
	const minutes = (currentTime.getMinutes() < 10 ? '0' : '') + currentTime.getMinutes();
	currentTimeEle.innerHTML = `${hours}:${minutes}`;

  const req = new XMLHttpRequest();
  req.open('GET', settings.api_url);
  req.onreadystatechange = () => {

    if (req.readyState !== 4) {
       return;
		}

    // req.status == 0 in case of a local file (e.g. json file saved for testing)
    if (req.status !== 200 && req.status !== 0) {
      return; /* FIXME warning in case of multiple errors? */
    }

    try {
      const json = JSON.parse(req.responseText);
      update_view(json);
    } catch (e) {
      if (e instanceof SyntaxError) { // invalid json document received
        document.getElementById('error').style.display = 'block';
      }

      document.getElementById('container').style.opacity = '0.2';
      console.log('wienerlinien returned invalid json'); /*TODO*/
      throw e;
    }
  };
  req.send();
}

window.onload = () => {
  update();
  window.setInterval(update, 10000);
};
