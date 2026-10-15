// Source: Google Maps Platform Code Assist
// Attribution ID: gmp_mcp_codeassist_v1_aistudio

import React, { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { RouteComputationResult } from '../../services/maps/routesService';
import { Navigation, Clock, MapPin } from 'lucide-react';

interface RouteOverlayProps {
  route: RouteComputationResult | null;
  nearbySpotsCount?: number;
}

export const RouteOverlay: React.FC<RouteOverlayProps> = ({ route, nearbySpotsCount = 0 }) => {
  const map = useMap();
  const polylineRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !route || !route.path || route.path.length < 2) {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      return;
    }

    const g = (window as any).google;
    if (!g || !g.maps) return;

    // Remove existing polyline if any
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    // Create modern glowing polyline for the India route corridor
    const polyline = new g.maps.Polyline({
      path: route.path,
      geodesic: true,
      strokeColor: '#f59e0b', // Amber-500
      strokeOpacity: 0.9,
      strokeWeight: 4,
      map,
    });

    polylineRef.current = polyline;

    // Fit map bounds to encompass the entire route
    const bounds = new g.maps.LatLngBounds();
    route.path.forEach((pt) => bounds.extend(new g.maps.LatLng(pt.lat, pt.lng)));
    map.fitBounds(bounds, 50);

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, route]);

  if (!route) return null;

  return (
    <div className="absolute top-3 left-3 z-30 max-w-xs rounded-2xl bg-slate-900/95 backdrop-blur-md border border-amber-500/30 p-3 text-xs shadow-2xl space-y-2">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
        <span className="font-extrabold text-amber-400 flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5" />
          <span>Active Route Corridor</span>
        </span>
        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
          {route.summary}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-slate-400 block text-[10px]">Total Distance</span>
          <span className="font-mono font-black text-white text-sm">
            {route.distanceKm} km
          </span>
        </div>

        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-slate-400 block text-[10px]">Est. Travel Time</span>
          <span className="font-mono font-black text-amber-400 text-sm flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {route.durationText}
          </span>
        </div>
      </div>

      {nearbySpotsCount > 0 && (
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
          <span>Useful spots near corridor:</span>
          <span className="font-bold text-emerald-400">{nearbySpotsCount} stops</span>
        </div>
      )}
    </div>
  );
};
