import { create } from 'zustand';
import type { WeatherData } from '../types';
import { weatherApi } from '../services/api';
import { soundEffects } from '../utils/audio';

interface WeatherStore {
  weather: WeatherData;
  unit: 'C' | 'F';
  selectedCity: string;
  lat: number;
  lon: number;
  isGpsLocated: boolean;
  locationStatus: 'pending' | 'granted' | 'denied' | 'unsupported';
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Actions
  requestLocation: () => Promise<void>;
  fetchWeather: (coords?: { lat: number; lon: number }, city?: string) => Promise<void>;
  setCity: (city: string) => Promise<void>;
  toggleUnit: () => void;
  refreshWeather: () => Promise<void>;
}

const CITY_COORDINATES: Record<string, { lat: number; lon: number; country: string }> = {
  Pune: { lat: 18.5204, lon: 73.8567, country: 'IN' },
  Mumbai: { lat: 19.0760, lon: 72.8777, country: 'IN' },
  Delhi: { lat: 28.6139, lon: 77.2090, country: 'IN' },
  Bengaluru: { lat: 12.9716, lon: 77.5946, country: 'IN' },
  'San Francisco': { lat: 37.7749, lon: -122.4194, country: 'US' },
  London: { lat: 51.5074, lon: -0.1278, country: 'UK' },
};

type WeatherIconType = 'sunny' | 'partly_cloudy' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'windy';

function interpretWmoCode(code?: number): { condition: string; icon: WeatherIconType } {
  if (code === undefined || code === null) return { condition: 'Partly Cloudy', icon: 'partly_cloudy' };
  if (code === 0) return { condition: 'Clear Sky', icon: 'sunny' };
  if (code === 1 || code === 2) return { condition: 'Partly Cloudy', icon: 'partly_cloudy' };
  if (code === 3) return { condition: 'Overcast', icon: 'cloudy' };
  if (code === 45 || code === 48) return { condition: 'Foggy', icon: 'cloudy' };
  if (code >= 51 && code <= 65) return { condition: 'Rain', icon: 'rain' };
  if (code >= 71 && code <= 77) return { condition: 'Snow', icon: 'snow' };
  if (code >= 80 && code <= 82) return { condition: 'Showers', icon: 'rain' };
  if (code >= 95) return { condition: 'Thunderstorm', icon: 'storm' };
  return { condition: 'Partly Cloudy', icon: 'partly_cloudy' };
}

function getWindDirectionLabel(deg?: number): string {
  if (deg === undefined || deg === null) return '';
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round(deg / 45) % 8];
}

function formatTimeStr(isoStr?: string): string {
  if (!isoStr) return '--:--';
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
}

export async function fetchLiveOpenMeteo(
  latitude: number,
  longitude: number,
  city: string
): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
  const data = await res.json();

  const current = data.current || {};
  const daily = data.daily || {};
  const hourly = data.hourly || {};

  const wmoMeta = interpretWmoCode(current.weather_code);

  const timeList: string[] = hourly.time || [];
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const currentHour = now.getHours();
  const currentHourPad = String(currentHour).padStart(2, '0');
  const localHourISO = `${year}-${month}-${day}T${currentHourPad}`;

  let startIndex = timeList.findIndex((t: string) => t.startsWith(localHourISO));

  if (startIndex === -1) {
    startIndex = timeList.findIndex((t: string) => {
      const h = parseInt(t.split('T')[1]?.slice(0, 2) || '0', 10);
      return h >= currentHour;
    });
  }
  if (startIndex === -1) startIndex = 0;

  const hourlyItems = timeList.slice(startIndex, startIndex + 24).map((t: string, offset: number) => {
    const idx = startIndex + offset;
    let formattedTime = '00:00';
    if (offset === 0) {
      formattedTime = 'Now';
    } else {
      const hourPart = parseInt(t.split('T')[1]?.slice(0, 2) || '0', 10);
      const period = hourPart >= 12 ? 'PM' : 'AM';
      const h12 = hourPart % 12 === 0 ? 12 : hourPart % 12;
      formattedTime = `${h12} ${period}`;
    }

    return {
      time: formattedTime,
      temp: Math.round(hourly.temperature_2m?.[idx] ?? current.temperature_2m ?? 0),
      condition: interpretWmoCode(hourly.weather_code?.[idx]).condition,
      icon: interpretWmoCode(hourly.weather_code?.[idx]).icon,
      pop: hourly.precipitation_probability?.[idx] ?? 0,
    };
  });

  const dailyItems = (daily.time || []).slice(0, 7).map((dStr: string, idx: number) => {
    const dObj = new Date(dStr);
    const dayName = idx === 0 ? 'Today' : dObj.toLocaleDateString('en-US', { weekday: 'short' });
    const meta = interpretWmoCode(daily.weather_code?.[idx]);
    return {
      date: dStr,
      dayName,
      tempMin: Math.round(daily.temperature_2m_min?.[idx] ?? 0),
      tempMax: Math.round(daily.temperature_2m_max?.[idx] ?? 0),
      condition: meta.condition,
      icon: meta.icon,
      pop: daily.precipitation_probability_max?.[idx] ?? 0,
      humidity: Math.round(current.relative_humidity_2m ?? 0),
    };
  });

  return {
    location: {
      city: city || 'Pune',
      country: CITY_COORDINATES[city]?.country || 'IN',
      timezone: data.timezone || 'IST (UTC+5:30)',
      updatedAt: new Date().toISOString(),
    },
    current: {
      temp: Math.round(current.temperature_2m ?? 0),
      feelsLike: Math.round(current.apparent_temperature ?? 0),
      tempMin: dailyItems[0]?.tempMin ?? 0,
      tempMax: dailyItems[0]?.tempMax ?? 0,
      condition: wmoMeta.condition,
      icon: wmoMeta.icon,
      description: `Live weather telemetry for ${city}. ${wmoMeta.condition} with ${current.relative_humidity_2m ?? 0}% humidity.`,
      humidity: Math.round(current.relative_humidity_2m ?? 0),
      windSpeed: Math.round(current.wind_speed_10m ?? 0),
      windDirection: getWindDirectionLabel(current.wind_direction_10m),
      uvIndex: Math.round(daily.uv_index_max?.[0] ?? 0),
      aqi: 0,
      aqiStatus: '',
      pressure: Math.round(current.surface_pressure ?? 0),
      visibility: 10,
      sunrise: formatTimeStr(daily.sunrise?.[0]),
      sunset: formatTimeStr(daily.sunset?.[0]),
    },
    hourly: hourlyItems,
    daily: dailyItems,
  };
}

const DEFAULT_PUNE_WEATHER: WeatherData = {
  location: {
    city: 'Pune',
    country: 'IN',
    region: 'Maharashtra',
    timezone: 'IST (UTC+5:30)',
    updatedAt: new Date().toISOString(),
  },
  current: {
    temp: 0,
    feelsLike: 0,
    tempMin: 0,
    tempMax: 0,
    condition: 'Loading...',
    icon: 'partly_cloudy',
    description: 'Fetching live weather telemetry for Pune, IN...',
    humidity: 0,
    windSpeed: 0,
    windDirection: '',
    uvIndex: 0,
    aqi: 0,
    aqiStatus: '',
    pressure: 0,
    visibility: 0,
    sunrise: '--:--',
    sunset: '--:--',
  },
  hourly: [],
  daily: [],
};

const STORAGE_KEY_CITY = 'pcc_weather_selected_city';
const STORAGE_KEY_UNIT = 'pcc_weather_unit';

const initialCity = localStorage.getItem(STORAGE_KEY_CITY) || 'Pune';
const initialUnit = (localStorage.getItem(STORAGE_KEY_UNIT) as 'C' | 'F') || 'C';

export const useWeatherStore = create<WeatherStore>((set, get) => ({
  weather: DEFAULT_PUNE_WEATHER,
  unit: initialUnit,
  selectedCity: initialCity,

  lat: CITY_COORDINATES[initialCity]?.lat || 18.5204,
  lon: CITY_COORDINATES[initialCity]?.lon || 73.8567,
  isGpsLocated: false,
  locationStatus: 'pending',
  isLoading: false,
  isRefreshing: false,
  error: null,

  requestLocation: async () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      set({ locationStatus: 'unsupported', isGpsLocated: false });
      get().fetchWeather({ lat: 18.5204, lon: 73.8567 }, 'Pune');
      return;
    }

    set({ locationStatus: 'pending' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        set({
          lat: latitude,
          lon: longitude,
          isGpsLocated: true,
          locationStatus: 'granted',
        });
        get().refreshWeather();
      },
      () => {
        set({
          lat: 18.5204,
          lon: 73.8567,
          isGpsLocated: false,
          locationStatus: 'denied',
        });
        get().fetchWeather({ lat: 18.5204, lon: 73.8567 }, 'Pune');
      },
      { timeout: 5000, enableHighAccuracy: true }
    );
  },

  fetchWeather: async (coords, city) => {
    const targetCity = city || get().selectedCity;
    const targetLat = coords?.lat ?? CITY_COORDINATES[targetCity]?.lat ?? get().lat;
    const targetLon = coords?.lon ?? CITY_COORDINATES[targetCity]?.lon ?? get().lon;

    set({ isLoading: true, error: null });

    try {
      const serverData = await weatherApi.getCurrentWeather({
        lat: targetLat,
        lon: targetLon,
        city: targetCity,
      });
      if (serverData && 'current' in serverData && serverData.current) {
        set({ weather: serverData, selectedCity: targetCity, lat: targetLat, lon: targetLon, isLoading: false });
        return;
      }
    } catch {
      // Direct live Open-Meteo API fallback
    }

    try {
      const liveData = await fetchLiveOpenMeteo(targetLat, targetLon, targetCity);
      set({
        weather: liveData,
        selectedCity: targetCity,
        lat: targetLat,
        lon: targetLon,
        isLoading: false,
      });
    } catch {
      set({
        weather: {
          ...DEFAULT_PUNE_WEATHER,
          location: { ...DEFAULT_PUNE_WEATHER.location, city: targetCity, updatedAt: new Date().toISOString() },
        },
        selectedCity: targetCity,
        isLoading: false,
      });
    }
  },

  setCity: async (city: string) => {
    localStorage.setItem(STORAGE_KEY_CITY, city);
    soundEffects.playPip();
    const coords = CITY_COORDINATES[city];
    await get().fetchWeather(coords, city);
  },

  toggleUnit: () => {
    const nextUnit = get().unit === 'C' ? 'F' : 'C';
    localStorage.setItem(STORAGE_KEY_UNIT, nextUnit);
    soundEffects.playPip();
    set({ unit: nextUnit });
  },

  refreshWeather: async () => {
    set({ isRefreshing: true });
    soundEffects.playPip();
    const currentCity = get().selectedCity;
    await get().fetchWeather(undefined, currentCity);
    set({ isRefreshing: false });
  },
}));
