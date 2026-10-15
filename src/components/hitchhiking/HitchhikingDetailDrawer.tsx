import React, { useState, useEffect } from 'react';
import { HitchhikingSpot, Report, UserProfile } from '../../types';
import { getReports } from '../../services/firestore';
import { SafetyDisclaimer } from '../safety/SafetyDisclaimer';
import { X, Navigation, Clock, ShieldCheck, ThumbsUp, Plus, Truck, AlertTriangle, Share2 } from 'lucide-react';

interface HitchhikingDetailDrawerProps {
  spot: HitchhikingSpot | null;
  onClose: () => void;
  currentUser: UserProfile | null;
  onOpenReportModal: (targetType: 'hitchhikingSpot', targetId: string) => void;
  onRequireAuth?: (reason?: string) => void;
}

export const HitchhikingDetailDrawer: React.FC<HitchhikingDetailDrawerProps> = ({
  spot,
  onClose,
  currentUser,
  onOpenReportModal,
  onRequireAuth
}) => {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    if (spot) {
      getReports(spot.id).then(setReports);
    }
  }, [spot]);

  if (!spot) return null;

  const handleShare = () => {
    const text = `Hitchhiking spot: ${spot.name} on ${spot.roadName} heading ${spot.direction}.`;
    if (navigator.share) {
      navigator.share({ title: spot.name, text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${spot.name} (${spot.roadName})`);
    }
  };

  const handleAddReport = () => {
    if (!currentUser && onRequireAuth) {
      onRequireAuth('Sign in to log your hitchhiking wait time & ride details');
      return;
    }
    onOpenReportModal('hitchhikingSpot', spot.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white border border-[#E2E8E3] p-5 shadow-2xl text-[#17211B] flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8E3]">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E8F5EC] text-[#1F7A4D] border border-[#1F7A4D]/20">
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Hitchhiking Corridor</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold border border-[#1F7A4D]/30 text-[#1F7A4D] bg-[#E8F5EC]">
              {spot.difficulty} Lift
            </span>
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

        {/* Spot Info */}
        <div className="py-4 space-y-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#17211B]">
              {spot.name}
            </h2>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1F7A4D] mt-1">
              <Navigation className="w-3.5 h-3.5 shrink-0" />
              <span>{spot.roadName}</span>
              <span className="text-[#66736B] font-normal truncate">➔ {spot.direction}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3] text-xs">
            <div>
              <span className="text-[10px] text-[#66736B] block font-bold uppercase tracking-wider">
                Average Wait Time
              </span>
              <span className="text-base font-black text-[#17211B] flex items-center gap-1 mt-0.5">
                <Clock className="w-4 h-4 text-[#E99A3D]" />
                ~{spot.averageWaitMinutes} mins
              </span>
            </div>

            <div>
              <span className="text-[10px] text-[#66736B] block font-bold uppercase tracking-wider">
                Safety Confidence
              </span>
              <div className="flex items-center gap-1 text-base font-black text-[#1F7A4D] mt-0.5">
                <ShieldCheck className="w-4 h-4" />
                <span>{spot.safetyRating.toFixed(1)} / 5</span>
              </div>
            </div>
          </div>

          {/* Vehicle Types */}
          {spot.vehicleTypes && spot.vehicleTypes.length > 0 && (
            <div className="space-y-1 text-xs">
              <span className="font-bold text-[#17211B] block">Frequent Stopping Vehicles:</span>
              <div className="flex flex-wrap gap-1.5">
                {spot.vehicleTypes.map((v, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-xl bg-[#E8F5EC] text-[#1F7A4D] border border-[#1F7A4D]/20 text-[11px] font-medium flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    <span>{v}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {spot.notes && (
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[#17211B] uppercase tracking-wider">
                Field Hitchhiking Notes
              </h4>
              <p className="text-xs text-[#17211B] leading-relaxed p-3 rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3]">
                {spot.notes}
              </p>
            </div>
          )}

          {/* Safety Disclaimer */}
          <SafetyDisclaimer />

          {/* Community Ride Logs */}
          <div className="space-y-3 pt-3 border-t border-[#E2E8E3]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#17211B] uppercase tracking-wider">
                Recent Rides & Logs ({reports.length})
              </h4>
              <button
                onClick={handleAddReport}
                className="flex items-center gap-1 text-xs font-bold text-[#1F7A4D] hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Ride Report</span>
              </button>
            </div>

            {reports.length === 0 ? (
              <p className="text-xs text-[#66736B] italic p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8E3] text-center">
                No recent rides logged for this spot yet. Hitchhiked here? Log your wait time!
              </p>
            ) : (
              <div className="space-y-2">
                {reports.map((r) => (
                  <div key={r.id} className="p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8E3] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#17211B]">{r.userName || 'Nomad Hitcher'}</span>
                      <span className="text-[10px] text-[#66736B]">{r.visitedAt}</span>
                    </div>
                    <p className="text-[#66736B]">{r.comment}</p>
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
