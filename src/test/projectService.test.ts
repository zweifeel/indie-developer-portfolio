import { describe, it, expect } from 'vitest';
import {
  getAllProjects,
  getProjectBySlug,
  getFeaturedProjects,
  getClosedTestingProjects,
  getReadyForReleaseProjects,
  getWorkInProgressProjects,
  calculateProjectStatistics,
  isValidProject,
} from '../services/projectService';

describe('Project Service & Official Projects Verification', () => {
  it('loads exactly the 6 official projects', () => {
    const all = getAllProjects();
    expect(all.length).toBe(6);

    const ids = all.map((p) => p.id);
    expect(ids).toEqual([
      'dompetnalar',
      'idle-master',
      'mobile-kasir',
      'idle-mining',
      'the-broken-origin',
      'worklume',
    ]);
  });

  it('guarantees no dummy projects exist', () => {
    const all = getAllProjects();
    const ids = all.map((p) => p.id);
    expect(ids).not.toContain('focus-quest');
    expect(ids).not.toContain('sound-craft-studio');
  });

  it('validates DompetNalar has status READY_FOR_RELEASE and empty PlayStoreUrl', () => {
    const dompetNalar = getProjectBySlug('dompetnalar');
    expect(dompetNalar).toBeDefined();
    expect(dompetNalar?.name).toBe('DompetNalar');
    expect(dompetNalar?.category).toBe('APPLICATION');
    expect(dompetNalar?.status).toBe('READY_FOR_RELEASE');
    expect(dompetNalar?.playStoreUrl).toBe('');
    expect(dompetNalar?.registrationOpen).toBe(false);
  });

  it('validates Mobile Kasir has status CLOSED_TESTING and registrationOpen true', () => {
    const mobileKasir = getProjectBySlug('mobile-kasir');
    expect(mobileKasir).toBeDefined();
    expect(mobileKasir?.name).toBe('Mobile Kasir');
    expect(mobileKasir?.category).toBe('APPLICATION');
    expect(mobileKasir?.status).toBe('CLOSED_TESTING');
    expect(mobileKasir?.registrationOpen).toBe(true);
    expect(mobileKasir?.testerRequirementDays).toBe(14);
  });

  it('validates IDLE MASTER, Idle Mining, and The Broken Origin are WORK_IN_PROGRESS games', () => {
    const idleMaster = getProjectBySlug('idle-master');
    const idleMining = getProjectBySlug('idle-mining');
    const theBrokenOrigin = getProjectBySlug('the-broken-origin');

    expect(idleMaster?.status).toBe('WORK_IN_PROGRESS');
    expect(idleMining?.status).toBe('WORK_IN_PROGRESS');
    expect(theBrokenOrigin?.status).toBe('WORK_IN_PROGRESS');

    expect(idleMaster?.category).toBe('GAME');
    expect(idleMining?.category).toBe('GAME');
    expect(theBrokenOrigin?.category).toBe('GAME');
  });

  it('validates Worklume has correct metadata, capabilities, and tagline', () => {
    const worklume = getProjectBySlug('worklume');
    expect(worklume).toBeDefined();
    expect(worklume?.name).toBe('Worklume');
    expect(worklume?.category).toBe('APPLICATION');
    expect(worklume?.status).toBe('WORK_IN_PROGRESS');
    expect(worklume?.featured).toBe(true);
    expect(worklume?.tagline).toBe('Work Smarter. Stay Organized.');
    expect(worklume?.capabilities?.length).toBe(8);
    expect(worklume?.vision).toBeDefined();
  });

  it('calculates project statistics dynamically matching official numbers for 6 projects', () => {
    const stats = calculateProjectStatistics();
    expect(stats.totalProjects).toBe(6);
    expect(stats.readyForReleaseProjects).toBe(1);
    expect(stats.releasedProjects).toBe(0);
    expect(stats.closedTestingProjects).toBe(1);
    expect(stats.workInProgressProjects).toBe(4);
    expect(stats.totalGames).toBe(3);
    expect(stats.totalApplications).toBe(3);
    expect(stats.activeRecruitmentCount).toBe(1);
  });

  it('filters ready for release, closed testing, and featured correctly', () => {
    const featured = getFeaturedProjects();
    expect(featured.length).toBe(3);
    expect(featured.map((p) => p.id)).toContain('dompetnalar');
    expect(featured.map((p) => p.id)).toContain('mobile-kasir');
    expect(featured.map((p) => p.id)).toContain('worklume');

    const ready = getReadyForReleaseProjects();
    expect(ready.length).toBe(1);
    expect(ready[0].id).toBe('dompetnalar');

    const closed = getClosedTestingProjects();
    expect(closed.length).toBe(1);
    expect(closed[0].id).toBe('mobile-kasir');

    const inDev = getWorkInProgressProjects();
    expect(inDev.length).toBe(4);
  });

  it('validates schema and rejects malformed project objects', () => {
    expect(isValidProject(null)).toBe(false);
    expect(isValidProject({})).toBe(false);
    expect(
      isValidProject({
        id: 'test',
        slug: 'test',
        name: 'Test',
        category: 'INVALID_CATEGORY',
        status: 'READY_FOR_RELEASE',
      })
    ).toBe(false);
  });
});
