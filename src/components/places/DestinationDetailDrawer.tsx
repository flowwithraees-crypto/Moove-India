import React from 'react';
import { CuratedDestination, PlaceDocument, HitchhikingSpot } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { X, Calendar, IndianRupee, MapPin, Sparkles, Route, ShieldCheck, ArrowRight, Check } from 'lucide-react';

interface DestinationDetailDrawerProps {
  destination: CuratedDestination | null;
  onClose: () => void;
  onPlanTrip: (destinationName: string) => void;
  places: PlaceDocument[];
  hitchhikingSpots: HitchhikingSpot[];
  onSelectPlace: (place: PlaceDocument) => void;
  onSelectHitchSpot: (spot: HitchhikingSpot) => void;
}

export const DestinationDetailDrawer: React.FC<DestinationDetailDrawerProps> = ({
  destination,
  onClose,
  onPlanTrip,
  places,
  hitchhikingSpots,
  onSelectPlace,
  onSelectHitchSpot
}) => {
  if (!destination) return null;

  // Find local spots matching this destination
  const destNameLower = destination.name.toLowerCase();
  const destStateLower = destination.state.toLowerCase();
  
  const localPlaces = places.filter(
    p => p.city.toLowerCase().includes(destNameLower) || 
         destNameLower.includes(p.city.toLowerCase()) ||
         p.state.toLowerCase().includes(destStateLower)
  ).slice(0, 4);

  const localHitchSpots = hitchhikingSpots.filter(
    s => s.name.toLowerCase().includes(destNameLower) ||
         s.roadName.toLowerCase().includes(destNameLower) ||
         s.direction.toLowerCase().includes(destNameLower)
  ).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white border border-[#E2E8E3] p-0 shadow-2xl text-[#17211B] flex flex-col">
        {/* Cover Photo */}
        <div className="relative aspect-[16/9] w-full bg-[#E8F5EC]">
          <ImageWithFallback
            src={destination.image}
            alt={destination.name}
            className="w-full h-full object-cover"
            fallbackText={`${destination.name}, ${destination.state}`}
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition z-20"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 left-3 z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-[#1F7A4D] shadow-md">
              <span>₹{destination.budgetPerDay}/day estimated budget</span>
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[#1F7A4D] bg-[#E8F5EC] px-2 py-0.5 rounded-full">
                {destination.tagBadge || 'Backpacking Destination'}
              </span>
              {destination.season && (
                <span className="text-xs font-semibold text-[#66736B] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{destination.season}</span>
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-[#17211B]">
              {destination.name}
            </h2>
            <p className="text-xs text-[#66736B] font-medium flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-[#1F7A4D]" />
              <span>{destination.state}, India</span>
            </p>
          </div>

          {/* Description */}
          <div className="p-3.5 rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3] space-y-1">
            <p className="text-xs text-[#17211B] leading-relaxed">
              {destination.description}
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] text-[#66736B]">
              <span>Estimate updated: {destination.lastUpdated || 'October 2026'}</span>
              <span className="font-semibold text-[#1F7A4D]">Based on community costs</span>
            </div>
          </div>

          {/* Highlights */}
          {destination.highlights && destination.highlights.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#17211B] uppercase tracking-wider">
                Ultra-Budget Highlights & Tips
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {destination.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-xl bg-white border border-[#E2E8E3] text-xs text-[#17211B]">
                    <Check className="w-4 h-4 text-[#1F7A4D] shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Local community spots */}
          {localPlaces.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#17211B] uppercase tracking-wider">
                  Verified Budget Spots in {destination.name}
                </h4>
                <span className="text-[11px] text-[#66736B]">{localPlaces.length} nearby</span>
              </div>
              <div className="space-y-2">
                {localPlaces.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onClose();
                      onSelectPlace(p);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAF7] border border-[#E2E8E3] hover:border-[#1F7A4D] cursor-pointer transition"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-[#17211B] line-clamp-1">{p.name}</h5>
                      <span className="text-[11px] text-[#66736B]">{p.city} • {p.priceMin === 0 ? 'FREE' : `₹${p.priceMin} - ₹${p.priceMax}`}</span>
                    </div>
                    <span className="text-xs font-bold text-[#1F7A4D]">Inspect →</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hitch corridors */}
          {localHitchSpots.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#17211B] uppercase tracking-wider">
                Hitchhiking Access Points
              </h4>
              <div className="space-y-2">
                {localHitchSpots.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      onClose();
                      onSelectHitchSpot(s);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#E8F5EC]/50 border border-[#1F7A4D]/20 hover:border-[#1F7A4D] cursor-pointer transition"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-[#17211B] line-clamp-1">{s.name}</h5>
                      <span className="text-[11px] text-[#1F7A4D] font-medium">{s.roadName}</span>
                    </div>
                    <span className="text-xs font-bold text-[#1F7A4D]">View Point →</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom CTA to plan journey */}
          <div className="pt-2">
            <button
              onClick={() => {
                onClose();
                onPlanTrip(destination.name);
              }}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#1F7A4D] hover:bg-[#19633e] text-white py-3.5 px-4 font-bold text-sm shadow-md transition active:scale-[0.99]"
            >
              <Route className="w-4 h-4" />
              <span>Plan a Journey to {destination.name}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
