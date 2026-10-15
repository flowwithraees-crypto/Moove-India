import React, { useState } from 'react';
import { ShieldAlert, PhoneCall, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

interface SafetyDisclaimerProps {
  confidenceScore?: number;
  reportCount?: number;
  onReportUnsafe?: () => void;
  compact?: boolean;
}

export const SafetyDisclaimer: React.FC<SafetyDisclaimerProps> = ({
  confidenceScore = 4.5,
  reportCount = 120,
  onReportUnsafe,
  compact = false
}) => {
  const [showEmergencyContacts, setShowEmergencyContacts] = useState(false);

  const getConfidenceLevel = (score: number, count: number) => {
    if (count < 3) return { text: 'Community Caution (New Spot)', color: 'text-[#E99A3D] bg-amber-50 border-[#E99A3D]/30' };
    if (score >= 4.2) return { text: 'High Community Confidence', color: 'text-[#1F7A4D] bg-[#E8F5EC] border-[#1F7A4D]/30' };
    if (score >= 3.5) return { text: 'Moderate Community Confidence', color: 'text-amber-700 bg-amber-50 border-amber-300' };
    return { text: 'Caution Advised by Travellers', color: 'text-[#D9534F] bg-red-50 border-[#D9534F]/30' };
  };

  const confidence = getConfidenceLevel(confidenceScore, reportCount);

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#F8FAF7] border border-[#E2E8E3] text-xs">
        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${confidence.color}`}>
            {confidence.text} ({confidenceScore.toFixed(1)}/5)
          </span>
          <span className="text-[#66736B] text-[11px]">{reportCount} reports</span>
        </div>
        {onReportUnsafe && (
          <button
            onClick={onReportUnsafe}
            className="text-[11px] text-[#D9534F] hover:underline font-semibold"
          >
            Report Unsafe
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3] p-3.5 text-xs text-[#17211B] space-y-2.5">
      <div className="flex items-start gap-2.5">
        <ShieldAlert className="w-5 h-5 text-[#E99A3D] shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-bold text-[#17211B] text-xs sm:text-sm">
              Community Safety & Travel Advisory
            </h4>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${confidence.color}`}>
              {confidence.text}
            </span>
          </div>
          <p className="mt-1 text-[#66736B] leading-relaxed text-[11px]">
            No location or person can be guaranteed safe. Ratings reflect community consensus and verified reports. Always travel during daylight hours, trust your instincts, and share live location with someone you trust.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-[#E2E8E3]">
        <button
          onClick={() => setShowEmergencyContacts(!showEmergencyContacts)}
          className="flex items-center gap-1.5 text-[11px] font-bold text-[#1F7A4D] hover:underline transition"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>India Highway Emergency Numbers</span>
          {showEmergencyContacts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {onReportUnsafe && (
          <button
            onClick={onReportUnsafe}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#D9534F] hover:underline"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Flag Spot</span>
          </button>
        )}
      </div>

      {showEmergencyContacts && (
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#E2E8E3] text-[11px]">
          <div className="p-2 rounded-xl bg-white border border-[#E2E8E3]">
            <div className="text-[#66736B] font-medium text-[10px]">All India Emergency</div>
            <div className="text-[#1F7A4D] font-black text-sm">112</div>
          </div>
          <div className="p-2 rounded-xl bg-white border border-[#E2E8E3]">
            <div className="text-[#66736B] font-medium text-[10px]">NHAI Highway SOS</div>
            <div className="text-[#1F7A4D] font-black text-sm">1033</div>
          </div>
          <div className="p-2 rounded-xl bg-white border border-[#E2E8E3]">
            <div className="text-[#66736B] font-medium text-[10px]">Railway Helpline</div>
            <div className="text-[#1F7A4D] font-black text-sm">139</div>
          </div>
          <div className="p-2 rounded-xl bg-white border border-[#E2E8E3]">
            <div className="text-[#66736B] font-medium text-[10px]">Women Helpline</div>
            <div className="text-[#1F7A4D] font-black text-sm">1091</div>
          </div>
        </div>
      )}
    </div>
  );
};
