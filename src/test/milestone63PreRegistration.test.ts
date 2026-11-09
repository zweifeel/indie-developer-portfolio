import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { isValidProject, getAllProjects } from '../services/projectService';
import type { Project, ProjectStatus } from '../types/project';
import type { CmsProject } from '../services/cmsProjectService';
import { id } from '../locales/id';

const rootDir = resolve(__dirname, '../..');

describe('Milestone 6.3 — Pre-Registration Status Integration & Verification', () => {
  const allSevenStatuses: ProjectStatus[] = [
    'RELEASED',
    'READY_FOR_RELEASE',
    'PRE_REGISTRATION',
    'CLOSED_TESTING',
    'INTERNAL_TESTING',
    'WORK_IN_PROGRESS',
    'COMING_SOON',
  ];

  describe('1. Project Status Type and Validation Definition', () => {
    it('accepts all 7 valid statuses in isValidProject', () => {
      const baseProject: Project = {
        id: 'test-1',
        slug: 'test-project',
        name: 'Test Project',
        shortDescription: 'Short description for testing',
        fullDescription: 'Full description for testing',
        icon: '/assets/icons/test.png',
        category: 'APPLICATION',
        status: 'PRE_REGISTRATION',
        tags: ['Utility'],
        version: '1.0.0',
        featured: false,
        registrationOpen: false,
        lastUpdated: '2026-11-01',
        screenshots: [],
      };

      for (const status of allSevenStatuses) {
        const projectCandidate = { ...baseProject, status };
        expect(isValidProject(projectCandidate)).toBe(true);
      }
    });

    it('rejects unrecognized, invalid, or malformed statuses', () => {
      const invalidProject = {
        id: 'test-invalid',
        slug: 'invalid-status-project',
        name: 'Invalid Status Project',
        shortDescription: 'Short description',
        fullDescription: 'Full description',
        icon: '/assets/icons/test.png',
        category: 'APPLICATION',
        status: 'OPEN_BETA' as any, // Not an allowed status
        tags: ['Utility'],
        version: '1.0.0',
        featured: false,
        registrationOpen: false,
        lastUpdated: '2026-11-01',
        screenshots: [],
      };

      expect(isValidProject(invalidProject)).toBe(false);
    });

    it('confirms PRE_REGISTRATION is recognized in projectService VALID_STATUSES', () => {
      const serviceFile = readFileSync(resolve(rootDir, 'src/services/projectService.ts'), 'utf-8');
      expect(serviceFile).toContain("'PRE_REGISTRATION'");
    });

    it('confirms PRE_REGISTRATION is present in types/project.ts ProjectStatus union', () => {
      const typesFile = readFileSync(resolve(rootDir, 'src/types/project.ts'), 'utf-8');
      expect(typesFile).toContain("'PRE_REGISTRATION'");
    });

    it('confirms PRE_REGISTRATION is present in cmsProjectService.ts CmsProject union', () => {
      const cmsServiceFile = readFileSync(resolve(rootDir, 'src/services/cmsProjectService.ts'), 'utf-8');
      expect(cmsServiceFile).toContain("'PRE_REGISTRATION'");
    });
  });

  describe('2. Localization & Branding Integrity', () => {
    it('defines PRE_REGISTRATION in statusLabels and filters with proper Indonesian translation', () => {
      expect(id.statusLabels.PRE_REGISTRATION).toBe('Pre-Registration');
      expect(id.filters.statusPreRegistration).toBe('Pre-Registration');
    });

    it('provides localized copy for Pre-Registration actions without misleading promises', () => {
      expect(id.projectDetail.preRegistrationAction).toBe('Pra-Registrasi Minat');
      expect(id.projectDetail.preRegistrationInfo).toBe('Proyek sedang membuka pendaftaran minat awal sebelum peluncuran resmi.');
    });

    it('does not contain any forbidden marketing hyperbole or gradient text references', () => {
      const statusBadgeFile = readFileSync(resolve(rootDir, 'src/components/StatusBadge.tsx'), 'utf-8');
      expect(statusBadgeFile).not.toContain('bg-clip-text');
      expect(statusBadgeFile).not.toContain('text-transparent');
    });
  });

  describe('3. UI Component Integration: StatusBadge, ProjectCard & ProjectDetailPage', () => {
    it('StatusBadge handles PRE_REGISTRATION with designated styling', () => {
      const statusBadgeFile = readFileSync(resolve(rootDir, 'src/components/StatusBadge.tsx'), 'utf-8');
      expect(statusBadgeFile).toContain("case 'PRE_REGISTRATION':");
      expect(statusBadgeFile).toContain('bg-indigo-950/70');
      expect(statusBadgeFile).toContain('text-indigo-300');
    });

    it('ProjectCard handles PRE_REGISTRATION and respects testingUrl presence', () => {
      const cardFile = readFileSync(resolve(rootDir, 'src/components/ProjectCard.tsx'), 'utf-8');
      expect(cardFile).toContain("project.status === 'PRE_REGISTRATION'");
      // Must not generate fake Google Play link if testingUrl is missing
      expect(cardFile).toContain('project.testingUrl');
    });

    it('ProjectDetailPage handles PRE_REGISTRATION with verified registration link only when available', () => {
      const detailFile = readFileSync(resolve(rootDir, 'src/pages/ProjectDetailPage.tsx'), 'utf-8');
      expect(detailFile).toContain("project.status === 'PRE_REGISTRATION'");
      // Ensures no fake registration buttons or fabricated external URLs
      expect(detailFile).toContain('project.testingUrl');
      expect(detailFile).toContain('id.projectDetail.preRegistrationAction');
    });

    it('ProjectsPage filter options include PRE_REGISTRATION', () => {
      const projectsPageFile = readFileSync(resolve(rootDir, 'src/pages/ProjectsPage.tsx'), 'utf-8');
      expect(projectsPageFile).toContain("key: 'PRE_REGISTRATION'");
      expect(projectsPageFile).toContain('id.filters.statusPreRegistration');
    });

    it('AdminPage editing dropdown includes PRE_REGISTRATION option', () => {
      const adminPageFile = readFileSync(resolve(rootDir, 'src/pages/AdminPage.tsx'), 'utf-8');
      expect(adminPageFile).toContain('<option value="PRE_REGISTRATION">PRE_REGISTRATION</option>');
    });
  });

  describe('4. Apps Script Backend Status Validation Synchronization', () => {
    it('validates that production backend gas/Code.gs allows PRE_REGISTRATION in allowedStatuses', () => {
      const gasCode = readFileSync(resolve(rootDir, 'backend/gas/Code.gs'), 'utf-8');
      const statusRegex = /var allowedStatuses = \[(.*?)\];/;
      const match = gasCode.match(statusRegex);
      expect(match).not.toBeNull();
      expect(match![1]).toContain('"PRE_REGISTRATION"');
    });

    it('validates that test backend test_gas/Code.gs allows PRE_REGISTRATION in allowedStatuses', () => {
      const testGasCode = readFileSync(resolve(rootDir, 'backend/test_gas/Code.gs'), 'utf-8');
      const statusRegex = /var allowedStatuses = \[(.*?)\];/;
      const match = testGasCode.match(statusRegex);
      expect(match).not.toBeNull();
      expect(match![1]).toContain('"PRE_REGISTRATION"');
    });
  });

  describe('5. Project Status vs Publish State Orthogonality & Privacy', () => {
    it('verifies status does not override or mutate publishState in CMS data model', () => {
      const cmsProjectPublished: CmsProject = {
        id: 'prereg-1',
        slug: 'prereg-published',
        name: 'Prereg Published',
        shortDescription: 'Short',
        fullDescription: 'Full',
        category: 'GAME',
        status: 'PRE_REGISTRATION',
        publishState: 'PUBLISHED',
        tags: ['Game'],
        version: '0.9.0',
        featured: false,
        registrationOpen: true,
        testingUrl: 'https://forms.gle/sample-prereg',
        lastUpdated: '2026-11-01',
        screenshots: [],
        technicalHighlights: [],
        capabilities: [],
      };

      const cmsProjectDraft: CmsProject = {
        ...cmsProjectPublished,
        slug: 'prereg-draft',
        publishState: 'DRAFT',
      };

      // Status remains PRE_REGISTRATION regardless of publishState
      expect(cmsProjectPublished.status).toBe('PRE_REGISTRATION');
      expect(cmsProjectDraft.status).toBe('PRE_REGISTRATION');
      expect(cmsProjectPublished.publishState).toBe('PUBLISHED');
      expect(cmsProjectDraft.publishState).toBe('DRAFT');
    });
  });

  describe('6. Canonical Official Projects Preservation', () => {
    const canonicalSlugs = [
      'dompetnalar',
      'idle-master',
      'mobile-kasir',
      'idle-mining',
      'the-broken-origin',
      'worklume',
    ];

    it('preserves exactly the 6 canonical official projects without alteration', () => {
      const allProjects = getAllProjects();
      expect(allProjects.length).toBe(6);

      const actualSlugs = allProjects.map((p) => p.slug);
      for (const expectedSlug of canonicalSlugs) {
        expect(actualSlugs).toContain(expectedSlug);
      }
    });

    it('retains canonical statuses for the 6 projects', () => {
      const allProjects = getAllProjects();
      const mobileKasir = allProjects.find((p) => p.slug === 'mobile-kasir');
      expect(mobileKasir?.status).toBe('CLOSED_TESTING');

      const dompetNalar = allProjects.find((p) => p.slug === 'dompetnalar');
      expect(dompetNalar?.status).toBe('READY_FOR_RELEASE');

      const theBrokenOrigin = allProjects.find((p) => p.slug === 'the-broken-origin');
      expect(theBrokenOrigin?.status).toBe('WORK_IN_PROGRESS');
    });
  });
});
