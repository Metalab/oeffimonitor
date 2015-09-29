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

	"1401", // Volkstheater 48A
	"1440", // Volkstheater 49er (nur stadtauswärts)
	"4909","4908", // Volkstheater U3

	"1376", // Auerspergstraße 46er (nur stadtauswärts)
	"5691" // Auerspergstraße N46
];
var api_url = 'http://www.wienerlinien.at/ogd_realtime/monitor?rbl='+api_ids.join("&rbl=")+'&sender=' + api_key;
//var api_url = '../test/response.json'; // local copy for testing

var walkTimes = {
// walkTime = walking distance in seconds
// unreachTime = threshold to hide unreachable connections
	"Rathaus": {"walkTime": 120, "unreachTime": 30},
	"Schottentor": {"walkTime": 480, "unreachTime": 360},
	"Volkstheater": {"walkTime": 480, "unreachTime": 360},
	"Landesgerichtsstraße": {"walkTime": 480, "unreachTime": 360},
	"Auerspergstraße": {"walkTime": 300, "unreachTime": 180}
};