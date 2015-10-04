'use strict';

import http from 'http';


// if environment is development start on port 1337, else on 80
const port = process.env.NODE_ENV === 'production' ? 80 : 1337;

// insert wienerlinien api key here
const api_key = 'XXXXXXXXXXX';

const api_ids = [
  '252','269', // Rathaus 2er
  '4205','4210', // Rathaus U2

  '1346', // Landesgerichtsstraße 43er/44er & N43 (nur stadtauswärts)

  '18', // Schottentor 1er & N25
  '1212', // Schottentor 37
  '1303', // Schottentor 40A
  '3701', // Schottentor N36
  '5568', // Schottentor N41

  '1401', // Volkstheater 48A
  '1440', // Volkstheater 49er (nur stadtauswärts)
  '4909', '4908', // Volkstheater U3

  '1376', // Auerspergstraße 46er (nur stadtauswärts)
  '5691' // Auerspergstraße N46
];

// first start the server
const server = http.createServer((req, res) => {

  // construct api url
  let api_url = 'http://www.wienerlinien.at/ogd_realtime/monitor?rbl=';
  api_url += api_ids.join('&rbl=');
  api_url += `&sender=${api_key}`;

  // get the data from the wienerlinien api
  http.get(api_url, getResult => {

    // used to collect the full response in case there are chunks
    let responseData = '';
  
    // all error codes are higher than 400
    if (getResult.statusCode > 400) {
      console.log('http request errored', getResult.statusCode);
    }

    // this gets called each time data gets returned by the wienerlinien
    getResult.on('data', data => {
      responseData += data.toString();
    });

    // this function gets called once the wienerlinien tell us that they sent all data.
    getResult.on('end', () => {
      res.end(responseData);
    });

  }).on('error', e => {
    console.log(`Got error: ${e.message}`);
  });

});

server.listen(port, () => {
  console.log('server listening to port', port);
});
