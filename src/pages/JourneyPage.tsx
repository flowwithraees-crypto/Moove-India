import React, { useState, useEffect } from 'react';
import { TravelStyle, Journey, UserProfile, PlaceDocument, HitchhikingSpot } from '../types';
import { generateBudgetJourney, optimizeBudget } from '../services/gemini';
import { toggleSaveTrip, isTripSaved } from '../services/firestore';
import { getPlacePredictions, getPlaceCoordinates, PlaceAutocompleteResult } from '../services/maps/placesService';
import { MapView } from '../components/map/MapView';
import { 
  Route, 
  Sparkles, 
  Bookmark, 
  BookmarkCheck, 
  Calendar, 
  IndianRupee, 
  ArrowRight, 
  ShieldCheck, 
  Sliders, 
  Check, 
  Clock, 
  MapPin, 
  Compass,
  AlertCircle,
  HelpCircle,
  TrendingDown
} from 'lucide-react';

interface JourneyPageProps {
  currentUser: UserProfile | null;
  onRequireAuth: (actionReason?: string) => void;
  places: PlaceDocument[];
  hitchhikingSpots: HitchhikingSpot[];
  onSelectPlace: (place: PlaceDocument) => void;
  onSelectHitchSpot: (spot: HitchhikingSpot) => void;
  initialDestination?: string;
}

export const JourneyPage: React.FC<JourneyPageProps> = ({
  currentUser,
  onRequireAuth,
  places,
  hitchhikingSpots,
  onSelectPlace,
  onSelectHitchSpot,
  initialDestination
}) => {
  const [from, setFrom] = useState('New Delhi');
  const [to, setTo] = useState(initialDestination || 'Manali');
  const [fromCoords, setFromCoords] = useState<{ lat: number; lng: number } | undefined>({ lat: 28.6139, lng: 77.2090 });
  const [toCoords, setToCoords] = useState<{ lat: number; lng: number } | undefined>({ lat: 32.2432, lng: 77.1892 });
  const [budget, setBudget] = useState(3000);
  const [days, setDays] = useState(5);
  const [travelStyle, setTravelStyle] = useState<TravelStyle>('Cheapest');

  const [fromSuggestions, setFromSuggestions] = useState<PlaceAutocompleteResult[]>([]);
  const [toSuggestions, setToSuggestions] = useState<PlaceAutocompleteResult[]>([]);
  const [showFromDrop, setShowFromDrop] = useState(false);
  const [showToDrop, setShowToDrop] = useState(false);

  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationTips, setOptimizationTips] = useState<string[]>([]);
  const [selectedAlternative, setSelectedAlternative] = useState<TravelStyle>('Cheapest');

  useEffect(() => {
    if (initialDestination) {
      setTo(initialDestination);
    }
  }, [initialDestination]);

  // Search autocomplete
  const handleFromChange = async (val: string) => {
    setFrom(val);
    setShowFromDrop(true);
    const results = await getPlacePredictions(val);
    setFromSuggestions(results);
  };

  const handleSelectFrom = async (item: PlaceAutocompleteResult) => {
    setFrom(item.fullText || item.mainText);
    setShowFromDrop(false);
    const coords = item.location || (await getPlaceCoordinates(item.placeId, item.mainText));
    setFromCoords(coords);
  };

  const handleToChange = async (val: string) => {
    setTo(val);
    setShowToDrop(true);
    const results = await getPlacePredictions(val);
    setToSuggestions(results);
  };

  const handleSelectTo = async (item: PlaceAutocompleteResult) => {
    setTo(item.fullText || item.mainText);
    setShowToDrop(false);
    const coords = item.location || (await getPlaceCoordinates(item.placeId, item.mainText));
    setToCoords(coords);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth('Sign in to generate personalized budget routes and save trips');
      return;
    }

    setLoading(true);
    setOptimizationTips([]);
    try {
      const generated = await generateBudgetJourney({
        from: from.trim(),
        to: to.trim(),
        budget,
        days,
        travelStyle: selectedAlternative
      });
      setJourney(generated);
      setIsSaved(isTripSaved(currentUser.id, generated.id));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAlternativeStyle = async (style: TravelStyle) => {
    setSelectedAlternative(style);
    if (!currentUser) {
      onRequireAuth('Sign in to customize travel styles');
      return;
    }
    setLoading(true);
    try {
      const generated = await generateBudgetJourney({
        from: from.trim(),
        to: to.trim(),
        budget,
        days,
        travelStyle: style
      });
      setJourney(generated);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!journey) return;
    if (!currentUser) {
      onRequireAuth('Sign in to optimize your budget plan');
      return;
    }
    setIsOptimizing(true);
    try {
      const cutTarget = Math.round(journey.totalEstimatedCost * 0.8);
      const res = await optimizeBudget(journey, cutTarget);
      setJourney(res.optimizedJourney);
      setOptimizationTips(res.savingsTips);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSaveToggle = () => {
    if (!journey) return;
    if (!currentUser) {
      onRequireAuth('Sign in to bookmark this journey in your profile');
      return;
    }
    const saved = toggleSaveTrip(currentUser.id, journey);
    setIsSaved(saved);
  };

  const routePoints = React.useMemo(
    () => journey?.suggestedStops.map(s => ({ lat: s.lat, lng: s.lng })) || [],
    [journey]
  );

  return (
    <div className="min-h-screen pb-28 md:pb-12 text-[#17211B] bg-[#F8FAF7]">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E8E3] p-4 sm:p-5">
        <div className="max-w-5xl mx-auto space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#E8F5EC] text-[#1F7A4D] border border-[#1F7A4D]/20">
              <Route className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#17211B]">
              Ultra-Budget Journey Builder
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#66736B]">
            Design an Indian road journey tailored to your exact budget in Rupees. Combines unreserved transit, roadside dhabas, free ashrams, and hitchhiking corridors.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Planner Form Card */}
        <form onSubmit={handleGenerate} className="rounded-3xl bg-white border border-[#E2E8E3] p-5 space-y-5 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Origin Field */}
            <div className="relative">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#66736B] block mb-1.5">
                Starting Location (From) *
              </label>
              <input
                type="text"
                required
                value={from}
                onChange={(e) => handleFromChange(e.target.value)}
                onFocus={() => setShowFromDrop(true)}
                placeholder="e.g. New Delhi, Mumbai, Bangalore"
                className="w-full rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3] p-3 text-xs sm:text-sm text-[#17211B] placeholder-[#66736B] focus:outline-none focus:border-[#1F7A4D] focus:bg-white shadow-inner transition"
              />
              {showFromDrop && fromSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-2xl bg-white border border-[#E2E8E3] shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                  {fromSuggestions.map((item) => (
                    <button
                      key={item.placeId}
                      type="button"
                      onClick={() => handleSelectFrom(item)}
                      className="w-full p-2.5 text-left text-xs text-[#17211B] hover:bg-[#E8F5EC] border-b border-[#E2E8E3] flex items-center gap-2"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#1F7A4D] shrink-0" />
                      <span className="truncate">{item.fullText}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Destination Field */}
            <div className="relative">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#66736B] block mb-1.5">
                Destination (To) *
              </label>
              <input
                type="text"
                required
                value={to}
                onChange={(e) => handleToChange(e.target.value)}
                onFocus={() => setShowToDrop(true)}
                placeholder="e.g. Manali, Rishikesh, Hampi, Varkala"
                className="w-full rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3] p-3 text-xs sm:text-sm text-[#17211B] placeholder-[#66736B] focus:outline-none focus:border-[#1F7A4D] focus:bg-white shadow-inner transition"
              />
              {showToDrop && toSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-2xl bg-white border border-[#E2E8E3] shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                  {toSuggestions.map((item) => (
                    <button
                      key={item.placeId}
                      type="button"
                      onClick={() => handleSelectTo(item)}
                      className="w-full p-2.5 text-left text-xs text-[#17211B] hover:bg-[#E8F5EC] border-b border-[#E2E8E3] flex items-center gap-2"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#1F7A4D] shrink-0" />
                      <span className="truncate">{item.fullText}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Budget, Duration & Travel Style */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#66736B] block mb-1.5">
                Total Budget (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#1F7A4D]">₹</span>
                <input
                  type="number"
                  min="500"
                  step="250"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3] py-2.5 pl-7 pr-3 text-xs font-bold text-[#17211B] focus:outline-none focus:border-[#1F7A4D] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#66736B] block mb-1.5">
                Trip Duration (Days)
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#66736B]" />
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3] py-2.5 pl-8 pr-3 text-xs font-bold text-[#17211B] focus:outline-none focus:border-[#1F7A4D] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#66736B] block mb-1.5">
                Travel Style
              </label>
              <div className="flex rounded-2xl bg-[#F8FAF7] p-1 border border-[#E2E8E3]">
                {(['Cheapest', 'Balanced', 'Adventure'] as TravelStyle[]).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setSelectedAlternative(style)}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl transition ${
                      selectedAlternative === style
                        ? 'bg-[#1F7A4D] text-white shadow-sm'
                        : 'text-[#66736B] hover:text-[#17211B]'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#1F7A4D] hover:bg-[#19633e] text-white font-black text-xs sm:text-sm shadow-md transition active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Computing Ultra-Budget Route & Stops...</span>
              </span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Generate Budget Journey</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Route Results */}
        {journey && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* Alternatives Switcher */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#E2E8E3] shadow-sm">
              <span className="text-xs font-bold text-[#66736B]">Route Style Alternatives:</span>
              <div className="flex gap-1.5">
                {(['Cheapest', 'Balanced', 'Adventure'] as TravelStyle[]).map((style) => (
                  <button
                    key={style}
                    onClick={() => handleSelectAlternativeStyle(style)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                      selectedAlternative === style
                        ? 'bg-[#1F7A4D] text-white shadow-sm'
                        : 'bg-[#F8FAF7] text-[#17211B] border border-[#E2E8E3] hover:border-[#1F7A4D]'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary & Cost Breakdown Card */}
            <div className="rounded-3xl bg-white border border-[#E2E8E3] p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-[#1F7A4D] bg-[#E8F5EC] px-2 py-0.5 rounded-md">
                    {journey.travelStyle} Plan • {journey.days} Days
                  </span>
                  <h3 className="text-lg font-black text-[#17211B] mt-1">
                    {journey.from} ➔ {journey.to}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveToggle}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                      isSaved
                        ? 'bg-[#E8F5EC] text-[#1F7A4D] border-[#1F7A4D]/30'
                        : 'bg-white text-[#66736B] border-[#E2E8E3] hover:border-[#1F7A4D]'
                    }`}
                  >
                    {isSaved ? <BookmarkCheck className="w-4 h-4 text-[#1F7A4D]" /> : <Bookmark className="w-4 h-4" />}
                    <span>{isSaved ? 'Saved' : 'Save Trip'}</span>
                  </button>

                  <button
                    onClick={handleOptimize}
                    disabled={isOptimizing}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#E8F5EC] text-[#1F7A4D] border border-[#1F7A4D]/30 hover:bg-[#d8eedf] transition"
                    title="Optimize and reduce costs"
                  >
                    <TrendingDown className="w-4 h-4" />
                    <span>{isOptimizing ? 'Optimizing...' : 'Reduce Costs'}</span>
                  </button>
                </div>
              </div>

              {/* Cost Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3] text-xs">
                <div>
                  <span className="text-[10px] text-[#66736B] block">Transit Cost</span>
                  <span className="font-extrabold text-[#17211B]">₹{journey.estimatedTransportCost}</span>
                  <span className="text-[10px] text-[#66736B] block">Unreserved / hitch</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#66736B] block">Food Cost</span>
                  <span className="font-extrabold text-[#17211B]">₹{journey.estimatedFoodCost}</span>
                  <span className="text-[10px] text-[#66736B] block">Dhabas & langars</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#66736B] block">Stay Cost</span>
                  <span className="font-extrabold text-[#17211B]">₹{journey.estimatedAccommodationCost}</span>
                  <span className="text-[10px] text-[#66736B] block">Sarai / camps</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#66736B] block">Emergency Buffer</span>
                  <span className="font-extrabold text-[#1F7A4D]">₹{journey.emergencyBudget}</span>
                  <span className="text-[10px] text-[#66736B] block">Reserved safety</span>
                </div>
              </div>

              {/* Total Summary Row */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#E8F5EC] border border-[#1F7A4D]/20 text-[#1F7A4D]">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider block">Total Estimated Cost</span>
                  <span className="text-base font-black">₹{journey.totalEstimatedCost}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider block">Daily Average</span>
                  <span className="text-base font-black">₹{journey.dailyAverage} / day</span>
                </div>
              </div>

              {/* Grounding & Verification Key */}
              <div className="p-3 rounded-xl bg-white border border-[#E2E8E3] text-[11px] space-y-1">
                <span className="font-bold text-[#17211B] block">Data Authenticity Grounding:</span>
                <div className="flex flex-wrap gap-3 text-[#66736B]">
                  <span className="flex items-center gap-1 text-[#1F7A4D] font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified community information</span>
                  </span>
                  <span className="flex items-center gap-1 text-[#E99A3D] font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Estimated budget information</span>
                  </span>
                  <span className="flex items-center gap-1 text-indigo-600 font-medium">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI suggestions</span>
                  </span>
                </div>
              </div>

              {/* Optimization tips if any */}
              {optimizationTips.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <span className="font-bold flex items-center gap-1 text-amber-800">
                    💡 Cost-Saving Adjustments:
                  </span>
                  {optimizationTips.map((tip, idx) => (
                    <p key={idx} className="text-[11px] text-amber-950 pl-2">
                      • {tip}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Map Preview of Route */}
            <div className="rounded-3xl overflow-hidden border border-[#E2E8E3] shadow-sm bg-white">
              <div className="p-3 bg-[#F8FAF7] border-b border-[#E2E8E3] flex items-center justify-between">
                <span className="text-xs font-bold text-[#17211B]">Route & Waypoints Map</span>
                <span className="text-[11px] text-[#66736B]">{journey.suggestedStops.length} stops along the route</span>
              </div>
              <MapView
                places={places}
                hitchhikingSpots={hitchhikingSpots}
                selectedPlace={null}
                selectedHitchSpot={null}
                onSelectPlace={onSelectPlace}
                onSelectHitchSpot={onSelectHitchSpot}
                routeCoordinates={routePoints}
                routeStartPoint={fromCoords}
                routeEndPoint={toCoords}
                heightClass="h-[280px] sm:h-[360px]"
              />
            </div>

            {/* Suggested Daily Stops List */}
            <div className="space-y-3">
              <h4 className="text-sm font-extrabold text-[#17211B] uppercase tracking-wider">
                Daily Stop Itinerary & Recommendations
              </h4>

              <div className="space-y-3">
                {journey.suggestedStops.map((stop, index) => (
                  <div 
                    key={stop.id}
                    className="p-4 rounded-2xl bg-white border border-[#E2E8E3] space-y-2 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#1F7A4D] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {stop.day}
                        </span>
                        <div>
                          <h5 className="text-xs sm:text-sm font-extrabold text-[#17211B]">
                            {stop.name}
                          </h5>
                          <span className="text-[11px] text-[#66736B]">
                            Approx day expense: ₹{stop.approxDailyCost}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Highlights */}
                    {stop.highlights && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {stop.highlights.map((h, i) => (
                          <span key={i} className="text-[11px] font-medium bg-[#F8FAF7] text-[#17211B] px-2 py-0.5 rounded-md border border-[#E2E8E3]">
                            {h}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Transit & Stay Suggestions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                      <div className="p-2 rounded-xl bg-[#F8FAF7] border border-[#E2E8E3]">
                        <span className="text-[10px] font-bold text-[#66736B] block">Transit Advice</span>
                        <p className="text-[11px] text-[#17211B] mt-0.5">{stop.transitTip}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-[#F8FAF7] border border-[#E2E8E3]">
                        <span className="text-[10px] font-bold text-[#66736B] block">Budget Stay / Sarai</span>
                        <p className="text-[11px] text-[#17211B] mt-0.5">{stop.staySuggestion}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
