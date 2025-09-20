// =======================
// --- Fetch Forecast by Coordinates ---
async function fetchForecast(lat, lon, placeName = "") {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode,precipitation,wind_speed_10m,relativehumidity_2m,surface_pressure,uv_index&daily=temperature_2m_max,temperature_2m_min,weathercode,sunrise,sunset&timezone=auto`);
    const data = await res.json();

    // Set location name
    document.getElementById("current").innerHTML = placeName ? `<h2>${placeName}</h2>` : `<h2>Your Location</h2>`;

    // Display current weather
    displayCurrentWeather(document.getElementById("current"), data);

    // Set sunrise/sunset for sun/moon background
    const sunrise = new Date(data.daily.sunrise[0]);
    const sunset = new Date(data.daily.sunset[0]);
    updateDayNight(sunrise, sunset, data.timezone);

    // Display hourly and daily forecasts
    displayHourly(data.hourly, data.timezone);
    displayDaily(data.daily);
  } catch (err) {
    console.error("Forecast error:", err);
    document.getElementById("current").innerHTML = "⚠️ Error fetching forecast.";
  }
}

// =======================
// --- Search by City ---
async function getWeatherByCity() {
  const city = document.getElementById("cityInput").value.trim();
  if (!city) return alert("Enter a city name!");
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`);
    const geo = await res.json();
    if (!geo.results || geo.results.length === 0) {
      document.getElementById("current").innerHTML = "❌ City not found!";
      return;
    }
    const { latitude, longitude, name, country } = geo.results[0];
    fetchForecast(latitude, longitude, `${name}, ${country}`);
  } catch {
    document.getElementById("current").innerHTML = "⚠️ Error fetching location.";
  }
}

// =======================
// --- Search by Geolocation ---
function getWeatherByLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      fetchForecast(latitude, longitude, "Your Location");
    }, () => alert("Location access denied."));
  } else alert("Geolocation not supported.");
}

// =======================
// --- Update Background + Sun/Moon ---
function updateDayNight(sunrise, sunset, timezone) {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
  const sun = document.getElementById("sun");
  const moon = document.getElementById("moon");

  if (now >= sunrise && now < sunset) {
    document.body.classList.add("daytime");
    document.body.classList.remove("nighttime");
    sun.style.opacity = 1;
    moon.style.opacity = 0;
  } else {
    document.body.classList.add("nighttime");
    document.body.classList.remove("daytime");
    sun.style.opacity = 0;
    moon.style.opacity = 1;
  }
}

// =======================
// --- Weather Icons ---
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

// =======================
// --- Display Current Weather ---
function displayCurrentWeather(container, data) {
  container.innerHTML = '';
  const timezone = data.timezone;
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));

  // Find nearest hour index
  let i = 0;
  const hourlyTimes = data.hourly.time.map(t => new Date(t));
  for (let j=0; j<hourlyTimes.length; j++){
    if (hourlyTimes[j] > now) break;
    i = j;
  }

  const temperature = data.hourly.temperature_2m[i];
  const wind = data.hourly.wind_speed_10m[i];
  const precipitation = data.hourly.precipitation[i];
  const humidity = data.hourly.relativehumidity_2m[i];
  const pressure = data.hourly.surface_pressure[i];
  const uv = data.hourly.uv_index[i];
  const code = data.hourly.weathercode[i];
  const icon = getWeatherIconURL(code);

  const sunrise = new Date(data.daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: timezone });
  const sunset = new Date(data.daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: timezone });

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

// =======================
// --- Hourly Forecast ---
function displayHourly(hourly, timezone){
  const container = document.getElementById("hourly");
  container.innerHTML = "";
  for(let i=0; i<12; i++){
    const timeLocal = new Date(hourly.time[i]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: timezone });
    const icon = getWeatherIconURL(hourly.weathercode[i]);
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<p>${timeLocal}</p><img src="${icon.src}" class="weather-icon ${icon.class}"><p>${hourly.temperature_2m[i]}°C</p><p>🌧️ ${hourly.precipitation[i]} mm</p>`;
    container.appendChild(card);
  }
}

// =======================
// --- Daily Forecast ---
function displayDaily(daily){
  const container = document.getElementById("daily");
  container.innerHTML = "";
  for(let i=0; i<7; i++){
    const icon = getWeatherIconURL(daily.weathercode[i]);
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<p>${new Date(daily.time[i]).toLocaleDateString("en-US",{weekday:'short'})}</p><img src="${icon.src}" class="weather-icon ${icon.class}"><p>Max: ${daily.temperature_2m_max[i]}°C | Min: ${daily.temperature_2m_min[i]}°C</p>`;
    container.appendChild(card);
  }
}

// =======================
// --- Default: Load User Location on Start ---
window.onload = getWeatherByLocation;
