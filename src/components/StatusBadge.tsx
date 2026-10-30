import React from 'react';
import type { ProjectStatus } from '../types/project';
import { id } from '../locales/id';

interface StatusBadgeProps {
  status: ProjectStatus;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showDot = true, size = 'md' }) => {
  const getStatusDotColor = (status: ProjectStatus) => {
    switch (status) {
      case 'READY_FOR_RELEASE':
        return 'bg-emerald-400';
      case 'CLOSED_TESTING':
        return 'bg-cyan-400 animate-pulse';
      case 'RELEASED':
        return 'bg-stone-300';
      case 'INTERNAL_TESTING':
        return 'bg-amber-400';
      case 'WORK_IN_PROGRESS':
        return 'bg-stone-400';
      case 'COMING_SOON':
      default:
        return 'bg-stone-600';
    }
  };

  const dotClass = getStatusDotColor(status);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-stone-800 bg-stone-900/90 text-[#E7E5E4] ${sizeClasses} backdrop-blur-xs tracking-wide`}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} aria-hidden="true" />}
      <span>{id.statusLabels[status] || status}</span>
    </span>
  );
};
