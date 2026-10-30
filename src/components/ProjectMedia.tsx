import React, { useState } from 'react';
import { Gamepad2, AppWindow, Image as ImageIcon } from 'lucide-react';
import type { ProjectCategory } from '../types/project';

interface ProjectIconProps {
  src: string;
  alt: string;
  name: string;
  category: ProjectCategory;
  className?: string;
}

export const ProjectIcon: React.FC<ProjectIconProps> = ({
  src,
  alt,
  name,
  category,
  className = 'w-12 h-12',
}) => {
  const [hasError, setHasError] = useState(false);
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (hasError || !src) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-linear-to-b from-stone-850 to-stone-900 border border-stone-700/80 text-stone-200 font-bold text-sm select-none shadow-xs ${className}`}
        aria-label={alt}
      >
        {initials || (category === 'GAME' ? <Gamepad2 className="w-5 h-5 text-stone-300" /> : <AppWindow className="w-5 h-5 text-cyan-300" />)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setHasError(true)}
      className={`rounded-xl object-cover border border-stone-800 shadow-xs ${className}`}
    />
  );
};

interface ScreenshotImageProps {
  src: string;
  alt: string;
  index: number;
}

export const ScreenshotImage: React.FC<ScreenshotImageProps> = ({ src, alt, index }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div className="aspect-16/9 w-full rounded-xl bg-stone-900/90 border border-stone-800 flex flex-col items-center justify-center p-6 text-stone-400 text-center select-none shadow-xs">
        <ImageIcon className="w-7 h-7 mb-2 text-stone-500" aria-hidden="true" />
        <span className="text-xs font-mono text-stone-300">Pratinjau Layar #{index + 1}</span>
        <span className="text-[11px] text-stone-500 mt-1">Pratinjau Belum Tersedia</span>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-stone-800 bg-stone-900/60">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setHasError(true)}
        className="w-full h-auto object-cover hover:scale-[1.02] transition-transform duration-300"
      />
    </div>
  );
};
