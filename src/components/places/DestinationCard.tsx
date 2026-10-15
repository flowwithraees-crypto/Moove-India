import React from 'react';
import { CuratedDestination } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { ChevronRight, Calendar, IndianRupee, MapPin } from 'lucide-react';

interface DestinationCardProps {
  destination: CuratedDestination;
  onExplore: (dest: CuratedDestination) => void;
}

export const DestinationCard: React.FC<DestinationCardProps> = ({ destination, onExplore }) => {
  return (
    <div 
      onClick={() => onExplore(destination)}
      className="group flex flex-col justify-between rounded-2xl bg-white border border-[#E2E8E3] overflow-hidden hover:border-[#1F7A4D]/50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md active:scale-[0.99]"
    >
      <div>
        {/* Cover Image Container */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#E8F5EC]">
          <ImageWithFallback
            src={destination.image}
            alt={destination.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            containerClassName="w-full h-full"
            fallbackText={`${destination.name}, ${destination.state}`}
          />

          {/* Budget Overlay Badge */}
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-md px-2.5 py-1 text-xs font-black text-[#1F7A4D] shadow-sm border border-black/5">
              <span>₹{destination.budgetPerDay}/day avg</span>
            </span>
          </div>

          {/* Best Season Badge */}
          {destination.season && (
            <div className="absolute bottom-2.5 right-2.5 z-10">
              <span className="inline-flex items-center gap-1 rounded-full bg-black/75 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                <Calendar className="w-3 h-3 text-white/80" />
                <span>{destination.season}</span>
              </span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-2">
          {/* Title and State */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-extrabold text-[#17211B] text-base group-hover:text-[#1F7A4D] transition-colors line-clamp-1">
              {destination.name}
            </h3>
            <span className="text-xs font-semibold text-[#66736B] shrink-0">
              {destination.state}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs text-[#66736B] line-clamp-2 leading-relaxed">
            {destination.description}
          </p>

          {/* Hashtags */}
          {destination.tags && destination.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {destination.tags.slice(0, 3).map((tag, idx) => (
                <span 
                  key={idx}
                  className="text-[11px] font-medium text-[#1F7A4D] bg-[#E8F5EC] px-2 py-0.5 rounded-md"
                >
                  #{tag.replace('#', '')}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#E2E8E3] bg-[#F8FAF7]/50 flex items-center justify-between text-xs">
        <span className="text-[11px] font-bold text-[#66736B]">
          {destination.tagBadge || 'Curated Backpacking Haven'}
        </span>
        <button
          type="button"
          className="flex items-center gap-0.5 font-bold text-[#1F7A4D] group-hover:translate-x-0.5 transition-transform"
        >
          <span>Explore</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
