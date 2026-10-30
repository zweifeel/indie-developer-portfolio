import React from 'react';
import { Gamepad2, AppWindow } from 'lucide-react';
import type { ProjectCategory } from '../types/project';
import { id } from '../locales/id';

interface CategoryBadgeProps {
  category: ProjectCategory;
  showIcon?: boolean;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, showIcon = true }) => {
  const isGame = category === 'GAME';

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium border border-stone-800 bg-stone-900/90 text-stone-300">
      {showIcon &&
        (isGame ? (
          <Gamepad2 className="h-3.5 w-3.5 text-stone-400" aria-hidden="true" />
        ) : (
          <AppWindow className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
        ))}
      <span>{id.categoryLabels[category] || category}</span>
    </span>
  );
};
