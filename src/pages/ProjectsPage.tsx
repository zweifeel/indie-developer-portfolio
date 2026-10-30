import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Layers, XCircle } from 'lucide-react';
import { getAllProjects } from '../services/projectService';
import { ProjectCard } from '../components/ProjectCard';
import { id } from '../locales/id';
import type { ProjectCategory, ProjectStatus } from '../types/project';

type CategoryFilter = ProjectCategory | 'ALL';
type StatusFilter = ProjectStatus | 'ALL';

export const ProjectsPage: React.FC = () => {
  const allProjects = useMemo(() => getAllProjects(), []);
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-driven filter states
  const categoryParam = (searchParams.get('category') as CategoryFilter) || 'ALL';
  const statusParam = (searchParams.get('status') as StatusFilter) || 'ALL';
  const queryParam = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(queryParam);

  // Sync state if URL changes externally
  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  const updateFilters = (newCategory?: string, newStatus?: string, newQ?: string) => {
    const params = new URLSearchParams(searchParams);

    if (newCategory !== undefined) {
      if (newCategory === 'ALL') params.delete('category');
      else params.set('category', newCategory);
    }

    if (newStatus !== undefined) {
      if (newStatus === 'ALL') params.delete('status');
      else params.set('status', newStatus);
    }

    if (newQ !== undefined) {
      if (!newQ.trim()) params.delete('q');
      else params.set('q', newQ.trim());
    }

    setSearchParams(params, { replace: true });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters(undefined, undefined, searchQuery);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSearchParams(new URLSearchParams());
  };

  // Filtered projects computation
  const filteredProjects = useMemo(() => {
    return allProjects.filter((project) => {
      // Category filter
      if (categoryParam !== 'ALL' && project.category !== categoryParam) {
        return false;
      }

      // Status filter
      if (statusParam !== 'ALL' && project.status !== statusParam) {
        return false;
      }

      // Search query filter
      if (queryParam) {
        const q = queryParam.toLowerCase();
        const matchesName = project.name.toLowerCase().includes(q);
        const matchesDesc = project.shortDescription.toLowerCase().includes(q);
        const matchesTagline = project.tagline?.toLowerCase().includes(q) ?? false;
        const matchesTags = project.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
        if (!matchesName && !matchesDesc && !matchesTagline && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [allProjects, categoryParam, statusParam, queryParam]);

  const categoryOptions: { key: CategoryFilter; label: string }[] = [
    { key: 'ALL', label: id.filters.categoryAll },
    { key: 'GAME', label: id.filters.categoryGame },
    { key: 'APPLICATION', label: id.filters.categoryApp },
  ];

  const statusOptions: { key: StatusFilter; label: string }[] = [
    { key: 'ALL', label: id.filters.statusAll },
    { key: 'READY_FOR_RELEASE', label: id.filters.statusReadyForRelease },
    { key: 'RELEASED', label: id.filters.statusReleased },
    { key: 'CLOSED_TESTING', label: id.filters.statusClosedTesting },
    { key: 'INTERNAL_TESTING', label: id.filters.statusInternalTesting },
    { key: 'WORK_IN_PROGRESS', label: id.filters.statusWip },
    { key: 'COMING_SOON', label: id.filters.statusComingSoon },
  ];

  const hasActiveFilters = categoryParam !== 'ALL' || statusParam !== 'ALL' || Boolean(queryParam);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-stone-800 bg-stone-900 text-xs font-mono text-cyan-300 mb-3">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Direktori Proyek Google Play & Platform</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          {id.nav.projects}
        </h1>
        <p className="mt-2 text-sm sm:text-base text-stone-300 max-w-2xl leading-relaxed">
          Koleksi enam proyek resmi aplikasi dan game. Saring berdasarkan status kesiapan rilis atau kategori aplikasi.
        </p>
      </div>

      {/* Control Bar: Search + Filter Tabs */}
      <div className="rounded-2xl border border-stone-800 bg-[#0f1118] p-4 sm:p-6 space-y-5">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <label htmlFor="search-projects" className="sr-only">
            Cari Proyek
          </label>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          <input
            id="search-projects"
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              updateFilters(undefined, undefined, e.target.value);
            }}
            placeholder="Cari berdasarkan nama, tagline, atau kata kunci (mis: Worklume, DompetNalar, Kasir, Mining)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-sm text-[#F5F5F4] placeholder-[#8A8580] focus:outline-hidden focus:ring-2 focus:ring-stone-500 transition-colors"
          />
        </form>

        {/* Filter Rows */}
        <div className="space-y-3 pt-1">
          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-[#A8A29E] mr-1 flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-[#8A8580]" />
              Kategori:
            </span>
            {categoryOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => updateFilters(opt.key, undefined, undefined)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  categoryParam === opt.key
                    ? 'bg-stone-100 text-stone-950 font-semibold shadow-xs'
                    : 'bg-stone-900 border border-stone-850 text-[#A8A29E] hover:text-[#F5F5F4] hover:bg-stone-850'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-[#A8A29E] mr-1">Status:</span>
            {statusOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => updateFilters(undefined, opt.key, undefined)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  statusParam === opt.key
                    ? 'bg-stone-100 text-stone-950 font-semibold shadow-xs'
                    : 'bg-stone-900 border border-stone-850 text-[#A8A29E] hover:text-[#F5F5F4] hover:bg-stone-850'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filter Clear Info */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-stone-850 flex items-center justify-between text-xs text-[#A8A29E]">
            <span>
              Menampilkan <strong className="text-[#F5F5F4]">{filteredProjects.length}</strong> dari{' '}
              {allProjects.length} proyek
            </span>
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 text-[#E7E5E4] hover:text-[#F5F5F4] font-medium underline decoration-stone-750 underline-offset-4"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reset Semua Filter</span>
            </button>
          </div>
        )}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-stone-800 bg-[#0f1118] py-16 px-6 text-center">
          <Layers className="w-10 h-10 mx-auto text-stone-600 mb-3" />
          <h2 className="text-lg font-bold text-[#F5F5F4] mb-1">Tidak Ada Proyek yang Cocok</h2>
          <p className="text-sm text-[#A8A29E] max-w-md mx-auto mb-6">
            Tidak ditemukan proyek dengan kombinasi kriteria pencarian atau filter yang dipilih.
          </p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-white text-stone-950 text-xs font-semibold transition-colors"
          >
            Hapus Semua Filter
          </button>
        </div>
      )}
    </div>
  );
};
