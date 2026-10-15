import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { addReport } from '../../services/firestore';
import { moderateUserContent } from '../../services/gemini';
import { X, Star, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface AddReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'place' | 'hitchhikingSpot';
  targetId: string;
  currentUser: UserProfile | null;
  onRequireAuth: (reason?: string) => void;
  onSuccess: () => void;
}

export const AddReportModal: React.FC<AddReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  currentUser,
  onRequireAuth,
  onSuccess
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [pricePaid, setPricePaid] = useState<number | ''>('');
  const [visitedAt, setVisitedAt] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth('Sign in to submit a field report or review');
      return;
    }

    if (!comment.trim()) {
      setError('Please provide a short description or field note.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Run AI safety check
      const modCheck = await moderateUserContent(comment);
      if (!modCheck.approved) {
        setError(modCheck.flaggedReason || 'Submission was flagged by safety filter.');
        setIsSubmitting(false);
        return;
      }

      await addReport({
        userId: currentUser.id,
        userName: currentUser.displayName,
        targetType,
        targetId,
        rating,
        comment: comment.trim(),
        pricePaid: pricePaid === '' ? undefined : Number(pricePaid),
        visitedAt,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white border border-[#E2E8E3] p-6 shadow-2xl text-[#17211B]">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8E3]">
          <div>
            <h3 className="text-base font-extrabold text-[#17211B]">
              Submit Community Field Report
            </h3>
            <p className="text-xs text-[#66736B]">
              Help other travellers with accurate prices and current conditions
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full text-[#66736B] hover:text-[#17211B] hover:bg-[#F8FAF7]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 border border-[#D9534F]/30 text-[#D9534F] text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          {/* Star Rating */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#66736B] block mb-1">
              Overall Experience Rating *
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 focus:outline-none"
                >
                  <Star
                    className={`w-6 h-6 transition ${
                      star <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-[#E2E8E3]'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-[#17211B] ml-2">{rating} / 5</span>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#66736B] block mb-1">
              Field Notes, Conditions & Cleanliness *
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Free Langar served till 3 PM; very clean, friendly volunteers. Hot water available in morning..."
              className="w-full rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3] p-3 text-xs text-[#17211B] placeholder-[#66736B] focus:outline-none focus:border-[#1F7A4D] focus:bg-white"
            />
          </div>

          {/* Price paid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#66736B] block mb-1">
                Actual Price Paid (₹)
              </label>
              <input
                type="number"
                min="0"
                value={pricePaid}
                onChange={(e) => setPricePaid(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 0 or 150"
                className="w-full rounded-xl bg-[#F8FAF7] border border-[#E2E8E3] p-2 text-xs font-bold text-[#17211B] focus:outline-none focus:border-[#1F7A4D] focus:bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#66736B] block mb-1">
                Visit Date *
              </label>
              <input
                type="date"
                required
                value={visitedAt}
                onChange={(e) => setVisitedAt(e.target.value)}
                className="w-full rounded-xl bg-[#F8FAF7] border border-[#E2E8E3] p-2 text-xs font-bold text-[#17211B] focus:outline-none focus:border-[#1F7A4D] focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-[#1F7A4D] hover:bg-[#19633e] text-white font-bold text-xs shadow-md transition active:scale-[0.99]"
          >
            {isSubmitting ? 'Submitting Review...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
};
