import type { GeocodingResult, GPSLocation } from '../types/navigation';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

// Helper to calculate haversine distance
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const searchCache: Record<string, GeocodingResult[]> = {};

export const searchDestination = async (query: string, location: GPSLocation | null): Promise<GeocodingResult[]> => {
  const cleanQuery = query.trim().replace(/\s+/g, ' ');
  if (!cleanQuery || cleanQuery.length < 2) return [];
  
  let cacheKey = cleanQuery.toLowerCase();
  if (location) {
    const latGrid = Math.round(location.latitude * 10) / 10;
    const lonGrid = Math.round(location.longitude * 10) / 10;
    cacheKey += `_${latGrid}_${lonGrid}`;
  }

  if (searchCache[cacheKey]) {
    return searchCache[cacheKey];
  }

  try {
    let url = `${NOMINATIM_BASE_URL}?q=${encodeURIComponent(cleanQuery)}&format=json&addressdetails=1&limit=10`;
    
    // Bias towards current location if available
    if (location) {
      const viewboxWidth = 1.0; // ~100km
      const minLon = location.longitude - viewboxWidth;
      const minLat = location.latitude - viewboxWidth;
      const maxLon = location.longitude + viewboxWidth;
      const maxLat = location.latitude + viewboxWidth;
      url += `&viewbox=${minLon},${minLat},${maxLon},${maxLat}`;
    }

    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Nova_Autonomous_Dashboard/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();
    
    // Deduplicate by place_id
    const seen = new Set();
    const uniqueData = data.filter((item: any) => {
      if (seen.has(item.place_id)) return false;
      seen.add(item.place_id);
      return true;
    });

    const results = uniqueData.map((item: any) => {
      const address = item.address || {};
      const primaryName = item.name || address.road || address.neighbourhood || address.suburb || address.city || item.display_name.split(',')[0];
      
      // Extract useful context
      const contextParts = [
        address.neighbourhood,
        address.suburb,
        address.city || address.town || address.village,
        address.state
      ].filter(Boolean);
      
      // Remove the primary name from the context if it's already there
      const filteredContext = contextParts.filter(p => p.toLowerCase() !== primaryName.toLowerCase());
      const context = filteredContext.length > 0 ? filteredContext.join(', ') : item.display_name;

      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      const distance = location ? getDistance(location.latitude, location.longitude, lat, lon) : Infinity;

      // Ranking Score (Lower is better)
      let score = 0;
      const qLower = cleanQuery.toLowerCase();
      const nameLower = primaryName.toLowerCase();
      
      if (nameLower === qLower) score -= 100;
      else if (nameLower.startsWith(qLower)) score -= 50;
      else if (nameLower.includes(qLower)) score -= 20;

      if (item.type === 'city' || item.type === 'administrative') score -= 10;
      if (item.importance) score -= (item.importance * 30);
      
      // Distance penalty (adds to score)
      if (distance < 10) score -= 10;
      else if (distance < 50) score -= 5;
      else if (distance > 500) score += 20;
      else if (distance > 2000) score += 50;

      return {
        placeId: item.place_id.toString(),
        name: primaryName,
        displayName: context,
        lat,
        lon,
        type: item.type || 'place',
        score,
        distance
      };
    });

    // Sort by score
    results.sort((a: any, b: any) => a.score - b.score);

    const finalResults = results.slice(0, 5); // Return top 5
    searchCache[cacheKey] = finalResults;
    return finalResults;
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error; // Throw error to trigger error state in UI
  }
};
