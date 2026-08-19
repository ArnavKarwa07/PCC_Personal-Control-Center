import { create } from 'zustand';
import type { WeatherData } from '../types';
import { weatherApi } from '../services/api';
import { soundEffects } from '../utils/audio';

interface WeatherStore {
  weather: WeatherData;
  unit: 'C' | 'F';
  selectedCity: string;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Actions
  fetchWeather: (city?: string) => Promise<void>;
  setCity: (city: string) => Promise<void>;
  toggleUnit: () => void;
  refreshWeather: () => Promise<void>;
}

const CITY_WEATHER_DATABASE: Record<string, WeatherData> = {
  Pune: {
    location: {
      city: 'Pune',
      country: 'IN',
      region: 'Maharashtra',
      timezone: 'IST (UTC+5:30)',
      updatedAt: '2026-08-18T12:00:00Z',
    },
    current: {
      temp: 27,
      feelsLike: 28,
      tempMin: 22,
      tempMax: 30,
      condition: 'Partly Cloudy',
      icon: 'partly_cloudy',
      description: 'Pleasant monsoonal breeze with mild sunshine over the Western Ghats plateau.',
      humidity: 75,
      windSpeed: 14,
      windDirection: 'WSW',
      uvIndex: 6,
      aqi: 42,
      aqiStatus: 'Good',
      pressure: 1010,
      visibility: 9,
      sunrise: '06:12 AM',
      sunset: '07:02 PM',
    },
    hourly: [
      { time: '16:00', temp: 28, condition: 'Partly Cloudy', icon: 'partly_cloudy', pop: 15 },
      { time: '17:00', temp: 27, condition: 'Partly Cloudy', icon: 'partly_cloudy', pop: 20 },
      { time: '18:00', temp: 26, condition: 'Light Rain', icon: 'rain', pop: 40 },
      { time: '19:00', temp: 25, condition: 'Light Rain', icon: 'rain', pop: 35 },
      { time: '20:00', temp: 24, condition: 'Partly Cloudy', icon: 'partly_cloudy', pop: 20 },
      { time: '21:00', temp: 24, condition: 'Cloudy', icon: 'cloudy', pop: 10 },
      { time: '22:00', temp: 23, condition: 'Cloudy', icon: 'cloudy', pop: 10 },
      { time: '23:00', temp: 23, condition: 'Clear Sky', icon: 'sunny', pop: 5 },
    ],
    daily: [
      { date: '2026-08-18', dayName: 'Today', tempMin: 22, tempMax: 30, condition: 'Partly Cloudy', icon: 'partly_cloudy', pop: 30, humidity: 75 },
      { date: '2026-08-19', dayName: 'Wed', tempMin: 21, tempMax: 29, condition: 'Light Rain', icon: 'rain', pop: 50, humidity: 80 },
      { date: '2026-08-20', dayName: 'Thu', tempMin: 22, tempMax: 31, condition: 'Sunny', icon: 'sunny', pop: 15, humidity: 70 },
      { date: '2026-08-21', dayName: 'Fri', tempMin: 22, tempMax: 30, condition: 'Partly Cloudy', icon: 'partly_cloudy', pop: 20, humidity: 72 },
      { date: '2026-08-22', dayName: 'Sat', tempMin: 21, tempMax: 29, condition: 'Moderate Rain', icon: 'rain', pop: 60, humidity: 82 },
    ],
    alerts: [
      {
        id: 'alt-pune-01',
        title: 'Mild Monsoon Shower Warning',
        severity: 'info',
        description: 'Passing monsoon showers expected in evening hours across Pune metro area.',
        time: 'Today 18:00 - 21:00',
      },
    ],
  },
  'San Francisco': {
    location: {
      city: 'San Francisco',
      country: 'US',
      region: 'California',
      timezone: 'PST (UTC-8)',
      updatedAt: '2026-08-15T15:30:00Z',
    },
    current: {
      temp: 21,
      feelsLike: 20,
      tempMin: 15,
      tempMax: 24,
      condition: 'Partly Cloudy',
      icon: 'partly_cloudy',
      description: 'Gentle marine layer rolling in from the Pacific with clear afternoon sun.',
      humidity: 68,
      windSpeed: 16,
      windDirection: 'WNW',
      uvIndex: 5,
      aqi: 24,
      aqiStatus: 'Good',
      pressure: 1015,
      visibility: 10,
      sunrise: '06:22 AM',
      sunset: '08:08 PM',
    },
    hourly: [
      { time: '16:00', temp: 22, condition: 'Partly Cloudy', icon: 'partly_cloudy', pop: 10 },
      { time: '17:00', temp: 21, condition: 'Sunny', icon: 'sunny', pop: 5 },
      { time: '18:00', temp: 20, condition: 'Sunny', icon: 'sunny', pop: 0 },
      { time: '19:00', temp: 18, condition: 'Partly Cloudy', icon: 'partly_cloudy', pop: 5 },
      { time: '20:00', temp: 17, condition: 'Partly Cloudy', icon: 'partly_cloudy', pop: 10 },
      { time: '21:00', temp: 16, condition: 'Cloudy', icon: 'cloudy', pop: 15 },
      { time: '22:00', temp: 15, condition: 'Cloudy', icon: 'cloudy', pop: 20 },
      { time: '23:00', temp: 15, condition: 'Cloudy', icon: 'cloudy', pop: 20 },
    ],
    daily: [
      { date: '2026-08-15', dayName: 'Today', tempMin: 15, tempMax: 24, condition: 'Partly Cloudy', icon: 'partly_cloudy', pop: 10, humidity: 68 },
      { date: '2026-08-16', dayName: 'Sun', tempMin: 14, tempMax: 22, condition: 'Sunny', icon: 'sunny', pop: 0, humidity: 62 },
      { date: '2026-08-17', dayName: 'Mon', tempMin: 15, tempMax: 25, condition: 'Sunny', icon: 'sunny', pop: 5, humidity: 58 },
      { date: '2026-08-18', dayName: 'Tue', tempMin: 16, tempMax: 26, condition: 'Partly Cloudy', icon: 'partly_cloudy', pop: 10, humidity: 64 },
      { date: '2026-08-19', dayName: 'Wed', tempMin: 15, tempMax: 23, condition: 'Cloudy', icon: 'cloudy', pop: 20, humidity: 70 },
    ],
    alerts: [
      {
        id: 'alt-01',
        title: 'Moderate UV Index Notice',
        severity: 'info',
        description: 'UV Index peaking at 5 between 12:00 PM and 3:30 PM. Sun protection advised.',
        time: 'Today 12:00 - 15:30',
      },
    ],
  },
  'New York': {
    location: {
      city: 'New York',
      country: 'US',
      region: 'New York',
      timezone: 'EST (UTC-5)',
      updatedAt: '2026-08-15T18:30:00Z',
    },
    current: {
      temp: 27,
      feelsLike: 29,
      tempMin: 22,
      tempMax: 30,
      condition: 'Sunny',
      icon: 'sunny',
      description: 'Clear warm summer day across the Manhattan skyline.',
      humidity: 55,
      windSpeed: 12,
      windDirection: 'SSE',
      uvIndex: 7,
      aqi: 38,
      aqiStatus: 'Good',
      pressure: 1012,
      visibility: 10,
      sunrise: '06:05 AM',
      sunset: '07:55 PM',
    },
    hourly: [
      { time: '19:00', temp: 26, condition: 'Sunny', icon: 'sunny', pop: 0 },
      { time: '20:00', temp: 25, condition: 'Partly Cloudy', icon: 'partly_cloudy', pop: 5 },
      { time: '21:00', temp: 24, condition: 'Partly Cloudy', icon: 'partly_cloudy', pop: 10 },
      { time: '22:00', temp: 23, condition: 'Cloudy', icon: 'cloudy', pop: 15 },
      { time: '23:00', temp: 22, condition: 'Cloudy', icon: 'cloudy', pop: 25 },
      { time: '00:00', temp: 22, condition: 'Rain', icon: 'rain', pop: 40 },
      { time: '01:00', temp: 21, condition: 'Rain', icon: 'rain', pop: 50 },
      { time: '02:00', temp: 21, condition: 'Rain', icon: 'rain', pop: 60 },
    ],
    daily: [
      { date: '2026-08-15', dayName: 'Today', tempMin: 22, tempMax: 30, condition: 'Sunny', icon: 'sunny', pop: 10, humidity: 55 },
      { date: '2026-08-16', dayName: 'Sun', tempMin: 21, tempMax: 28, condition: 'Rain', icon: 'rain', pop: 65, humidity: 75 },
      { date: '2026-08-17', dayName: 'Mon', tempMin: 20, tempMax: 27, condition: 'Partly Cloudy', icon: 'partly_cloudy', pop: 20, humidity: 60 },
      { date: '2026-08-18', dayName: 'Tue', tempMin: 22, tempMax: 31, condition: 'Sunny', icon: 'sunny', pop: 5, humidity: 52 },
      { date: '2026-08-19', dayName: 'Wed', tempMin: 23, tempMax: 32, condition: 'Storm', icon: 'storm', pop: 70, humidity: 80 },
    ],
    alerts: [
      {
        id: 'alt-02',
        title: 'Overnight Rain Showers Anticipated',
        severity: 'warning',
        description: 'Light to moderate rainfall developing around midnight through early Sunday morning.',
        time: 'Tonight from 23:00',
      },
    ],
  },
  London: {
    location: {
      city: 'London',
      country: 'UK',
      region: 'Greater London',
      timezone: 'BST (UTC+1)',
      updatedAt: '2026-08-15T23:30:00Z',
    },
    current: {
      temp: 19,
      feelsLike: 18,
      tempMin: 13,
      tempMax: 22,
      condition: 'Partly Cloudy',
      icon: 'partly_cloudy',
      description: 'Pleasant summer evening with a cool breeze along the Thames.',
      humidity: 72,
      windSpeed: 18,
      windDirection: 'SW',
      uvIndex: 3,
      aqi: 22,
      aqiStatus: 'Good',
      pressure: 1018,
      visibility: 10,
      sunrise: '05:45 AM',
      sunset: '08:24 PM',
    },
    hourly: [
      { time: '00:00', temp: 16, condition: 'Partly Cloudy', icon: 'partly_cloudy', pop: 10 },
      { time: '01:00', temp: 15, condition: 'Cloudy', icon: 'cloudy', pop: 15 },
      { time: '02:00', temp: 14, condition: 'Cloudy', icon: 'cloudy', pop: 20 },
      { time: '03:00', temp: 14, condition: 'Cloudy', icon: 'cloudy', pop: 20 },
      { time: '04:00', temp: 13, condition: 'Partly Cloudy', icon: 'partly_cloudy', pop: 15 },
      { time: '05:00', temp: 13, condition: 'Partly Cloudy', icon: 'partly_cloudy', pop: 10 },
      { time: '06:00', temp: 14, condition: 'Sunny', icon: 'sunny', pop: 5 },
      { time: '07:00', temp: 16, condition: 'Sunny', icon: 'sunny', pop: 5 },
    ],
    daily: [
      { date: '2026-08-15', dayName: 'Today', tempMin: 13, tempMax: 22, condition: 'Partly Cloudy', icon: 'partly_cloudy', pop: 15, humidity: 72 },
      { date: '2026-08-16', dayName: 'Sun', tempMin: 14, tempMax: 23, condition: 'Sunny', icon: 'sunny', pop: 10, humidity: 65 },
      { date: '2026-08-17', dayName: 'Mon', tempMin: 15, tempMax: 24, condition: 'Sunny', icon: 'sunny', pop: 5, humidity: 60 },
      { date: '2026-08-18', dayName: 'Tue', tempMin: 14, tempMax: 21, condition: 'Rain', icon: 'rain', pop: 60, humidity: 80 },
      { date: '2026-08-19', dayName: 'Wed', tempMin: 13, tempMax: 20, condition: 'Partly Cloudy', icon: 'partly_cloudy', pop: 20, humidity: 70 },
    ],
  },
  Tokyo: {
    location: {
      city: 'Tokyo',
      country: 'JP',
      region: 'Kanto',
      timezone: 'JST (UTC+9)',
      updatedAt: '2026-08-16T07:30:00Z',
    },
    current: {
      temp: 29,
      feelsLike: 33,
      tempMin: 25,
      tempMax: 33,
      condition: 'Sunny',
      icon: 'sunny',
      description: 'Vibrant morning sunshine with humid summer atmosphere.',
      humidity: 78,
      windSpeed: 10,
      windDirection: 'S',
      uvIndex: 8,
      aqi: 28,
      aqiStatus: 'Good',
      pressure: 1009,
      visibility: 10,
      sunrise: '05:01 AM',
      sunset: '06:33 PM',
    },
    hourly: [
      { time: '08:00', temp: 30, condition: 'Sunny', icon: 'sunny', pop: 0 },
      { time: '09:00', temp: 31, condition: 'Sunny', icon: 'sunny', pop: 5 },
      { time: '10:00', temp: 32, condition: 'Sunny', icon: 'sunny', pop: 5 },
      { time: '11:00', temp: 33, condition: 'Sunny', icon: 'sunny', pop: 10 },
      { time: '12:00', temp: 33, condition: 'Partly Cloudy', icon: 'partly_cloudy', pop: 20 },
      { time: '13:00', temp: 32, condition: 'Storm', icon: 'storm', pop: 45 },
      { time: '14:00', temp: 30, condition: 'Storm', icon: 'storm', pop: 60 },
      { time: '15:00', temp: 29, condition: 'Rain', icon: 'rain', pop: 40 },
    ],
    daily: [
      { date: '2026-08-16', dayName: 'Today', tempMin: 25, tempMax: 33, condition: 'Sunny', icon: 'sunny', pop: 20, humidity: 78 },
      { date: '2026-08-17', dayName: 'Mon', tempMin: 26, tempMax: 34, condition: 'Partly Cloudy', icon: 'partly_cloudy', pop: 25, humidity: 75 },
      { date: '2026-08-18', dayName: 'Tue', tempMin: 25, tempMax: 32, condition: 'Storm', icon: 'storm', pop: 70, humidity: 85 },
      { date: '2026-08-19', dayName: 'Wed', tempMin: 24, tempMax: 30, condition: 'Rain', icon: 'rain', pop: 50, humidity: 80 },
      { date: '2026-08-20', dayName: 'Thu', tempMin: 25, tempMax: 31, condition: 'Sunny', icon: 'sunny', pop: 10, humidity: 70 },
    ],
  },
};

const STORAGE_KEY_CITY = 'pcc_weather_selected_city';
const STORAGE_KEY_UNIT = 'pcc_weather_unit';

const initialCity = localStorage.getItem(STORAGE_KEY_CITY) || 'Pune';
const initialUnit = (localStorage.getItem(STORAGE_KEY_UNIT) as 'C' | 'F') || 'C';

export const useWeatherStore = create<WeatherStore>((set, get) => ({
  weather: CITY_WEATHER_DATABASE[initialCity] || CITY_WEATHER_DATABASE['Pune'],
  unit: initialUnit,
  selectedCity: initialCity,
  isLoading: false,
  isRefreshing: false,
  error: null,

  fetchWeather: async (city) => {
    const targetCity = city || get().selectedCity;
    set({ isLoading: true, error: null });

    try {
      const serverData = await weatherApi.getCurrent(targetCity);
      if (serverData && serverData.current) {
        set({ weather: serverData, selectedCity: targetCity, isLoading: false });
        return;
      }
    } catch {
      // Fallback to internal database
    }

    const localData = CITY_WEATHER_DATABASE[targetCity] || CITY_WEATHER_DATABASE['Pune'];
    set({
      weather: localData,
      selectedCity: targetCity,
      isLoading: false,
    });
  },

  setCity: async (city: string) => {
    localStorage.setItem(STORAGE_KEY_CITY, city);
    soundEffects.playPip();
    await get().fetchWeather(city);
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
    await new Promise((res) => setTimeout(res, 600));

    const currentCity = get().selectedCity;
    const baseData = CITY_WEATHER_DATABASE[currentCity] || CITY_WEATHER_DATABASE['Pune'];

    set({
      weather: {
        ...baseData,
        location: {
          ...baseData.location,
          updatedAt: new Date().toISOString(),
        },
      },
      isRefreshing: false,
    });
  },
}));
