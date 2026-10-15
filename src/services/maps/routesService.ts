// Source: Google Maps Platform Code Assist
// Attribution ID: gmp_mcp_codeassist_v1_aistudio

import { LatLngLiteral, calculateDistanceKm } from './mapsService';

export interface RouteComputationResult {
  origin: LatLngLiteral;
  destination: LatLngLiteral;
  distanceKm: number;
  durationText: string;
  durationMinutes: number;
  path: LatLngLiteral[];
  summary: string;
}

/**
 * Calculates real-world route using modern Google Maps Routes API (Route.computeRoutes)
 */
export async function calculateRouteBetweenPoints(
  origin: LatLngLiteral,
  destination: LatLngLiteral
): Promise<RouteComputationResult> {
  const g = typeof window !== 'undefined' ? (window as any).google : undefined;

  // 1. Try modern Maps JS SDK Routes library (Route.computeRoutes)
  if (g && g.maps && g.maps.importLibrary) {
    try {
      const routesLib = (await g.maps.importLibrary('routes')) as any;
      if (routesLib && routesLib.Route) {
        const routeService = new routesLib.Route();
        const request = {
          origin: { lat: origin.lat, lng: origin.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          travelMode: routesLib.TravelMode?.DRIVING || 'DRIVING',
          fields: ['polyline', 'distanceMeters', 'duration', 'viewport'],
        };

        const response = await routeService.computeRoutes(request);
        if (response && response.routes && response.routes.length > 0) {
          const route = response.routes[0];
          let path: LatLngLiteral[] = [];

          if (route.polyline && route.polyline.encodedPolyline) {
            const decoded = routesLib.Route.decode(route.polyline.encodedPolyline);
            path = decoded.map((p: any) => ({
              lat: typeof p.lat === 'function' ? p.lat() : p.lat,
              lng: typeof p.lng === 'function' ? p.lng() : p.lng,
            }));
          }

          const distMeters = route.distanceMeters || 0;
          const distanceKm = Math.round(distMeters / 1000) || calculateDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);

          // Duration formatting
          let durationSeconds = 0;
          if (typeof route.duration === 'string') {
            durationSeconds = parseInt(route.duration.replace('s', ''), 10) || 0;
          } else if (typeof route.duration === 'number') {
            durationSeconds = route.duration;
          }
          const hours = Math.floor(durationSeconds / 3600);
          const minutes = Math.round((durationSeconds % 3600) / 60);
          const durationText = hours > 0
            ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`
            : `${minutes || Math.round(distanceKm / 50 * 60)}m`;

          return {
            origin,
            destination,
            distanceKm,
            durationText,
            durationMinutes: Math.round(durationSeconds / 60) || Math.round(distanceKm / 50 * 60),
            path: path.length > 0 ? path : interpolatePoints(origin, destination, 24),
            summary: 'National Highway Corridor',
          };
        }
      }
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (msg.includes('QuotaExceeded') || msg.includes('OverQuota') || msg.includes('RESOURCE_EXHAUSTED')) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
      console.warn('Google Routes API computeRoutes note, using highway corridor calculation:', err);
    }
  }

  // 2. Realistic Grounded Routing Fallback for Indian Highway Corridors
  const directKm = calculateDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
  const roadKm = Math.max(50, Math.round(directKm * 1.3)); // 1.3x road factor in India
  const avgSpeedKmh = 50; // Average Indian highway speed including tolls
  const totalHours = Math.round((roadKm / avgSpeedKmh) * 10) / 10;
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);

  const interpolatedPath = interpolatePoints(
    origin,
    destination,
    Math.max(12, Math.min(40, Math.round(roadKm / 30)))
  );

  return {
    origin,
    destination,
    distanceKm: roadKm,
    durationText: `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`,
    durationMinutes: Math.round(totalHours * 60),
    path: interpolatedPath,
    summary: 'NH Highway Corridor (India)',
  };
}

/**
 * Interpolates smooth points between two coordinates with slight organic curvature for highway simulation
 */
function interpolatePoints(
  start: LatLngLiteral,
  end: LatLngLiteral,
  numSteps: number
): LatLngLiteral[] {
  const points: LatLngLiteral[] = [];
  for (let i = 0; i <= numSteps; i++) {
    const fraction = i / numSteps;
    // Add subtle curvature to simulate road routing
    const arcOffset = Math.sin(fraction * Math.PI) * 0.15;
    points.push({
      lat: start.lat + (end.lat - start.lat) * fraction + arcOffset * 0.2,
      lng: start.lng + (end.lng - start.lng) * fraction + arcOffset * 0.3,
    });
  }
  return points;
}

/**
 * Filters places and hitchhiking spots that lie within a certain distance of the route
 */
export function findSpotsNearRoute<T extends { location: { lat: number; lng: number } }>(
  items: T[],
  routePath: LatLngLiteral[],
  maxDistanceKm = 35
): T[] {
  if (routePath.length === 0) return items;

  return items.filter((item) => {
    // Check distance to any sample point along the route
    return routePath.some((pt) => {
      const dist = calculateDistanceKm(item.location.lat, item.location.lng, pt.lat, pt.lng);
      return dist <= maxDistanceKm;
    });
  });
}
