"""Pydantic schemas for Weather information and forecasts."""

import datetime as dt
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class WeatherCurrentResponse(BaseModel):
    """Current weather observations for a geographical location."""

    location: str = Field(..., description="Location name or coordinates")
    latitude: float = Field(..., description="Geographical latitude")
    longitude: float = Field(..., description="Geographical longitude")
    temperature: float = Field(..., description="Current temperature")
    temperature_unit: str = Field("celsius", description="Temperature unit (celsius, fahrenheit)")
    condition: str = Field(..., description="Human-readable weather condition")
    weather_code: Optional[int] = Field(None, description="WMO weather interpretation code")
    humidity: int = Field(..., description="Relative humidity percentage")
    wind_speed: float = Field(..., description="Wind speed")
    wind_unit: str = Field("km/h", description="Wind speed unit")
    feels_like: float = Field(..., description="Apparent feels-like temperature")
    icon: Optional[str] = Field(None, description="Weather icon identifier")
    updated_at: dt.datetime = Field(..., description="Timestamp of observation")

    model_config = ConfigDict(from_attributes=True)


class WeatherForecastDay(BaseModel):
    """Daily forecast data for a single day."""

    date: dt.date = Field(..., description="Forecast date")
    temp_min: float = Field(..., description="Minimum forecasted temperature")
    temp_max: float = Field(..., description="Maximum forecasted temperature")
    condition: str = Field(..., description="Dominant weather condition")
    weather_code: Optional[int] = Field(None, description="WMO weather interpretation code")
    precipitation_probability: Optional[int] = Field(None, description="Probability of precipitation percentage")
    icon: Optional[str] = Field(None, description="Weather icon identifier")

    model_config = ConfigDict(from_attributes=True)


class WeatherForecastResponse(BaseModel):
    """Weather forecast response containing current conditions and multi-day forecast."""

    location: str
    latitude: float
    longitude: float
    current: WeatherCurrentResponse
    forecast: List[WeatherForecastDay]

    model_config = ConfigDict(from_attributes=True)
