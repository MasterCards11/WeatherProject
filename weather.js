
"use strict";

// Shepherdstown, West Virginia
const LATITUDE = 39.4301;
const LONGITUDE = -77.8042;

const API_URL = "https://api.open-meteo.com/v1/forecast";

const WEATHER_CODES = {
    0: ["Clear sky", "☀️"],
    1: ["Mainly clear", "🌤️"],
    2: ["Partly cloudy", "⛅"],
    3: ["Overcast", "☁️"],
    45: ["Foggy", "🌫️"],
    48: ["Freezing fog", "🌫️"],
    51: ["Light drizzle", "🌦️"],
    53: ["Drizzle", "🌦️"],
    55: ["Heavy drizzle", "🌧️"],
    56: ["Freezing drizzle", "🌧️"],
    57: ["Heavy freezing drizzle", "🌧️"],
    61: ["Light rain", "🌦️"],
    63: ["Rain", "🌧️"],
    65: ["Heavy rain", "🌧️"],
    66: ["Freezing rain", "🌧️"],
    67: ["Heavy freezing rain", "🌧️"],
    71: ["Light snow", "🌨️"],
    73: ["Snow", "🌨️"],
    75: ["Heavy snow", "❄️"],
    77: ["Snow grains", "❄️"],
    80: ["Rain showers", "🌦️"],
    81: ["Rain showers", "🌧️"],
    82: ["Heavy rain showers", "🌧️"],
    85: ["Snow showers", "🌨️"],
    86: ["Heavy snow showers", "❄️"],
    95: ["Thunderstorm", "⛈️"],
    96: ["Thunderstorm with hail", "⛈️"],
    99: ["Severe thunderstorm with hail", "⛈️"]
};

function getWeatherDescription(code) {
    return WEATHER_CODES[code] || ["Unknown conditions", "🌡️"];
}

function display(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);

    return new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        weekday: "long",
        month: "short",
        day: "numeric"
    }).format(date);
}

function renderHomeForecast(daily) {
    const container = document.getElementById("home-forecast");

    if (!container) return;

    container.replaceChildren();

    for (let i = 0; i < 3; i++) {
        const [description, icon] =
            getWeatherDescription(daily.weather_code[i]);

        const card = document.createElement("article");
        card.className = "forecast-card";

        const heading = document.createElement("h3");
        heading.textContent = formatDate(daily.time[i]);

        const weatherIcon = document.createElement("span");
        weatherIcon.className = "weather-icon";
        weatherIcon.setAttribute("aria-hidden", "true");
        weatherIcon.textContent = icon;

        const condition = document.createElement("p");
        condition.textContent = description;

        const temperatures = document.createElement("p");
        temperatures.className = "high-low";

        temperatures.textContent =
            `${Math.round(daily.temperature_2m_max[i])}° / ` +
            `${Math.round(daily.temperature_2m_min[i])}°F`;

        card.append(
            heading,
            weatherIcon,
            condition,
            temperatures
        );

        container.appendChild(card);
    }
}

async function loadWeather() {
    const status = document.getElementById("weather-status");

    try {
        if (status) {
            status.textContent = "Loading the latest weather...";
        }

        const params = new URLSearchParams({
            latitude: LATITUDE,
            longitude: LONGITUDE,
            current: [
                "temperature_2m",
                "apparent_temperature",
                "relative_humidity_2m",
                "wind_speed_10m",
                "weather_code"
            ].join(","),
            daily: [
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min"
            ].join(","),
            temperature_unit: "fahrenheit",
            wind_speed_unit: "mph",
            timezone: "America/New_York",
            forecast_days: "7"
        });

        const response = await fetch(`${API_URL}?${params}`);

        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();

        if (!data.current || !data.daily) {
            throw new Error("Weather information is missing.");
        }

        const current = data.current;
        const daily = data.daily;

        if (
            !Array.isArray(daily.time) ||
            daily.time.length < 3 ||
            !Array.isArray(daily.temperature_2m_max) ||
            !Array.isArray(daily.temperature_2m_min) ||
            !Array.isArray(daily.weather_code)
        ) {
            throw new Error("Incomplete forecast information.");
        }

        const [description, icon] =
            getWeatherDescription(current.weather_code);

        display("current-condition", description);
        display("current-icon", icon);

        display(
            "current-temp",
            Math.round(current.temperature_2m)
        );

        display(
            "feels-like",
            `Feels like ${Math.round(current.apparent_temperature)}°F`
        );

        display(
            "wind-speed",
            `${Math.round(current.wind_speed_10m)} mph`
        );

        display(
            "humidity",
            `${current.relative_humidity_2m}%`
        );

        display(
            "today-high",
            `${Math.round(daily.temperature_2m_max[0])}°F`
        );

        display(
            "today-low",
            `${Math.round(daily.temperature_2m_min[0])}°F`
        );

        display(
            "current-date",
            formatDate(current.time)
        );

        renderHomeForecast(daily);

        display(
            "weather-status",
            "Weather updated successfully."
        );

        console.log("Homepage weather loaded successfully.", data);

    } catch (error) {
        console.error("Weather loading failed:", error);

        display(
            "weather-status",
            `Unable to load weather: ${error.message}`
        );

        const container = document.getElementById("home-forecast");

        if (container) {
            container.textContent =
                "Forecast currently unavailable. Please refresh the page.";
        }
    }
}

loadWeather();
