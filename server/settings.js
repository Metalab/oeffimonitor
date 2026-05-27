let api_ids = [
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

let api_url = 'https://www.wienerlinien.at/ogd_realtime/monitor' +
  '?activateTrafficInfo=stoerunglang' +
//  `&sender=${api_key}`+
  '&rbl=' + api_ids.join("&rbl=");

let filters = [
  {
    line: ['VRT'],  
  },
  {
    line: ['D', '1', '71'],
    stop: ['Rathausplatz/Burgtheater'], 
  },
  {
    line: ['2'],
    stop: ['Stadiongasse/Parlament'],
  },
];

let location_coordinate = '16.3509389,48.2103151'

let osrm_api_url = 'https://router.project-osrm.org/route/v1/foot/' + location_coordinate + ';'


module.exports = {
  'api_url'         : api_url,
//  'api_key'         : api_key,
  'api_ids'         : api_ids,
  'filters'         : filters,
  'api_cache_msec'  : 6000,   
  'listen_port'     : 8080,   
  'osrm_api_url'    : osrm_api_url
};
