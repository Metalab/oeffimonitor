// add your API key here
// const api_key = 'XXXXXXXXXX';

// define all RBLs of stops you want to display
const api_ids = [
  "252",    // Rathaus – 2 (Richtung Friedrich-Engels-Platz)
  "269",    // Rathaus – 2 (Richtung Ottakringer Str./Erdbrustgasse)
  "4205",   // Rathaus – U2 (Richtung Karlsplatz)
  "4210",   // Rathaus – U2 (Richtung Seestadt)
  "1346",   // Landesgerichtsstraße – 43, 44, N43 (stadtauswärts)
  "1212",   // Schottentor – 37, 38, 40, 41, 42 (stadtauswärts)
  "1303",   // Schottentor — 40A (stadtauswärts)
  "3701",   // Schottentor – N38 (stadtauswärts, nur am Wochenende)
  "5568",   // Schottentor – N41 (stadtauswärts)
  "17",     // Rathausplatz/Burgtheater – D, 1, 71, N25, N38, N60, N66 (Richtung Schottentor, Nachtbusse nur wochentags)
  "48",     // Stadiongasse/Parlament – D, 1, 71 (Richtung Volkstheater)
  "16",     // Stadiongasse/Parlament – D, 1, 2, 71 (Richtung Schottentor)
  "1401",   // Volkstheater – 48A (stadtauswärts)
  "1440",   // Volkstheater – 49 (stadtauswärts)
  "4908",   // Volkstheater – U3 (Richtung Ottakring)
  "4909",   // Volkstheater – U3 (Richtung Simmering)
  "1376",   // Auerspergstraße – 46 (stadtauswärts)
  "5691",   // Auerspergstraße – N46 (stadtauswärts)
];

const api_url = 'https://www.wienerlinien.at/ogd_realtime/monitor' +
  '?activateTrafficInfo=stoerunglang' +
//  `&sender=${api_key}`+
  '&rbl=' + api_ids.join("&rbl=");


// define filters to exclude specific departures from the monitor
// currently you can exclude lines as a whole or only at certain stops
const filters = [
  {
    line: ['VRT'],  // excludes whole line (VRT = tourist line)
  },
  {
    line: ['D', '1', '71'],
    stop: ['Rathausplatz/Burgtheater'], // excludes lines only at given stop
  },
  {
    line: ['2'],
    stop: ['Stadiongasse/Parlament'],
  },
];

// define your current location
const location_coordinate = '16.3509389,48.2103151'

// define OSRM server for routing to stops. Empty string to disable feature
const osrm_api_url = 'https://router.project-osrm.org/route/v1/foot/' + location_coordinate + ';'


module.exports = {
  'api_url'         : api_url,
//  'api_key'         : api_key,
  'api_ids'         : api_ids,
  'filters'         : filters,
  'api_cache_msec'  : 6000,   // cache API responses for this many milliseconds; default: 6s
  'listen_port'     : 8080,   // port to listen on
  'osrm_api_url'    : osrm_api_url
};
