const express = require('express')
const http = require('http')
const url = require('url')
const apicache = require('apicache')
const settings = require(__dirname + '/settings.js');
const package = require(__dirname + '/../package.json');

let app = express()
let cache = apicache.middleware
let walkcache = []

app.use(express.static(__dirname + '/../site'));

app.get('/api', cache(settings.api_cache_msec), (req, res) => {
	console.log('API: new request')
	getData((data) => res.json(data));
})

app.listen(settings.listen_port, () => {
	console.log('Server up on port', settings.listen_port);
});

const requestLoopOSRM = () => {
	// check if unrequested walk duration was added to cache
	const next = walkcache.find((element) => element.requested === false)

	// if not, do nothing
	if (next === undefined) {
		return
	}

	// if yes, set requested to true to remove from queue
	next.requested = true

	console.log('OSRM: new request for', next.coordinates)
	const osrm_url = url.parse(settings.osrm_api_url +
		next.coordinates[0] + ',' +
		next.coordinates[1] + '?overview=false');

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
				next.duration = JSON.parse(data).routes[0].duration;
				console.log('resolved for', next.coordinates, next.duration)
			} catch (e) {
				console.error('OSRM API response invalid JSON', data);
			}
		});
		response.on('error', (err) => console.error(err));
	}).on('error', (err) => console.error(err));
}

// rate limiting to once per second
setInterval(requestLoopOSRM, 1000)

const errorHandler = (error, cb) => {
	console.error(error);
	cb({
		status: 'error',
		error: error
	});
}

const getData = (cb) => {
	http.get(settings.api_url, (response) => {
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

const getWalkDuration = (coordinates) => {
	if (!settings.osrm_api_url) {
		// no OSRM server defined
		return undefined;
	}

	const findCoordinates = (element) => {
		return element.coordinates[0] === coordinates[0] &&
			element.coordinates[1] === coordinates[1];
	}

	// if cached, fetch from cache
	if (walkcache.find(findCoordinates)) {
		return walkcache.find(findCoordinates).duration
	}
	
	// else push to cache queue
	walkcache.push({ coordinates: coordinates, duration: undefined, requested: false })
	return undefined;
}

const flatten = (json, cb) => {
	let data = [];
	let warnings = [];
	let now = new Date();
	json.data.monitors.map(monitor => {
		monitor.lines.map(line => {

			// filter stuff as defined in settings.filters
			if (settings.filters && !!settings.filters.find(filter => {
				const keys = Object.keys(filter);
				// check if there is a filter with only stop and line defined
				if (keys.length === 2 && !!filter.stop && !!filter.line) {
					// filter if both stop and line match
					return filter.stop.indexOf(monitor.locationStop.properties.title) > -1
						&& filter.line.indexOf(line.name) > -1;
				}
				// else check if there is a filter for the whole line
				return keys.length === 1 && keys[0] === 'line' && filter.line.indexOf(line.name) > -1
			})) {
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
						'departure': departure
					});
					return; // connection does not have any time information -> log & skip
				}

				let walkDuration = getWalkDuration(monitor.locationStop.geometry.coordinates);
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
					'line': departure.vehicle && departure.vehicle.name ? departure.vehicle.name : line.name,
					'type': departure.vehicle && departure.vehicle.type ? departure.vehicle.type : line.type,
					'towards': departure.vehicle && departure.vehicle.towards ? departure.vehicle.towards : line.towards,
					'barrierFree': departure.vehicle && departure.vehicle.barrierFree ? departure.vehicle.barrierFree : line.barrierFree,
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

	if (json.data.trafficInfos) {
		warnings = json.data.trafficInfos.map(trafficInfo => {
			return { title: trafficInfo.title, description: trafficInfo.description };
		})
	}

	cb({ status: 'ok', departures: data, warnings: warnings });
}
