const express = require('express')
const http = require('http')
const apicache = require('apicache')
const settings = require(__dirname + '/settings.js');

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

const getData = (cb) => {
	return http.get(settings.api_url, (response) => {
		let data = '';
		response.on('data', (chunk) => data += chunk);
		response.on('end', () => {
			const json = JSON.parse(data);
			flatten(json, cb);
		});
		response.on('error', (err) => console.log(err));
	}).on('error', (err) => console.log(err));
}

const getOSRM	= (coordinates) => {
	const findCoordinates = (element) => {
		return element.coordinates[0] === coordinates[0] &&
			element.coordinates[1] === coordinates[1];
	}

	if (walkcache.find(findCoordinates)) {
		console.log('OSRM: cached', coordinates)
		return walkcache.find(findCoordinates).duration
	}

	console.log('OSRM: new request for', coordinates)
	const url = settings.osrm_api_url +
		coordinates[0] + ',' +
		coordinates[1] + '?overview=false';

	let duration = 0;
	const request = http.get(url, (response) => {
		let data = '';
		response.on('data', (chunk) => data += chunk);
		response.on('end', () => {
			duration = JSON.parse(data).routes[0].duration;
			if (!walkcache.find(findCoordinates)) {
				walkcache.push({ coordinates: coordinates, duration: duration })
			}
		});
		response.on('error', (err) => console.log(err));
	}).on('error', (err) => console.log(err));

	return duration;
}

const flatten = (json, cb) => {
	let data = [];
	json.data.monitors.map((monitor, i) => {
		monitor.lines.map(line => {
			line.departures.departure.map(departure => {
				let walkDuration = getOSRM(monitor.locationStop.geometry.coordinates);
				let walkStatus = '';
				if (walkDuration * 0.9 > departure.departureTime.countdown * 60) {
					walkStatus = 'too late';
				} else if (walkDuration + 2 * 60 > departure.departureTime.countdown * 60) {
					walkStatus = 'hurry';
				} else if (walkDuration + 5 * 60 > departure.departureTime.countdown * 60) {
					walkStatus = 'soon';
				}
				data.push({
					'stop': monitor.locationStop.properties.title,
					'coordinates': monitor.locationStop.geometry.coordinates,
					'line': line.name,
					'towards': departure.vehicle ? departure.vehicle.towards : line.towards,
					'barrierFree': line.barrierFree,
					'timePlanned': departure.departureTime.timePlanned,
					'timeReal': departure.departureTime.timeReal ? departure.departureTime.timeReal : departure.departureTime.timePlanned,
					'countdown': departure.departureTime.countdown,
					'walkDuration': walkDuration,
					'walkStatus': walkStatus
				});
			})
		})
	})

	data.sort((a, b) => {
		return (a.timeReal < b.timeReal) ? -1 : ((a.timeReal > b.timeReal) ? 1 : 0);
	})
	cb(data);
}
