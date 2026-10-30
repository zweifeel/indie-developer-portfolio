import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { Project } from '../types/project';
import { StatusBadge } from './StatusBadge';
import { CategoryBadge } from './CategoryBadge';
import { ProjectIcon } from './ProjectMedia';

interface ProjectCardProps {
  project: Project;
  featuredHighlight?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  featuredHighlight = false,
}) => {
  const isReady = project.status === 'READY_FOR_RELEASE';
  const isClosedTesting = project.status === 'CLOSED_TESTING';

  return (
    <article
      className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-200 ${
        featuredHighlight
          ? 'bg-[#11131c] border-stone-750 hover:border-stone-600 shadow-sm'
          : 'bg-[#0f1118] border-stone-800 hover:border-stone-700 hover:bg-[#12141f]'
      } p-6 sm:p-7 hover:-translate-y-0.5`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3.5">
            <ProjectIcon
              src={project.icon}
              alt={`Ikon ${project.name}`}
              name={project.name}
              category={project.category}
              className="w-12 h-12"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-[#F5F5F4]">
                  {project.name}
                </h3>
                {project.featured && (
                  <span
                    className="inline-flex items-center gap-1 rounded bg-stone-850 px-1.5 py-0.5 text-[10px] font-medium text-[#A8A29E] border border-stone-750"
                    title="Proyek Unggulan"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-[#A8A29E]" />
                    Featured
                  </span>
                )}
              </div>
              {project.tagline && (
                <p className="text-xs font-mono text-[#8A8580] mt-0.5">{project.tagline}</p>
              )}
              {project.version && (
                <span className="text-xs font-mono text-[#8A8580]">v{project.version}</span>
              )}
            </div>
          </div>
          <StatusBadge status={project.status} size="sm" />
        </div>

        {/* Categories & Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <CategoryBadge category={project.category} />
          {isClosedTesting && project.registrationOpen && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#D6D3D1] bg-stone-900 border border-stone-800 rounded px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Butuh Penguji ({project.testerRequirementDays || 14} Hari)</span>
            </span>
          )}
          {isReady && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#D6D3D1] bg-stone-900 border border-stone-800 rounded px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Siap Rilis Google Play</span>
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-[#D6D3D1] line-clamp-3 leading-relaxed mb-4">
          {project.shortDescription}
        </p>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-900 border border-stone-850 text-[#8A8580]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Action */}
      <div className="pt-4 border-t border-stone-850 flex items-center justify-between">
        <span className="text-xs text-[#8A8580]">
          {project.lastUpdated
            ? `Update: ${new Date(project.lastUpdated).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}`
            : 'Fase Aktif'}
        </span>
        <Link
          to={`/projects/${project.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E7E5E4] hover:text-[#F5F5F4] transition-colors group-hover:translate-x-0.5"
          aria-label={`Lihat rincian lengkap proyek ${project.name}`}
        >
          <span className="underline decoration-stone-700 underline-offset-4 group-hover:decoration-stone-400">Detail Proyek</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 text-[#A8A29E]" />
        </Link>
      </div>
    </article>
  );
};
