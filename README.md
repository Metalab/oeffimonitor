# Öffimonitor

Display the Wiener Linien timetable for nearby bus/tram/subway lines on a
screen in the Metalab Hauptraum.

Written in Javascript for use on a Raspberry Pi in a CSS3 capable browser in Kiosk mode.

## Usage

1. Run npm install
2.  Move ```server/settings.example.js``` to ```server/settings.js``` and add your API key and change the listen port and other settings.
3.  Change the walktimes in ```site/settings.js``` according to your needs (you can also choose to use a local JSON file as input here for client side testing)
4.  Run ```node server/httpd.js```
5.  Open Öffimonitor in a browser of your choice.


Happy hacking!


