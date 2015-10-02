<?php

$api_key = 'XXXXXXXXXXX';
$api_ids = array(
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
);
$api_url = 'http://www.wienerlinien.at/ogd_realtime/monitor?rbl='.implode("&rbl=",$api_ids).'&sender='.$api_key;

$curl = curl_init();

curl_setopt_array($curl, array(
    CURLOPT_RETURNTRANSFER => 1,
    CURLOPT_URL => $api_url
));

$resp = curl_exec($curl);
curl_close($curl);

print_r($resp);

?>
