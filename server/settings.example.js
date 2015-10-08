'use strict';

var key = 'XXXXXXXXXX';
var ids = [
  '252','269',   // Rathaus 2er
  '4205','4210', // Rathaus U2

  '1346',        // Landesgerichtsstraße 43er/44er & N43 (nur stadtauswärts)

  '18',          // Schottentor 1er & N25
  '1212',        // Schottentor 37
  '1303',        // Schottentor 40A
  '3701',        // Schottentor N36
  '5568',        // Schottentor N41

  '1401',        // Volkstheater 48A
  '1440',        // Volkstheater 49er (nur stadtauswärts)
  '4909','4908', // Volkstheater U3

  '1376',        // Auerspergstraße 46er (nur stadtauswärts)
  '5691',        // Auerspergstraße N46
];

var url = [
  'http://www.wienerlinien.at/ogd_realtime/monitor?sender=',
  key,
  '&rbl=',
  ids.join('&rbl='),
].join('');

module.exports = {
  api: {
    key: key,
    ids: ids,
    url: url,
  },
  cache: {
    msec: 6000, // Cache API responses for this many milliseconds; default: 6s
  },
  server: {
    port: 8080,	// Port to listen on
  },
};
