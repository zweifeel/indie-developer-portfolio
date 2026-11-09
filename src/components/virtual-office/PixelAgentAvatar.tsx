import React from 'react';
import { AgentCrewMember, SimulatedActivityType } from '../../types/virtualOffice';
import {
  FileSpreadsheet,
  Code2,
  Bug,
  CheckCircle,
  UploadCloud,
  Coffee,
  MessageSquare,
  BookOpen,
} from 'lucide-react';

export interface PixelAgentAvatarProps {
  agent: AgentCrewMember;
  reducedMotion?: boolean;
  staticFallback?: boolean;
  onSelect?: (agent: AgentCrewMember) => void;
  isSelected?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ACTIVITY_ICONS: Record<SimulatedActivityType, React.ReactNode> = {
  PLANNING: <FileSpreadsheet className="w-3 h-3 text-blue-400" />,
  CODING: <Code2 className="w-3 h-3 text-teal-400" />,
  TESTING: <Bug className="w-3 h-3 text-emerald-400" />,
  REVIEWING: <CheckCircle className="w-3 h-3 text-amber-400" />,
  PUBLISHING: <UploadCloud className="w-3 h-3 text-sky-400" />,
  DISCUSSING: <MessageSquare className="w-3 h-3 text-pink-400" />,
  READING: <BookOpen className="w-3 h-3 text-indigo-400" />,
  IDLE: <Coffee className="w-3 h-3 text-stone-400" />,
};

const ROLE_SPRITE_MAP: Record<string, string> = {
  PLANNER: '/assets/virtual-office/b344/characters/modern-citizens/frames/char_citizens_office_m_b/stand_down.png',
  DEVELOPER: '/assets/virtual-office/b344/characters/modern-citizens/frames/char_citizens_office_m_blue/stand_side.png',
  TESTER: '/assets/virtual-office/b344/characters/modern-citizens/frames/char_citizens_casual_f_b/stand_down.png',
  REVIEWER: '/assets/virtual-office/b344/characters/modern-citizens/frames/char_citizens_office_f_c/stand_down.png',
  PUBLISHER: '/assets/virtual-office/b344/characters/modern-citizens/frames/char_citizens_elder_m_a/stand_down.png',
};

const ROLE_COLOR_MAP: Record<string, { ring: string; glow: string; badge: string; badgeDot: string }> = {
  PLANNER: {
    ring: 'ring-blue-400',
    glow: 'rgba(59, 130, 246, 0.45)',
    badge: 'bg-blue-950/90 text-blue-300 border-blue-700',
    badgeDot: 'bg-blue-400',
  },
  DEVELOPER: {
    ring: 'ring-teal-400',
    glow: 'rgba(20, 184, 166, 0.45)',
    badge: 'bg-teal-950/90 text-teal-300 border-teal-700',
    badgeDot: 'bg-teal-400',
  },
  TESTER: {
    ring: 'ring-emerald-400',
    glow: 'rgba(16, 185, 129, 0.45)',
    badge: 'bg-emerald-950/90 text-emerald-300 border-emerald-700',
    badgeDot: 'bg-emerald-400',
  },
  REVIEWER: {
    ring: 'ring-amber-400',
    glow: 'rgba(245, 158, 11, 0.45)',
    badge: 'bg-amber-950/90 text-amber-300 border-amber-700',
    badgeDot: 'bg-amber-400',
  },
  PUBLISHER: {
    ring: 'ring-sky-400',
    glow: 'rgba(14, 165, 233, 0.45)',
    badge: 'bg-sky-950/90 text-sky-300 border-sky-700',
    badgeDot: 'bg-sky-400',
  },
};

export const PixelAgentAvatar: React.FC<PixelAgentAvatarProps> = ({
  agent,
  reducedMotion = false,
  staticFallback = false,
  onSelect,
  isSelected = false,
  className = '',
  size = 'md',
}) => {
  const { role, name, specialization, currentActivity, position } = agent;
  const isAnimated = !reducedMotion && !staticFallback;
  const spriteSrc = ROLE_SPRITE_MAP[role] || ROLE_SPRITE_MAP.DEVELOPER;
  const colors = ROLE_COLOR_MAP[role] || ROLE_COLOR_MAP.DEVELOPER;

  const sizeDimensions = {
    sm: 'w-11 h-15',
    md: 'w-14 h-20',
    lg: 'w-18 h-24',
  }[size];

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${name} (${role}): ${specialization} - ${currentActivity.label}`}
      onClick={() => onSelect?.(agent)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(agent);
        }
      }}
      style={{
        left: `${position.xPercent}%`,
        top: `${position.yPercent}%`,
      }}
      className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-200 z-20 group focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded-2xl ${
        isAnimated ? 'hover:scale-105 active:scale-95' : ''
      } ${className}`}
    >
      <div className="relative flex flex-col items-center">
        {/* Modern Activity Status Pill (Hybrid Modern Web UI) */}
        <div
          className={`mb-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono border bg-stone-900/95 shadow-md flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            isSelected
              ? 'border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/40'
              : 'border-stone-800 text-stone-300 group-hover:border-stone-700'
          } ${isAnimated ? 'animate-pulse' : ''}`}
        >
          {ACTIVITY_ICONS[currentActivity.type] || <Coffee className="w-3 h-3 text-stone-400" />}
          <span>{currentActivity.label}</span>
        </div>

        {/* Human Character Sprite Container */}
        <div className={`relative ${sizeDimensions} flex items-center justify-center select-none`}>
          {/* Ambient Lighting Halo on Select / Hover */}
          <div
            className={`absolute inset-0 rounded-full blur-md transition-opacity -z-10 ${
              isSelected ? 'opacity-85 scale-110' : 'opacity-0 group-hover:opacity-45'
            }`}
            style={{ backgroundColor: colors.glow }}
          />

          {/* Crisp Stylized Human Coworker Sprite */}
          <img
            src={spriteSrc}
            alt={name}
            className={`w-full h-full object-contain filter drop-shadow-md transition-all ${
              isSelected ? 'scale-105 filter drop-shadow-[0_0_10px_rgba(6,182,212,0.65)]' : ''
            } ${isAnimated ? 'hover:-translate-y-0.5' : ''}`}
            style={{
              imageRendering: 'pixelated',
              shapeRendering: 'crispEdges',
            }}
            loading="lazy"
          />
        </div>

        {/* Role Nameplate (Accessible text label, not relying on color only) */}
        <div className="mt-1 flex flex-col items-center">
          <span
            className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold tracking-wider uppercase border shadow-md flex items-center gap-1 ${colors.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${colors.badgeDot}`} />
            <span>{role}</span>
          </span>
          <p className="text-[11px] font-medium text-stone-300 mt-0.5 whitespace-nowrap group-hover:text-cyan-300">
            {name}
          </p>
        </div>
      </div>
    </div>
  );
};
