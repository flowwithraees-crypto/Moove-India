import React, { useState, useEffect } from 'react';
import { PlaceDocument, Report, UserProfile } from '../../types';
import { CATEGORY_COLORS, CATEGORY_ICONS_LABEL } from '../../services/maps';
import { getReports } from '../../services/firestore';
import { SafetyDisclaimer } from '../safety/SafetyDisclaimer';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { X, MapPin, Clock, Star, Share2, Plus, ShieldCheck, IndianRupee, MessageSquare, AlertTriangle } from 'lucide-react';

interface PlaceDetailDrawerProps {
  place: PlaceDocument | null;
  onClose: () => void;
  currentUser: UserProfile | null;
  onOpenReportModal: (targetType: 'place', targetId: string) => void;
  onRequireAuth?: (reason?: string) => void;
}

export const PlaceDetailDrawer: React.FC<PlaceDetailDrawerProps> = ({
  place,
  onClose,
  currentUser,
  onOpenReportModal,
  onRequireAuth
}) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (place) {
      getReports(place.id).then(setReports);
    }
  }, [place]);

  if (!place) return null;

  const meta = CATEGORY_ICONS_LABEL[place.type] || CATEGORY_ICONS_LABEL.food;
  const isFree = place.priceMin === 0 && place.priceMax === 0;

  const handleShare = () => {
    const text = `Check out ${place.name} on Moove India: ${place.description}`;
    if (navigator.share) {
      navigator.share({ title: place.name, text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${place.name} - ${place.city}, ${place.state}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddReviewClick = () => {
    if (!currentUser && onRequireAuth) {
      onRequireAuth('Sign in to submit a field review & helpful rating');
      return;
    }
    onOpenReportModal('place', place.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white border border-[#E2E8E3] p-5 shadow-2xl text-[#17211B] flex flex-col"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8E3]">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E8F5EC] text-[#1F7A4D] border border-[#1F7A4D]/20">
              <span>{meta.symbol}</span>
              <span>{meta.label}</span>
            </span>
            {place.verified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1F7A4D] bg-[#E8F5EC] px-2 py-0.5 rounded-full border border-[#1F7A4D]/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Spot</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-full text-[#66736B] hover:text-[#17211B] hover:bg-[#F8FAF7] transition"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-[#66736B] hover:text-[#17211B] hover:bg-[#F8FAF7] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Place Info */}
        <div className="py-4 space-y-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#17211B] leading-tight">
              {place.name}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-[#66736B] mt-1">
              <MapPin className="w-3.5 h-3.5 text-[#1F7A4D] shrink-0" />
              <span>{place.city}, {place.state}</span>
              {place.location.landmark && (
                <span>• {place.location.landmark}</span>
              )}
            </div>
          </div>

          {/* Price Box */}
          <div className="p-3.5 rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#66736B] block uppercase font-bold tracking-wider">
                Approximate Price
              </span>
              <span className={`text-base font-black ${isFree ? 'text-[#1F7A4D]' : 'text-[#17211B]'}`}>
                {isFree ? 'FREE (Langar / RO / Volunteer)' : `₹${place.priceMin} - ₹${place.priceMax}`}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-[#66736B] block uppercase font-bold tracking-wider">
                Community Rating
              </span>
              <div className="flex items-center gap-1 text-sm font-bold text-[#17211B] justify-end">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{place.rating.toFixed(1)}</span>
                <span className="text-[#66736B] text-xs font-normal">({place.reportCount})</span>
              </div>
            </div>
          </div>

          {/* Timing */}
          {place.timing && (
            <div className="flex items-center gap-2 text-xs text-[#66736B]">
              <Clock className="w-4 h-4 text-[#1F7A4D]" />
              <span>Hours: <strong className="text-[#17211B]">{place.timing}</strong></span>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-[#17211B] uppercase tracking-wider">
              About this spot
            </h4>
            <p className="text-xs text-[#17211B] leading-relaxed">
              {place.description}
            </p>
          </div>

          {/* Tags */}
          {place.tags && place.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {place.tags.map((tag, i) => (
                <span key={i} className="text-[11px] font-medium bg-[#E8F5EC] text-[#1F7A4D] px-2 py-0.5 rounded-md">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Safety Disclaimer */}
          <SafetyDisclaimer />

          {/* Community Field Reports / Reviews */}
          <div className="space-y-3 pt-3 border-t border-[#E2E8E3]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#17211B] uppercase tracking-wider">
                Field Reports & Reviews ({reports.length})
              </h4>
              <button
                onClick={handleAddReviewClick}
                className="flex items-center gap-1 text-xs font-bold text-[#1F7A4D] hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Review</span>
              </button>
            </div>

            {reports.length === 0 ? (
              <p className="text-xs text-[#66736B] italic p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8E3] text-center">
                No reports submitted yet. Be the first nomad to verify this place!
              </p>
            ) : (
              <div className="space-y-2">
                {reports.map((r) => (
                  <div key={r.id} className="p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8E3] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#17211B]">{r.userName || 'Nomad'}</span>
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{r.rating}</span>
                      </div>
                    </div>
                    <p className="text-[#66736B]">{r.comment}</p>
                    {r.pricePaid !== undefined && (
                      <span className="text-[10px] text-[#1F7A4D] font-medium block">
                        Reported price paid: ₹{r.pricePaid}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
