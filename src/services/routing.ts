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
  const isValidPoint = ([longitude, latitude]: [number, number]) =>
    Number.isFinite(longitude) && Number.isFinite(latitude) &&
    longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90;

  if (!isValidPoint(start) || !isValidPoint(end)) return { status: 'no-route' };

  try {
    const response = await fetch(
      `${OSRM_BASE_URL}/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson&alternatives=true`,
      { signal }
    );

    if (!response.ok) {
      return { status: 'server-error' };
    }

    const data: unknown = await response.json();
    if (!data || typeof data !== 'object') return { status: 'no-route' };
    const responseData = data as { code?: unknown; routes?: unknown };

    if (responseData.code !== 'Ok' || !Array.isArray(responseData.routes) || responseData.routes.length === 0) {
      return { status: 'no-route' };
    }

    const routeCandidates = responseData.routes as unknown[];
    const routes = routeCandidates.filter((route: unknown): route is {
      duration: number;
      distance: number;
      geometry: { coordinates: [number, number][] };
    } => {
      if (!route || typeof route !== 'object') return false;
      const candidate = route as { duration?: unknown; distance?: unknown; geometry?: { coordinates?: unknown } };
      return Number.isFinite(candidate.duration) && Number.isFinite(candidate.distance) &&
        !!candidate.geometry && Array.isArray(candidate.geometry.coordinates) &&
        candidate.geometry.coordinates.length > 1 && candidate.geometry.coordinates.every((point: unknown) =>
          Array.isArray(point) && point.length >= 2 && Number.isFinite(point[0]) && Number.isFinite(point[1])
        );
    });
    if (routes.length === 0) return { status: 'no-route' };

    const minDuration = Math.min(...routes.map((route) => route.duration));
    const minDistance = Math.min(...routes.map((route) => route.distance));

    const parsedRoutes = routes.map((r, index) => {
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
  } catch (error) {
    console.error('Routing error:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      return { status: 'cancelled' };
    }
    return { status: 'network-error' };
  }
};
