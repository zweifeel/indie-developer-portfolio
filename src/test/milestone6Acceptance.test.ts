import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { renderHook } from '@testing-library/react';
import { usePageMeta } from '../hooks/usePageMeta';
import { getAllProjects } from '../services/projectService';

describe('Milestone 6 Acceptance Suite — Product Enhancement & Studio Operations', () => {
  const rootDir = resolve(__dirname, '../../');

  describe('5.6 SEO & Discoverability Verification', () => {
    it('1. index.html contains canonical URL, Open Graph, Twitter cards, and Schema.org JSON-LD', () => {
      const htmlPath = resolve(rootDir, 'index.html');
      expect(existsSync(htmlPath)).toBe(true);
      const html = readFileSync(htmlPath, 'utf-8');

      // Canonical URL
      expect(html).toContain('<link rel="canonical" href="https://sleepykoala.pages.dev/" />');

      // Open Graph
      expect(html).toContain('property="og:url" content="https://sleepykoala.pages.dev/"');
      expect(html).toContain('property="og:site_name" content="SleepyKoala Studio"');
      expect(html).toContain('property="og:image" content="https://sleepykoala.pages.dev/assets/branding/sleepykoala-logo.png"');

      // Twitter / X card
      expect(html).toContain('name="twitter:card" content="summary_large_image"');
      expect(html).toContain('name="twitter:title"');
      expect(html).toContain('name="twitter:image" content="https://sleepykoala.pages.dev/assets/branding/sleepykoala-logo.png"');

      // Schema.org JSON-LD
      expect(html).toContain('@context": "https://schema.org');
      expect(html).toContain('"@type": "Organization"');
      expect(html).toContain('"@type": "WebSite"');
      expect(html).toContain('"url": "https://sleepykoala.pages.dev/"');
    });

    it('2. public/robots.txt allows public crawling, disallows admin paths, and points to canonical sitemap', () => {
      const robotsPath = resolve(rootDir, 'public/robots.txt');
      expect(existsSync(robotsPath)).toBe(true);
      const robots = readFileSync(robotsPath, 'utf-8');

      expect(robots).toContain('User-agent: *');
      expect(robots).toContain('Allow: /');
      expect(robots).toContain('Disallow: /admin');
      expect(robots).toContain('Disallow: /api/admin/');
      expect(robots).toContain('Sitemap: https://sleepykoala.pages.dev/sitemap.xml');
    });

    it('3. public/sitemap.xml lists canonical URLs for all public pages including 6 official projects', () => {
      const sitemapPath = resolve(rootDir, 'public/sitemap.xml');
      expect(existsSync(sitemapPath)).toBe(true);
      const sitemap = readFileSync(sitemapPath, 'utf-8');

      expect(sitemap).toContain('https://sleepykoala.pages.dev/');
      expect(sitemap).toContain('https://sleepykoala.pages.dev/projects');
      expect(sitemap).toContain('https://sleepykoala.pages.dev/about');

      // All 6 official projects
      const expectedSlugs = [
        'dompetnalar',
        'idle-master',
        'mobile-kasir',
        'idle-mining',
        'the-broken-origin',
        'worklume',
      ];

      for (const slug of expectedSlugs) {
        expect(sitemap).toContain(`https://sleepykoala.pages.dev/projects/${slug}`);
      }
    });

    it('4. usePageMeta hook dynamically updates document.title, meta tags, and canonical link in DOM', () => {
      const testMeta = {
        title: 'DompetNalar — Catat Pengeluaran Harian',
        description: 'Aplikasi pembukuan dan keuangan pribadi untuk pengguna Android.',
        canonicalPath: '/projects/dompetnalar',
        ogType: 'article' as const,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'DompetNalar',
        },
      };

      const { unmount } = renderHook(() => usePageMeta(testMeta));

      expect(document.title).toBe('DompetNalar — Catat Pengeluaran Harian | SleepyKoala Studio');

      const descMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      expect(descMeta?.content).toBe(testMeta.description);

      const ogTitleMeta = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
      expect(ogTitleMeta?.content).toBe('DompetNalar — Catat Pengeluaran Harian | SleepyKoala Studio');

      const canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      expect(canonicalLink?.href).toBe('https://sleepykoala.pages.dev/projects/dompetnalar');

      const jsonLdScript = document.getElementById('dynamic-jsonld');
      expect(jsonLdScript).not.toBeNull();
      expect(jsonLdScript?.textContent).toContain('DompetNalar');

      unmount();
      expect(document.getElementById('dynamic-jsonld')).toBeNull();
    });
  });

  describe('5.1 Public Portfolio Experience & Brand Integrity', () => {
    it('1. All 6 canonical official projects exist with correct configurations', () => {
      const allProjects = getAllProjects();
      expect(allProjects).toHaveLength(6);
      const slugMap = new Map(allProjects.map((p) => [p.slug, p]));

      // 1. dompetnalar
      const dompetnalar = slugMap.get('dompetnalar');
      expect(dompetnalar).toBeDefined();
      expect(dompetnalar?.category).toBe('APPLICATION');
      expect(dompetnalar?.status).toBe('READY_FOR_RELEASE');
      expect(dompetnalar?.registrationOpen).toBe(false);

      // 2. idle-master
      const idleMaster = slugMap.get('idle-master');
      expect(idleMaster).toBeDefined();
      expect(idleMaster?.category).toBe('GAME');
      expect(idleMaster?.status).toBe('WORK_IN_PROGRESS');
      expect(idleMaster?.registrationOpen).toBe(false);

      // 3. mobile-kasir
      const mobileKasir = slugMap.get('mobile-kasir');
      expect(mobileKasir).toBeDefined();
      expect(mobileKasir?.category).toBe('APPLICATION');
      expect(mobileKasir?.status).toBe('CLOSED_TESTING');
      expect(mobileKasir?.registrationOpen).toBe(true);

      // 4. idle-mining
      const idleMining = slugMap.get('idle-mining');
      expect(idleMining).toBeDefined();
      expect(idleMining?.category).toBe('GAME');
      expect(idleMining?.status).toBe('WORK_IN_PROGRESS');
      expect(idleMining?.registrationOpen).toBe(false);

      // 5. the-broken-origin
      const tbo = slugMap.get('the-broken-origin');
      expect(tbo).toBeDefined();
      expect(tbo?.category).toBe('GAME');
      expect(tbo?.status).toBe('WORK_IN_PROGRESS');
      expect(tbo?.registrationOpen).toBe(false);

      // 6. worklume
      const worklume = slugMap.get('worklume');
      expect(worklume).toBeDefined();
      expect(worklume?.category).toBe('APPLICATION');
      expect(worklume?.status).toBe('WORK_IN_PROGRESS');
      expect(worklume?.tagline).toBe('Work Smarter. Stay Organized.');
      expect(worklume?.capabilities).toBeDefined();
      expect(worklume?.capabilities?.length).toBe(8);
    });

    it('2. Enforces strictly solid typography with NO text gradient styling across src/', () => {
      const srcFiles = ['HomePage.tsx', 'ProjectsPage.tsx', 'ProjectDetailPage.tsx', 'AboutPage.tsx', 'FeedbackPage.tsx', 'Navbar.tsx', 'Footer.tsx'];
      for (const file of srcFiles) {
        const fullPath = resolve(rootDir, 'src', file.includes('Page') ? `pages/${file}` : `components/${file}`);
        if (existsSync(fullPath)) {
          const content = readFileSync(fullPath, 'utf-8');
          expect(content).not.toContain('bg-clip-text');
          expect(content).not.toContain('text-transparent');
        }
      }
    });

    it('3. Official logo asset exists and is referenced consistently', () => {
      const logoPath = resolve(rootDir, 'public/assets/branding/sleepykoala-logo.png');
      expect(existsSync(logoPath)).toBe(true);

      const navbarContent = readFileSync(resolve(rootDir, 'src/components/Navbar.tsx'), 'utf-8');
      expect(navbarContent).toContain('/assets/branding/sleepykoala-logo.png');

      const footerContent = readFileSync(resolve(rootDir, 'src/components/Footer.tsx'), 'utf-8');
      expect(footerContent).toContain('/assets/branding/sleepykoala-logo.png');
    });
  });

  describe('5.5 Mobile Experience & Touch Accessibility', () => {
    it('1. Mobile menu button and brand links have minimum 44px touch targets', () => {
      const navbarContent = readFileSync(resolve(rootDir, 'src/components/Navbar.tsx'), 'utf-8');
      expect(navbarContent).toContain('min-h-[44px]');
      expect(navbarContent).toContain('min-w-[44px]');
    });

    it('2. ProjectCard detail action link has minimum 44px touch target', () => {
      const cardContent = readFileSync(resolve(rootDir, 'src/components/ProjectCard.tsx'), 'utf-8');
      expect(cardContent).toContain('min-h-[44px]');
    });

    it('3. App container has horizontal overflow protection', () => {
      const appContent = readFileSync(resolve(rootDir, 'src/App.tsx'), 'utf-8');
      expect(appContent).toContain('overflow-x-hidden');
    });
  });

  describe('5.2 & 5.3 Project Management & 7 Valid Statuses', () => {
    it('1. All 7 canonical statuses (including PRE_REGISTRATION) are fully recognized and supported', () => {
      const expectedStatuses = [
        'RELEASED',
        'READY_FOR_RELEASE',
        'PRE_REGISTRATION',
        'CLOSED_TESTING',
        'INTERNAL_TESTING',
        'WORK_IN_PROGRESS',
        'COMING_SOON',
      ];

      const projectsPageContent = readFileSync(resolve(rootDir, 'src/pages/ProjectsPage.tsx'), 'utf-8');
      for (const status of expectedStatuses) {
        expect(projectsPageContent).toContain(`'${status}'`);
      }

      const adminPageContent = readFileSync(resolve(rootDir, 'src/pages/AdminPage.tsx'), 'utf-8');
      for (const status of expectedStatuses) {
        expect(adminPageContent).toContain(`value="${status}"`);
      }
    });
  });
});
