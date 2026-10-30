import React from 'react';
import type { ProjectStatus } from '../types/project';
import { id } from '../locales/id';

interface StatusBadgeProps {
  status: ProjectStatus;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showDot = true, size = 'md' }) => {
  const getStatusStyles = (status: ProjectStatus) => {
    switch (status) {
      case 'READY_FOR_RELEASE':
        return {
          bg: 'bg-emerald-950/80',
          text: 'text-emerald-300',
          border: 'border-emerald-700/70',
          dot: 'bg-emerald-400',
        };
      case 'RELEASED':
        return {
          bg: 'bg-sky-950/70',
          text: 'text-sky-300',
          border: 'border-sky-700/70',
          dot: 'bg-sky-400',
        };
      case 'CLOSED_TESTING':
        return {
          bg: 'bg-cyan-950/80',
          text: 'text-cyan-200',
          border: 'border-cyan-700/70',
          dot: 'bg-cyan-400 animate-pulse',
        };
      case 'INTERNAL_TESTING':
        return {
          bg: 'bg-amber-950/70',
          text: 'text-amber-300',
          border: 'border-amber-700/70',
          dot: 'bg-amber-400',
        };
      case 'WORK_IN_PROGRESS':
        return {
          bg: 'bg-stone-900/80',
          text: 'text-stone-300',
          border: 'border-stone-700/80',
          dot: 'bg-stone-400',
        };
      case 'COMING_SOON':
      default:
        return {
          bg: 'bg-neutral-900/80',
          text: 'text-stone-400',
          border: 'border-neutral-800',
          dot: 'bg-neutral-500',
        };
    }
  };

  const style = getStatusStyles(status);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeClasses} backdrop-blur-xs tracking-wide`}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />}
      {id.statusLabels[status] || status}
    </span>
  );
};
