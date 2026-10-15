import React, { useState, useEffect } from 'react';
import { 
  PlaceDocument, 
  HitchhikingSpot, 
  Report, 
  UserProfile, 
  ModerationStatus,
  CuratedDestination,
  BannerItem,
  AppSettings
} from '../types';
import { 
  getAllPlacesForAdmin, 
  getAllHitchhikingSpotsForAdmin, 
  updatePlaceStatus, 
  updateHitchhikingSpotStatus, 
  getReports,
  deletePlace,
  deleteHitchhikingSpot,
  getUsersForAdmin
} from '../services/firestore';
import { 
  CURATED_DESTINATIONS, 
  INITIAL_APP_SETTINGS 
} from '../data/mockData';
import { MapView } from '../components/map/MapView';
import { 
  Shield, 
  Check, 
  X, 
  AlertTriangle, 
  Eye, 
  ThumbsUp, 
  MapPin, 
  Star, 
  RefreshCw, 
  LayoutDashboard, 
  Map as MapIcon, 
  Users, 
  FileText, 
  Settings, 
  Image as ImageIcon, 
  Compass, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Sliders, 
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Edit
} from 'lucide-react';

interface AdminPageProps {
  currentUser: UserProfile | null;
  onNavigateTab: (tab: string) => void;
  onRequireAuth?: (reason?: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ 
  currentUser, 
  onNavigateTab,
  onRequireAuth 
}) => {
  const [activeSection, setActiveSection] = useState<
    'dashboard' | 'places' | 'hitchhiking' | 'moderation' | 'users' | 'destinations' | 'banners' | 'settings' | 'map'
  >('dashboard');

  const [places, setPlaces] = useState<PlaceDocument[]>([]);
  const [spots, setSpots] = useState<HitchhikingSpot[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [destinations, setDestinations] = useState<CuratedDestination[]>(CURATED_DESTINATIONS);
  const [appSettings, setAppSettings] = useState<AppSettings>(INITIAL_APP_SETTINGS);
  const [banners, setBanners] = useState<BannerItem[]>([
    {
      id: 'banner-1',
      title: 'Himalayan Hitching Season Opens',
      description: 'NH44 to Manali is now clear for budget backpackers.',
      ctaText: 'Explore Manali',
      ctaDestination: 'explore',
      isPublished: true,
      createdAt: '2026-03-25'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    const [pList, sList, rList, uList] = await Promise.all([
      getAllPlacesForAdmin(),
      getAllHitchhikingSpotsForAdmin(),
      getReports(),
      getUsersForAdmin()
    ]);
    setPlaces(pList);
    setSpots(sList);
    setReports(rList);
    setUsersList(uList);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Security Gate
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-[80vh] p-6 flex flex-col items-center justify-center text-center text-[#17211B] bg-[#F8FAF7]">
        <div className="w-16 h-16 rounded-3xl bg-red-50 border border-red-200 flex items-center justify-center text-[#D9534F] mb-4 shadow-sm">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-[#17211B] mb-2">
          Administrator Access Required
        </h2>
        <p className="text-xs sm:text-sm text-[#66736B] max-w-sm mb-6 leading-relaxed">
          The Moove India control panel is restricted to verified administrators (Role: ADMIN). Please sign in with administrator credentials.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => onNavigateTab('explore')}
            className="px-5 py-2.5 rounded-xl bg-white border border-[#E2E8E3] text-[#17211B] font-bold text-xs hover:bg-[#F8FAF7]"
          >
            Return to Explore
          </button>
          {onRequireAuth && (
            <button
              onClick={() => onRequireAuth('Sign in with authorized administrator credentials')}
              className="px-5 py-2.5 rounded-xl bg-[#1F7A4D] text-white font-bold text-xs shadow-md hover:bg-[#19633e]"
            >
              Sign In to Authorized Account
            </button>
          )}
        </div>
      </div>
    );
  }

  // Place actions
  const handleApprovePlace = async (id: string) => {
    await updatePlaceStatus(id, 'approved', true);
    setPlaces(prev => prev.map(p => p.id === id ? { ...p, status: 'approved', verified: true } : p));
    showNotice(`Place ${id} approved & published.`);
  };

  const handleRejectPlace = async (id: string) => {
    await updatePlaceStatus(id, 'rejected');
    setPlaces(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected' } : p));
    showNotice(`Place ${id} rejected.`);
  };

  const handleDeletePlace = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this place permanently?')) {
      await deletePlace(id);
      setPlaces(prev => prev.filter(p => p.id !== id));
      showNotice(`Place deleted.`);
    }
  };

  // Spot actions
  const handleApproveSpot = async (id: string) => {
    await updateHitchhikingSpotStatus(id, 'approved');
    setSpots(prev => prev.map(s => s.id === id ? { ...s, status: 'approved' } : s));
    showNotice(`Hitchhiking point approved.`);
  };

  const handleRejectSpot = async (id: string) => {
    await updateHitchhikingSpotStatus(id, 'rejected');
    setSpots(prev => prev.map(s => s.id === id ? { ...s, status: 'rejected' } : s));
    showNotice(`Hitchhiking point rejected.`);
  };

  const handleDeleteSpot = async (id: string) => {
    if (window.confirm('Delete this hitchhiking spot?')) {
      await deleteHitchhikingSpot(id);
      setSpots(prev => prev.filter(s => s.id !== id));
      showNotice(`Hitchhiking point removed.`);
    }
  };

  // Destination toggle published
  const handleToggleDestinationPublish = (id: string) => {
    setDestinations(prev => prev.map(d => d.id === id ? { ...d, isPublished: !d.isPublished } : d));
    showNotice('Destination status updated.');
  };

  const pendingPlaces = places.filter(p => p.status === 'pending');
  const pendingSpots = spots.filter(s => s.status === 'pending');
  const totalPending = pendingPlaces.length + pendingSpots.length;

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#17211B] flex flex-col md:flex-row pb-24 md:pb-8">
      {/* Sidebar (Desktop first) */}
      <aside className="w-full md:w-64 bg-white border-r border-[#E2E8E3] shrink-0 p-4 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#E2E8E3]">
          <div className="w-8 h-8 rounded-xl bg-[#1F7A4D] text-white flex items-center justify-center font-black">
            M
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-[#17211B]">Moove India Admin</h2>
            <p className="text-[10px] text-[#66736B]">Control Panel & CMS</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 text-xs">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'places', label: `Places (${places.length})`, icon: MapPin },
            { id: 'hitchhiking', label: `Hitch Corridors (${spots.length})`, icon: ThumbsUp },
            { id: 'moderation', label: `Moderation Queue (${totalPending})`, icon: ShieldCheck, badge: totalPending > 0 ? totalPending : undefined },
            { id: 'map', label: 'Admin Map Overview', icon: MapIcon },
            { id: 'destinations', label: `Destinations CMS (${destinations.length})`, icon: Compass },
            { id: 'users', label: `Users & Roles (${usersList.length})`, icon: Users },
            { id: 'banners', label: 'Banners & Notices', icon: ImageIcon },
            { id: 'settings', label: 'App Settings', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isCurrent = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as any)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition text-left ${
                  isCurrent
                    ? 'bg-[#E8F5EC] text-[#1F7A4D]'
                    : 'text-[#66736B] hover:text-[#17211B] hover:bg-[#F8FAF7]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="w-5 h-5 rounded-full bg-[#E99A3D] text-white flex items-center justify-center text-[10px] font-black">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Return Button */}
        <div className="pt-4 border-t border-[#E2E8E3]">
          <button
            onClick={() => onNavigateTab('explore')}
            className="w-full py-2 px-3 rounded-xl bg-[#F8FAF7] hover:bg-[#E8F5EC] text-xs font-semibold text-[#17211B] transition flex items-center justify-center gap-1.5"
          >
            <span>Exit to Traveller App</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Main Admin Content Body */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2E8E3]">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#17211B] capitalize">
              {activeSection.replace('-', ' ')} Management
            </h1>
            <p className="text-xs text-[#66736B]">
              Logged in as <strong className="text-[#17211B]">{currentUser.displayName}</strong> ({currentUser.email})
            </p>
          </div>

          <div className="flex items-center gap-2">
            {actionNotice && (
              <span className="px-3 py-1 rounded-full bg-[#E8F5EC] text-[#1F7A4D] border border-[#1F7A4D]/20 text-xs font-bold animate-in fade-in">
                {actionNotice}
              </span>
            )}
            <button
              onClick={loadAll}
              disabled={loading}
              className="p-2 rounded-xl bg-white border border-[#E2E8E3] hover:bg-[#F8FAF7] text-xs font-semibold text-[#17211B] flex items-center gap-1.5 shadow-sm"
              title="Refresh Firestore Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* 1. DASHBOARD VIEW */}
        {activeSection === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-[#E2E8E3] shadow-sm">
                <span className="text-[11px] font-bold uppercase text-[#66736B]">Total Users</span>
                <div className="text-2xl font-black text-[#17211B] mt-1">{usersList.length + 42}</div>
                <span className="text-[10px] text-[#1F7A4D] font-semibold">+8 this week</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#E2E8E3] shadow-sm">
                <span className="text-[11px] font-bold uppercase text-[#66736B]">Total Places</span>
                <div className="text-2xl font-black text-[#17211B] mt-1">{places.length}</div>
                <span className="text-[10px] text-[#66736B]">{places.filter(p => p.verified).length} verified</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#E2E8E3] shadow-sm">
                <span className="text-[11px] font-bold uppercase text-[#66736B]">Pending Submissions</span>
                <div className="text-2xl font-black text-[#E99A3D] mt-1">{totalPending}</div>
                <span className="text-[10px] text-[#E99A3D] font-semibold">Requires review</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#E2E8E3] shadow-sm">
                <span className="text-[11px] font-bold uppercase text-[#66736B]">Journeys Planned</span>
                <div className="text-2xl font-black text-[#1F7A4D] mt-1">128</div>
                <span className="text-[10px] text-[#66736B]">Community routes</span>
              </div>
            </div>

            {/* Quick Action Queue */}
            <div className="rounded-2xl bg-white border border-[#E2E8E3] p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#17211B]">
                  Pending Moderation Queue ({totalPending})
                </h3>
                <button
                  onClick={() => setActiveSection('moderation')}
                  className="text-xs font-bold text-[#1F7A4D] hover:underline"
                >
                  View Full Queue →
                </button>
              </div>

              {totalPending === 0 ? (
                <p className="text-xs text-[#66736B] p-4 text-center italic bg-[#F8FAF7] rounded-xl">
                  No submissions currently waiting for moderation. Great job!
                </p>
              ) : (
                <div className="space-y-2.5">
                  {pendingPlaces.slice(0, 3).map((p) => (
                    <div key={p.id} className="p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8E3] flex items-center justify-between gap-3 text-xs">
                      <div>
                        <h4 className="font-extrabold text-[#17211B]">{p.name}</h4>
                        <span className="text-[11px] text-[#66736B]">{p.city}, {p.state} • Submitted by {p.creatorName || p.createdBy}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleApprovePlace(p.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#1F7A4D] text-white font-bold text-xs hover:bg-[#19633e]"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectPlace(p.id)}
                          className="px-2.5 py-1 rounded-lg bg-red-50 text-[#D9534F] font-bold text-xs hover:bg-red-100"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity Log */}
            <div className="rounded-2xl bg-white border border-[#E2E8E3] p-5 space-y-3 shadow-sm">
              <h3 className="text-sm font-extrabold text-[#17211B]">
                Recent Audit & Platform Activity
              </h3>
              <div className="space-y-2 text-xs text-[#66736B]">
                <div className="p-2.5 rounded-xl bg-[#F8FAF7] flex items-center justify-between">
                  <span>New budget spot "NDLS Water ATM" verified by admin</span>
                  <span className="text-[10px]">Today</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F8FAF7] flex items-center justify-between">
                  <span>Hitchhiking point on NH44 approved</span>
                  <span className="text-[10px]">Yesterday</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F8FAF7] flex items-center justify-between">
                  <span>Curated destination "Hampi" updated with new season notes</span>
                  <span className="text-[10px]">2 days ago</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. PLACES MANAGEMENT */}
        {activeSection === 'places' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#66736B]" />
                <input
                  type="text"
                  placeholder="Filter places by name or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl bg-white border border-[#E2E8E3] py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-[#1F7A4D]"
                />
              </div>
            </div>

            {/* Places Table */}
            <div className="rounded-2xl bg-white border border-[#E2E8E3] overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8E3] bg-[#F8FAF7] text-[#66736B] font-bold text-[11px] uppercase tracking-wider">
                    <th className="p-3">Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Confidence</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E3]">
                  {places
                    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.city.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-[#F8FAF7]/60 transition">
                        <td className="p-3 font-bold text-[#17211B]">{p.name}</td>
                        <td className="p-3 capitalize">{p.type}</td>
                        <td className="p-3 text-[#66736B]">{p.city}, {p.state}</td>
                        <td className="p-3 font-bold">{p.priceMin === 0 ? 'FREE' : `₹${p.priceMin}-₹${p.priceMax}`}</td>
                        <td className="p-3">{p.rating.toFixed(1)} ★ ({p.reportCount})</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            p.status === 'approved' 
                              ? 'bg-[#E8F5EC] text-[#1F7A4D]'
                              : p.status === 'pending'
                              ? 'bg-amber-50 text-[#E99A3D]'
                              : 'bg-red-50 text-[#D9534F]'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          {p.status !== 'approved' && (
                            <button
                              onClick={() => handleApprovePlace(p.id)}
                              className="px-2 py-1 rounded bg-[#E8F5EC] text-[#1F7A4D] font-bold hover:bg-[#d8eedf]"
                              title="Approve"
                            >
                              Approve
                            </button>
                          )}
                          {p.status !== 'rejected' && (
                            <button
                              onClick={() => handleRejectPlace(p.id)}
                              className="px-2 py-1 rounded bg-amber-50 text-[#E99A3D] font-bold hover:bg-amber-100"
                              title="Reject"
                            >
                              Reject
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePlace(p.id)}
                            className="p-1 rounded text-[#D9534F] hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. HITCHHIKING CORRIDORS */}
        {activeSection === 'hitchhiking' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white border border-[#E2E8E3] overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8E3] bg-[#F8FAF7] text-[#66736B] font-bold text-[11px] uppercase tracking-wider">
                    <th className="p-3">Bay / Point</th>
                    <th className="p-3">Highway & Direction</th>
                    <th className="p-3">Wait Time</th>
                    <th className="p-3">Difficulty</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E3]">
                  {spots.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F8FAF7]/60 transition">
                      <td className="p-3 font-bold text-[#17211B]">{s.name}</td>
                      <td className="p-3 text-[#66736B]">{s.roadName} ➔ {s.direction}</td>
                      <td className="p-3">~{s.averageWaitMinutes} mins</td>
                      <td className="p-3 font-semibold">{s.difficulty}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          s.status === 'approved' ? 'bg-[#E8F5EC] text-[#1F7A4D]' : 'bg-amber-50 text-[#E99A3D]'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1">
                        {s.status !== 'approved' && (
                          <button
                            onClick={() => handleApproveSpot(s.id)}
                            className="px-2 py-1 rounded bg-[#E8F5EC] text-[#1F7A4D] font-bold"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteSpot(s.id)}
                          className="p-1 rounded text-[#D9534F] hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. MODERATION QUEUE */}
        {activeSection === 'moderation' && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-[#17211B]">
              Submissions Requiring Community Guardian Review ({totalPending})
            </h3>

            {totalPending === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-[#E2E8E3] text-center text-[#66736B]">
                <CheckCircle2 className="w-10 h-10 text-[#1F7A4D] mx-auto mb-2" />
                <p className="font-bold text-sm text-[#17211B]">All Submissions Clear</p>
                <p className="text-xs">No pending items in queue.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pendingPlaces.map((p) => (
                  <div key={p.id} className="p-4 rounded-2xl bg-white border border-[#E2E8E3] space-y-3 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-[#E99A3D] bg-amber-50 px-2 py-0.5 rounded-md">
                          Pending Place ({p.type})
                        </span>
                        <h4 className="text-sm font-black text-[#17211B] mt-1">{p.name}</h4>
                        <span className="text-xs text-[#66736B]">{p.city}, {p.state}</span>
                      </div>
                      <span className="text-xs font-bold text-[#1F7A4D]">
                        ₹{p.priceMin} - ₹{p.priceMax}
                      </span>
                    </div>

                    <p className="text-xs text-[#17211B] bg-[#F8FAF7] p-2.5 rounded-xl border border-[#E2E8E3]">
                      {p.description}
                    </p>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E2E8E3]">
                      <span className="text-[#66736B]">By {p.creatorName || p.createdBy}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprovePlace(p.id)}
                          className="px-3 py-1.5 rounded-xl bg-[#1F7A4D] text-white font-bold hover:bg-[#19633e]"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectPlace(p.id)}
                          className="px-3 py-1.5 rounded-xl bg-red-50 text-[#D9534F] font-bold hover:bg-red-100"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. DESTINATIONS CMS */}
        {activeSection === 'destinations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-[#17211B]">
                  CMS Controlled Destinations ({destinations.length})
                </h3>
                <p className="text-xs text-[#66736B]">
                  Changes here directly reflect in the traveller Explore page
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {destinations.map((dest) => (
                <div key={dest.id} className="rounded-2xl bg-white border border-[#E2E8E3] overflow-hidden shadow-sm flex flex-col justify-between">
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#17211B]">{dest.name}</span>
                      <span className="text-xs text-[#66736B]">{dest.state}</span>
                    </div>
                    <p className="text-xs text-[#66736B] line-clamp-2">{dest.description}</p>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-bold text-[#1F7A4D]">₹{dest.budgetPerDay}/day</span>
                      <span className="text-[#66736B]">{dest.season}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#F8FAF7] border-t border-[#E2E8E3] flex items-center justify-between text-xs">
                    <span className={`font-bold ${dest.isPublished ? 'text-[#1F7A4D]' : 'text-[#66736B]'}`}>
                      {dest.isPublished ? 'Published' : 'Hidden'}
                    </span>
                    <button
                      onClick={() => handleToggleDestinationPublish(dest.id)}
                      className="px-2.5 py-1 rounded-lg border border-[#E2E8E3] font-bold text-[#17211B] bg-white hover:bg-[#F8FAF7]"
                    >
                      {dest.isPublished ? 'Hide' : 'Publish'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. ADMIN MAP VIEW */}
        {activeSection === 'map' && (
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-[#17211B]">
              Live Geographic Map of All Registered Points ({places.length + spots.length})
            </h3>
            <div className="rounded-2xl overflow-hidden border border-[#E2E8E3] shadow-sm bg-white">
              <MapView
                places={places}
                hitchhikingSpots={spots}
                selectedPlace={null}
                selectedHitchSpot={null}
                onSelectPlace={(p) => handleApprovePlace(p.id)}
                onSelectHitchSpot={(s) => handleApproveSpot(s.id)}
                activeCategories={['food', 'stay', 'hitchhiking', 'camping', 'water', 'shower', 'charging']}
                heightClass="h-[480px]"
              />
            </div>
          </div>
        )}

        {/* 7. USERS */}
        {activeSection === 'users' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white border border-[#E2E8E3] overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8E3] bg-[#F8FAF7] text-[#66736B] font-bold text-[11px] uppercase">
                    <th className="p-3">User</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Karma</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E3]">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-[#F8FAF7]/60">
                      <td className="p-3 font-bold text-[#17211B]">{u.displayName}</td>
                      <td className="p-3 text-[#66736B]">{u.email || 'N/A'}</td>
                      <td className="p-3 uppercase font-bold text-[#1F7A4D]">{u.role}</td>
                      <td className="p-3 font-bold">{u.travelKarma || 100}</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5EC] text-[#1F7A4D]">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 8. BANNERS */}
        {activeSection === 'banners' && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-[#17211B]">
              Broadcast Announcements & Banners
            </h3>
            <div className="space-y-3">
              {banners.map((b) => (
                <div key={b.id} className="p-4 rounded-2xl bg-white border border-[#E2E8E3] flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-xs text-[#17211B]">{b.title}</h4>
                    <p className="text-xs text-[#66736B]">{b.description}</p>
                    <span className="text-[10px] text-[#1F7A4D] font-bold mt-1 block">CTA: {b.ctaText}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E8F5EC] text-[#1F7A4D]">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. SETTINGS */}
        {activeSection === 'settings' && (
          <div className="max-w-xl space-y-4 rounded-3xl bg-white border border-[#E2E8E3] p-6 shadow-sm">
            <h3 className="text-base font-extrabold text-[#17211B]">
              System Configuration (Admin-Controlled)
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8E3]">
                <div>
                  <span className="font-bold text-[#17211B] block">App Name</span>
                  <span className="text-[#66736B]">Public brand display</span>
                </div>
                <span className="font-black text-[#1F7A4D] text-sm">{appSettings.appName}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8E3]">
                <div>
                  <span className="font-bold text-[#17211B] block">Community Submissions</span>
                  <span className="text-[#66736B]">Allow users to add spots</span>
                </div>
                <input
                  type="checkbox"
                  checked={appSettings.communitySubmissionsEnabled}
                  onChange={(e) => setAppSettings({ ...appSettings, communitySubmissionsEnabled: e.target.checked })}
                  className="w-4 h-4 accent-[#1F7A4D]"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8E3]">
                <div>
                  <span className="font-bold text-[#17211B] block">AI Features (Gemini)</span>
                  <span className="text-[#66736B]">Journey builder & travel advisor</span>
                </div>
                <input
                  type="checkbox"
                  checked={appSettings.aiFeaturesEnabled}
                  onChange={(e) => setAppSettings({ ...appSettings, aiFeaturesEnabled: e.target.checked })}
                  className="w-4 h-4 accent-[#1F7A4D]"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8E3]">
                <div>
                  <span className="font-bold text-[#17211B] block">Moderation Required</span>
                  <span className="text-[#66736B]">New submissions start in Pending status</span>
                </div>
                <input
                  type="checkbox"
                  checked={appSettings.moderationRequired}
                  onChange={(e) => setAppSettings({ ...appSettings, moderationRequired: e.target.checked })}
                  className="w-4 h-4 accent-[#1F7A4D]"
                />
              </div>
            </div>

            <button
              onClick={() => showNotice('Application settings updated.')}
              className="w-full py-2.5 rounded-xl bg-[#1F7A4D] text-white font-bold text-xs shadow-md"
            >
              Save Configuration
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
