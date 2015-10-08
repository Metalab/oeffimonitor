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
 
'use strict';

import settings from './settings';

/**** Table functions ****/
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

    if (waitMs < 0 || waitMs < entry.unreachTime * 1000) {
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

    tdTime.appendChild(textNode);
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

    this.table.lastChild.appendChild(tr);
  }

  display() {
    let overviewElement;

    // Fall back to inserting into document.body if no previous 'overview'
    // Element was found
    let parentElement = document.getElementById('container');

    // Dispose of the previous display table (if any)
    if (overviewElement = document.getElementById('overview')) {
      parentElement = overviewElement.parentElement;
      parentElement.removeChild(overviewElement);
    }

    this.table.id = 'overview';
    parentElement.appendChild(this.table);
  }
}

/**** End of table stuff ****/

function updateView(json) {
  const tableFactory = new TableFactory(['Zeit', 'Linie', 'Ab', 'Nach']);
  const {monitors} = json.data;

  let values = [];

  // XXX This part particularly unfinished:
  // TODO sort by time
  monitors.forEach(monitor => {
    const lines = monitor.lines;
    const {title} = monitor.locationStop.properties.title;
    const {walkTimes} = settings;
    const walkTime = walkTimes[title].walkTime;
    const unreachTime = walkTimes[title].unreachTime;

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

    /*
    // Complicated offsetTime calculation
    const offsetTime = parseFloat(a.timestamp + a.walkTime * 60 * 1000);
    offsetTime -= parseFloat(b.timestamp + b.walkTime * 60 * 1000);
    return offsetTime
    */
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

  const time = new Date();
  const timeEle = document.getElementById('currentTime');
  const hours = (time.getHours() < 10 ? '0' : '') + time.getHours();
  const minutes = (time.getMinutes() < 10 ? '0' : '') + time.getMinutes();
  timeEle.innerHTML = `${hours}:${minutes}`;

  const req = new XMLHttpRequest();
  req.open('GET', settings.api.url);
  req.onreadystatechange = () => {

    if (req.readyState !== 4) {
      return;
    }

    // Local File: req.status == 0 (e.g. json file saved for testing)
    if (req.status !== 200 && req.status !== 0) {
      /* FIXME warning in case of multiple errors? */
      return;
    }

    try {
      const json = JSON.parse(req.responseText);
      updateView(json);
    } catch (e) {
      if (e instanceof SyntaxError) { // Invalid json document received
        document.getElementById('error').style.display = 'block';
      }

      document.getElementById('container').style.opacity = '0.2';
      /* TODO */
      console.log('wienerlinien returned invalid json');
      throw e;
    }
  };
  req.send();
}

window.onload = () => {
  update();
  window.setInterval(update, 10000);
};
