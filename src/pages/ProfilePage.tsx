import React, { useState, useEffect } from 'react';
import { UserProfile, SavedTrip, PlaceDocument, HitchhikingSpot } from '../types';
import { getSavedTrips, getAllPlacesForAdmin, getAllHitchhikingSpotsForAdmin } from '../services/firestore';
import { signOut } from '../services/auth';
import { 
  User, 
  Award, 
  Bookmark, 
  ShieldCheck, 
  LogOut, 
  CheckCircle2, 
  MapPin, 
  ChevronRight, 
  Flame, 
  LogIn,
  ThumbsUp,
  Clock,
  PlusCircle
} from 'lucide-react';

interface ProfilePageProps {
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onNavigateTab: (tab: string, state?: any) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser,
  onOpenAuth,
  onNavigateTab
}) => {
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [myPlaces, setMyPlaces] = useState<PlaceDocument[]>([]);
  const [mySpots, setMySpots] = useState<HitchhikingSpot[]>([]);
  const [activeProfileTab, setActiveProfileTab] = useState<'saved' | 'places' | 'spots'>('saved');

  useEffect(() => {
    if (currentUser) {
      const trips = getSavedTrips(currentUser.id);
      setSavedTrips(trips);

      getAllPlacesForAdmin().then(allP => {
        setMyPlaces(allP.filter(p => p.createdBy === currentUser.id || p.createdBy === 'system_curator'));
      });
      getAllHitchhikingSpotsForAdmin().then(allS => {
        setMySpots(allS.filter(s => s.createdBy === currentUser.id || s.createdBy === 'system_curator'));
      });
    }
  }, [currentUser]);

  const handleSignOut = async () => {
    await signOut();
  };

  // If visitor is not logged in, show clean prompt with benefits of registration
  if (!currentUser) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center text-[#17211B] bg-[#F8FAF7]">
        <div className="w-16 h-16 rounded-3xl bg-[#E8F5EC] border border-[#1F7A4D]/20 flex items-center justify-center text-[#1F7A4D] mb-4 shadow-sm">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-[#17211B] mb-2">
          Your Moove India Profile & Saved Vault
        </h2>
        <p className="text-xs sm:text-sm text-[#66736B] max-w-sm mb-6 leading-relaxed">
          Create an account to save custom journeys, submit budget spots, review backpacker locations, and build your community Karma.
        </p>
        <button
          onClick={onOpenAuth}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#1F7A4D] hover:bg-[#19633e] text-white py-3 px-6 text-xs sm:text-sm font-bold shadow-md transition active:scale-95"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In / Create Account</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 md:pb-12 text-[#17211B] bg-[#F8FAF7]">
      {/* Header Profile Banner */}
      <div className="bg-white border-b border-[#E2E8E3] p-4 sm:p-6 shadow-sm">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[#1F7A4D] shadow-sm"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-[#E8F5EC] border border-[#1F7A4D]/20 flex items-center justify-center text-[#1F7A4D] font-black text-xl shadow-sm">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-lg text-[#17211B]">
                    {currentUser.displayName}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E8F5EC] text-[#1F7A4D] border border-[#1F7A4D]/20">
                    {currentUser.role === 'admin' ? 'Community Guardian' : 'Verified Nomad'}
                  </span>
                </div>
                <p className="text-xs text-[#66736B]">
                  {currentUser.email || 'Verified Backpacker'}
                </p>
                {currentUser.bio && (
                  <p className="text-[11px] text-[#66736B] mt-1 max-w-sm">
                    {currentUser.bio}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="p-2 rounded-xl text-[#66736B] hover:text-[#D9534F] hover:bg-red-50 border border-[#E2E8E3] transition text-xs font-semibold flex items-center gap-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3] text-center">
              <span className="text-[10px] text-[#66736B] block font-bold uppercase">Karma</span>
              <span className="text-base font-black text-[#1F7A4D]">
                {currentUser.travelKarma || 100}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3] text-center">
              <span className="text-[10px] text-[#66736B] block font-bold uppercase">Spots Added</span>
              <span className="text-base font-black text-[#17211B]">
                {myPlaces.length + mySpots.length}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-[#F8FAF7] border border-[#E2E8E3] text-center">
              <span className="text-[10px] text-[#66736B] block font-bold uppercase">Saved Trips</span>
              <span className="text-base font-black text-[#17211B]">
                {savedTrips.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
        <div className="flex border-b border-[#E2E8E3]">
          <button
            onClick={() => setActiveProfileTab('saved')}
            className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 ${
              activeProfileTab === 'saved'
                ? 'border-[#1F7A4D] text-[#1F7A4D]'
                : 'border-transparent text-[#66736B] hover:text-[#17211B]'
            }`}
          >
            Saved Journeys ({savedTrips.length})
          </button>
          <button
            onClick={() => setActiveProfileTab('places')}
            className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 ${
              activeProfileTab === 'places'
                ? 'border-[#1F7A4D] text-[#1F7A4D]'
                : 'border-transparent text-[#66736B] hover:text-[#17211B]'
            }`}
          >
            Submitted Spots ({myPlaces.length})
          </button>
          <button
            onClick={() => setActiveProfileTab('spots')}
            className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 ${
              activeProfileTab === 'spots'
                ? 'border-[#1F7A4D] text-[#1F7A4D]'
                : 'border-transparent text-[#66736B] hover:text-[#17211B]'
            }`}
          >
            Hitch Corridors ({mySpots.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeProfileTab === 'saved' && (
          <div className="space-y-3">
            {savedTrips.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-[#E2E8E3] text-center text-[#66736B]">
                <Bookmark className="w-8 h-8 text-[#E2E8E3] mx-auto mb-2" />
                <p className="text-xs font-semibold">No journeys saved yet.</p>
                <button
                  onClick={() => onNavigateTab('journey')}
                  className="mt-3 text-xs font-bold text-[#1F7A4D] hover:underline"
                >
                  Plan a journey now →
                </button>
              </div>
            ) : (
              savedTrips.map((st) => (
                <div
                  key={st.id}
                  className="p-4 rounded-2xl bg-white border border-[#E2E8E3] space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-[#17211B]">
                      {st.journey.from} ➔ {st.journey.to}
                    </h4>
                    <span className="text-xs font-black text-[#1F7A4D]">
                      ₹{st.journey.totalEstimatedCost}
                    </span>
                  </div>
                  <p className="text-xs text-[#66736B]">
                    {st.journey.days} Days • {st.journey.travelStyle} Style • {st.journey.suggestedStops.length} Waypoints
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {activeProfileTab === 'places' && (
          <div className="space-y-3">
            {myPlaces.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-[#E2E8E3] text-center text-[#66736B]">
                <PlusCircle className="w-8 h-8 text-[#E2E8E3] mx-auto mb-2" />
                <p className="text-xs font-semibold">You haven't submitted any places yet.</p>
                <button
                  onClick={() => onNavigateTab('add')}
                  className="mt-3 text-xs font-bold text-[#1F7A4D] hover:underline"
                >
                  Contribute your first budget spot →
                </button>
              </div>
            ) : (
              myPlaces.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-white border border-[#E2E8E3] flex items-center justify-between"
                >
                  <div>
                    <h5 className="font-extrabold text-xs text-[#17211B]">{p.name}</h5>
                    <span className="text-[11px] text-[#66736B]">{p.city}, {p.state} • {p.status}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    p.status === 'approved' 
                      ? 'bg-[#E8F5EC] text-[#1F7A4D]'
                      : 'bg-amber-50 text-[#E99A3D]'
                  }`}>
                    {p.status === 'approved' ? 'Approved' : 'Pending Review'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {activeProfileTab === 'spots' && (
          <div className="space-y-3">
            {mySpots.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-[#E2E8E3] text-center text-[#66736B]">
                <ThumbsUp className="w-8 h-8 text-[#E2E8E3] mx-auto mb-2" />
                <p className="text-xs font-semibold">No hitchhiking spots submitted yet.</p>
              </div>
            ) : (
              mySpots.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-2xl bg-white border border-[#E2E8E3] flex items-center justify-between"
                >
                  <div>
                    <h5 className="font-extrabold text-xs text-[#17211B]">{s.name}</h5>
                    <span className="text-[11px] text-[#66736B]">{s.roadName} • {s.direction}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    s.status === 'approved' 
                      ? 'bg-[#E8F5EC] text-[#1F7A4D]'
                      : 'bg-amber-50 text-[#E99A3D]'
                  }`}>
                    {s.status === 'approved' ? 'Approved' : 'Pending Review'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
