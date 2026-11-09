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

interface AgentAvatarProps {
  agent: AgentCrewMember;
  reducedMotion?: boolean;
  staticFallback?: boolean;
  onSelect?: (agent: AgentCrewMember) => void;
  isSelected?: boolean;
}

const ACTIVITY_ICONS: Record<SimulatedActivityType, React.ReactNode> = {
  PLANNING: <FileSpreadsheet className="w-3 h-3 text-cyan-400" />,
  CODING: <Code2 className="w-3 h-3 text-emerald-400" />,
  TESTING: <Bug className="w-3 h-3 text-amber-400" />,
  REVIEWING: <CheckCircle className="w-3 h-3 text-violet-400" />,
  PUBLISHING: <UploadCloud className="w-3 h-3 text-sky-400" />,
  DISCUSSING: <MessageSquare className="w-3 h-3 text-pink-400" />,
  READING: <BookOpen className="w-3 h-3 text-blue-400" />,
  IDLE: <Coffee className="w-3 h-3 text-stone-400" />,
};

const PIXEL_SPRITES: Record<string, string> = {
  PLANNER: '/assets/virtual-office/characters/human-planner.svg',
  DEVELOPER: '/assets/virtual-office/characters/human-developer.svg',
  TESTER: '/assets/virtual-office/characters/human-tester.svg',
  REVIEWER: '/assets/virtual-office/characters/human-reviewer.svg',
  PUBLISHER: '/assets/virtual-office/characters/human-publisher.svg',
};

export const AgentAvatar: React.FC<AgentAvatarProps> = ({
  agent,
  reducedMotion = false,
  staticFallback = false,
  onSelect,
  isSelected = false,
}) => {
  const { role, name, specialization, currentActivity, avatar, position } = agent;
  const isAnimated = !reducedMotion && !staticFallback;
  const pixelSprite = PIXEL_SPRITES[role] || PIXEL_SPRITES.DEVELOPER;

  return (
    <div
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
      className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-20 group ${
        isSelected ? 'scale-110 z-30' : 'hover:scale-105'
      }`}
      role="button"
      tabIndex={0}
      aria-label={`${name} (${role}): ${specialization} - ${currentActivity.label}`}
    >
      {/* 2D/2.5D Isometric Koala Agent Graphic (Cozy Pixel Art Sprite) */}
      <div className="relative flex flex-col items-center">
        {/* Activity Status Bubble (Floating Pill) */}
        {!staticFallback && (
          <div
            className={`mb-1 px-2 py-0.5 rounded-full text-[10px] font-mono border border-stone-800 bg-stone-900/90 shadow-md flex items-center gap-1.5 whitespace-nowrap ${
              isAnimated ? 'animate-pulse' : ''
            }`}
          >
            {ACTIVITY_ICONS[currentActivity.type] || ACTIVITY_ICONS.IDLE}
            <span className="text-stone-300">{currentActivity.label}</span>
          </div>
        )}

        {/* Character Illustration Container */}
        <div className="relative w-12 h-14 flex items-center justify-center">
          {/* Ambient Glow */}
          <div
            className="absolute inset-0 rounded-full blur-md opacity-40 -z-10"
            style={{ backgroundColor: avatar.primaryColor || '#38bdf8' }}
          />

          {/* Crisp Pixel Art Koala Sprite */}
          <img
            src={pixelSprite}
            alt={name}
            className="w-12 h-14 drop-shadow-lg select-none"
            style={{
              imageRendering: 'pixelated',
              shapeRendering: 'crispEdges',
            }}
            loading="lazy"
          />
        </div>

        {/* Name Label */}
        <div className="mt-1 text-center">
          <p className="text-xs font-semibold text-stone-200 leading-tight whitespace-nowrap">
            {name}
          </p>
          <p className="text-[10px] text-cyan-400 font-medium leading-tight whitespace-nowrap">
            {specialization}
          </p>
        </div>
      </div>
    </div>
  );
};
