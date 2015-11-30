//var api_url = 'server/index.php';
//var api_url = 'test/response.json'; // local copy for testing
var api_url = '/api';

var walkTimes = {
// walkTime = walking distance in seconds
// unreachTime = threshold to hide unreachable connections
	"Rathaus": {"walkTime": 120, "unreachTime": 30},
	"Schottentor": {"walkTime": 480, "unreachTime": 300},
	"Volkstheater": {"walkTime": 480, "unreachTime": 300},
	"Landesgerichtsstraße": {"walkTime": 480, "unreachTime": 300},
	"Auerspergstraße": {"walkTime": 300, "unreachTime": 180},
	"Rathausplatz/Burgtheater": {"walkTime": 480, "unreachTime": 
300}
};
