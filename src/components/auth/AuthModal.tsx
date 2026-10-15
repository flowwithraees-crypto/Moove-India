import React, { useState } from 'react';
import { 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  resetPassword,
  getPendingAuthAction 
} from '../../services/auth';
import { UserProfile } from '../../types';
import { X, Eye, EyeOff, Mail, Lock, User, Compass, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  actionReason?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  actionReason 
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  if (!isOpen) return null;

  const pendingAction = getPendingAuthAction();
  const promptContext = actionReason || (
    pendingAction?.type === 'add_spot' 
      ? 'Sign in to submit a new budget spot for community review'
      : pendingAction?.type === 'add_review'
      ? 'Sign in to share your verified field review & tips'
      : pendingAction?.type === 'plan_journey'
      ? 'Sign in to plan and customize your personalized budget route'
      : pendingAction?.type === 'save_journey'
      ? 'Sign in to save this journey to your traveller profile'
      : undefined
  );

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Google Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessInfo(null);

    try {
      if (mode === 'forgot') {
        const msg = await resetPassword(email.trim());
        setSuccessInfo(msg);
        setLoading(false);
        return;
      }

      let user: UserProfile;
      if (mode === 'signup') {
        user = await signUpWithEmail(email.trim(), password, displayName.trim(), confirmPassword);
      } else {
        user = await signInWithEmail(email.trim(), password);
      }
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white border border-[#E2E8E3] p-6 shadow-2xl text-[#17211B] relative">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#E2E8E3]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1F7A4D] flex items-center justify-center text-white shadow-sm">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#17211B] leading-snug">
                {mode === 'signup' && 'Create your Moove India Account'}
                {mode === 'signin' && 'Welcome to Moove India'}
                {mode === 'forgot' && 'Reset Password'}
              </h3>
              <p className="text-[11px] text-[#66736B]">
                {mode === 'signup' ? 'Join India’s ultra-budget backpacker community' : 'Go farther. Spend less.'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full text-[#66736B] hover:text-[#17211B] hover:bg-[#F8FAF7] transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reason banner if triggered by a protected action */}
        {promptContext && (
          <div className="mt-3 p-2.5 rounded-xl bg-[#E8F5EC] border border-[#1F7A4D]/20 text-[#1F7A4D] text-xs flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#1F7A4D]" />
            <span>{promptContext}</span>
          </div>
        )}

        {/* Status messages */}
        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 border border-[#D9534F]/30 text-[#D9534F] text-xs font-medium">
            {error}
          </div>
        )}
        {successInfo && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successInfo}</span>
          </div>
        )}

        {/* Google One-Tap / Popup Button */}
        {mode !== 'forgot' && (
          <div className="mt-4">
            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl bg-white hover:bg-slate-50 py-2.5 px-4 text-xs font-bold text-[#17211B] border border-[#E2E8E3] shadow-sm transition active:scale-[0.99]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-2 text-[#66736B] text-[11px] my-3">
              <span className="flex-1 h-[1px] bg-[#E2E8E3]" />
              <span className="font-semibold uppercase tracking-wider text-[10px]">or with email</span>
              <span className="flex-1 h-[1px] bg-[#E2E8E3]" />
            </div>
          </div>
        )}

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          {mode === 'signup' && (
            <div>
              <label className="text-[11px] font-bold text-[#17211B] block mb-1">
                Full Name / Backpacker Handle *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#66736B]" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Maya Backpacker"
                  className="w-full rounded-xl bg-[#F8FAF7] border border-[#E2E8E3] py-2.5 pl-9 pr-3 text-xs text-[#17211B] placeholder-[#66736B] focus:border-[#1F7A4D] focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-[#17211B] block mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#66736B]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nomad@moove.in"
                className="w-full rounded-xl bg-[#F8FAF7] border border-[#E2E8E3] py-2.5 pl-9 pr-3 text-xs text-[#17211B] placeholder-[#66736B] focus:border-[#1F7A4D] focus:bg-white focus:outline-none transition"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-[#17211B]">
                  Password *
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(null); }}
                    className="text-[11px] text-[#1F7A4D] hover:underline font-semibold"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#66736B]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-xl bg-[#F8FAF7] border border-[#E2E8E3] py-2.5 pl-9 pr-10 text-xs text-[#17211B] placeholder-[#66736B] focus:border-[#1F7A4D] focus:bg-white focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#66736B] hover:text-[#17211B]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="text-[11px] font-bold text-[#17211B] block mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#66736B]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full rounded-xl bg-[#F8FAF7] border border-[#E2E8E3] py-2.5 pl-9 pr-10 text-xs text-[#17211B] placeholder-[#66736B] focus:border-[#1F7A4D] focus:bg-white focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#66736B] hover:text-[#17211B]"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-[#1F7A4D] py-3 text-xs font-bold text-white hover:bg-[#19633e] transition shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Processing...</span>
            ) : mode === 'signup' ? (
              <>
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : mode === 'signin' ? (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <span>Send Reset Instructions</span>
            )}
          </button>
        </form>

        {/* Toggle mode links */}
        <div className="text-center pt-3 mt-2 border-t border-[#E2E8E3] text-xs text-[#66736B]">
          {mode === 'signin' && (
            <p>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); }}
                className="font-bold text-[#1F7A4D] hover:underline"
              >
                Sign up free
              </button>
            </p>
          )}

          {mode === 'signup' && (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); }}
                className="font-bold text-[#1F7A4D] hover:underline"
              >
                Sign in
              </button>
            </p>
          )}

          {mode === 'forgot' && (
            <p>
              Remembered your password?{' '}
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); }}
                className="font-bold text-[#1F7A4D] hover:underline"
              >
                Back to Sign in
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
