import rawProjects from '../data/projects.json';
import type { Project, ProjectCategory, ProjectStatus, ProjectStatistics } from '../types/project';

const VALID_CATEGORIES: ReadonlySet<ProjectCategory> = new Set(['GAME', 'APPLICATION']);
const VALID_STATUSES: ReadonlySet<ProjectStatus> = new Set([
  'READY_FOR_RELEASE',
  'RELEASED',
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

// Parse and validate once at runtime
export const projects: readonly Project[] = (rawProjects as unknown[]).filter(isValidProject);

export function getAllProjects(): readonly Project[] {
  return projects;
}

export function getProjectBySlug(slug: string): Project | undefined {
  if (!slug) return undefined;
  return projects.find((p) => p.slug.toLowerCase() === slug.toLowerCase());
}

export function getFeaturedProjects(): readonly Project[] {
  return projects.filter((p) => p.featured);
}

export function getClosedTestingProjects(): readonly Project[] {
  return projects.filter((p) => p.status === 'CLOSED_TESTING');
}

export function getReadyForReleaseProjects(): readonly Project[] {
  return projects.filter((p) => p.status === 'READY_FOR_RELEASE');
}

export function getWorkInProgressProjects(): readonly Project[] {
  return projects.filter((p) => p.status === 'WORK_IN_PROGRESS');
}

export function calculateProjectStatistics(): ProjectStatistics {
  const totalProjects = projects.length;
  let readyForReleaseProjects = 0;
  let releasedProjects = 0;
  let closedTestingProjects = 0;
  let workInProgressProjects = 0;
  let totalGames = 0;
  let totalApplications = 0;
  let activeRecruitmentCount = 0;

  for (const project of projects) {
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
