import type { GeocodingResult } from '../types/navigation';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

export const searchDestination = async (query: string): Promise<GeocodingResult[]> => {
  if (!query || query.length < 3) return [];
  
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`,
      {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          // Required by Nominatim Terms of Use
          'User-Agent': 'Nova_Autonomous_Dashboard/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();
    return data.map((item: any) => ({
      placeId: item.place_id.toString(),
      name: item.name || item.display_name.split(',')[0],
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon)
    }));
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
};
