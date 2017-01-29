# Öffimonitor

Display the timetable for nearby public transport lines in Vienna, Austria on an info screen. It was developed and is currently in use at [Metalab](https://metalab.at).

It includes a small server written in Node.js that pulls the needed data from the [Wiener Linien API](https://www.data.gv.at/katalog/dataset/add66f20-d033-4eee-b9a0-47019828e698), caches it and serves it together with an HTML5 frontend. At Metalab, [all of this runs](https://metalab.at/wiki/%C3%96ffimonitor) on a Raspberry Pi, which also displays the frontend on a spare monitor (check out ```utils``` for reproduction).

## Usage

1.  Run ```npm install``` to fetch dependencies.
2.  Move ```server/settings.example.js``` to ```server/settings.js``` and
  1. Add your API key (mandatory, [get one here](http://www.wienerlinien.at/eportal3/ep/channelView.do?pageTypeId=66528&channelId=-48664)).
  2. Most likely you will also want to change the ```api_ids``` to the RBL numbers that correspond to the stations you want to include ([find them here](https://till.mabe.at/rbl/)) and change the ```location_coordinate``` to the location of your Öffimonitor.
  3. Change additional settings (optional).
3.  Run ```npm start```
4.  Open Öffimonitor in a browser of your choice.

## API

Besides the HTML frontend you can find a JSON API at ```/api```. It returns an array of objects, each object represents one departure, e.g.:

    {
      "stop":"Volkstheater",
      "coordinates":[16.3591657401836,48.205583461748],
      "line":"U3",
      "type":"ptMetro",
      "towards":"SIMMERING",
      "barrierFree":true,
      "timePlanned":"2017-01-20T23:37:54.000+0100",
      "timeReal":"2017-01-20T23:37:54.000+0100",
      "countdown":4,
      "walkDuration":255,   // walking duration to station in seconds
      "walkStatus":"hurry"  // 'too late', 'hurry' or 'soon'
    }

## License

This project is licensed under [AGPL-3](COPYING). It includes several external assets in the folder ```site/assets```, which are licensed under [Creative Commons Namensnennung 3.0 Österreich](https://creativecommons.org/licenses/by/3.0/at/deed.de) by Stadt Wien – Wiener Linien (all SVG files) as well as the Roboto font by Google licensed under [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0) (all TTF files).

Happy hacking!
