# Öffimonitor

Display the Wiener Linien timetable for nearby bus/tram/subway lines on a
screen in the Metalab Hauptraum.

Written in Javascript for use on a Raspberry Pi in a CSS3 capable browser in Kiosk mode.

## Usage

1.  Run ```npm install``` to fetch dependencies.
2.  Move ```server/settings.example.js``` to ```server/settings.js``` and add your API key and change the listen port and other settings.
3.  Run ```npm start```
4.  Open Öffimonitor in a browser of your choice.

## API

Besides the HTML frontend you can find a JSON API at ```/api```. It returns an array of objects, each object represents one departure, e.g.:

    {
      "stop":"Volkstheater",
      "coordinates":[16.3591657401836,48.205583461748],
      "line":"U3",
      "towards":"SIMMERING",
      "barrierFree":true,
      "timePlanned":"2017-01-20T23:37:54.000+0100",
      "timeReal":"2017-01-20T23:37:54.000+0100",
      "countdown":0,
      "walkDuration":0,               // walking duration to station in seconds
      "walkStatus":"too late"         // 'too late', 'hurry' or 'soon'
    }

## License

This project is licensed under AGPL-3. It includes several external assets in the folder ```site/assets```, which are licensed under [Creative Commons Namensnennung 3.0 Österreich](https://creativecommons.org/licenses/by/3.0/at/deed.de) by Stadt Wien – Wiener Linien (all SVG files) as well as the Roboto font by Google licensed under [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0) (all TTF files).

Happy hacking!
