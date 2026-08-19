import React from 'react';
import { useWeatherStore } from '../../stores/weatherStore';
import { Button, Badge } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import './Weather.css';

export const WeatherPage: React.FC = () => {
  const { weather, unit, isRefreshing, isGpsLocated, locationStatus, requestLocation, toggleUnit, refreshWeather } =
    useWeatherStore();
  const { toast } = useToast();

  React.useEffect(() => {
    if (locationStatus === 'pending') {
      requestLocation();
    }
  }, [locationStatus, requestLocation]);

  const convertTemp = (tempC: number) => {
    if (unit === 'F') {
      return Math.round((tempC * 9) / 5 + 32);
    }
    return Math.round(tempC);
  };


  const renderWeatherIcon = (iconName: string) => {
    switch (iconName) {
      case 'sunny':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" fill="#f59e0b" fillOpacity="0.2" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        );
      case 'cloudy':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="#94a3b8" fillOpacity="0.2" />
          </svg>
        );
      case 'rain':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="16" y1="13" x2="16" y2="21" />
            <line x1="8" y1="13" x2="8" y2="21" />
            <line x1="12" y1="15" x2="12" y2="23" />
            <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
          </svg>
        );
      case 'storm':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9" />
            <polyline points="13 11 9 17 15 17 11 23" />
          </svg>
        );
      case 'snow':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" />
            <line x1="8" y1="16" x2="8.01" y2="16" />
            <line x1="8" y1="20" x2="8.01" y2="20" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
            <line x1="12" y1="22" x2="12.01" y2="22" />
            <line x1="16" y1="16" x2="16.01" y2="16" />
            <line x1="16" y1="20" x2="16.01" y2="20" />
          </svg>
        );
      case 'partly_cloudy':
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v2" />
            <path d="M4.93 4.93l1.41 1.41" />
            <path d="M20 12h2" />
            <path d="M19.07 4.93l-1.41 1.41" />
            <path d="M15.5 13a4.5 4.5 0 1 0-8.9 1A4 4 0 0 0 8 22h10a4 4 0 0 0 0-8c-.8 0-1.6.2-2.5.5z" fill="#6366f1" fillOpacity="0.2" />
          </svg>
        );
    }
  };

  return (
    <div className="pcc-weather-page">
      {/* Header Controls */}
      <header className="pcc-weather-header">
        <div className="pcc-weather-header__titles">
          <h1>Weather & Environmental Metrics</h1>
          <p>Hyper-local weather telemetry, AQI indices, and multi-day meteorological forecasts.</p>
        </div>

        <div className="pcc-weather-header__controls">
          <Badge variant={isGpsLocated ? 'success' : 'primary'} size="sm">
            {isGpsLocated ? 'GPS Located' : 'Pune, IN (Default)'}
          </Badge>


          <div className="pcc-weather-unit-toggle">
            <button
              type="button"
              className={`pcc-weather-unit-btn ${unit === 'C' ? 'pcc-weather-unit-btn--active' : ''}`}
              onClick={toggleUnit}
            >
              °C
            </button>
            <button
              type="button"
              className={`pcc-weather-unit-btn ${unit === 'F' ? 'pcc-weather-unit-btn--active' : ''}`}
              onClick={toggleUnit}
            >
              °F
            </button>
          </div>

          <Button
            id="btn-refresh-weather"
            variant="secondary"
            size="sm"
            loading={isRefreshing}
            onClick={async () => {
              await refreshWeather();
              toast.success('Weather updated');
            }}
          >
            Refresh
          </Button>
        </div>
      </header>

      {/* Weather Alerts if present */}
      {weather.alerts && weather.alerts.length > 0 && (
        <div className="pcc-weather-alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <strong>{weather.alerts[0].title}:</strong> {weather.alerts[0].description} ({weather.alerts[0].time})
          </div>
        </div>
      )}

      {/* Hero Weather Card */}
      <div className="pcc-weather-hero">
        <div className="pcc-weather-hero__left">
          <div className="pcc-weather-hero__location">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>
              {weather.location.city}, {weather.location.country}
            </span>
            <Badge variant="accent" size="sm">
              {weather.location.timezone}
            </Badge>
          </div>

          <div className="pcc-weather-hero__temp-row">
            <div className="pcc-weather-hero__icon">{renderWeatherIcon(weather.current.icon)}</div>

            <div>
              <div className="pcc-weather-hero__temp">
                {convertTemp(weather.current.temp)}°{unit}
              </div>
            </div>

            <div className="pcc-weather-hero__temp-meta">
              <span className="pcc-weather-hero__condition">{weather.current.condition}</span>
              <span className="pcc-weather-hero__feels-like">
                Feels like {convertTemp(weather.current.feelsLike)}°{unit} • H:{' '}
                {convertTemp(weather.current.tempMax)}° L: {convertTemp(weather.current.tempMin)}°
              </span>
            </div>
          </div>

          <p className="pcc-weather-hero__desc">{weather.current.description}</p>
        </div>

        {/* Environmental Metrics Quick Grid */}
        <div className="pcc-weather-hero__right">
          <div className="pcc-weather-quick-metric">
            <div className="pcc-weather-quick-metric__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
            <div className="pcc-weather-quick-metric__info">
              <span className="pcc-weather-quick-metric__value">{weather.current.humidity}%</span>
              <span className="pcc-weather-quick-metric__label">Humidity</span>
            </div>
          </div>

          <div className="pcc-weather-quick-metric">
            <div className="pcc-weather-quick-metric__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
              </svg>
            </div>
            <div className="pcc-weather-quick-metric__info">
              <span className="pcc-weather-quick-metric__value">
                {weather.current.windSpeed} km/h {weather.current.windDirection}
              </span>
              <span className="pcc-weather-quick-metric__label">Wind Speed</span>
            </div>
          </div>

          <div className="pcc-weather-quick-metric">
            <div className="pcc-weather-quick-metric__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12a4 4 0 0 1 8 0" />
              </svg>
            </div>
            <div className="pcc-weather-quick-metric__info">
              <span className="pcc-weather-quick-metric__value">
                AQI {weather.current.aqi} ({weather.current.aqiStatus})
              </span>
              <span className="pcc-weather-quick-metric__label">Air Quality</span>
            </div>
          </div>

          <div className="pcc-weather-quick-metric">
            <div className="pcc-weather-quick-metric__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
              </svg>
            </div>
            <div className="pcc-weather-quick-metric__info">
              <span className="pcc-weather-quick-metric__value">UV {weather.current.uvIndex} (Moderate)</span>
              <span className="pcc-weather-quick-metric__label">UV Index</span>
            </div>
          </div>

          <div className="pcc-weather-quick-metric">
            <div className="pcc-weather-quick-metric__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 14 14" />
              </svg>
            </div>
            <div className="pcc-weather-quick-metric__info">
              <span className="pcc-weather-quick-metric__value">{weather.current.pressure} hPa</span>
              <span className="pcc-weather-quick-metric__label">Pressure</span>
            </div>
          </div>

          <div className="pcc-weather-quick-metric">
            <div className="pcc-weather-quick-metric__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 18a5 5 0 0 0-10 0" />
                <line x1="12" y1="2" x2="12" y2="9" />
                <line x1="4.22" y1="10.22" x2="5.64" y2="11.64" />
                <line x1="1" y1="18" x2="3" y2="18" />
                <line x1="21" y1="18" x2="23" y2="18" />
                <line x1="18.36" y1="11.64" x2="19.78" y2="10.22" />
                <line x1="23" y1="22" x2="1" y2="22" />
              </svg>
            </div>
            <div className="pcc-weather-quick-metric__info">
              <span className="pcc-weather-quick-metric__value">
                {weather.current.sunrise} / {weather.current.sunset}
              </span>
              <span className="pcc-weather-quick-metric__label">Sunrise / Sunset</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Forecast Track */}
      <div>
        <h2 className="pcc-weather-section-title">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          24-Hour Hourly Forecast
        </h2>

        <div className="pcc-weather-hourly-track">
          {weather.hourly.map((hour, idx) => (
            <div key={idx} className="pcc-weather-hourly-card">
              <span className="pcc-weather-hourly-time">{hour.time}</span>
              <div className="pcc-weather-hourly-icon">{renderWeatherIcon(hour.icon)}</div>
              <span className="pcc-weather-hourly-temp">
                {convertTemp(hour.temp)}°{unit}
              </span>
              <span className="pcc-weather-hourly-pop">
                {hour.pop > 0 ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                    </svg>
                    {hour.pop}%
                  </span>
                ) : (
                  '-'
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 5-Day Extended Forecast */}
      <div>
        <h2 className="pcc-weather-section-title">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          5-Day Forecast
        </h2>

        <div className="pcc-weather-daily-grid">
          {weather.daily.map((day, idx) => (
            <div key={idx} className="pcc-weather-daily-card">
              <div className="pcc-weather-daily-header">
                <span className="pcc-weather-daily-day">{day.dayName}</span>
                <span className="pcc-weather-daily-date">{day.date.slice(5)}</span>
              </div>

              <div className="pcc-weather-daily-main">
                <div className="pcc-weather-daily-icon">{renderWeatherIcon(day.icon)}</div>
                <div className="pcc-weather-daily-temps">
                  <span className="pcc-weather-daily-temp-high">
                    {convertTemp(day.tempMax)}°{unit}
                  </span>
                  <span className="pcc-weather-daily-temp-low">
                    Low {convertTemp(day.tempMin)}°{unit}
                  </span>
                </div>
              </div>

              <div className="pcc-weather-daily-footer">
                <span>{day.condition}</span>
                <span>
                  {day.pop > 0 ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                      </svg>
                      {day.pop}%
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                      </svg>
                      Dry
                    </span>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeatherPage;
