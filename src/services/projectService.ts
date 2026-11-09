import { useState, useEffect, useCallback } from 'react';
import rawProjects from '../data/projects.json';
import type { Project, ProjectCategory, ProjectStatus, ProjectStatistics } from '../types/project';

const VALID_CATEGORIES: ReadonlySet<ProjectCategory> = new Set(['GAME', 'APPLICATION']);
const VALID_STATUSES: ReadonlySet<ProjectStatus> = new Set([
  'READY_FOR_RELEASE',
  'RELEASED',
  'PRE_REGISTRATION',
  'CLOSED_TESTING',
  'INTERNAL_TESTING',
  'WORK_IN_PROGRESS',
  'COMING_SOON',
]);

export function isValidProject(data: unknown): data is Project {
  if (typeof data !== 'object' || data === null) return false;
  const p = data as Record<string, unknown>;

  return (
    typeof p.id === 'string' &&
    p.id.trim().length > 0 &&
    typeof p.slug === 'string' &&
    p.slug.trim().length > 0 &&
    typeof p.name === 'string' &&
    p.name.trim().length > 0 &&
    typeof p.category === 'string' &&
    VALID_CATEGORIES.has(p.category as ProjectCategory) &&
    typeof p.status === 'string' &&
    VALID_STATUSES.has(p.status as ProjectStatus) &&
    typeof p.shortDescription === 'string' &&
    typeof p.fullDescription === 'string' &&
    typeof p.icon === 'string' &&
    Array.isArray(p.screenshots) &&
    typeof p.version === 'string' &&
    typeof p.lastUpdated === 'string' &&
    typeof p.registrationOpen === 'boolean' &&
    typeof p.featured === 'boolean'
  );
}

// Initial baseline projects from static projects.json
const initialStaticProjects: readonly Project[] = (rawProjects as unknown[]).filter(isValidProject);

// Mutable in-memory active project list for dynamic CMS synchronization
let activeProjects: readonly Project[] = initialStaticProjects;

// Event listeners for subscribers to dynamic project changes
type ProjectsChangeListener = (projects: readonly Project[]) => void;
const changeListeners: Set<ProjectsChangeListener> = new Set();

function notifyListeners() {
  for (const listener of changeListeners) {
    try {
      listener(activeProjects);
    } catch (e) {
      console.error('[projectService] Error in change listener:', e);
    }
  }
}

/**
 * Synchronous accessor for currently active in-memory projects
 */
export const projects: readonly Project[] = activeProjects;

export function getAllProjects(): readonly Project[] {
  return activeProjects;
}

export function getProjectBySlug(slug: string): Project | undefined {
  if (!slug) return undefined;
  return activeProjects.find((p) => p.slug.toLowerCase() === slug.toLowerCase());
}

export function getFeaturedProjects(): readonly Project[] {
  return activeProjects.filter((p) => p.featured);
}

export function getClosedTestingProjects(): readonly Project[] {
  return activeProjects.filter((p) => p.status === 'CLOSED_TESTING');
}

export function getReadyForReleaseProjects(): readonly Project[] {
  return activeProjects.filter((p) => p.status === 'READY_FOR_RELEASE');
}

export function getWorkInProgressProjects(): readonly Project[] {
  return activeProjects.filter((p) => p.status === 'WORK_IN_PROGRESS');
}

export function calculateProjectStatistics(customProjects?: readonly Project[]): ProjectStatistics {
  const targetList = customProjects || activeProjects;
  const totalProjects = targetList.length;
  let readyForReleaseProjects = 0;
  let releasedProjects = 0;
  let closedTestingProjects = 0;
  let workInProgressProjects = 0;
  let totalGames = 0;
  let totalApplications = 0;
  let activeRecruitmentCount = 0;

  for (const project of targetList) {
    if (project.status === 'READY_FOR_RELEASE') readyForReleaseProjects++;
    if (project.status === 'RELEASED') releasedProjects++;
    if (project.status === 'CLOSED_TESTING') {
      closedTestingProjects++;
      if (project.registrationOpen) {
        activeRecruitmentCount++;
      }
    }
    if (project.status === 'WORK_IN_PROGRESS') workInProgressProjects++;
    if (project.category === 'GAME') totalGames++;
    if (project.category === 'APPLICATION') totalApplications++;
  }

  return {
    totalProjects,
    readyForReleaseProjects,
    releasedProjects,
    closedTestingProjects,
    workInProgressProjects,
    totalGames,
    totalApplications,
    activeRecruitmentCount,
  };
}

/**
 * Override in-memory projects (useful for testing or manual sync)
 */
export function setProjectsCache(newProjects: readonly Project[]): void {
  activeProjects = newProjects.filter(isValidProject);
  notifyListeners();
}

/**
 * Reset in-memory projects back to the initial static dataset
 */
export function resetProjectsCache(): void {
  activeProjects = initialStaticProjects;
  notifyListeners();
}

/**
 * Fetches dynamic published projects from the Cloudflare Pages Function /api/projects
 * Enforces Fail-Closed: Never falls back to static projects.json when backend is down.
 */
export async function fetchPublishedProjects(): Promise<{
  projects: readonly Project[];
  isUnavailable: boolean;
  error?: string;
}> {
  try {
    const res = await fetch('/api/projects', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const validated = (json.data as unknown[]).filter(isValidProject);
        activeProjects = validated;
        notifyListeners();
        return {
          projects: activeProjects,
          isUnavailable: false,
        };
      }
    }

    // Upstream returned non-200 or invalid format -> Fail-closed!
    // NEVER fall back to static projects.json
    activeProjects = [];
    notifyListeners();
    let errorMsg = 'Layanan katalog proyek sementara tidak tersedia.';
    try {
      const errJson = await res.json();
      if (errJson.message) errorMsg = errJson.message;
    } catch {
      // ignore parse error
    }
    return {
      projects: [],
      isUnavailable: true,
      error: errorMsg,
    };
  } catch (err: any) {
    // Network error or fetch aborted -> Fail-closed!
    activeProjects = [];
    notifyListeners();
    return {
      projects: [],
      isUnavailable: true,
      error: err.message || 'Kesalahan jaringan saat memuat proyek.',
    };
  }
}

/**
 * React hook for consuming dynamic projects with automatic synchronization
 */
export function useProjects() {
  const [projectList, setProjectList] = useState<readonly Project[]>(activeProjects);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnavailable, setIsUnavailable] = useState(false);

  useEffect(() => {
    const listener: ProjectsChangeListener = (updated) => {
      setProjectList(updated);
    };
    changeListeners.add(listener);
    return () => {
      changeListeners.delete(listener);
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await fetchPublishedProjects();
    setProjectList(result.projects);
    setIsUnavailable(result.isUnavailable);
    setError(result.error || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    projects: projectList,
    loading,
    error,
    isUnavailable,
    refresh,
  };
}
