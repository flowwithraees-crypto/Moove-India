import React, { useState, useEffect } from 'react';
import { UserProfile, PlaceDocument, HitchhikingSpot } from './types';
import { onAuthChange, getPendingAuthAction, clearPendingAuthAction, setPendingAuthAction } from './services/auth';
import { usePlaces } from './hooks/usePlaces';
import { useHitchhikingSpots } from './hooks/useHitchhikingSpots';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { QuotaExceededBanner } from './components/common/QuotaExceededBanner';
import { ExplorePage } from './pages/ExplorePage';
import { MapPage } from './pages/MapPage';
import { JourneyPage } from './pages/JourneyPage';
import { AddPage } from './pages/AddPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { PlaceDetailDrawer } from './components/places/PlaceDetailDrawer';
import { HitchhikingDetailDrawer } from './components/hitchhiking/HitchhikingDetailDrawer';
import { AddReportModal } from './components/reports/AddReportModal';
import { TravelAssistantDrawer } from './components/ai/TravelAssistantDrawer';
import { TravelUpdatesModal } from './components/reports/TravelUpdatesModal';
import { AuthModal } from './components/auth/AuthModal';
import { APIProvider } from '@vis.gl/react-google-maps';
import { GOOGLE_MAPS_API_KEY } from './services/maps/mapsService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'explore' | 'map' | 'add' | 'journey' | 'profile' | 'admin'>('explore');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Data hooks
  const { places, refresh: refreshPlaces } = usePlaces();
  const { spots: hitchhikingSpots, refresh: refreshSpots } = useHitchhikingSpots();

  // Drawers and Modals state
  const [selectedPlace, setSelectedPlace] = useState<PlaceDocument | null>(null);
  const [selectedHitchSpot, setSelectedHitchSpot] = useState<HitchhikingSpot | null>(null);
  const [mapTargetLocation, setMapTargetLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [journeyTargetDestination, setJourneyTargetDestination] = useState<string | undefined>(undefined);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authActionReason, setAuthActionReason] = useState<string | undefined>(undefined);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isTravelUpdatesOpen, setIsTravelUpdatesOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'place' | 'hitchhikingSpot'; id: string } | null>(null);

  // Check route on mount (support direct /admin URL)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
      setActiveTab('admin');
    }
  }, []);

  // Listen to auth changes
  useEffect(() => {
    const unsub = onAuthChange((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  const handleOpenAuth = (reason?: string) => {
    setAuthActionReason(reason);
    setIsAuthModalOpen(true);
  };

  const handleOpenReportModal = (type: 'place' | 'hitchhikingSpot', id: string) => {
    if (!currentUser) {
      setPendingAuthAction({ type: 'add_review', payload: { type, id } });
      handleOpenAuth('Sign in to post a verified review & community rating');
      return;
    }
    setReportTarget({ type, id });
  };

  const handleNavigateTab = (tab: string, state?: any) => {
    setActiveTab(tab as any);
    if (state?.targetDestination) {
      setJourneyTargetDestination(state.targetDestination);
    }
    if (state?.lat && state?.lng) {
      setMapTargetLocation({ lat: state.lat, lng: state.lng });
      if (state.placeId) {
        const p = places.find(item => item.id === state.placeId);
        if (p) setSelectedPlace(p);
      }
      if (state.spotId) {
        const s = hitchhikingSpots.find(item => item.id === state.spotId);
        if (s) setSelectedHitchSpot(s);
      }
    }
  };

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    const pending = getPendingAuthAction();
    if (pending) {
      clearPendingAuthAction();
      if (pending.type === 'add_spot') {
        setActiveTab('add');
      } else if (pending.type === 'plan_journey') {
        setActiveTab('journey');
      } else if (pending.type === 'add_review' && pending.payload) {
        setReportTarget({ type: pending.payload.type, id: pending.payload.id });
      }
    }
  };

  return (
    <APIProvider
      apiKey={GOOGLE_MAPS_API_KEY}
      libraries={['places', 'marker', 'geometry']}
    >
      <div className="min-h-screen bg-[#F8FAF7] text-[#17211B] font-sans antialiased selection:bg-[#E8F5EC] selection:text-[#1F7A4D]">
        {/* Google Maps Quota notice if applicable */}
        <QuotaExceededBanner />

      {/* Responsive Top Header */}
      <Navbar
        currentUser={currentUser}
        onOpenAuth={() => handleOpenAuth()}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenTravelUpdates={() => setIsTravelUpdatesOpen(true)}
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab as any)}
        onRequireAuth={(reason) => handleOpenAuth(reason)}
      />

      {/* Main Content Area */}
      <main className="w-full">
        {activeTab === 'explore' && (
          <ExplorePage
            places={places}
            hitchhikingSpots={hitchhikingSpots}
            onSelectPlace={(p) => setSelectedPlace(p)}
            onSelectHitchSpot={(s) => setSelectedHitchSpot(s)}
            onNavigateTab={handleNavigateTab}
            onOpenAssistant={() => setIsAssistantOpen(true)}
            currentUser={currentUser}
            onRequireAuth={(reason) => {
              setPendingAuthAction({ type: 'plan_journey' });
              handleOpenAuth(reason);
            }}
            onOpenTravelUpdates={() => setIsTravelUpdatesOpen(true)}
          />
        )}

        {activeTab === 'map' && (
          <MapPage
            places={places}
            hitchhikingSpots={hitchhikingSpots}
            selectedPlace={selectedPlace}
            selectedHitchSpot={selectedHitchSpot}
            onSelectPlace={(p) => setSelectedPlace(p)}
            onSelectHitchSpot={(s) => setSelectedHitchSpot(s)}
            initialLocation={mapTargetLocation}
          />
        )}

        {activeTab === 'journey' && (
          <JourneyPage
            currentUser={currentUser}
            onRequireAuth={(reason) => {
              setPendingAuthAction({ type: 'plan_journey' });
              handleOpenAuth(reason);
            }}
            places={places}
            hitchhikingSpots={hitchhikingSpots}
            onSelectPlace={(p) => setSelectedPlace(p)}
            onSelectHitchSpot={(s) => setSelectedHitchSpot(s)}
            initialDestination={journeyTargetDestination}
          />
        )}

        {activeTab === 'add' && (
          <AddPage
            currentUser={currentUser}
            onRequireAuth={(reason) => {
              setPendingAuthAction({ type: 'add_spot' });
              handleOpenAuth(reason);
            }}
            onSuccess={(type, id) => {
              refreshPlaces();
              refreshSpots();
              setActiveTab('explore');
            }}
          />
        )}

        {activeTab === 'profile' && (
          <ProfilePage
            currentUser={currentUser}
            onOpenAuth={() => handleOpenAuth()}
            onNavigateTab={handleNavigateTab}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPage
            currentUser={currentUser}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
            onRequireAuth={(reason) => handleOpenAuth(reason)}
          />
        )}
      </main>

      {/* Bottom Mobile Navigation (only for non-admin view, hidden on md+ screens) */}
      {activeTab !== 'admin' && (
        <BottomNav
          activeTab={activeTab}
          setActiveTab={(tab) => setActiveTab(tab as any)}
        />
      )}

      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Modals & Drawers */}
      <PlaceDetailDrawer
        place={selectedPlace}
        onClose={() => setSelectedPlace(null)}
        currentUser={currentUser}
        onOpenReportModal={handleOpenReportModal}
        onRequireAuth={(reason) => handleOpenAuth(reason)}
      />

      <HitchhikingDetailDrawer
        spot={selectedHitchSpot}
        onClose={() => setSelectedHitchSpot(null)}
        currentUser={currentUser}
        onOpenReportModal={handleOpenReportModal}
        onRequireAuth={(reason) => handleOpenAuth(reason)}
      />

      <AddReportModal
        isOpen={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        targetType={reportTarget?.type || 'place'}
        targetId={reportTarget?.id || ''}
        currentUser={currentUser}
        onRequireAuth={(reason) => handleOpenAuth(reason)}
        onSuccess={() => {
          refreshPlaces();
          refreshSpots();
        }}
      />

      <TravelAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        places={places}
        hitchhikingSpots={hitchhikingSpots}
      />

      <TravelUpdatesModal
        isOpen={isTravelUpdatesOpen}
        onClose={() => setIsTravelUpdatesOpen(false)}
        onOpenReport={() => {
          if (!currentUser) {
            handleOpenAuth('Sign in to submit a community field report');
          }
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthActionReason(undefined);
        }}
        onSuccess={handleAuthSuccess}
        actionReason={authActionReason}
      />
      </div>
    </APIProvider>
  );
}
