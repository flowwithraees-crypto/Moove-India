import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../../types';
import { 
  Compass, 
  Sparkles, 
  LogIn, 
  Map as MapIcon, 
  Route, 
  PlusCircle, 
  Radio, 
  User, 
  Bookmark, 
  LogOut, 
  ChevronDown 
} from 'lucide-react';
import { signOut } from '../../services/auth';

interface NavbarProps {
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onOpenAssistant: () => void;
  onOpenTravelUpdates?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRequireAuth?: (reason?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenAuth,
  onOpenAssistant,
  onOpenTravelUpdates,
  activeTab,
  setActiveTab,
  onRequireAuth
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (tabId: string) => {
    if (tabId === 'journey' && !currentUser && onRequireAuth) {
      onRequireAuth('Sign in to access personalized journey planning');
      return;
    }
    if (tabId === 'add' && !currentUser && onRequireAuth) {
      onRequireAuth('Sign in to submit a budget spot or hitchhiking corridor');
      return;
    }
    setActiveTab(tabId);
  };

  const navItems = [
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'map', label: 'Live Map', icon: MapIcon },
    { id: 'updates', label: 'Travel Updates', icon: Radio, isAction: true },
    { id: 'journey', label: 'Plan Journey', icon: Route },
    { id: 'add', label: 'Add Spot', icon: PlusCircle },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E2E8E3] bg-white/95 backdrop-blur-md transition-all shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
        
        {/* Simple Brand: Only mention "Moove" */}
        <div 
          onClick={() => setActiveTab('explore')}
          className="flex items-center gap-2.5 cursor-pointer select-none group min-w-0 shrink-0"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1F7A4D] text-white shadow-xs group-hover:scale-105 transition-transform">
            <Compass className="h-5 w-5 stroke-[2.3]" />
          </div>
          <span className="font-extrabold tracking-tight text-[#17211B] text-xl">
            Moove
          </span>
        </div>

        {/* Desktop Navigation Links (Spacious, uncluttered, hidden on mobile) */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-3" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.isAction && onOpenTravelUpdates) {
                    onOpenTravelUpdates();
                  } else {
                    handleNavClick(item.id);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs lg:text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#E8F5EC] text-[#1F7A4D] font-bold'
                    : 'text-[#66736B] hover:text-[#17211B] hover:bg-[#F8FAF7]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#1F7A4D] stroke-[2.4]' : 'stroke-[1.8]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action Controls: Clean and spacious */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* AI Guide as Symbol Only */}
          <button
            onClick={onOpenAssistant}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-[#E8F5EC] hover:bg-[#d8eedf] text-[#1F7A4D] border border-[#1F7A4D]/20 transition-all active:scale-95 shadow-2xs"
            title="Ask AI Guide"
            aria-label="Ask AI Guide"
          >
            <Sparkles className="w-4 h-4 text-[#1F7A4D]" />
          </button>

          {/* User Profile or Simple Sign In Button */}
          {currentUser ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 rounded-full bg-white hover:bg-[#F8FAF7] text-[#17211B] border border-[#E2E8E3] pl-1.5 pr-2.5 sm:pr-3 py-1 text-xs font-semibold transition active:scale-95 shadow-2xs"
                aria-label="Account menu"
                aria-expanded={isProfileMenuOpen}
              >
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName} 
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-[#1F7A4D]"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#1F7A4D] text-white flex items-center justify-center font-bold text-[11px]">
                    {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                  </div>
                )}
                <span className="max-w-[85px] sm:max-w-[110px] truncate text-xs font-bold">
                  {currentUser.displayName.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#66736B] hidden sm:block" />
              </button>

              {/* Account Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-[#E2E8E3] shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-2 border-b border-[#E2E8E3]">
                    <p className="text-xs font-extrabold text-[#17211B] truncate">
                      {currentUser.displayName}
                    </p>
                    <p className="text-[11px] text-[#66736B] truncate">
                      {currentUser.email || 'Verified Backpacker'}
                    </p>
                    <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8F5EC] text-[#1F7A4D] text-[10px] font-bold">
                      <span>Karma: {currentUser.travelKarma || 100}</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-[#17211B] hover:bg-[#F8FAF7] flex items-center gap-2 font-medium transition"
                    >
                      <User className="w-3.5 h-3.5 text-[#66736B]" />
                      <span>View Profile & Spots</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-[#17211B] hover:bg-[#F8FAF7] flex items-center gap-2 font-medium transition"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-[#66736B]" />
                      <span>Saved Journeys</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-[#E2E8E3]">
                    <button
                      onClick={async () => {
                        setIsProfileMenuOpen(false);
                        await signOut();
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-[#D9534F] hover:bg-red-50 flex items-center gap-2 font-semibold transition"
                    >
                      <LogOut className="w-3.5 h-3.5 text-[#D9534F]" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 rounded-xl bg-[#1F7A4D] hover:bg-[#185e3b] text-white px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold shadow-xs transition active:scale-95"
              aria-label="Sign in"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
