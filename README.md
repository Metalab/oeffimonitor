# Öffimonitor

Display the Wiener Linien timetable for nearby bus/tram/subway lines on a
screen in the Metalab Hauptraum.

Written in Javascript for use on a Raspberry Pi in Midori in Kiosk mode.

Currently comes with two different JSON proxies, one written in PHP and one in node.js.
One of them needs to run to fetch the data from Wiener Linien API (api-key needed).

Alternatively, use a browser that lets you enable cross-site requests.
In case of chrome, this can be accomplished as follows:
```
chrome --disable-web-security
```

Note that this is neither pretty nor finished.

#### nodejs server:

Installation:
```
  git clone https://github.com/metalab/oeffimonitor
  cd oeffimonitor
  npm install
  npm start # builds the server.js file to the root of the project, then runs it
```

Usage:
```
  npm run dev # runs server/httpd.js using babel-node on port specified in settings

  npm run build # builds server/httpd.js to httpd.js

  sudo npm start # first builds then runs httpd.js on port specified in settings
```


Happy hacking!
