import React from 'react';
import { HitchhikingSpot } from '../../types';
import { Clock, Navigation, ShieldCheck, ThumbsUp, ArrowRight } from 'lucide-react';

interface HitchhikingSpotCardProps {
  spot: HitchhikingSpot;
  onSelect: (spot: HitchhikingSpot) => void;
  onShowOnMap?: (spot: HitchhikingSpot) => void;
}

export const HitchhikingSpotCard: React.FC<HitchhikingSpotCardProps> = ({
  spot,
  onSelect,
  onShowOnMap
}) => {
  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return 'text-[#1F7A4D] bg-[#E8F5EC] border-[#1F7A4D]/20';
      case 'Moderate':
        return 'text-[#E99A3D] bg-amber-50 border-[#E99A3D]/20';
      default:
        return 'text-[#D9534F] bg-red-50 border-[#D9534F]/20';
    }
  };

  return (
    <div
      onClick={() => onSelect(spot)}
      className="group relative flex flex-col justify-between rounded-2xl bg-white border border-[#E2E8E3] p-4 hover:border-[#1F7A4D]/50 transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-[0.99]"
    >
      <div>
        {/* Header badges */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E8F5EC] text-[#1F7A4D] border border-[#1F7A4D]/20">
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Hitchhiking Point</span>
          </span>

          <div className="flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getDifficultyBadge(spot.difficulty)}`}>
              {spot.difficulty} Lift
            </span>
            <div className="flex items-center gap-1 text-xs font-bold text-[#17211B] bg-[#F8FAF7] px-2 py-0.5 rounded-full border border-[#E2E8E3]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1F7A4D]" />
              <span>{spot.safetyRating.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-extrabold text-[#17211B] text-base group-hover:text-[#1F7A4D] transition-colors line-clamp-1">
          {spot.name}
        </h3>

        {/* Highway & Direction */}
        <div className="mt-2 space-y-1 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-[#1F7A4D]">
            <Navigation className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{spot.roadName}</span>
          </div>
          <div className="text-[#66736B] text-[11px] line-clamp-1 pl-5">
            ➔ {spot.direction}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-[#F8FAF7] border border-[#E2E8E3] text-[11px]">
          <div>
            <span className="text-[#66736B] block">Avg Wait Time</span>
            <span className="font-bold text-[#17211B] flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-[#E99A3D]" />
              ~{spot.averageWaitMinutes} mins
            </span>
          </div>
          <div>
            <span className="text-[#66736B] block">Best Departure</span>
            <span className="font-semibold text-[#17211B] truncate block mt-0.5">
              {spot.bestTime.split('&')[0]}
            </span>
          </div>
        </div>

        {/* Notes preview */}
        {spot.notes && (
          <p className="text-xs text-[#66736B] line-clamp-2 leading-relaxed">
            {spot.notes}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#E2E8E3]">
        <span className="text-[11px] text-[#66736B]">
          {spot.reportCount} community rides logged
        </span>

        <div className="flex items-center gap-2">
          {onShowOnMap && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShowOnMap(spot);
              }}
              className="text-xs font-semibold text-[#17211B] hover:text-[#1F7A4D] bg-[#F8FAF7] hover:bg-[#E8F5EC] px-2.5 py-1.5 rounded-xl border border-[#E2E8E3] transition"
            >
              Locate
            </button>
          )}
          <span className="text-xs font-bold text-[#1F7A4D] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
            <span>Guide</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
