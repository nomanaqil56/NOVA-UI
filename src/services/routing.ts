import type { RouteOption } from '../types/navigation';

export type RoutingStatus = 'success' | 'no-route' | 'network-error' | 'server-error' | 'cancelled';

export type RoutingResult = 
  | { status: 'success'; routes: RouteOption[] }
  | { status: Exclude<RoutingStatus, 'success'> };

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

/**
 * Get route from start to end.
 * @param start [lon, lat]
 * @param end [lon, lat]
 */
export const getRoute = async (start: [number, number], end: [number, number], signal?: AbortSignal): Promise<RoutingResult> => {
  try {
    const response = await fetch(
      `${OSRM_BASE_URL}/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson&alternatives=true`,
      { signal }
    );

    if (!response.ok) {
      return { status: 'server-error' };
    }

    const data = await response.json();
    
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return { status: 'no-route' };
    }

    const routes = data.routes;
    const minDuration = Math.min(...routes.map((r: any) => r.duration));
    const minDistance = Math.min(...routes.map((r: any) => r.distance));

    const parsedRoutes = routes.map((r: any, index: number) => {
      let name = 'ALTERNATIVE';
      if (r.duration === minDuration && r.distance === minDistance) name = 'OPTIMAL';
      else if (r.duration === minDuration) name = 'FASTEST';
      else if (r.distance === minDistance) name = 'SHORTEST';

      return {
        id: `route-${index}`,
        name,
        distance: r.distance,
        duration: r.duration,
        geometry: {
          coordinates: r.geometry.coordinates // [lon, lat][]
        },
        type: name.toLowerCase()
      };
    });

    return { status: 'success', routes: parsedRoutes };
  } catch (error: any) {
    console.error('Routing error:', error);
    if (error.name === 'AbortError') {
      return { status: 'cancelled' };
    }
    return { status: 'network-error' };
  }
};
