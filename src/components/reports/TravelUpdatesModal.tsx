import React, { useState } from 'react';
import { INITIAL_TRAVEL_UPDATES } from '../../data/mockData';
import { X, ShieldCheck, Clock, ThumbsUp, MapPin, Filter, MessageSquare, AlertCircle } from 'lucide-react';

interface TravelUpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReport?: () => void;
}

export const TravelUpdatesModal: React.FC<TravelUpdatesModalProps> = ({
  isOpen,
  onClose,
  onOpenReport
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [updates, setUpdates] = useState(INITIAL_TRAVEL_UPDATES);

  if (!isOpen) return null;

  const categories = ['all', 'Road & Transit', 'Camp & Water', 'Budget Tip'];

  const filtered = selectedFilter === 'all'
    ? updates
    : updates.filter(u => u.category === selectedFilter);

  const handleLike = (id: string) => {
    setUpdates(prev => prev.map(u => u.id === id ? { ...u, likes: u.likes + 1 } : u));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white border border-[#E2E8E3] p-5 shadow-2xl text-[#17211B] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8E3]">
          <div>
            <h3 className="font-extrabold text-base text-[#17211B]">
              Field Travel Dispatches & Updates
            </h3>
            <p className="text-xs text-[#66736B]">
              Real conditions reported by backpackers across Indian highways
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full text-[#66736B] hover:text-[#17211B] hover:bg-[#F8FAF7] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-1.5 overflow-x-auto py-3 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition ${
                selectedFilter === cat
                  ? 'bg-[#1F7A4D] text-white shadow-sm'
                  : 'bg-[#F8FAF7] text-[#66736B] border border-[#E2E8E3] hover:border-[#1F7A4D]'
              }`}
            >
              {cat === 'all' ? 'All Updates' : cat}
            </button>
          ))}
        </div>

        {/* List of updates */}
        <div className="space-y-3 py-2">
          {filtered.map((item) => (
            <div 
              key={item.id}
              className="p-3.5 rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3] space-y-2 hover:border-[#1F7A4D]/40 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-[#1F7A4D] bg-[#E8F5EC] px-2 py-0.5 rounded-md">
                    {item.category}
                  </span>
                  <h4 className="text-xs font-bold text-[#17211B] mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#1F7A4D] shrink-0" />
                    <span>{item.location}</span>
                  </h4>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-[#66736B] block">
                    {item.timeAgo}
                  </span>
                  {item.verified ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#1F7A4D]">
                      <ShieldCheck className="w-3 h-3 text-[#1F7A4D]" />
                      <span>Verified</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#E99A3D] font-medium">
                      Community Report
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-[#17211B] leading-relaxed">
                {item.content}
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-[#E2E8E3] text-[11px] text-[#66736B]">
                <span className="italic">{item.sourceLabel}</span>
                <button
                  onClick={() => handleLike(item.id)}
                  className="flex items-center gap-1 text-[#1F7A4D] hover:underline font-semibold"
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>{item.likes} helpful</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note & CTA */}
        <div className="pt-3 border-t border-[#E2E8E3] flex items-center justify-between">
          <p className="text-[11px] text-[#66736B]">
            Never claim any spot is guaranteed safe.
          </p>
          {onOpenReport && (
            <button
              onClick={() => {
                onClose();
                onOpenReport();
              }}
              className="px-3 py-1.5 rounded-xl bg-[#1F7A4D] text-white text-xs font-bold hover:bg-[#19633e] transition"
            >
              Post Field Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
