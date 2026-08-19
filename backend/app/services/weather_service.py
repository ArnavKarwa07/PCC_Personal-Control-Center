"""Weather service integrating Open-Meteo with deterministic fallback."""

from datetime import date, datetime, timedelta, timezone
from typing import Dict, List, Optional

import httpx

from app.schemas.weather import (
    WeatherCurrentResponse,
    WeatherForecastDay,
    WeatherForecastResponse,
)

WMO_CODE_MAP: Dict[int, Dict[str, str]] = {
    0: {"condition": "Clear Sky", "icon": "sunny"},
    1: {"condition": "Mainly Clear", "icon": "mostly_sunny"},
    2: {"condition": "Partly Cloudy", "icon": "partly_cloudy"},
    3: {"condition": "Overcast", "icon": "cloudy"},
    45: {"condition": "Fog", "icon": "foggy"},
    48: {"condition": "Depositing Rime Fog", "icon": "foggy"},
    51: {"condition": "Light Drizzle", "icon": "rainy"},
    53: {"condition": "Moderate Drizzle", "icon": "rainy"},
    55: {"condition": "Dense Drizzle", "icon": "rainy"},
    61: {"condition": "Slight Rain", "icon": "rainy"},
    63: {"condition": "Moderate Rain", "icon": "rainy"},
    65: {"condition": "Heavy Rain", "icon": "heavy_rain"},
    71: {"condition": "Slight Snow", "icon": "snowy"},
    73: {"condition": "Moderate Snow", "icon": "snowy"},
    75: {"condition": "Heavy Snow", "icon": "snowy"},
    80: {"condition": "Slight Rain Showers", "icon": "rainy"},
    81: {"condition": "Moderate Rain Showers", "icon": "rainy"},
    82: {"condition": "Violent Rain Showers", "icon": "heavy_rain"},
    95: {"condition": "Thunderstorm", "icon": "thunderstorm"},
    96: {"condition": "Thunderstorm with Slight Hail", "icon": "thunderstorm"},
    99: {"condition": "Thunderstorm with Heavy Hail", "icon": "thunderstorm"},
}


class WeatherService:
    """Service fetching real-time weather and forecasts with offline fallback."""

    OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast"

    @classmethod
    def _interpret_wmo_code(cls, code: Optional[int]) -> Dict[str, str]:
        """Map WMO integer weather code to condition string and icon."""
        if code is None:
            return {"condition": "Clear Sky", "icon": "sunny"}
        return WMO_CODE_MAP.get(code, {"condition": "Partly Cloudy", "icon": "partly_cloudy"})

    @classmethod
    def _get_mock_current(
        cls,
        latitude: float,
        longitude: float,
        location: str,
        units: str = "metric",
    ) -> WeatherCurrentResponse:
        """Generate consistent mock current weather."""
        now = datetime.now(timezone.utc)
        temp = 22.5 if units == "metric" else 72.5
        wind = 12.0 if units == "metric" else 7.5
        temp_unit = "celsius" if units == "metric" else "fahrenheit"
        wind_unit = "km/h" if units == "metric" else "mph"

        return WeatherCurrentResponse(
            location=location,
            latitude=latitude,
            longitude=longitude,
            temperature=temp,
            temperature_unit=temp_unit,
            condition="Partly Cloudy",
            weather_code=2,
            humidity=55,
            wind_speed=wind,
            wind_unit=wind_unit,
            feels_like=temp - 0.5,
            icon="partly_cloudy",
            updated_at=now,
        )

    @classmethod
    def _get_mock_forecast(
        cls,
        latitude: float,
        longitude: float,
        location: str,
        days: int = 5,
        units: str = "metric",
    ) -> WeatherForecastResponse:
        """Generate realistic mock multi-day forecast."""
        current = cls._get_mock_current(latitude, longitude, location, units)
        today = date.today()
        forecast_days: List[WeatherForecastDay] = []

        conditions = ["Clear Sky", "Partly Cloudy", "Light Rain", "Mostly Sunny", "Clear Sky"]
        icons = ["sunny", "partly_cloudy", "rainy", "mostly_sunny", "sunny"]
        min_temps = [16.0, 17.5, 15.0, 16.5, 18.0]
        max_temps = [24.0, 23.0, 20.5, 25.0, 26.5]

        for i in range(days):
            idx = i % len(conditions)
            forecast_days.append(
                WeatherForecastDay(
                    date=today + timedelta(days=i),
                    temp_min=min_temps[idx],
                    temp_max=max_temps[idx],
                    condition=conditions[idx],
                    weather_code=2 if idx == 1 else (61 if idx == 2 else 0),
                    precipitation_probability=10 + (i * 15) % 80,
                    icon=icons[idx],
                )
            )

        return WeatherForecastResponse(
            location=location,
            latitude=latitude,
            longitude=longitude,
            current=current,
            forecast=forecast_days,
        )

    @classmethod
    def get_current_weather(
        cls,
        latitude: float = 18.5204,
        longitude: float = 73.8567,
        city: Optional[str] = "Pune, India",
        units: str = "metric",
    ) -> WeatherCurrentResponse:
        """Fetch current weather for coordinates or fallback to mock."""
        location_label = city or f"{latitude:.2f}, {longitude:.2f}"
        temperature_unit = "fahrenheit" if units == "imperial" else "celsius"
        wind_speed_unit = "mph" if units == "imperial" else "kmh"

        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
            "temperature_unit": temperature_unit,
            "wind_speed_unit": wind_speed_unit,
            "timezone": "auto",
        }

        try:
            with httpx.Client(timeout=3.0) as client:
                res = client.get(cls.OPEN_METEO_BASE_URL, params=params)
                if res.status_code == 200:
                    data = res.json()
                    current_data = data.get("current", {})
                    weather_code = current_data.get("weather_code")
                    wmo_meta = cls._interpret_wmo_code(weather_code)

                    return WeatherCurrentResponse(
                        location=location_label,
                        latitude=latitude,
                        longitude=longitude,
                        temperature=float(current_data.get("temperature_2m", 20.0)),
                        temperature_unit=temperature_unit,
                        condition=wmo_meta["condition"],
                        weather_code=weather_code,
                        humidity=int(current_data.get("relative_humidity_2m", 50)),
                        wind_speed=float(current_data.get("wind_speed_10m", 10.0)),
                        wind_unit="mph" if units == "imperial" else "km/h",
                        feels_like=float(current_data.get("apparent_temperature", 20.0)),
                        icon=wmo_meta["icon"],
                        updated_at=datetime.now(timezone.utc),
                    )
        except Exception:
            pass

        return cls._get_mock_current(latitude, longitude, location_label, units)

    @classmethod
    def get_weather_forecast(
        cls,
        latitude: float = 18.5204,
        longitude: float = 73.8567,
        city: Optional[str] = "Pune, India",
        days: int = 5,
        units: str = "metric",
    ) -> WeatherForecastResponse:
        """Fetch 5-day weather forecast with fallback."""
        location_label = city or f"{latitude:.2f}, {longitude:.2f}"
        days_bounded = min(max(days, 1), 7)
        temperature_unit = "fahrenheit" if units == "imperial" else "celsius"
        wind_speed_unit = "mph" if units == "imperial" else "kmh"

        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
            "forecast_days": days_bounded,
            "temperature_unit": temperature_unit,
            "wind_speed_unit": wind_speed_unit,
            "timezone": "auto",
        }

        try:
            with httpx.Client(timeout=3.0) as client:
                res = client.get(cls.OPEN_METEO_BASE_URL, params=params)
                if res.status_code == 200:
                    data = res.json()
                    current_data = data.get("current", {})
                    daily_data = data.get("daily", {})

                    weather_code = current_data.get("weather_code")
                    wmo_meta = cls._interpret_wmo_code(weather_code)

                    current_resp = WeatherCurrentResponse(
                        location=location_label,
                        latitude=latitude,
                        longitude=longitude,
                        temperature=float(current_data.get("temperature_2m", 20.0)),
                        temperature_unit=temperature_unit,
                        condition=wmo_meta["condition"],
                        weather_code=weather_code,
                        humidity=int(current_data.get("relative_humidity_2m", 50)),
                        wind_speed=float(current_data.get("wind_speed_10m", 10.0)),
                        wind_unit="mph" if units == "imperial" else "km/h",
                        feels_like=float(current_data.get("apparent_temperature", 20.0)),
                        icon=wmo_meta["icon"],
                        updated_at=datetime.now(timezone.utc),
                    )

                    forecast_days: List[WeatherForecastDay] = []
                    dates_str = daily_data.get("time", [])
                    max_t = daily_data.get("temperature_2m_max", [])
                    min_t = daily_data.get("temperature_2m_min", [])
                    codes = daily_data.get("weather_code", [])
                    precip = daily_data.get("precipitation_probability_max", [])

                    for i in range(len(dates_str)):
                        d_code = codes[i] if i < len(codes) else None
                        d_meta = cls._interpret_wmo_code(d_code)
                        forecast_days.append(
                            WeatherForecastDay(
                                date=date.fromisoformat(dates_str[i]),
                                temp_min=float(min_t[i]) if i < len(min_t) else 15.0,
                                temp_max=float(max_t[i]) if i < len(max_t) else 25.0,
                                condition=d_meta["condition"],
                                weather_code=d_code,
                                precipitation_probability=int(precip[i]) if i < len(precip) and precip[i] is not None else None,
                                icon=d_meta["icon"],
                            )
                        )

                    return WeatherForecastResponse(
                        location=location_label,
                        latitude=latitude,
                        longitude=longitude,
                        current=current_resp,
                        forecast=forecast_days,
                    )
        except Exception:
            pass

        return cls._get_mock_forecast(latitude, longitude, location_label, days_bounded, units)


weather_service = WeatherService()
