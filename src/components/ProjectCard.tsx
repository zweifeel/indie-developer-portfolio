import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';
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
      className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-300 ${
        featuredHighlight
          ? 'bg-linear-to-b from-[#141826] to-[#0f121d] border-stone-700/80 hover:border-cyan-500/50 shadow-md'
          : 'bg-[#10131f] border-stone-800 hover:border-stone-700 hover:bg-[#141824]'
      } p-6 sm:p-7 hover:-translate-y-1`}
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
              className="w-13 h-13"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-[#FAFAF9] group-hover:text-cyan-200 transition-colors">
                  {project.name}
                </h3>
                {project.featured && (
                  <span
                    className="inline-flex items-center gap-1 rounded bg-stone-800/80 px-1.5 py-0.5 text-[10px] font-semibold text-stone-300 border border-stone-700/80"
                    title="Proyek Unggulan"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                    Featured
                  </span>
                )}
              </div>
              {project.version && (
                <span className="text-xs font-mono text-[#78716C]">v{project.version}</span>
              )}
            </div>
          </div>
          <StatusBadge status={project.status} size="sm" />
        </div>

        {/* Categories & Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <CategoryBadge category={project.category} />
          {isClosedTesting && project.registrationOpen && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 rounded px-2 py-0.5">
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
              Butuh Penguji ({project.testerRequirementDays || 14} Hari)
            </span>
          )}
          {isReady && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 rounded px-2 py-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Siap Rilis Google Play
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-[#E7E5E4] line-clamp-3 leading-relaxed mb-4">
          {project.shortDescription}
        </p>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-[#A8A29E]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Action */}
      <div className="pt-4 border-t border-stone-800/80 flex items-center justify-between">
        <span className="text-xs text-[#78716C]">
          {project.lastUpdated
            ? `Update: ${new Date(project.lastUpdated).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}`
            : 'Fase Aktif'}
        </span>
        <Link
          to={`/projects/${project.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#67E8F9] hover:text-[#A5F3FC] transition-colors group-hover:translate-x-0.5"
          aria-label={`Lihat rincian lengkap proyek ${project.name}`}
        >
          <span>Detail Proyek</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
};
