const express = require('express')
const http = require('http')
const url = require('url')
const apicache = require('apicache')
const settings = require(__dirname + '/settings.js');
const package = require(__dirname + '/../package.json');

let app = express()
let cache = apicache.middleware
let walkcache = []

app.use(express.static('site'));

app.get('/api', cache(settings.api_cache_msec), (req, res) => {
	console.log('API: new request')
	getData((data) => res.json(data));
})

app.listen(settings.listen_port, () => {
	console.log('Server up on port', settings.listen_port);
});

const errorHandler = (error, cb) => {
	console.error(error);
	cb({
		status: 'error',
		error: error
	});
}

const getData = (cb) => {
	return http.get(settings.api_url, (response) => {
		let data = '';
		response.on('data', (chunk) => data += chunk);
		response.on('end', () => {
			try {
				const json = JSON.parse(data);
				flatten(json, cb);
			} catch (e) {
				errorHandler('API response invalid JSON', cb);
			}
		});
		response.on('error', (err) => errorHandler('API response failed', cb));
	}).on('error', (err) => errorHandler('API request failed', cb));
}

const getOSRM = (coordinates) => {
	if (!settings.osrm_api_url) {
		// no OSRM server defined
		return;
	}

	const findCoordinates = (element) => {
		return element.coordinates[0] === coordinates[0] &&
			element.coordinates[1] === coordinates[1];
	}

	if (walkcache.find(findCoordinates)) {
		return walkcache.find(findCoordinates).duration
	}

	console.log('OSRM: new request for', coordinates)
	const osrm_url = url.parse(settings.osrm_api_url +
		coordinates[0] + ',' +
		coordinates[1] + '?overview=false');

	let duration;

	http.get({
		protocol: osrm_url.protocol,
		host: osrm_url.host,
		path: osrm_url.path,
		headers: {
			'User-Agent': 'Öffimonitor/' + package.version + ' <https://github.com/metalab/oeffimonitor>',
		}
	}, (response) => {
		let data = '';
		response.on('data', (chunk) => data += chunk);
		response.on('end', () => {
			try {
				duration = JSON.parse(data).routes[0].duration;
				if (!walkcache.find(findCoordinates)) {
					walkcache.push({ coordinates: coordinates, duration: duration })
				}
			} catch (e) {
				console.error('OSRM API response invalid JSON', data);
			}
		});
		response.on('error', (err) => console.error(err));
	}).on('error', (err) => console.error(err));

	return duration;
}

const flatten = (json, cb) => {
	let data = [];
	let now = new Date();
	json.data.monitors.map((monitor, i) => {
		monitor.lines.map(line => {

			// don't add departures on excluded lines
			if (settings.exclude_lines && settings.exclude_lines.indexOf(line.name) > -1) {
				return;
			}
			line.departures.departure.map(departure => {
				// calculate most accurate known departure time
				let time;

				if (departure.departureTime.timeReal) {
					// if realtime data is available, use that
					time = new Date(departure.departureTime.timeReal);
				} else if (departure.departureTime.timePlanned) {
					// if not, use scheduled data
					time = new Date(departure.departureTime.timePlanned);
				} else if (line.towards.indexOf('NÄCHSTER ZUG') > -1 &&
						line.towards.indexOf(' MIN') > -1) {
					// if that's not available, try to find departure time elsewhere
					let countdown = line.towards.split(' MIN')[0].substr(-2, 2); // grab last two chars before ' MIN'
					time = new Date();
					time.setMinutes(time.getMinutes() + parseInt(countdown));
				} else {
					console.warn({
						'stop': monitor.locationStop.properties.title,
						'line': line.name,
						'towards': departure.vehicle ? departure.vehicle.towards : line.towards,
					});
					return; // connection does not have any time information -> log & skip
				}

				let walkDuration = getOSRM(monitor.locationStop.geometry.coordinates);
				let differenceToNow = (time.getTime() - now.getTime()) / 1000;
				let walkStatus;

				if (typeof walkDuration === 'undefined') {
					// no walkDuration, no walkStatus
				} else if (walkDuration * 0.9 > differenceToNow) {
					walkStatus = 'too late';
				} else if (walkDuration + 2 * 60 > differenceToNow) {
					walkStatus = 'hurry';
				} else if (walkDuration + 5 * 60 > differenceToNow) {
					walkStatus = 'soon';
				}

				time = time.toISOString();

				data.push({
					'stop': monitor.locationStop.properties.title,
					'coordinates': monitor.locationStop.geometry.coordinates,
					'line': line.name,
					'type': departure.vehicle ? departure.vehicle.type : line.type,
					'towards': departure.vehicle ? departure.vehicle.towards : line.towards,
					'barrierFree': line.barrierFree,
					'time': time,
					'timePlanned': departure.departureTime.timePlanned,
					'timeReal': departure.departureTime.timeReal,
					'countdown': departure.departureTime.countdown,
					'walkDuration': walkDuration,
					'walkStatus': walkStatus
				});
			})
		})
	})

	data.sort((a, b) => {
		return (a.time < b.time) ? -1 : ((a.time > b.time) ? 1 : 0);
	})
	cb(data);
}
