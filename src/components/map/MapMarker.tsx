// Source: Google Maps Platform Code Assist
// Attribution ID: gmp_mcp_codeassist_v1_aistudio

import React, { useEffect } from 'react';
import { AdvancedMarker, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { PlaceDocument, HitchhikingSpot, PlaceType } from '../../types';
import { CATEGORY_COLORS, CATEGORY_ICONS_LABEL } from '../../services/maps';

interface MapMarkerProps {
  place?: PlaceDocument;
  spot?: HitchhikingSpot;
  isSelected: boolean;
  onClick: () => void;
  setMarkerRef?: (marker: any, key: string) => void;
}

export const MapMarkerComponent: React.FC<MapMarkerProps> = ({
  place,
  spot,
  isSelected,
  onClick,
}) => {
  const isHitch = Boolean(spot);
  const position = isHitch
    ? { lat: spot!.location.lat, lng: spot!.location.lng }
    : { lat: place!.location.lat, lng: place!.location.lng };

  const type: PlaceType | 'hitchhiking' = isHitch ? 'hitchhiking' : place!.type;
  const meta = CATEGORY_ICONS_LABEL[type] || CATEGORY_ICONS_LABEL.food;
  const color = CATEGORY_COLORS[type] || CATEGORY_COLORS.food;
  const title = isHitch ? spot!.name : place!.name;
  const rating = isHitch ? spot!.safetyRating : place!.rating;

  const [markerRef, marker] = useAdvancedMarkerRef();

  // Attach supported gmp-click listener with proper cleanup on AdvancedMarkerElement
  useEffect(() => {
    if (!marker) return;

    const handleGmpClick = () => {
      if (onClick) onClick();
    };

    const target = (marker as any).element || marker;
    if (typeof target.addEventListener === 'function') {
      target.addEventListener('gmp-click', handleGmpClick);
    }

    return () => {
      if (typeof target.removeEventListener === 'function') {
        target.removeEventListener('gmp-click', handleGmpClick);
      }
    };
  }, [marker, onClick]);

  return (
    <AdvancedMarker
      ref={markerRef}
      position={position}
      title={title}
      gmpClickable={true}
      onClick={onClick}
    >
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={`relative flex flex-col items-center cursor-pointer transition-all duration-200 group ${
          isSelected ? 'scale-125 z-40' : 'hover:scale-115 z-20'
        }`}
      >
        {/* Circle Icon Badge */}
        <div
          style={{ backgroundColor: color.hex }}
          className={`h-9 w-9 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-sm font-black text-slate-950 transition-shadow ${
            isSelected ? 'ring-4 ring-amber-400/60 shadow-amber-500/50' : 'hover:shadow-2xl'
          }`}
        >
          {meta.symbol}
        </div>

        {/* Pointer Pin */}
        <div
          style={{ borderTopColor: color.hex }}
          className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] -mt-[1px]"
        />

        {/* Rating chip */}
        <div className="absolute -bottom-2 bg-slate-950 text-white font-mono text-[9px] font-black px-1 rounded-full border border-slate-700 shadow-md">
          {rating.toFixed(1)}★
        </div>

        {/* Hover Label */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 whitespace-nowrap bg-slate-950 text-slate-100 text-[11px] font-bold px-2 py-0.5 rounded shadow-xl border border-slate-700 pointer-events-none z-50">
          {title}
        </div>
      </div>
    </AdvancedMarker>
  );
};

export const MapMarker = React.memo(MapMarkerComponent);
