import React from 'react';
import { PlaceDocument } from '../../types';
import { CATEGORY_COLORS, CATEGORY_ICONS_LABEL } from '../../services/maps';
import { Star, MapPin, ShieldCheck, ArrowRight } from 'lucide-react';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface PlaceCardProps {
  place: PlaceDocument;
  onSelect: (place: PlaceDocument) => void;
  onShowOnMap?: (place: PlaceDocument) => void;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ place, onSelect, onShowOnMap }) => {
  const meta = CATEGORY_ICONS_LABEL[place.type] || CATEGORY_ICONS_LABEL.food;
  const isFree = place.priceMin === 0 && place.priceMax === 0;

  return (
    <div 
      onClick={() => onSelect(place)}
      className="group relative flex flex-col justify-between rounded-2xl bg-white border border-[#E2E8E3] p-4 hover:border-[#1F7A4D]/50 transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-[0.99]"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E8F5EC] text-[#1F7A4D] border border-[#1F7A4D]/20">
            <span>{meta.symbol}</span>
            <span>{meta.label}</span>
          </span>

          <div className="flex items-center gap-1.5">
            {place.verified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1F7A4D] bg-[#E8F5EC] px-2 py-0.5 rounded-full border border-[#1F7A4D]/20">
                <ShieldCheck className="w-3 h-3 text-[#1F7A4D]" />
                <span>Verified</span>
              </span>
            )}
            <div className="flex items-center gap-1 text-xs font-bold text-[#17211B] bg-[#F8FAF7] px-2 py-0.5 rounded-full border border-[#E2E8E3]">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{place.rating.toFixed(1)}</span>
              <span className="text-[#66736B] font-normal text-[10px]">({place.reportCount})</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-extrabold text-[#17211B] text-base leading-snug group-hover:text-[#1F7A4D] transition-colors line-clamp-1">
          {place.name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-[#66736B] mt-1 mb-2">
          <MapPin className="w-3.5 h-3.5 text-[#1F7A4D] shrink-0" />
          <span className="truncate">{place.city}, {place.state}</span>
          {place.location.landmark && (
            <span className="text-[#66736B] truncate hidden xs:inline">• {place.location.landmark}</span>
          )}
        </div>

        {/* Description snippet */}
        <p className="text-xs text-[#66736B] line-clamp-2 leading-relaxed mb-3">
          {place.description}
        </p>

        {/* Tags */}
        {place.tags && place.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {place.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-[10px] font-medium bg-[#F8FAF7] text-[#66736B] px-2 py-0.5 rounded-md border border-[#E2E8E3]">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer with Price and Action */}
      <div className="flex items-center justify-between pt-2.5 border-t border-[#E2E8E3]">
        <div>
          <span className="text-[10px] text-[#66736B] block uppercase font-bold tracking-wider">Estimated Cost</span>
          <span className={`text-sm font-black ${isFree ? 'text-[#1F7A4D]' : 'text-[#17211B]'}`}>
            {isFree ? 'FREE (₹0)' : `₹${place.priceMin} - ₹${place.priceMax}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onShowOnMap && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShowOnMap(place);
              }}
              className="text-xs font-semibold text-[#17211B] hover:text-[#1F7A4D] bg-[#F8FAF7] hover:bg-[#E8F5EC] px-2.5 py-1.5 rounded-xl border border-[#E2E8E3] transition"
            >
              Locate
            </button>
          )}
          <span className="text-xs font-bold text-[#1F7A4D] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
            <span>Details</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
