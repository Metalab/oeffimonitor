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

## Debugging

Öffimonitor by default logs HTTP requests but no further  messages while running. It uses https://github.com/visionmedia/debug for logging.
The DEBUG environment variable is used to enable these based on space or comma-delimited names. Here are some examples:
DEBUG=server:*
DEBUG=*
DEBUG=server:httpd server:api

### Save debug output to a file

You can save all debug statements to a file by piping them.
Example:
    $ DEBUG_FD=3 server/httpd.js 3> debug.log

## Start from systemd
(Taken from https://rocketeer.be/articles/deploying-node-js-with-systemd/)

Copy the provided script init-script/oeffimonitor.service to /etc/systemd/system/ **and adjust paths and user in the script**.
Then the Öffimonitor can be started using the systemd:

```bash
# systemctl start oeffimonitor
```

Systemd will monitor the node process and restart the server as appropriate


Happy hacking!


### Start from systemd
(Taken from https://rocketeer.be/articles/deploying-node-js-with-systemd/)

Copy the provided script init-script/oeffimonitor.service to /etc/systemd/system/ **and adjust paths and user in the script*$
Then the Öffimonitor can be started using the systemd:

```bash
# systemctl start oeffimonitor
```

Systemd will monitor the node process and restart the server as appropriate




