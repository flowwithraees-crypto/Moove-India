// Source: Google Maps Platform Code Assist
// Attribution ID: gmp_mcp_codeassist_v1_aistudio

import React from 'react';
import { PlaceType } from '../../types';
import { CATEGORY_COLORS, CATEGORY_ICONS_LABEL } from '../../services/maps';
import { Search, Locate, Check, Layers, RefreshCw } from 'lucide-react';

interface MapFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeCategories: (PlaceType | 'hitchhiking')[];
  onToggleCategory: (cat: PlaceType | 'hitchhiking') => void;
  onLocateMe: () => void;
  isLocating: boolean;
  totalVisibleCount: number;
}

export const MapFilters: React.FC<MapFiltersProps> = ({
  searchQuery,
  onSearchChange,
  activeCategories,
  onToggleCategory,
  onLocateMe,
  isLocating,
  totalVisibleCount,
}) => {
  const allCategories: (PlaceType | 'hitchhiking')[] = [
    'hitchhiking',
    'food',
    'stay',
    'water',
    'camping',
    'shower',
    'charging',
  ];

  return (
    <div className="space-y-2">
      {/* Search Bar + Current Location button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search city, dhaba, or highway (NH44, Rishikesh)..."
            className="w-full rounded-xl bg-slate-950/90 border border-slate-700/80 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 shadow-inner"
          />
        </div>

        {/* Locate Me Button */}
        <button
          onClick={onLocateMe}
          disabled={isLocating}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition active:scale-95 shrink-0"
          title="Current GPS Location"
        >
          <Locate className={`w-3.5 h-3.5 text-amber-400 ${isLocating ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">My Location</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {allCategories.map((cat) => {
          const meta = CATEGORY_ICONS_LABEL[cat];
          const isSelected = activeCategories.includes(cat);
          const color = CATEGORY_COLORS[cat];

          return (
            <button
              key={cat}
              onClick={() => onToggleCategory(cat)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
                isSelected
                  ? `${color.bg} text-slate-950 border-white/40 shadow-sm font-bold`
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span>{meta.symbol}</span>
              <span>{meta.label}</span>
              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
