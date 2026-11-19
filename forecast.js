
"use strict";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const FORECAST_LOCATION = {
    latitude: 39.4301,
    longitude: -77.8042
};

const TIMEZONE = "America/New_York";

const FORECAST_CODES = {
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

function getDescription(code) {
    return FORECAST_CODES[code] ||
        ["Conditions unavailable", "🌡️"];
}

function getDateLabel(dateString) {
    const date = new Date(`${dateString}T12:00:00`);

    return date.toLocaleDateString("en-US", {
        timeZone: TIMEZONE,
        weekday: "long",
        month: "short",
        day: "numeric"
    });
}

function validateForecastData(data) {
    if (
        !data ||
        !data.daily ||
        !Array.isArray(data.daily.time) ||
        data.daily.time.length !== 7
    ) {
        throw new Error("Invalid seven-day forecast data.");
    }

    const fields = [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_probability_max"
    ];

    for (const field of fields) {
        if (
            !Array.isArray(data.daily[field]) ||
            data.daily[field].length !== 7
        ) {
            throw new Error(`Missing forecast field: ${field}`);
        }
    }
}

function createForecastRow(day, index, data) {
    const daily = data.daily;

    const [description, icon] = getDescription(
        daily.weather_code[index]
    );

    const row = document.createElement("article");
    row.className = "forecast-row";

    const date = document.createElement("strong");
    date.textContent = getDateLabel(day);

    const condition = document.createElement("span");
    condition.className = "condition";
    condition.textContent = `${icon} ${description}`;

    const temperatures = document.createElement("span");
    temperatures.className = "high-low";

    temperatures.textContent =
        `${Math.round(daily.temperature_2m_max[index])}° / ` +
        `${Math.round(daily.temperature_2m_min[index])}°F`;

    const precipitation = document.createElement("span");
    precipitation.className = "rain-chance";

    const rainChance = daily.precipitation_probability_max[index];

    precipitation.textContent =
        `Rain chance: ${rainChance == null ? "Unavailable" : rainChance + "%"}`;

    row.append(
        date,
        condition,
        temperatures,
        precipitation
    );

    return row;
}

async function loadForecast() {
    const container = document.getElementById("weekly-forecast");
    const status = document.getElementById("forecast-status");

    if (!container || !status) {
        console.error("Forecast page elements were not found.");
        return;
    }

    const params = new URLSearchParams({
        latitude: FORECAST_LOCATION.latitude,
        longitude: FORECAST_LOCATION.longitude,
        timezone: TIMEZONE,
        temperature_unit: "fahrenheit",
        wind_speed_unit: "mph",

        daily: [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_probability_max"
        ].join(","),

        forecast_days: "7"
    });

    try {
        status.textContent = "Loading seven-day forecast...";

        const response = await fetch(
            `${FORECAST_URL}?${params}`
        );

        if (!response.ok) {
            throw new Error(
                `Forecast request failed: ${response.status}`
            );
        }

        const data = await response.json();

        validateForecastData(data);

        const fragment = document.createDocumentFragment();

        data.daily.time.forEach((day, index) => {
            const row = createForecastRow(day, index, data);

            fragment.appendChild(row);
        });

        container.replaceChildren(fragment);

        status.textContent =
            "Seven-day forecast loaded successfully.";

    } catch (error) {
        console.error("Unable to load forecast:", error);

        status.textContent =
            "The forecast could not be loaded. Please try again later.";

        container.textContent =
            "Please check your internet connection and reload the page.";
    }
}

loadForecast();
