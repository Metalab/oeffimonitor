# Öffimonitor

Displays an info screen with the next Wiener Linien public transport connections nearby. It was developed and is currently in use at [Metalab](https://metalab.at).

It includes a small server written in Node.js that pulls the needed data from the [Wiener Linien API](https://www.data.gv.at/katalog/dataset/add66f20-d033-4eee-b9a0-47019828e698), caches it and serves it together with an HTML5 frontend. At Metalab, [all of this runs](https://metalab.at/wiki/%C3%96ffimonitor) on a Raspberry Pi, which also displays the frontend on a spare monitor (check out ```util``` for reproduction).

![Screenshot of Öffimonitor running at Metalab](https://metalab.at/wiki/images/b/b0/Oeffimonitor_screenshot.png)

## Usage

1.  Run ```npm install``` to fetch dependencies.
2.  Move ```server/settings.example.js``` to ```server/settings.js``` and
  1. Add your API key (mandatory, [get one here](http://www.wienerlinien.at/eportal3/ep/channelView.do?pageTypeId=66528&channelId=-48664)).
  2. Most likely you will also want to change the ```api_ids``` to the RBL numbers that correspond to the stops you want to include ([find them here](https://till.mabe.at/rbl/)) and change the ```location_coordinate``` to the location of your Öffimonitor.
  3. Change additional settings (optional).
3.  Run ```npm start```
4.  Open Öffimonitor in a browser of your choice.

## API

Besides the HTML frontend you can find a JSON API at ```/api```. It returns a status message, an array of departures and an array of warnings, which include all traffic infos of the type ```stoerunglang``` from the Wiener Linien API.

### Example response

    {
      "status": "ok",                       // 'ok' or 'error'
      "departures":[{
        "stop": "Landesgerichtsstraße",
        "coordinates": [16.3568570699034,48.2145510683941],
        "line": "43",
        "type": "ptTram",
        "towards": "Neuwaldegg",
        "barrierFree": true,
        "time": "2017-02-14T18:54:14.000Z", // calculated most accurate departure time
        "timePlanned": "2017-02-14T19:52:00.000+0100",
        "timeReal": "2017-02-14T19:54:14.000+0100",
        "countdown": 6,
        "walkDuration": 197.9,              // walking duration to stop in seconds
        "walkStatus": "soon"                 // 'too late', 'hurry' or 'soon'
      }],
      "warnings": [{
        "title": "43 : Fremder Verkehrsunfall",
        "description": "Nach einer Fahrtbehinderung kommt es auf der Linie 43 zu unterschiedlichen Intervallen."
      }]
    }

All values without comments are directly taken from the Wiener Linien API. **Attention!** ```timeReal``` does not exist in case there is no real time information available and even ```timePlanned``` might be undefined if the departure time is written into the ```towards``` string (e.g. 'KARLSPLATZ NÄCHSTER ZUG   9 MIN'). In case you need a returned timestamp, rely on ```time```, which always contains the most accurate departure time available.

### Example error response

    {
      "status": "error",
      "error": "API request failed"
    }

## Contributing

We highly appreciate any and all help. If (or better, when) you find a bug, please open an [issue on Github](https://github.com/Metalab/oeffimonitor/issues) – please tag the issue with the Metalab tag, if the issue is specifically about the Öffimonitor at Metalab.

Pull requests are also very welcome, especially if they fix a bug or add features requested in an issue. Please be aware that if you open a PR, you agree with licensing your code under [AGPL-3](#license). You might have noticed that our client-side code has no dependencies and we would like to keep it that way. If you disagree with that approach or want to make bigger changes, please open an issue and discuss things with us first. We might not merge PRs if we feel that the changes do not reflect the usage of Öffimonitor at Metalab, but we're happy about forks as well!

Here's a list of awesome forks:
* https://github.com/maltezacharias/oeffimonitor

## License

This project is licensed under [AGPL-3](COPYING) by [Metalab](https://metalab.at). It includes several external assets in the folder ```site/assets```, namely a bunch of pictograms (all SVG files) which are licensed under [Creative Commons Namensnennung 3.0 Österreich](https://creativecommons.org/licenses/by/3.0/at/deed.de) by Stadt Wien – Wiener Linien as well as the Roboto font (all TTF files) by Google licensed under [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0).

For calculating the walking duration to the stop, Öffimonitor by default queries the [OSRM Demo Server](https://github.com/Project-OSRM/osrm-backend/wiki/Demo-server) and caches these results for the current runtime execution. By using the OSRM Demo Server you agree to this [API usage policy](https://github.com/Project-OSRM/osrm-backend/wiki/Api-usage-policy). The corresponding database is licensed under [ODbL](http://opendatacommons.org/licenses/odbl/) by [OSRM](http://project-osrm.org/). You can change the server address to any other OSRM instance in ```server/settings.js``` or leave it blank to disable the feature.

### Contributors
* Bernhard Hayden [@burnoutberni](https://github.com/burnoutberni)
* Moritz Wilhelmy [@wilhelmy](https://github.com/wilhelmy)
* Jascha Ehrenreich [@jaeh](https://github.com/jaeh)

Happy hacking! <3
