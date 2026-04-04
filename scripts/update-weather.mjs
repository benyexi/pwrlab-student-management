import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENWEATHERMAP_KEY = process.env.OPENWEATHERMAP_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OPENWEATHERMAP_KEY) {
  console.error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENWEATHERMAP_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

async function fetchWeather(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_KEY}&units=metric&lang=zh_cn`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`OpenWeatherMap API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function pruneOldRecords(siteId) {
  const { data, error } = await supabase
    .from('weather_records')
    .select('id, date')
    .eq('site_id', siteId)
    .order('date', { ascending: true });

  if (error) {
    console.error(`  Failed to query records for pruning (site ${siteId}):`, error.message);
    return;
  }

  if (data.length > 30) {
    const toDelete = data.slice(0, data.length - 30).map((r) => r.id);
    const { error: deleteError } = await supabase
      .from('weather_records')
      .delete()
      .in('id', toDelete);

    if (deleteError) {
      console.error(`  Failed to prune old records (site ${siteId}):`, deleteError.message);
    } else {
      console.log(`  Pruned ${toDelete.length} old record(s) for site ${siteId}`);
    }
  }
}

async function main() {
  console.log(`Starting weather update for ${today}`);

  // Fetch all sites
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('id, name_cn, latitude, longitude');

  if (sitesError) {
    console.error('Failed to fetch sites:', sitesError.message);
    process.exit(1);
  }

  console.log(`Found ${sites.length} site(s)`);

  for (const site of sites) {
    console.log(`\nProcessing site: ${site.name_cn} (id=${site.id})`);

    // Check if today's record already exists
    const { data: existing, error: checkError } = await supabase
      .from('weather_records')
      .select('id')
      .eq('site_id', site.id)
      .eq('date', today)
      .maybeSingle();

    if (checkError) {
      console.error(`  Failed to check existing record:`, checkError.message);
      continue;
    }

    if (existing) {
      console.log(`  Record already exists for today, skipping`);
      continue;
    }

    // Fetch weather from OpenWeatherMap
    let weatherData;
    try {
      weatherData = await fetchWeather(site.latitude, site.longitude);
    } catch (err) {
      console.error(`  Failed to fetch weather:`, err.message);
      continue;
    }

    const rainfall =
      weatherData.rain?.['1h'] ?? weatherData.rain?.['3h'] ?? 0;

    const record = {
      site_id: site.id,
      date: today,
      temperature: weatherData.main?.temp ?? null,
      temperature_min: weatherData.main?.temp_min ?? null,
      temperature_max: weatherData.main?.temp_max ?? null,
      rainfall,
      humidity: weatherData.main?.humidity ?? null,
      wind_speed: weatherData.wind?.speed ?? null,
      weather_desc: weatherData.weather?.[0]?.description ?? null,
      source: 'auto',
    };

    const { error: insertError } = await supabase
      .from('weather_records')
      .insert(record);

    if (insertError) {
      console.error(`  Failed to insert record:`, insertError.message);
      continue;
    }

    console.log(`  Inserted weather record: ${record.temperature}°C, ${record.weather_desc}`);

    // Prune records exceeding 30 entries
    await pruneOldRecords(site.id);
  }

  console.log('\nWeather update completed');
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
