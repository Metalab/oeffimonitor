# Öffimonitor

Display the Wiener Linien timetable for nearby bus/tram/subway lines on a
screen in the Metalab Hauptraum.

Written in Javascript for use on a Raspberry Pi in a CSS3 capable browser in Kiosk mode.

#### Prerequisites

configure and run the included httpd and point your browser http://localhost:port/ where port is the port that you configured the httpd to listen on. The httpd includes a cache for API requests. If you can't run the httpd, you can turn off CORS validation (e.g. `chrome --disable-web-security`)

Happy hacking!
