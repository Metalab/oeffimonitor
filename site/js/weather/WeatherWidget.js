var WeatherWidget = (function () {

  return WeatherWidget;

  function WeatherWidget(svg) {
    var weatherIcon = svg.getElementById('currentWeatherIcon');
    var currentTemperature = svg.getElementById('currentTemperature');
    var forecastIcons = svg.getElementsByClassName('weatherIcon');
    var forecastTimes = svg.getElementsByClassName('forecastTime');
    var forecastTemperatures = svg.getElementsByClassName('forecastTemperature');
    var lastUpdate = svg.getElementById('lastUpdate');
    this.setCurrentTemperature = setCurrentTemperature;
    this.setCurrentIcon = setCurrentIcon;
    this.setForecasts = setForecasts;
    this.icons = {
      mostlyCloudy: '#bkn',
      blizzard: '#blizzard',
      cold: '#cold',
      dust: '#du',
      fewClouds: '#few',
      fog: '#fg',
      smoke: '#fu',
      freezingRain: '#fzra',
      rainShowersInVicinity: '#hi_shwrs',
      hot: '#hot',
      icePellets: '#ip',
      mix: '#mix',
      overcast: '#ovc',
      rain: '#ra',
      rainIcePellets: '#raip',
      rainSnow: '#rasn',
      partlyCloudy: '#sct',
      sctfg: '#sctfg',
      thunderstormInVicinity: '#scttsra',
      rainShowers: '#shra',
      clearSky: '#skc',
      snow: '#sn',
      thunderstormRain: '#tsra',
      wind: '#wind'
    };


    /**
     * setForecasts - updates the weather forecast information in the svg
     * expects an array of objects formed like this:
     * [{ iconId: this.icons.snow, time: '06:00', temperature: 20.15 },...]
     *
     * @param  {type} forecasts description
     * @return {type}           description
     */
    function setForecasts(forecasts) {
      refreshLastUpdate();
      forecasts.forEach(function processForecast(forecast, index){
        if (forecastIcons[index] && forecastTimes[index] && forecastTemperatures[index]) {
          setIcon(forecastIcons[index],this.icons[forecast.iconId]);
          setText(forecastTimes[index],forecast.time);
          setText(forecastTemperatures[index],forecast.temperature.toFixed(0)+ ' °C');
        }
      }, this);
    }

    /**
     * setIcon - sets current weather icon
     *
     * @param  {String} iconId id of the icon from the svg file (xlink:href syntax)
     */
    function setCurrentIcon(iconId) {
      refreshLastUpdate();
      setIcon(weatherIcon,this.icons[iconId]);
    }

    /**
     * setCurrentTemperature - updates the current temperature in the graphic
     *
     * @param  {Number} temperature temperature in degrees Celsius
     */
    function setCurrentTemperature(temperature) {
      refreshLastUpdate();
      setText(currentTemperature, temperature.toFixed(0)+" °C");
    }

    /**
     * setText - private function to create/replace Text Nodes
     *
     * @param  {Node} node DOM node to set text of
     * @param  {string} text text content to set
     */
    function setText(node,text) {
      var textNode = svg.createTextNode(text);
      if (node.firstChild !== null) {
        node.replaceChild(textNode, node.firstChild);
      } else {
        node.appendChild(textNode);
      }
    }

    function setIcon(node, iconId) {
      node.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', iconId);
    }

    function getIcon(node) {
      return node.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
    }

    function refreshLastUpdate() {
      setText(lastUpdate,'Last Update ' + formatTime(new Date()) );
    }

    function formatTime(date) {
    	var hours = "0" + date.getHours();
    	var minutes = "0" + date.getMinutes();
      var seconds = "0" + date.getSeconds();

    	var formattedTime = hours.substr(-2) + ':' + minutes.substr(-2)+':'+seconds.substr(-2);
    	return formattedTime;
    }

  }

})()
