// Source: Google Maps Platform Code Assist
// Attribution ID: gmp_mcp_codeassist_v1_aistudio

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  APIProvider,
  Map,
  useMap,
  useApiIsLoaded,
  useApiLoadingStatus,
} from '@vis.gl/react-google-maps';
import { PlaceDocument, HitchhikingSpot, PlaceType } from '../../types';
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_ATTRIBUTION_ID,
  DEMO_MAP_ID,
  INDIA_CENTER,
  DEFAULT_ZOOM,
  LatLngLiteral,
  MapBounds,
  isPointInBounds,
  getCurrentUserLocation,
} from '../../services/maps/mapsService';
import { MapMarker } from './MapMarker';
import { MapFilters } from './MapFilters';
import { RouteOverlay } from './RouteOverlay';
import {
  calculateRouteBetweenPoints,
  RouteComputationResult,
  findSpotsNearRoute,
} from '../../services/maps/routesService';
import { Compass, AlertTriangle, Loader2, RefreshCw, MapPin } from 'lucide-react';

interface MapViewProps {
  places: PlaceDocument[];
  hitchhikingSpots: HitchhikingSpot[];
  selectedPlace: PlaceDocument | null;
  selectedHitchSpot: HitchhikingSpot | null;
  onSelectPlace: (place: PlaceDocument) => void;
  onSelectHitchSpot: (spot: HitchhikingSpot) => void;
  activeCategories?: (PlaceType | 'hitchhiking')[];
  onToggleCategory?: (cat: PlaceType | 'hitchhiking') => void;
  routeCoordinates?: Array<{ lat: number; lng: number }>;
  centerLocation?: { lat: number; lng: number };
  zoomLevel?: number;
  heightClass?: string;
  routeStartPoint?: LatLngLiteral;
  routeEndPoint?: LatLngLiteral;
  showFilters?: boolean;
  onBoundsChange?: (bounds: MapBounds) => void;
}

/**
 * Child component that connects to the Google Maps instance to manage
 * pan camera, bounds updates, route corridor polyline, and markers
 */
const MapController: React.FC<{
  places: PlaceDocument[];
  hitchhikingSpots: HitchhikingSpot[];
  selectedPlace: PlaceDocument | null;
  selectedHitchSpot: HitchhikingSpot | null;
  onSelectPlace: (p: PlaceDocument) => void;
  onSelectHitchSpot: (s: HitchhikingSpot) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  centerLocation?: { lat: number; lng: number };
  route: RouteComputationResult | null;
}> = ({
  places,
  hitchhikingSpots,
  selectedPlace,
  selectedHitchSpot,
  onSelectPlace,
  onSelectHitchSpot,
  onBoundsChange,
  centerLocation,
  route,
}) => {
  const map = useMap();
  const lastCenterRef = useRef<{ lat: number; lng: number } | null>(null);

  // Handle center pan without infinite loops
  useEffect(() => {
    if (!map || !centerLocation) return;
    if (
      lastCenterRef.current &&
      Math.abs(lastCenterRef.current.lat - centerLocation.lat) < 0.0001 &&
      Math.abs(lastCenterRef.current.lng - centerLocation.lng) < 0.0001
    ) {
      return;
    }
    lastCenterRef.current = centerLocation;
    map.panTo(centerLocation);
    map.setZoom(12);
  }, [map, centerLocation]);

  // Handle bounds change listener
  useEffect(() => {
    if (!map || !onBoundsChange) return;

    const listener = map.addListener('idle', () => {
      const b = map.getBounds();
      if (b) {
        const ne = b.getNorthEast();
        const sw = b.getSouthWest();
        onBoundsChange({
          north: ne.lat(),
          south: sw.lat(),
          east: ne.lng(),
          west: sw.lng(),
        });
      }
    });

    return () => {
      (window as any).google?.maps?.event?.removeListener(listener);
    };
  }, [map, onBoundsChange]);

  const spotsNearCorridor = useMemo(() => {
    if (!route || !route.path || route.path.length === 0) return 0;
    const nearbyPlaces = findSpotsNearRoute(places, route.path, 40);
    const nearbyHitch = findSpotsNearRoute(hitchhikingSpots, route.path, 40);
    return nearbyPlaces.length + nearbyHitch.length;
  }, [route, places, hitchhikingSpots]);

  return (
    <>
      {/* Route polyline corridor overlay */}
      <RouteOverlay route={route} nearbySpotsCount={spotsNearCorridor} />

      {/* Hitchhiking Markers */}
      {hitchhikingSpots.map((spot) => (
        <MapMarker
          key={spot.id}
          spot={spot}
          isSelected={selectedHitchSpot?.id === spot.id}
          onClick={() => onSelectHitchSpot(spot)}
        />
      ))}

      {/* Community Verified Places Markers */}
      {places.map((place) => (
        <MapMarker
          key={place.id}
          place={place}
          isSelected={selectedPlace?.id === place.id}
          onClick={() => onSelectPlace(place)}
        />
      ))}
    </>
  );
};

export const MapView: React.FC<MapViewProps> = ({
  places,
  hitchhikingSpots,
  selectedPlace,
  selectedHitchSpot,
  onSelectPlace,
  onSelectHitchSpot,
  activeCategories = ['hitchhiking', 'food', 'stay', 'water', 'camping', 'shower', 'charging'],
  onToggleCategory,
  routeCoordinates,
  centerLocation,
  zoomLevel = DEFAULT_ZOOM,
  heightClass = 'h-[500px]',
  routeStartPoint,
  routeEndPoint,
  showFilters = false,
  onBoundsChange: onBoundsChangeProp,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentBounds, setCurrentBounds] = useState<MapBounds | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [deviceLoc, setDeviceLoc] = useState<LatLngLiteral | undefined>(centerLocation);
  const [computedRoute, setComputedRoute] = useState<RouteComputationResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReloadKey, setMapReloadKey] = useState(0);

  // Hook into Google Maps loading status
  const isApiLoaded = useApiIsLoaded();
  const apiStatus = useApiLoadingStatus();

  // Serialize route endpoints to avoid triggering effect on new object references
  const routeStartKey = routeStartPoint ? `${routeStartPoint.lat.toFixed(4)},${routeStartPoint.lng.toFixed(4)}` : '';
  const routeEndKey = routeEndPoint ? `${routeEndPoint.lat.toFixed(4)},${routeEndPoint.lng.toFixed(4)}` : '';
  const routeCoordsKey = routeCoordinates && routeCoordinates.length >= 2
    ? `${routeCoordinates[0].lat.toFixed(4)},${routeCoordinates[0].lng.toFixed(4)}->${routeCoordinates[routeCoordinates.length - 1].lat.toFixed(4)},${routeCoordinates[routeCoordinates.length - 1].lng.toFixed(4)}`
    : '';

  // Compute route when origin and destination are passed
  useEffect(() => {
    let cancelled = false;
    if (routeStartPoint && routeEndPoint) {
      setRouteLoading(true);
      calculateRouteBetweenPoints(routeStartPoint, routeEndPoint)
        .then((res) => {
          if (!cancelled) {
            setComputedRoute(res);
            setRouteLoading(false);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            console.warn('Route computation notice:', err);
            setRouteLoading(false);
          }
        });
    } else if (routeCoordinates && routeCoordinates.length >= 2) {
      const start = routeCoordinates[0];
      const end = routeCoordinates[routeCoordinates.length - 1];
      calculateRouteBetweenPoints(start, end)
        .then((res) => {
          if (!cancelled) setComputedRoute(res);
        })
        .catch(() => {});
    } else {
      setComputedRoute(null);
    }
    return () => {
      cancelled = true;
    };
  }, [routeStartKey, routeEndKey, routeCoordsKey]);

  // Handle GPS location
  const handleLocateMe = async () => {
    setIsLocating(true);
    try {
      const loc = await getCurrentUserLocation();
      setDeviceLoc(loc);
    } catch {
      setMapError('Could not fetch GPS. Please verify location permissions.');
      setTimeout(() => setMapError(null), 3500);
    } finally {
      setIsLocating(false);
    }
  };

  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    setCurrentBounds(bounds);
    if (onBoundsChangeProp) {
      onBoundsChangeProp(bounds);
    }
  }, [onBoundsChangeProp]);

  // Filter spots based on active category, search query, and current map bounds
  const visiblePlaces = useMemo(() => {
    return places.filter((p) => {
      const matchCat = activeCategories.includes(p.type);
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.state.toLowerCase().includes(searchQuery.toLowerCase());

      const matchBounds = currentBounds
        ? isPointInBounds({ lat: p.location.lat, lng: p.location.lng }, currentBounds)
        : true;

      return matchCat && matchSearch && matchBounds;
    });
  }, [places, activeCategories, searchQuery, currentBounds]);

  const visibleHitchSpots = useMemo(() => {
    const showHitch = activeCategories.includes('hitchhiking');
    if (!showHitch) return [];

    return hitchhikingSpots.filter((s) => {
      const matchSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.roadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.direction.toLowerCase().includes(searchQuery.toLowerCase());

      const matchBounds = currentBounds
        ? isPointInBounds({ lat: s.location.lat, lng: s.location.lng }, currentBounds)
        : true;

      return matchSearch && matchBounds;
    });
  }, [hitchhikingSpots, activeCategories, searchQuery, currentBounds]);

  const totalVisibleCount = visiblePlaces.length + visibleHitchSpots.length;

  const isFullHeight = heightClass === 'h-full';
  const containerClasses = isFullHeight
    ? 'relative w-full h-full flex-1 min-h-0 flex flex-col'
    : 'relative w-full flex flex-col space-y-2';

  const mapBoxClasses = isFullHeight
    ? 'relative w-full h-full flex-1 min-h-[350px] rounded-2xl overflow-hidden border border-[#E2E8E3] bg-[#F8FAF7] shadow-sm'
    : `relative w-full ${heightClass} min-h-[260px] rounded-2xl overflow-hidden border border-[#E2E8E3] bg-[#F8FAF7] shadow-sm`;

  return (
    <div className={containerClasses}>
      {/* Optional Filters Bar on top of map */}
      {showFilters && (
        <MapFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeCategories={activeCategories}
          onToggleCategory={onToggleCategory || (() => {})}
          onLocateMe={handleLocateMe}
          isLocating={isLocating}
          totalVisibleCount={totalVisibleCount}
        />
      )}

      {/* Map Container */}
      <div className={mapBoxClasses}>
        {/* Error banner */}
        {mapError && (
          <div className="absolute top-3 left-3 right-3 z-50 rounded-xl bg-red-500/90 text-white text-xs font-semibold p-2.5 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{mapError}</span>
            </div>
            <button onClick={() => setMapError(null)} className="text-white hover:opacity-80">
              ✕
            </button>
          </div>
        )}

        {/* Route Calculation Loading Indicator */}
        {routeLoading && (
          <div className="absolute top-3 right-3 z-40 flex items-center gap-2 bg-white/95 text-[#1F7A4D] border border-[#E2E8E3] px-3 py-1.5 rounded-full text-xs font-bold shadow-md">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1F7A4D]" />
            <span>Calculating Highway Corridor...</span>
          </div>
        )}

        {/* Loading Overlay while Google Maps loads */}
        {!isApiLoaded && apiStatus !== 'FAILED' && apiStatus !== 'AUTH_FAILURE' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#F8FAF7] p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F5EC] flex items-center justify-center text-[#1F7A4D] shadow-xs">
              <Compass className="w-6 h-6 animate-spin stroke-[2.2]" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-[#17211B]">Loading Moove India Live Map</h4>
              <p className="text-xs text-[#66736B] mt-0.5">Plotting verified budget spots & corridors across India...</p>
            </div>
          </div>
        )}

        {/* Fallback View if Google Maps API failed (e.g. adblocker / offline) */}
        {(apiStatus === 'FAILED' || apiStatus === 'AUTH_FAILURE') && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="max-w-md">
              <h4 className="font-extrabold text-sm text-[#17211B]">Live Map Temporarily Unavailable</h4>
              <p className="text-xs text-[#66736B] mt-1 leading-relaxed">
                Could not connect to the Google Maps tile service. All {totalVisibleCount} verified budget spots are available in List View.
              </p>
            </div>
            <button
              onClick={() => setMapReloadKey((k) => k + 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F7A4D] hover:bg-[#16603b] text-white text-xs font-bold transition shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Loading Map</span>
            </button>
          </div>
        )}

        {/* Google Maps Component with MapController */}
        <Map
          key={mapReloadKey}
          style={{ width: '100%', height: '100%' }}
          defaultCenter={deviceLoc || centerLocation || INDIA_CENTER}
          defaultZoom={zoomLevel}
          mapId={DEMO_MAP_ID}
          gestureHandling="greedy"
          disableDefaultUI={false}
          reuseMaps={true}
          internalUsageAttributionIds={[GOOGLE_MAPS_ATTRIBUTION_ID]}
        >
          <MapController
            places={visiblePlaces}
            hitchhikingSpots={visibleHitchSpots}
            selectedPlace={selectedPlace}
            selectedHitchSpot={selectedHitchSpot}
            onSelectPlace={onSelectPlace}
            onSelectHitchSpot={onSelectHitchSpot}
            onBoundsChange={handleBoundsChange}
            centerLocation={deviceLoc || centerLocation}
            route={computedRoute}
          />
        </Map>

        {/* Floating Quick Locate Me Button if not using header filters */}
        {!showFilters && (
          <button
            onClick={handleLocateMe}
            disabled={isLocating}
            className="absolute bottom-4 right-4 z-30 p-2.5 rounded-xl bg-white hover:bg-[#F8FAF7] text-[#1F7A4D] border border-[#E2E8E3] shadow-md transition active:scale-95 cursor-pointer"
            title="Locate Me on GPS"
            aria-label="Locate Me on GPS"
          >
            <Compass className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
          </button>
        )}

        {/* Visible count badge */}
        <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2 bg-white/95 backdrop-blur-md border border-[#E2E8E3] px-3 py-1.5 rounded-full text-[11px] text-[#17211B] shadow-md">
          <span className="w-2 h-2 rounded-full bg-[#1F7A4D] animate-pulse" />
          <span className="font-semibold">
            {totalVisibleCount} spots in view {computedRoute ? '• Route active' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};
