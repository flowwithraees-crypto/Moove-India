import React, { useState } from 'react';
import { PlaceDocument, HitchhikingSpot, PlaceType, UserProfile, CuratedDestination } from '../../src/types';
import { MapView } from '../components/map/MapView';
import { PlaceCard } from '../components/places/PlaceCard';
import { HitchhikingSpotCard } from '../components/hitchhiking/HitchhikingSpotCard';
import { DestinationCard } from '../components/places/DestinationCard';
import { DestinationDetailDrawer } from '../components/places/DestinationDetailDrawer';
import { 
  CURATED_DESTINATIONS, 
  INITIAL_TRAVEL_UPDATES 
} from '../data/mockData';
import { 
  Search, 
  Route, 
  Map as MapIcon, 
  Compass, 
  ArrowRight, 
  ChevronRight, 
  MapPin,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  ThumbsUp
} from 'lucide-react';

interface ExplorePageProps {
  places: PlaceDocument[];
  hitchhikingSpots: HitchhikingSpot[];
  onSelectPlace: (place: PlaceDocument) => void;
  onSelectHitchSpot: (spot: HitchhikingSpot) => void;
  onNavigateTab: (tab: string, state?: any) => void;
  onOpenAssistant: () => void;
  currentUser: UserProfile | null;
  onRequireAuth: (actionReason?: string) => void;
  onOpenTravelUpdates?: () => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({
  places,
  hitchhikingSpots,
  onSelectPlace,
  onSelectHitchSpot,
  onNavigateTab,
  onOpenAssistant,
  currentUser,
  onRequireAuth,
  onOpenTravelUpdates
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PlaceType | 'hitchhiking' | 'all'>('all');
  const [viewTab, setViewTab] = useState<'destinations' | 'spots' | 'hitch'>('destinations');
  
  // Destination drawer state
  const [selectedDestination, setSelectedDestination] = useState<CuratedDestination | null>(null);

  // Filter curated destinations
  const filteredDestinations = CURATED_DESTINATIONS.filter(dest => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return dest.name.toLowerCase().includes(q) ||
           dest.state.toLowerCase().includes(q) ||
           dest.description.toLowerCase().includes(q) ||
           dest.tags.some(t => t.toLowerCase().includes(q));
  });

  // Filter places
  const filteredPlaces = places.filter(place => {
    const matchCat = selectedCategory === 'all' || place.type === selectedCategory;
    const matchSearch = searchQuery === '' || 
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.state.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Filter hitchhiking spots
  const filteredHitchSpots = hitchhikingSpots.filter(spot => {
    const matchCat = selectedCategory === 'all' || selectedCategory === 'hitchhiking';
    const matchSearch = searchQuery === '' ||
      spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spot.roadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spot.direction.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const categories: { id: PlaceType | 'hitchhiking'; label: string; icon: string }[] = [
    { id: 'hitchhiking', label: 'Hitchhiking', icon: '👍' },
    { id: 'food', label: 'Budget Food', icon: '🍲' },
    { id: 'stay', label: 'Budget Stay', icon: '🛏️' },
    { id: 'camping', label: 'Camping', icon: '⛺' },
    { id: 'water', label: 'Water', icon: '💧' },
    { id: 'shower', label: 'Shower', icon: '🚿' },
    { id: 'charging', label: 'Charging', icon: '⚡' },
  ];

  const handlePlanJourneyClick = () => {
    if (!currentUser) {
      onRequireAuth('Sign in to access personalized journey planning');
      return;
    }
    onNavigateTab('journey');
  };

  const handleExploreDestination = (dest: CuratedDestination) => {
    setSelectedDestination(dest);
  };

  return (
    <div className="min-h-screen pb-28 md:pb-12 text-[#17211B] bg-[#F8FAF7]">
      {/* 1. Responsive Hero Section */}
      <section className="bg-gradient-to-br from-[#1F7A4D] via-[#1a6841] to-[#155434] text-white shadow-sm border-b border-[#1F7A4D]/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-3 sm:space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3 py-1 text-xs font-bold text-white border border-white/20">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Moove India • Community Ultra-Budget Network</span>
                </span>
                <span className="text-xs font-semibold text-emerald-200">
                  ₹350–₹500/day standard
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white">
                  Where will ₹1,000 take you?
                </h1>
                <p className="mt-2 text-xs sm:text-sm lg:text-base text-emerald-100/95 max-w-2xl leading-relaxed">
                  Discover community-verified Gurudwara langars, ₹5 RO drinking water ATMs, free temple sarai, verified stays, and safe highway hitch bays across India.
                </p>
              </div>

              {/* Primary CTAs */}
              <div className="pt-1 flex flex-wrap items-center gap-3">
                <button
                  onClick={handlePlanJourneyClick}
                  className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-emerald-50 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-[#1F7A4D] shadow-md transition active:scale-95"
                >
                  <Route className="w-4 h-4 stroke-[2.2]" />
                  <span>Plan Your Journey</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigateTab('map')}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-900/40 hover:bg-emerald-900/60 px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white border border-white/25 transition active:scale-95"
                >
                  <MapIcon className="w-4 h-4" />
                  <span>Explore Live Map</span>
                </button>
              </div>
            </div>

            {/* Right Supporting Visual (Desktop Only) */}
            <div className="hidden lg:block lg:col-span-5">
              <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-5 text-white shadow-xl space-y-3.5">
                <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                    Backpacker Benchmarks
                  </span>
                  <span className="text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                    Target: ₹500/day Max
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-black/15 rounded-xl p-3 border border-white/10">
                    <span className="text-emerald-200 text-[10px] block font-semibold uppercase">Free / ₹30 Meals</span>
                    <span className="font-bold text-sm block mt-0.5">Gurudwara Langars</span>
                  </div>
                  <div className="bg-black/15 rounded-xl p-3 border border-white/10">
                    <span className="text-emerald-200 text-[10px] block font-semibold uppercase">Drinking Water</span>
                    <span className="font-bold text-sm block mt-0.5">₹5 / 20L Water ATMs</span>
                  </div>
                  <div className="bg-black/15 rounded-xl p-3 border border-white/10">
                    <span className="text-emerald-200 text-[10px] block font-semibold uppercase">Ultra-Budget Stay</span>
                    <span className="font-bold text-sm block mt-0.5">Sarai & Hostels</span>
                  </div>
                  <div className="bg-black/15 rounded-xl p-3 border border-white/10">
                    <span className="text-emerald-200 text-[10px] block font-semibold uppercase">Highway Hitch</span>
                    <span className="font-bold text-sm block mt-0.5">Verified Toll Bays</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-emerald-100">
                  <span className="flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Real-time community reports</span>
                  </span>
                  <span className="font-mono text-emerald-200">100% Non-Commercial</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Main Centered Content Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6 sm:space-y-8">
        
        {/* 2. Prominent Destination Search Field */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#66736B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search destination, city, or highway (e.g. Hampi, Manali, Rishikesh, Pushkar, NH44)..."
            className="w-full rounded-2xl bg-white border border-[#E2E8E3] py-3 sm:py-3.5 pl-11 sm:pl-12 pr-12 text-xs sm:text-sm text-[#17211B] placeholder-[#66736B] focus:outline-none focus:border-[#1F7A4D] shadow-xs transition"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#66736B] hover:text-[#17211B] bg-[#F8FAF7] px-2 py-1 rounded-lg border border-[#E2E8E3]"
            >
              Clear
            </button>
          )}
        </div>

        {/* 3. Quick Categories (Responsive row on desktop, scrollable on mobile) */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] sm:text-xs font-bold text-[#66736B] uppercase tracking-wider">
              Quick Categories
            </span>
            <span className="text-[11px] sm:text-xs font-semibold text-[#1F7A4D]">
              {places.length + hitchhikingSpots.length} verified spots across India
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none md:flex-wrap">
            <button
              onClick={() => {
                setSelectedCategory('all');
                if (viewTab !== 'destinations') setViewTab('destinations');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-[#1F7A4D] text-white shadow-xs'
                  : 'bg-white text-[#17211B] border border-[#E2E8E3] hover:border-[#1F7A4D]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>All Categories</span>
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = cat.id === 'hitchhiking'
                ? hitchhikingSpots.length
                : places.filter(p => p.type === cat.id).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    if (cat.id === 'hitchhiking') {
                      setViewTab('hitch');
                    } else {
                      setViewTab('spots');
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                    isSelected
                      ? 'bg-[#1F7A4D] text-white font-bold shadow-xs'
                      : 'bg-white text-[#17211B] border border-[#E2E8E3] hover:border-[#1F7A4D]'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span className="text-[10px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Subtabs & Responsive Destination Cards Grid */}
        <section className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8E3] pb-2.5">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setViewTab('destinations')}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                  viewTab === 'destinations'
                    ? 'bg-[#E8F5EC] text-[#1F7A4D] border border-[#1F7A4D]/30 shadow-xs'
                    : 'text-[#66736B] hover:text-[#17211B]'
                }`}
              >
                Curated Destinations ({filteredDestinations.length})
              </button>

              <button
                onClick={() => setViewTab('spots')}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                  viewTab === 'spots'
                    ? 'bg-[#E8F5EC] text-[#1F7A4D] border border-[#1F7A4D]/30 shadow-xs'
                    : 'text-[#66736B] hover:text-[#17211B]'
                }`}
              >
                Verified Spots ({filteredPlaces.length})
              </button>

              <button
                onClick={() => setViewTab('hitch')}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                  viewTab === 'hitch'
                    ? 'bg-[#E8F5EC] text-[#1F7A4D] border border-[#1F7A4D]/30 shadow-xs'
                    : 'text-[#66736B] hover:text-[#17211B]'
                }`}
              >
                Hitch Corridors ({filteredHitchSpots.length})
              </button>
            </div>

            <span className="text-[11px] text-[#66736B] hidden lg:inline">
              Click any destination or spot to inspect budget details
            </span>
          </div>

          {/* Cards Content Grids */}
          <div>
            {viewTab === 'destinations' && (
              filteredDestinations.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredDestinations.map((dest) => (
                    <DestinationCard
                      key={dest.id}
                      destination={dest}
                      onExplore={handleExploreDestination}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center rounded-2xl bg-white border border-[#E2E8E3] text-[#66736B]">
                  <p className="text-sm font-bold">No destinations matching "{searchQuery}"</p>
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="mt-2 text-xs font-bold text-[#1F7A4D] hover:underline"
                  >
                    Clear search filter
                  </button>
                </div>
              )
            )}

            {viewTab === 'spots' && (
              filteredPlaces.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPlaces.map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      onSelect={onSelectPlace}
                      onShowOnMap={() => onNavigateTab('map', { placeId: place.id, lat: place.location.lat, lng: place.location.lng })}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center rounded-2xl bg-white border border-[#E2E8E3] text-[#66736B]">
                  <p className="text-sm font-bold">No spots found in this category.</p>
                </div>
              )
            )}

            {viewTab === 'hitch' && (
              filteredHitchSpots.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredHitchSpots.map((spot) => (
                    <HitchhikingSpotCard
                      key={spot.id}
                      spot={spot}
                      onSelect={onSelectHitchSpot}
                      onShowOnMap={() => onNavigateTab('map', { spotId: spot.id, lat: spot.location.lat, lng: spot.location.lng })}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center rounded-2xl bg-white border border-[#E2E8E3] text-[#66736B]">
                  <p className="text-sm font-bold">No hitchhiking corridors found.</p>
                </div>
              )
            )}
          </div>
        </section>

        {/* 5. Responsive Travel Updates Section */}
        <section className="rounded-2xl bg-white border border-[#E2E8E3] p-4 sm:p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1F7A4D] animate-ping" />
              <h3 className="text-sm sm:text-base font-extrabold text-[#17211B]">
                Recent Field Travel Updates
              </h3>
            </div>
            {onOpenTravelUpdates && (
              <button
                onClick={onOpenTravelUpdates}
                className="text-xs sm:text-sm font-bold text-[#1F7A4D] hover:underline flex items-center gap-1"
              >
                <span>View All Updates</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Desktop 2-column or Mobile 1-column feed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {INITIAL_TRAVEL_UPDATES.slice(0, 4).map((update) => (
              <div 
                key={update.id}
                className="p-3.5 rounded-xl bg-[#F8FAF7] border border-[#E2E8E3] space-y-2 hover:border-[#1F7A4D]/40 transition"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#17211B] flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-[#1F7A4D] shrink-0" />
                    <span className="truncate">{update.location}</span>
                  </span>
                  <span className="text-[#66736B] text-[11px] shrink-0">{update.timeAgo}</span>
                </div>
                <p className="text-xs text-[#17211B] leading-relaxed line-clamp-2">
                  {update.content}
                </p>
                <div className="flex items-center justify-between pt-1 text-[11px] text-[#66736B]">
                  <span className="font-semibold text-[#1F7A4D] bg-[#E8F5EC] px-2 py-0.5 rounded-md">
                    {update.category}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-[#66736B]">
                    <ThumbsUp className="w-3 h-3 text-[#1F7A4D]" />
                    <span>{update.likes} helpful</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Interactive Map Preview Section */}
        <section className="space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#17211B] flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-[#1F7A4D]" />
                <span>Interactive Map Preview</span>
              </h3>
              <p className="text-xs text-[#66736B]">
                Explore verified low-budget food, stays, water stations & hitch bays across India
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('map')}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1F7A4D] hover:bg-[#d8eedf] bg-[#E8F5EC] px-3.5 py-2 rounded-xl border border-[#1F7A4D]/25 transition active:scale-95 self-start sm:self-auto cursor-pointer"
            >
              <MapIcon className="w-4 h-4" />
              <span>Open Full Interactive Map →</span>
            </button>
          </div>

          <div className="rounded-2xl overflow-hidden border border-[#E2E8E3] shadow-xs bg-white min-h-[300px]">
            <MapView
              places={places}
              hitchhikingSpots={hitchhikingSpots}
              selectedPlace={null}
              selectedHitchSpot={null}
              onSelectPlace={onSelectPlace}
              onSelectHitchSpot={onSelectHitchSpot}
              activeCategories={['food', 'stay', 'hitchhiking', 'camping']}
              heightClass="h-[300px] sm:h-[380px] lg:h-[440px]"
            />
          </div>
        </section>

      </div>

      {/* Destination Detail Drawer */}
      <DestinationDetailDrawer
        destination={selectedDestination}
        onClose={() => setSelectedDestination(null)}
        onPlanTrip={(destName) => {
          setSelectedDestination(null);
          onNavigateTab('journey', { targetDestination: destName });
        }}
        places={places}
        hitchhikingSpots={hitchhikingSpots}
        onSelectPlace={onSelectPlace}
        onSelectHitchSpot={onSelectHitchSpot}
      />
    </div>
  );
};
