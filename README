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
  npm run build # builds the server.js file to the root of the project.
```

Usage:
```
  npm run dev # runs site/server/index.js using babel-node on port 1337

  npm run build # builds site/server/index.js to server.js

  sudo npm start # first builds then runs server.js on port 80
```


Happy hacking!
