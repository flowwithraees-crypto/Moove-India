import React, { useState, useEffect } from 'react';
import { PlaceDocument, HitchhikingSpot, PlaceType } from '../types';
import { CATEGORY_COLORS, CATEGORY_ICONS_LABEL } from '../services/maps';
import { MapView } from '../components/map/MapView';
import { PlaceCard } from '../components/places/PlaceCard';
import { HitchhikingSpotCard } from '../components/hitchhiking/HitchhikingSpotCard';
import { Search, Map as MapIcon, List, Filter, ThumbsUp, Compass, Check } from 'lucide-react';

interface MapPageProps {
  places: PlaceDocument[];
  hitchhikingSpots: HitchhikingSpot[];
  selectedPlace: PlaceDocument | null;
  selectedHitchSpot: HitchhikingSpot | null;
  onSelectPlace: (place: PlaceDocument) => void;
  onSelectHitchSpot: (spot: HitchhikingSpot) => void;
  initialLocation?: { lat: number; lng: number };
}

export const MapPage: React.FC<MapPageProps> = ({
  places,
  hitchhikingSpots,
  selectedPlace,
  selectedHitchSpot,
  onSelectPlace,
  onSelectHitchSpot,
  initialLocation,
}) => {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [centerLoc, setCenterLoc] = useState<{ lat: number; lng: number } | undefined>(initialLocation);

  const allCategories: (PlaceType | 'hitchhiking')[] = [
    'hitchhiking',
    'food',
    'stay',
    'water',
    'camping',
    'shower',
    'charging',
  ];

  const [activeCategories, setActiveCategories] = useState<(PlaceType | 'hitchhiking')[]>(allCategories);

  useEffect(() => {
    if (initialLocation) {
      setCenterLoc(initialLocation);
    }
  }, [initialLocation]);

  const toggleCategory = (cat: PlaceType | 'hitchhiking') => {
    setActiveCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const selectAll = () => setActiveCategories(allCategories);
  const clearAll = () => setActiveCategories([]);

  // Filter spots
  const filteredPlaces = places.filter((p) => {
    const matchCat = activeCategories.includes(p.type);
    const matchSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.state.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredHitchSpots = hitchhikingSpots.filter((s) => {
    const matchCat = activeCategories.includes('hitchhiking');
    const matchSearch =
      searchQuery === '' ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.direction.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalFilteredCount = filteredPlaces.length + (activeCategories.includes('hitchhiking') ? filteredHitchSpots.length : 0);

  return (
    <div className="flex flex-col h-[calc(100vh-61px)] pb-16 md:pb-0 bg-[#F8FAF7] text-[#17211B] overflow-hidden w-full">
      {/* Top Filter Bar */}
      <div className="p-3 sm:px-6 lg:px-8 bg-white border-b border-[#E2E8E3] space-y-2.5 shrink-0 z-30 shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66736B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search spots, cities or highways (NH44, Rishikesh)..."
              className="w-full rounded-xl bg-[#F8FAF7] border border-[#E2E8E3] py-2 pl-9 pr-3 text-xs text-[#17211B] placeholder-[#66736B] focus:outline-none focus:border-[#1F7A4D] focus:bg-white"
            />
          </div>

          {/* Toggle Map / List */}
          <div className="flex rounded-xl bg-[#F8FAF7] border border-[#E2E8E3] p-0.5 shrink-0">
            <button
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                viewMode === 'map'
                  ? 'bg-white text-[#1F7A4D] shadow-sm'
                  : 'text-[#66736B] hover:text-[#17211B]'
              }`}
              title="Map View"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Map</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                viewMode === 'list'
                  ? 'bg-white text-[#1F7A4D] shadow-sm'
                  : 'text-[#66736B] hover:text-[#17211B]'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>

        {/* Categories Chips */}
        <div className="mx-auto max-w-7xl flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
          <button
            onClick={() => {
              if (activeCategories.length === allCategories.length) clearAll();
              else selectAll();
            }}
            className="px-2.5 py-1 rounded-full bg-[#E8F5EC] text-[#1F7A4D] border border-[#1F7A4D]/20 text-[11px] font-bold whitespace-nowrap"
          >
            {activeCategories.length === allCategories.length ? 'Clear' : 'All'} ({totalFilteredCount})
          </button>

          {allCategories.map((cat) => {
            const meta = CATEGORY_ICONS_LABEL[cat];
            const isSelected = activeCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap border transition ${
                  isSelected
                    ? 'bg-[#1F7A4D] text-white border-[#1F7A4D] font-bold shadow-sm'
                    : 'bg-white text-[#66736B] border-[#E2E8E3] hover:border-[#1F7A4D]'
                }`}
              >
                <span>{meta.symbol}</span>
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Map / List View Container */}
      <div className="relative flex-1 w-full min-h-0 overflow-hidden flex flex-col">
        {viewMode === 'map' ? (
          <div className="w-full h-full flex-1 min-h-0 flex flex-col">
            <MapView
              places={filteredPlaces}
              hitchhikingSpots={filteredHitchSpots}
              selectedPlace={selectedPlace}
              selectedHitchSpot={selectedHitchSpot}
              onSelectPlace={onSelectPlace}
              onSelectHitchSpot={onSelectHitchSpot}
              activeCategories={activeCategories}
              centerLocation={centerLoc}
              heightClass="h-full"
            />
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-4 max-w-5xl mx-auto pb-24 md:pb-8">
            <div className="flex items-center justify-between text-xs text-[#66736B]">
              <span>Showing {totalFilteredCount} matching locations</span>
              <button
                onClick={() => setViewMode('map')}
                className="text-[#1F7A4D] font-bold hover:underline"
              >
                Switch to Map
              </button>
            </div>

            {/* Places */}
            {filteredPlaces.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#66736B] uppercase tracking-wider">
                  Community Verified Spots ({filteredPlaces.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredPlaces.map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      onSelect={onSelectPlace}
                      onShowOnMap={() => {
                        setCenterLoc({ lat: place.location.lat, lng: place.location.lng });
                        setViewMode('map');
                        onSelectPlace(place);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Hitchhiking Spots */}
            {activeCategories.includes('hitchhiking') && filteredHitchSpots.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold text-[#66736B] uppercase tracking-wider">
                  Hitchhiking Points & Bays ({filteredHitchSpots.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredHitchSpots.map((spot) => (
                    <HitchhikingSpotCard
                      key={spot.id}
                      spot={spot}
                      onSelect={onSelectHitchSpot}
                      onShowOnMap={() => {
                        setCenterLoc({ lat: spot.location.lat, lng: spot.location.lng });
                        setViewMode('map');
                        onSelectHitchSpot(spot);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
