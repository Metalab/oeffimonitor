var api_key = 'XXXXXXXXXX';
var api_ids = [
        "252","269", // Rathaus 2er
        "4205","4210", // Rathaus U2

        "1346", // Landesgerichtsstraße 43er/44er & N43 (nur stadtauswärts)

        "18", // Schottentor 1er & N25
        "1212", // Schottentor 37
        "1303", // Schottentor 40A
        "3701", // Schottentor N36
        "5568", // Schottentor N41
	"17",   // Burgtheather/Rathausplatz N66
        "1401", // Volkstheater 48A
        "1440", // Volkstheater 49er (nur stadtauswärts)
        "4909","4908", // Volkstheater U3

        "1376", // Auerspergstraße 46er (nur stadtauswärts)
        "5691" // Auerspergstraße N46
];
var api_url = 'http://www.wienerlinien.at/ogd_realtime/monitor?sender='+api_key+'&rbl='+api_ids.join("&rbl=");

module.exports = {
	'title':					'Next public transport connections from Metalab',
	'theme':					'metalab.css',
	'api_url'         :   api_url,
	'api_key'         :   api_key,
	'api_ids'         :   api_ids,
	'api_cache_msec'  :   6000,     // cache API responses for this many milliseconds; default: 6s
	'listen_port'     :   8080,	// port to listen on
};
