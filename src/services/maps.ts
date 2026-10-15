import { PlaceType } from '../types';

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export const isGoogleMapsConfigured = (): boolean => {
  return Boolean(
    GOOGLE_MAPS_API_KEY &&
    GOOGLE_MAPS_API_KEY !== 'MY_GOOGLE_MAPS_API_KEY' &&
    GOOGLE_MAPS_API_KEY.length > 5
  );
};

// Default center of India
export const INDIA_MAP_CENTER = {
  lat: 22.9734,
  lng: 78.6569,
};

export const DEFAULT_MAP_ZOOM = 5;

// Color mapping for community categories
export const CATEGORY_COLORS: Record<PlaceType | 'hitchhiking', { bg: string; text: string; hex: string }> = {
  hitchhiking: { bg: 'bg-emerald-500', text: 'text-emerald-950', hex: '#10b981' },
  food: { bg: 'bg-amber-500', text: 'text-amber-950', hex: '#f59e0b' },
  stay: { bg: 'bg-indigo-500', text: 'text-indigo-950', hex: '#6366f1' },
  water: { bg: 'bg-cyan-500', text: 'text-cyan-950', hex: '#06b6d4' },
  camping: { bg: 'bg-lime-500', text: 'text-lime-950', hex: '#84cc16' },
  shower: { bg: 'bg-blue-500', text: 'text-blue-950', hex: '#3b82f6' },
  charging: { bg: 'bg-purple-500', text: 'text-purple-950', hex: '#a855f7' },
};

export const CATEGORY_ICONS_LABEL: Record<PlaceType | 'hitchhiking', { label: string; symbol: string; desc: string }> = {
  hitchhiking: { label: 'Hitchhiking', symbol: '👍', desc: 'Toll bays & high-visibility highway pickup points' },
  food: { label: 'Cheap Food', symbol: '🍲', desc: 'Dhabas, langars, thali & local community meals' },
  stay: { label: 'Budget Stay', symbol: '🛏️', desc: 'Ashrams, dharamshalas & backpacker dorms' },
  water: { label: 'Free Water', symbol: '💧', desc: 'RO water ATMs, temple dispensers & springs' },
  camping: { label: 'Camping', symbol: '⛺', desc: 'Wild tent spots, boulder plateaus & beaches' },
  shower: { label: 'Shower / Bath', symbol: '🚿', desc: 'Sulabh complexes, hot springs & railway baths' },
  charging: { label: 'Charging Point', symbol: '⚡', desc: 'Free AC plugs, metro lounges & cafes' },
};

// Distance calculation between two lat/lng in kilometers (Haversine formula)
export const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

// Build high-contrast custom SVG pin markup for Google Maps or vector map canvas
export const getCustomMarkerSvg = (
  type: PlaceType | 'hitchhiking',
  title: string
): string => {
  const meta = CATEGORY_ICONS_LABEL[type];
  const color = CATEGORY_COLORS[type].hex;

  return `
    <div class="group relative flex flex-col items-center cursor-pointer transform hover:scale-110 transition-transform duration-200">
      <div style="background-color: ${color}; border: 2px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.5);" 
           class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-xl">
        ${meta.symbol}
      </div>
      <div style="border-top-color: ${color};" class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] -mt-[1px]"></div>
      <div class="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 whitespace-nowrap bg-slate-900 text-slate-100 text-[11px] font-semibold px-2 py-0.5 rounded shadow pointer-events-none z-50">
        ${title}
      </div>
    </div>
  `;
};
