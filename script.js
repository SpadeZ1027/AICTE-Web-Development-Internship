// --- Search by city ---
function getWeatherByCity() {
  const city = document.getElementById("cityInput").value;
  if (!city) return alert("Enter a city name!");
  fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`)
    .then(res => res.json())
    .then(data => {
      if (!data.results || data.results.length === 0) {
        document.getElementById("current").innerHTML = "❌ City not found!";
        return;
      }
      const { latitude, longitude, name, country } = data.results[0];
      document.getElementById("current").innerHTML = `<h2>${name}, ${country}</h2>`;
      fetchForecast(latitude, longitude);
    })
    .catch(() => document.getElementById("current").innerHTML = "⚠️ Error fetching location.");
}

// --- Search by geolocation ---
function getWeatherByLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      document.getElementById("current").innerHTML = `<h2>Your Location</h2>`;
      fetchForecast(latitude, longitude);
    }, () => alert("Location access denied."));
  } else alert("Geolocation not supported.");
}

function getConditionFromCode(code) {
  if([0,1].includes(code)) return "sunny";
  if([2,3,45,48].includes(code)) return "cloud";
  if([51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code)) return "rain";
  if([71,73,75,77,85,86].includes(code)) return "snow";
  return "sunny";
}

// --- Background and theme ---
function setBackground(condition, sunrise, sunset) {
  const now = Date.now() / 1000;
  const isNight = now < sunrise || now > sunset;
  let theme = "sunny";
  if (isNight) theme = "night";
  else if (condition.includes("cloud")) theme = "cloudy";
  else if (condition.includes("rain") || condition.includes("drizzle") || condition.includes("thunder")) theme = "rainy";
  else if (condition.includes("snow")) theme = "snowy";
  document.body.className = theme;
}

// --- Weather icons ---
function getWeatherIconURL(code) {
  const iconMap = {
    0:{src:"icons/sun.png",class:"sun"},1:{src:"icons/sun.png",class:"sun"},
    2:{src:"icons/cloud.png",class:"cloud"},3:{src:"icons/cloud.png",class:"cloud"},
    45:{src:"icons/fog.png",class:"cloud"},48:{src:"icons/fog.png",class:"cloud"},
    51:{src:"icons/rain.png",class:"rain"},53:{src:"icons/rain.png",class:"rain"},
    55:{src:"icons/rain.png",class:"rain"},56:{src:"icons/rain.png",class:"rain"},
    57:{src:"icons/rain.png",class:"rain"},61:{src:"icons/rain.png",class:"rain"},
    63:{src:"icons/rain.png",class:"rain"},65:{src:"icons/rain.png",class:"rain"},
    66:{src:"icons/rain.png",class:"rain"},67:{src:"icons/rain.png",class:"rain"},
    71:{src:"icons/snow.png",class:"snow"},73:{src:"icons/snow.png",class:"snow"},
    75:{src:"icons/snow.png",class:"snow"},77:{src:"icons/snow.png",class:"snow"},
    80:{src:"icons/rain.png",class:"rain"},81:{src:"icons/rain.png",class:"rain"},
    82:{src:"icons/rain.png",class:"rain"},85:{src:"icons/snow.png",class:"snow"},
    86:{src:"icons/snow.png",class:"snow"},95:{src:"icons/thunder.png",class:"rain"},
    96:{src:"icons/thunder.png",class:"rain"},99:{src:"icons/thunder.png",class:"rain"}
  };
  return iconMap[code] || {src:"icons/unknown.png",class:""};
}

// --- Background animation ---
function clearWeatherBG() { document.getElementById("weather-bg").innerHTML = ""; }
function createClouds(count=5){const bg=document.getElementById("weather-bg");for(let i=0;i<count;i++){const c=document.createElement("div");c.className="cloud-bg";c.style.top=Math.random()*50+"%";c.style.animationDuration=40+Math.random()*20+"s";c.style.left=-200+Math.random()*100+"px";bg.appendChild(c);}}
function createRain(count=50){const bg=document.getElementById("weather-bg");for(let i=0;i<count;i++){const d=document.createElement("div");d.className="rain-bg";d.style.left=Math.random()*window.innerWidth+"px";d.style.animationDelay=Math.random()+"s";d.style.height=10+Math.random()*10+"px";bg.appendChild(d);}}
function createSnow(count=50){const bg=document.getElementById("weather-bg");for(let i=0;i<count;i++){const f=document.createElement("div");f.className="snow-bg";f.style.left=Math.random()*window.innerWidth+"px";f.style.animationDelay=Math.random()*5+"s";f.style.width=5+Math.random()*5+"px";f.style.height=5+Math.random()*5+"px";bg.appendChild(f);}}
function applyWeatherBG(code){clearWeatherBG();if([0,1].includes(code)){createClouds(3);}else if([2,3,45,48].includes(code)){createClouds(6);}else if([51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code)){createClouds(3);createRain(100);}else if([71,73,75,77,85,86].includes(code)){createClouds(3);createSnow(80);}else{createClouds(3);}}

// --- Sun & Moon ---
function moveSunMoon(sunrise, sunset, timezone){
  const nowLocal = new Date().toLocaleString("en-US", { timeZone: timezone });
  const nowUnix = new Date(nowLocal).getTime()/1000;

  const sm = document.getElementById("sun-moon");
  const sky = document.getElementById("sky-container");
  const isNight = nowUnix < sunrise || nowUnix > sunset;

  if(isNight){
    sm.classList.add("moon");
    sm.style.background="#f0f0f0";
  }else{
    sm.classList.remove("moon");
    sm.style.background="yellow";
  }

  const dayDuration = sunset - sunrise;
  const elapsed = Math.min(Math.max(nowUnix - sunrise,0), dayDuration);
  const percent = (elapsed/dayDuration)*100;
  const radians = (percent/100)*Math.PI;
  const height = Math.sin(radians)*50;

  sm.style.left = percent+"%";
  sm.style.top = 50-height+"%";
}

// --- Fetch forecast ---
function fetchForecast(lat,lon){
  fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode,precipitation,wind_speed_10m,relativehumidity_2m,surface_pressure,uv_index&daily=temperature_2m_max,temperature_2m_min,weathercode,sunrise,sunset&timezone=auto`)
  .then(res=>res.json()).then(data=>{
    const current=document.getElementById("current");

    // Get sunrise/sunset in Unix timestamp
    const sunriseUnix = new Date(data.daily.sunrise[0]).getTime()/1000;
    const sunsetUnix = new Date(data.daily.sunset[0]).getTime()/1000;

    displayCurrentWeather(current,data);
    const weatherCode = data.hourly.weathercode[0];
    setBackground(weatherCode, sunriseUnix, sunsetUnix, data.timezone);
    applyWeatherBG(weatherCode);
    moveSunMoon(sunriseUnix, sunsetUnix, data.timezone);

    displayHourly(data.hourly);
    displayDaily(data.daily);
  }).catch(err=>console.error("Forecast error:",err));
}

function displayCurrentWeather(container, data) {
  // Clear previous content
  container.innerHTML = '';

  // Helper to get current hour index in API timezone
  function getCurrentHourIndex(data) {
    const timezone = data.timezone || 'UTC'; // Use API timezone if available
    const nowLocal = new Date().toLocaleString("en-US", { timeZone: timezone });
    const now = new Date();


    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit'
    });

    const parts = formatter.formatToParts(now);
    const currentTimeString = `${parts.find(p=>p.type==='year').value}-${parts.find(p=>p.type==='month').value}-${parts.find(p=>p.type==='day').value}T${parts.find(p=>p.type==='hour').value}:00`;

    const index = data.hourly.time.findIndex(t => t.startsWith(currentTimeString));
    return index !== -1 ? index : 0;
  }

  const i = getCurrentHourIndex(data);

  // Extract current hourly data
  const temperature = data.hourly.temperature_2m[i];
  const wind = data.hourly.wind_speed_10m[i];
  const precipitation = data.hourly.precipitation[i];
  const humidity = data.hourly.relativehumidity_2m[i];
  const pressure = data.hourly.surface_pressure[i];
  const uv = data.hourly.uv_index[i];
  const code = data.hourly.weathercode[i];

  const icon = getWeatherIconURL(code);

  const sunrise = new Date(data.daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: data.timezone });
  const sunset = new Date(data.daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: data.timezone });

  // Weather metrics for cards
  const metrics = [
    { label: "Temperature", value: `${temperature}°C`, icon: icon.src, className: icon.class },
    { label: "Wind", value: `${wind} m/s`, icon: "icons/wind.png" },
    { label: "Precipitation", value: `${precipitation} mm`, icon: "icons/precipitation.png" },
    { label: "Humidity", value: `${humidity}%`, icon: "icons/humidity.png" },
    { label: "Pressure", value: `${pressure} mBar`, icon: "icons/pressure.png" },
    { label: "UV Index", value: uv, icon: "icons/uv-index.png" },
    { label: "Sunrise", value: sunrise, icon: "icons/sunrise.png" },
    { label: "Sunset", value: sunset, icon: "icons/sunset.png" }
  ];

  // Create horizontal scroll container
  const scrollContainer = document.createElement('div');
  scrollContainer.className = 'weather-cards-container';

  metrics.forEach(metric => {
    const card = document.createElement('div');
    card.className = 'weather-card';
    card.innerHTML = `
      <img src="${metric.icon}" class="${metric.className || ''}" alt="${metric.label}">
      <p class="metric-value">${metric.value}</p>
      <p class="metric-label">${metric.label}</p>
    `;
    scrollContainer.appendChild(card);
  });

  container.appendChild(scrollContainer);
}

// --- Hourly forecast ---
function displayHourly(hourly){
  const container=document.getElementById("hourly");container.innerHTML="";
  for(let i=0;i<12;i++){
    const icon=getWeatherIconURL(hourly.weathercode[i]);
    const card=document.createElement("div");card.className="card";
    card.innerHTML=`<p>${new Date(hourly.time[i]).getHours()}:00</p><img src="${icon.src}" class="weather-icon ${icon.class}"><p>${hourly.temperature_2m[i]}°C</p>`;
    container.appendChild(card);
  }
}

// --- Daily forecast ---
function displayDaily(daily){
  const container=document.getElementById("daily");container.innerHTML="";
  for(let i=0;i<7;i++){
    const icon=getWeatherIconURL(daily.weathercode[i]);
    const card=document.createElement("div");card.className="card";
    card.innerHTML=`<p>${new Date(daily.time[i]).toLocaleDateString("en-US",{weekday:'short'})}</p><img src="${icon.src}" class="weather-icon ${icon.class}"><p>Max: ${daily.temperature_2m_max[i]}°C | Min: ${daily.temperature_2m_min[i]}°C</p>`;
    container.appendChild(card);
  }
}
