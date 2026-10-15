import React from 'react';
import { Compass, Map as MapIcon, Route, PlusCircle, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  // Center position (3rd item out of 5) is Add Spot
  const navItems = [
    { id: 'explore', label: 'Home', icon: Compass },
    { id: 'map', label: 'Map', icon: MapIcon },
    { id: 'add', label: 'Add Spot', icon: PlusCircle, isHighlight: true },
    { id: 'journey', label: 'Plan', icon: Route },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#E2E8E3] bg-white/95 backdrop-blur-md pb-safe shadow-[0_-2px_8px_rgba(0,0,0,0.04)]"
      aria-label="Mobile Navigation"
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isHighlight) {
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="group relative -top-2.5 flex flex-col items-center justify-center focus:outline-none"
                aria-label={item.label}
              >
                <div 
                  className={`flex h-12 w-12 items-center justify-center rounded-full bg-[#1F7A4D] text-white shadow-md shadow-[#1F7A4D]/30 transition-transform active:scale-95 group-hover:scale-105 ${
                    isActive ? 'ring-4 ring-[#1F7A4D]/25' : ''
                  }`}
                >
                  <Icon className="h-5 w-5 stroke-[2.4]" />
                </div>
                <span className={`mt-0.5 text-[10px] font-bold ${isActive ? 'text-[#1F7A4D]' : 'text-[#66736B]'}`}>
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 text-xs font-medium transition-colors focus:outline-none ${
                isActive
                  ? 'text-[#1F7A4D] font-bold'
                  : 'text-[#66736B] hover:text-[#17211B]'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.4] text-[#1F7A4D]' : 'stroke-[1.8]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#1F7A4D]" />
                )}
              </div>
              <span className="mt-1 text-[11px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
