var weatherUpdateFunction;
(function () {
  var weather;
  var mapping = new WeatherConditionMapping();
  var forecast;
  document.addEventListener("DOMContentLoaded", onReady);

  function onReady(){
    forecast = document.getElementById('forecast');
    forecast.addEventListener("load", function(event){
      console.log("Load event");
      weather = new WeatherWidget(document.getElementById('forecast').contentDocument);
      updateDisplay();
      weatherUpdateFunction = function() {
        updateDisplay();
      }
    });
  }

  function updateDisplay() {
    getWeatherData(onWeatherDataReceived);
    function onWeatherDataReceived(weatherData){
      weather.setCurrentIcon(mapping.getIcon(weatherData.current.weather[0].id));
      weather.setCurrentTemperature(weatherData.current.main.temp);
      var forecasts = weatherData.forecast.list;
      var relevantForecasts = forecasts.slice(0,Math.min(4,forecasts.length));
      var processedForecasts = relevantForecasts.map(function (forecast){
        return {
          iconId: mapping.getIcon(forecast.weather[0].id),
          time: formatTime(forecast.dt * 1000), // format is seconds since unix epoch, convert to msecs
          temperature: forecast.main.temp
        };
      });
      weather.setForecasts(processedForecasts);
    }
  }

  function getWeatherData(callback){

    var weatherData = {
      current:null,
      forecast:null,
      checkAllLoaded: function checkAllLoaded() {
        if (!this.current || !this.forecast) return;
        setErrorIconVisible(false);
        callback(this);
      }
    };

    getHTTP('/weather',onCurrentWeatherLoaded,onError);
    getHTTP('/forecast',onForecastLoaded,onError);

    function onError() { setErrorIconVisible(true); }
    function onCurrentWeatherLoaded() { weatherData.current = this.response; weatherData.checkAllLoaded(); }
    function onForecastLoaded() { weatherData.forecast = this.response; weatherData.checkAllLoaded(); }
  }

  function formatTime(timestamp) {
  	var date = new Date(timestamp);
  	var hours = "0" + date.getHours();
  	var minutes = "0" + date.getMinutes();

  	var formattedTime = hours.substr(-2) + ':' + minutes.substr(-2);
  	return formattedTime;
  }

  function getHTTP(url,completeCallback,errorCallback) {
    var request = new XMLHttpRequest();
    request.addEventListener("load",statusInterceptor);
    request.addEventListener("error",errorCallback);
    request.responseType = 'json';
    request.open('GET',url);
    request.send();

    function statusInterceptor() {
      if (this.status != 200) {
        errorCallback.apply(this);
      } else {
        completeCallback.apply(this);
      }
    }
  }

  function setErrorIconVisible(visible) {
    var errorSpan = document.getElementById('weatherError');
    if (visible) {
      errorSpan.style.display = 'inline'
      // forecast.style.display = 'none'; REMOVED - bug at least in Chrome will force a reload of the SVG, retriggering the load event
    } else {
      errorSpan.style.display = 'none';
      // forecast.style.display = 'inline'; REMOVED - bug at least in Chrome will force a reload of the SVG, retriggering the load event
    }

  }

  // Mappings of weather conditions to icons as defined by openweathermap
  // #see http://openweathermap.org/weather-conditions
  //
  function WeatherConditionMapping() {
    /* Group 2xx Thunderstorm */
    this[200] = 'thunderstormRain'; // thunderstorm with light rain
    this[201] = 'thunderstormRain'; // thunderstorm with rain
    this[202] = 'thunderstormRain'; // thunderstorm with heavy rain
    this[210] = 'thunderstormRain'; // light thunderstorm
    this[211] = 'thunderstormRain'; // thunderstorm
    this[212] = 'thunderstormRain'; // heavy thunderstorm
    this[221] = 'thunderstormRain'; // ragged thunderstorm
    this[230] = 'thunderstormRain'; // thunderstorm with light Drizzle
    this[231] = 'thunderstormRain'; // thunderstorm with Drizzle
    this[232] = 'thunderstormRain'; // thunderstorm with heavy Drizzle
    /* Group 3xx Drizzle */
    this[300] = 'rainShowers'; // light intensity Drizzle
    this[301] = 'rainShowers'; // Drizzle
    this[302] = 'rainShowers'; // heavy intensity drizzle
    this[310] = 'rainShowers'; // light intensity drizzle rain
    this[311] = 'rainShowers'; // drizzle rain
    this[312] = 'rainShowers'; // heavy intensity drizzle rain
    this[313] = 'rainShowers'; // shower rain and drizzle
    this[314] = 'rainShowers'; // heavy shower rain and drizzle
    this[321] = 'rainShowers'; // shower drizzle
    /* Group 5xx Rain */
    this[500] = 'rain'; // light rain
    this[501] = 'rain'; // moderate rain
    this[502] = 'rain'; // heavy intensity rain
    this[503] = 'rain'; // very heavy rain
    this[504] = 'rain'; // extreme rain
    this[511] = 'freezingRain'; // freezing rain
    this[520] = 'rainShowers'; // light intensity shower rain
    this[521] = 'rainShowers'; // shower rain
    this[522] = 'rainShowers'; // heavy intensity shower rain
    this[531] = 'rainShowers'; // ragged shower rain
    /* Group 6xx Snow */
    this[600] = 'snow'; // light snow
    this[601] = 'snow'; // snow
    this[602] = 'snow'; // heavy snow
    this[611] = 'snow'; // sleet
    this[612] = 'snow'; // shower sleet
    this[615] = 'rainSnow'; // light rain and snow
    this[616] = 'rainSnow'; // rain and snow
    this[620] = 'snow'; // light shower snow
    this[621] = 'snow'; // shower snow
    this[622] = 'snow'; // heavy shower snow
    /* Group 7xx Atmosphere */
    this[701] = 'fog'; // mist
    this[711] = 'smoke'; // smoke
    this[721] = 'fog'; // haze
    this[731] = 'dust'; // sand; dust whirls
    this[741] = 'fog'; // fog
    this[751] = 'dust'; // sand
    this[761] = 'dust'; // dust
    // 762] = '' // volcanic ash
    this[771] = 'wind'; // squalls
    this[781] = 'wind'; // tornado
    /* Group 800 clear */
    this[800] = 'clearSky'; // clear sky
    /* Group 80x Clouds */
    this[801] = 'fewClouds'; // few Clouds
    this[802] = 'partlyCloudy'; // scattered Clouds
    this[803] = 'mostlyCloudy'; // broken Clouds
    this[804] = 'overcast'; // overcast clouds
    /* Group 90x Extreme */
    this[900] = 'wind'; // tornado
    this[901] = 'wind'; // tropical storm
    this[902] = 'wind'; // hurricane
    this[903] = 'cold'; // cold
    this[904] = 'hot';  // hot
    this[905] = 'wind'; // windy
    this[906] = 'icePellets'; // hail

    this.getIcon = function getIcon(code) {
      if (this[code] !== undefined && (typeof this[code] === 'string' )) {
        return this[code];
      }
      return 'mix'; // fallback for unknown code
    }
  }


})()
