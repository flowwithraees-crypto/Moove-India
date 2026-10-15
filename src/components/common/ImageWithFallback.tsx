import React, { useState } from 'react';
import { Compass, Image as ImageIcon } from 'lucide-react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  fallbackText?: string;
  containerClassName?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  fallbackText,
  className = '',
  containerClassName = '',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // If no source or failed to load, render robust, handsome placeholder
  if (!src || hasError) {
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#E8F5EC] to-[#E2E8E3] text-[#66736B] p-4 text-center select-none relative overflow-hidden ${className || 'w-full h-full'}`}
      >
        <div className="w-10 h-10 rounded-full bg-white/80 border border-[#E2E8E3] flex items-center justify-center mb-1 text-[#1F7A4D] shadow-sm">
          <Compass className="w-5 h-5 text-[#1F7A4D]" />
        </div>
        <span className="text-xs font-semibold text-[#17211B] line-clamp-1">{alt}</span>
        <span className="text-[10px] text-[#66736B]">
          {fallbackText || 'India Budget Backpacker Spot'}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-[#E8F5EC]/60 animate-pulse flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-[#1F7A4D]/40" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        {...props}
      />
    </div>
  );
};
