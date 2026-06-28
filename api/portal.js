// Vercel Serverless Function: api/portal.js
// Aggregates CheckStatus uptime, GameCalendar daily summaries, Recetario latest recipe, and Utrecht live weather.

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Aggregation endpoints (configurable via environment variables)
  const CHECKSTATUS_API = process.env.CHECKSTATUS_API || 'https://checkstatus-eight.vercel.app/api/monitors';
  const GAMECALENDAR_API = process.env.GAMECALENDAR_API || 'https://www.gamecalendar.es/api/daily-summary';
  const RECETARIO_API = process.env.RECETARIO_API || 'https://recetario-rosy.vercel.app/api/recipes';
  
  // Free public weather API for Utrecht coordinates (latitude 52.0907, longitude 5.1214)
  const WEATHER_API = 'https://api.open-meteo.com/v1/forecast?latitude=52.0907&longitude=5.1214&current_weather=true';

  try {
    // Utility to fetch API endpoints in parallel with a strict 3-second timeout protection
    const fetchWithTimeout = (url, timeout = 3000) => {
      return Promise.race([
        fetch(url),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout fetching ${url}`)), timeout))
      ]).then(response => {
        if (!response.ok) throw new Error(`Fetch failed for ${url} with status ${response.status}`);
        return response.json();
      }).catch(error => {
        console.warn('Portal aggregation warning:', error.message);
        return null; // Fallback gracefully to keep the rest of the data intact
      });
    };

    // Run all aggregation tasks concurrently
    const [uptimeData, dailySummary, recipesData, weatherData] = await Promise.all([
      fetchWithTimeout(CHECKSTATUS_API),
      fetchWithTimeout(GAMECALENDAR_API),
      fetchWithTimeout(RECETARIO_API),
      fetchWithTimeout(WEATHER_API)
    ]);

    // Recetario devuelve { recipes: [...] }; aceptamos también un array suelto por robustez.
    const recipeList = Array.isArray(recipesData) ? recipesData : recipesData?.recipes;

    // Construct unified telemetry data model
    const portalTelemetry = {
      uptime: uptimeData || [],
      gamingSummary: dailySummary || null,
      latestRecipe: Array.isArray(recipeList) && recipeList.length ? recipeList[0] : null,
      weather: weatherData && weatherData.current_weather ? {
        temp: weatherData.current_weather.temperature,
        code: weatherData.current_weather.weathercode,
        wind: weatherData.current_weather.windspeed,
        time: weatherData.current_weather.time
      } : null,
      timestamp: Date.now()
    };

    return res.status(200).json(portalTelemetry);
  } catch (error) {
    console.error('Portal API aggregator critical error:', error);
    return res.status(500).json({ error: 'Failed to aggregate portal telemetry' });
  }
}
