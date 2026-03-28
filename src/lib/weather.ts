// OpenWeatherMap API wrapper
// Replace with your actual API key
const API_KEY = 'ecc3a26ba4dc21f272555411b71e81e6'
const BASE_URL = 'https://api.openweathermap.org/data/2.5'

export interface WeatherApiResponse {
  temperature: number
  temperature_min: number
  temperature_max: number
  rainfall: number
  humidity: number
  wind_speed: number
  weather_desc: string
}

export async function fetchCurrentWeather(lat: number, lon: number): Promise<WeatherApiResponse> {
  // In demo mode, return mock data
  if (API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY') {
    return {
      temperature: +(15 + Math.random() * 15).toFixed(1),
      temperature_min: +(10 + Math.random() * 8).toFixed(1),
      temperature_max: +(22 + Math.random() * 10).toFixed(1),
      rainfall: +(Math.random() > 0.6 ? Math.random() * 10 : 0).toFixed(1),
      humidity: Math.round(40 + Math.random() * 40),
      wind_speed: +(1 + Math.random() * 5).toFixed(1),
      weather_desc: ['晴', '多云', '阴', '小雨', '晴转多云'][Math.floor(Math.random() * 5)],
    }
  }

  const res = await fetch(
    `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=zh_cn`
  )
  if (!res.ok) throw new Error('Failed to fetch weather data')
  const data = await res.json()

  return {
    temperature: data.main.temp,
    temperature_min: data.main.temp_min,
    temperature_max: data.main.temp_max,
    rainfall: data.rain?.['1h'] || data.rain?.['3h'] || 0,
    humidity: data.main.humidity,
    wind_speed: data.wind.speed,
    weather_desc: data.weather?.[0]?.description || '未知',
  }
}
