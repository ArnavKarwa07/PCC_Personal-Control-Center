"""Weather Information REST API endpoints."""

from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.weather_service import weather_service

router = APIRouter(prefix="/weather", tags=["Weather"])


@router.get("/get_current_weather", operation_id="get_current_weather", summary="Get Current Weather")
@router.get("/current", include_in_schema=False)
def get_current_weather(
    lat: float = Query(18.5204, description="Latitude coordinates"),
    lon: float = Query(73.8567, description="Longitude coordinates"),
    city: Optional[str] = Query("Pune, India", description="City / location name override"),
    units: str = Query("metric", description="Unit system: metric or imperial"),
    current_user: User = Depends(get_current_user),
):
    """Retrieve current real-time weather observations."""
    current = weather_service.get_current_weather(
        latitude=lat,
        longitude=lon,
        city=city,
        units=units,
    )
    return {
        "data": current.model_dump(),
    }


@router.get("/get_weather_forecast", operation_id="get_weather_forecast", summary="Get Weather Forecast")
@router.get("/forecast", include_in_schema=False)
def get_weather_forecast(
    lat: float = Query(18.5204, description="Latitude coordinates"),
    lon: float = Query(73.8567, description="Longitude coordinates"),
    city: Optional[str] = Query("Pune, India", description="City / location name override"),
    days: int = Query(5, ge=1, le=7, description="Forecast days (1 to 7)"),
    units: str = Query("metric", description="Unit system: metric or imperial"),
    current_user: User = Depends(get_current_user),
):
    """Retrieve multi-day weather forecast."""
    forecast = weather_service.get_weather_forecast(
        latitude=lat,
        longitude=lon,
        city=city,
        days=days,
        units=units,
    )
    return {
        "data": forecast.model_dump(),
    }
