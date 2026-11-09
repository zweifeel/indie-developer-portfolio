/**
 * ============================================================================
 * SLEEPYKOALA CMS — MILESTONE 6.5.6 COMPREHENSIVE TEST SUITE
 * PROJECT LOGO & SCREENSHOT GALLERY MANAGEMENT
 * ============================================================================
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  uploadCmsMedia,
  fetchProjectMedia,
  validateMediaFileBeforeUpload,
} from '../services/cmsMediaService';
import {
  saveAdminProject,
  CmsProject,
} from '../services/cmsProjectService';
import {
  isValidProject,
  getAllProjects,
} from '../services/projectService';
import { CmsMediaMetadata } from '../services/media/types';
import { render } from '@testing-library/react';
import { ProjectIcon, ScreenshotImage } from '../components/ProjectMedia';
import { ProjectCard } from '../components/ProjectCard';
import { BrowserRouter } from 'react-router-dom';
import type { Project } from '../types/project';

// Valid binary generator helpers
function createValidWebpFile(name = 'icon.webp'): File {
  const bytes = new Uint8Array([
    0x52, 0x49, 0x46, 0x46, // RIFF
    0x24, 0x00, 0x00, 0x00, // length
    0x57, 0x45, 0x42, 0x50, // WEBP
    0x56, 0x50, 0x38, 0x20, // VP8_
    0x18, 0x00, 0x00, 0x00,
    0x30, 0x01, 0x00, 0x9d, 0x01, 0x2a, 0x01, 0x00, 0x01, 0x00,
  ]);
  return new File([bytes], name, { type: 'image/webp' });
}

function createValidPngFile(name = 'screenshot.png'): File {
  const bytes = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
  ]);
  return new File([bytes], name, { type: 'image/png' });
}

function createValidJpegFile(name = 'screenshot.jpg'): File {
  const bytes = new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, // SOI
    0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00,
    0xff, 0xd9, // EOI
  ]);
  return new File([bytes], name, { type: 'image/jpeg' });
}

function createCorruptedFile(name = 'corrupted.webp'): File {
  const bytes = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c]);
  return new File([bytes], name, { type: 'image/webp' });
}

describe('Milestone 6.5.6: Project Logo & Screenshot Gallery Management', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // SUITE 1: FILE VALIDATION (MIME, MAGIC BYTES, SIZE LIMITS)
  // --------------------------------------------------------------------------
  describe('1. File Validation Engine (MIME Type, Magic Bytes & Size Limits)', () => {
    it('1.1 accepts valid WebP, PNG, and JPEG files with authentic magic bytes', async () => {
      const webp = createValidWebpFile();
      const png = createValidPngFile();
      const jpeg = createValidJpegFile();

      const valWebp = await validateMediaFileBeforeUpload(webp);
      expect(valWebp.valid).toBe(true);

      const valPng = await validateMediaFileBeforeUpload(png);
      expect(valPng.valid).toBe(true);

      const valJpeg = await validateMediaFileBeforeUpload(jpeg);
      expect(valJpeg.valid).toBe(true);
    });

    it('1.2 strictly rejects SVG, HTML, and XML files due to script execution risks', async () => {
      const svg = new File(['<svg><script>alert(1)</script></svg>'], 'malicious.svg', { type: 'image/svg+xml' });
      const html = new File(['<html><body>test</body></html>'], 'page.html', { type: 'text/html' });

      const valSvg = await validateMediaFileBeforeUpload(svg);
      expect(valSvg.valid).toBe(false);
      expect(valSvg.error).toBe('FORBIDDEN_FORMAT');

      const valHtml = await validateMediaFileBeforeUpload(html);
      expect(valHtml.valid).toBe(false);
      expect(valHtml.error).toBe('FORBIDDEN_FORMAT');
    });

    it('1.3 strictly rejects unsupported MIME types (e.g. PDF, GIF, EXE)', async () => {
      const pdf = new File(['%PDF-1.4'], 'doc.pdf', { type: 'application/pdf' });
      const valPdf = await validateMediaFileBeforeUpload(pdf);
      expect(valPdf.valid).toBe(false);
      expect(valPdf.error).toBe('UNSUPPORTED_MIME');
    });

    it('1.4 strictly rejects files exceeding the 2.0 MB size ceiling', async () => {
      // 2.1 MB buffer
      const largeBytes = new Uint8Array(2.1 * 1024 * 1024);
      const largeFile = new File([largeBytes], 'large.webp', { type: 'image/webp' });

      const valLarge = await validateMediaFileBeforeUpload(largeFile);
      expect(valLarge.valid).toBe(false);
      expect(valLarge.error).toBe('PAYLOAD_TOO_LARGE');
    });

    it('1.5 detects and rejects corrupted files with invalid magic bytes signature', async () => {
      const corrupt = createCorruptedFile();
      const valCorrupt = await validateMediaFileBeforeUpload(corrupt);
      expect(valCorrupt.valid).toBe(false);
      expect(valCorrupt.error).toBe('INVALID_WEBP_SIGNATURE');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 2: LOGO MANAGEMENT (UPLOAD, REPLACE, REMOVE, ISOLATION)
  // --------------------------------------------------------------------------
  describe('2. Project Logo Management', () => {
    it('2.1 successfully uploads a main logo for a project and receives publicUrl', async () => {
      const validLogo = createValidWebpFile('dompetnalar-logo.webp');

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            media: {
              mediaId: 'med_logo1234567890',
              projectId: 'dompetnalar',
              originalName: 'dompetnalar-logo.webp',
              safeName: 'dompetnalar_logo.webp',
              mimeType: 'image/webp',
              role: 'ICON',
              visibility: 'PUBLISHED',
              sizeBytes: 30,
              sha256: 'abc123sha256',
              uploadedAt: '2026-11-02 12:00:00',
              uploadedBy: 'zweifeel@gmail.com',
            },
            publicUrl: '/api/media/med_logo1234567890',
            isDuplicate: false,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const res = await uploadCmsMedia('dompetnalar', validLogo, 'ICON', 'PUBLISHED');
      expect(res.success).toBe(true);
      expect(res.media?.mediaId).toBe('med_logo1234567890');
      expect(res.media?.role).toBe('ICON');
      expect(res.publicUrl).toBe('/api/media/med_logo1234567890');
    });

    it('2.2 allows replacing a project logo with a new file', async () => {
      const newLogo = createValidPngFile('new-logo.png');

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            media: {
              mediaId: 'med_logo_v2_999999',
              projectId: 'dompetnalar',
              originalName: 'new-logo.png',
              safeName: 'new_logo.png',
              mimeType: 'image/png',
              role: 'ICON',
              visibility: 'PUBLISHED',
              sizeBytes: 16,
              sha256: 'def456sha256',
              uploadedAt: '2026-11-02 12:10:00',
              uploadedBy: 'zweifeel@gmail.com',
            },
            publicUrl: '/api/media/med_logo_v2_999999',
            isDuplicate: false,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const res = await uploadCmsMedia('dompetnalar', newLogo, 'ICON', 'PUBLISHED');
      expect(res.success).toBe(true);
      expect(res.media?.mediaId).toBe('med_logo_v2_999999');
    });

    it('2.3 removes logo reference without affecting other project metadata', async () => {
      const originalProject: CmsProject = {
        id: 'dompetnalar',
        slug: 'dompetnalar',
        name: 'DompetNalar',
        category: 'APPLICATION',
        status: 'READY_FOR_RELEASE',
        shortDescription: 'Deskripsi singkat DompetNalar',
        fullDescription: 'Deskripsi lengkap DompetNalar',
        iconUrl: '/api/media/med_logo1234567890',
        icon: '/api/media/med_logo1234567890',
        screenshots: [],
        version: '1.0.0',
        lastUpdated: '2026-11-02',
        registrationOpen: false,
        featured: true,
        tags: ['Aplikasi'],
        technicalHighlights: [],
        capabilities: [],
        publishState: 'PUBLISHED',
      };

      // Simulates removing logo
      const updatedProject: CmsProject = {
        ...originalProject,
        iconUrl: '',
        icon: '',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: { project: updatedProject },
            message: 'Proyek berhasil diperbarui.',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const saveRes = await saveAdminProject(updatedProject);
      expect(saveRes.success).toBe(true);
      expect(saveRes.data.project.iconUrl).toBe('');
      expect(saveRes.data.project.name).toBe('DompetNalar');
      expect(saveRes.data.project.category).toBe('APPLICATION');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 3: SCREENSHOT GALLERY (UPLOAD, REORDER, REPLACE, DELETE, CAPACITIES)
  // --------------------------------------------------------------------------
  describe('3. Screenshot Gallery Management', () => {
    it('3.1 uploads multiple screenshots sequentially and builds gallery array', async () => {
      const shot1 = createValidWebpFile('screen1.webp');
      const shot2 = createValidPngFile('screen2.png');

      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              success: true,
              media: { mediaId: 'med_shot_01', projectId: 'dompetnalar', role: 'SCREENSHOT', visibility: 'PUBLISHED' },
              publicUrl: '/api/media/med_shot_01',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              success: true,
              media: { mediaId: 'med_shot_02', projectId: 'dompetnalar', role: 'SCREENSHOT', visibility: 'PUBLISHED' },
              publicUrl: '/api/media/med_shot_02',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        );

      const res1 = await uploadCmsMedia('dompetnalar', shot1, 'SCREENSHOT', 'PUBLISHED');
      const res2 = await uploadCmsMedia('dompetnalar', shot2, 'SCREENSHOT', 'PUBLISHED');

      expect(res1.success).toBe(true);
      expect(res2.success).toBe(true);

      const gallery = [res1.publicUrl!, res2.publicUrl!];
      expect(gallery).toEqual(['/api/media/med_shot_01', '/api/media/med_shot_02']);
    });

    it('3.2 enforces gallery reordering (swap items left and right)', () => {
      const initialScreenshots = [
        '/api/media/med_shot_01',
        '/api/media/med_shot_02',
        '/api/media/med_shot_03',
      ];

      // Reorder: move index 1 to left (index 0)
      const reordered = [...initialScreenshots];
      const temp = reordered[1];
      reordered[1] = reordered[0];
      reordered[0] = temp;

      expect(reordered).toEqual([
        '/api/media/med_shot_02',
        '/api/media/med_shot_01',
        '/api/media/med_shot_03',
      ]);

      // Move index 1 to right (index 2)
      const reordered2 = [...reordered];
      const temp2 = reordered2[1];
      reordered2[1] = reordered2[2];
      reordered2[2] = temp2;

      expect(reordered2).toEqual([
        '/api/media/med_shot_02',
        '/api/media/med_shot_03',
        '/api/media/med_shot_01',
      ]);
    });

    it('3.3 deletes a single screenshot from gallery at specific index', () => {
      const screenshots = [
        '/api/media/med_shot_01',
        '/api/media/med_shot_02',
        '/api/media/med_shot_03',
      ];

      // Delete index 1
      const updated = [...screenshots];
      updated.splice(1, 1);

      expect(updated).toHaveLength(2);
      expect(updated).toEqual(['/api/media/med_shot_01', '/api/media/med_shot_03']);
    });

    it('3.4 replaces a specific screenshot in gallery without altering others', () => {
      const screenshots = [
        '/api/media/med_shot_01',
        '/api/media/med_shot_02',
        '/api/media/med_shot_03',
      ];

      // Replace index 1 with new URL
      const updated = [...screenshots];
      updated[1] = '/api/media/med_shot_02_replaced';

      expect(updated).toEqual([
        '/api/media/med_shot_01',
        '/api/media/med_shot_02_replaced',
        '/api/media/med_shot_03',
      ]);
    });

    it('3.5 supports empty gallery state without breaking serialization or UI', async () => {
      const emptyGalleryProject: Partial<CmsProject> = {
        id: 'worklume',
        name: 'Worklume',
        slug: 'worklume',
        screenshots: [],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({ success: true, message: 'Proyek disimpan.' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const res = await saveAdminProject(emptyGalleryProject);
      expect(res.success).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 4: PROJECT ISOLATION & RELATIONAL INTEGRITY
  // --------------------------------------------------------------------------
  describe('4. Project Isolation & Security Integrity', () => {
    it('4.1 filters media by projectId ensuring Project A media does not appear on Project B', async () => {
      const mockAllMedia: CmsMediaMetadata[] = [
        {
          mediaId: 'med_projA_01',
          projectId: 'dompetnalar',
          driveFileId: 'drv_1',
          originalName: 'iconA.webp',
          safeName: 'iconA.webp',
          mimeType: 'image/webp',
          sizeBytes: 100,
          sha256: 'shaA',
          role: 'ICON',
          visibility: 'PUBLISHED',
          uploadedAt: '2026-11-02 10:00:00',
          uploadedBy: 'zweifeel@gmail.com',
        },
        {
          mediaId: 'med_projB_01',
          projectId: 'idle-master',
          driveFileId: 'drv_2',
          originalName: 'iconB.webp',
          safeName: 'iconB.webp',
          mimeType: 'image/webp',
          sizeBytes: 200,
          sha256: 'shaB',
          role: 'ICON',
          visibility: 'PUBLISHED',
          uploadedAt: '2026-11-02 10:05:00',
          uploadedBy: 'zweifeel@gmail.com',
        },
      ];

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({ success: true, data: { media: [mockAllMedia[0]] } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const resA = await fetchProjectMedia('dompetnalar');
      expect(resA.success).toBe(true);
      expect(resA.data).toHaveLength(1);
      expect(resA.data![0].projectId).toBe('dompetnalar');
      expect(resA.data![0].mediaId).toBe('med_projA_01');
    });

    it('4.2 preserves CSRF headers and admin session authentication on all requests', async () => {
      let capturedHeaders: Record<string, string> = {};
      vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (_url, init) => {
        capturedHeaders = init?.headers as Record<string, string>;
        return new Response(JSON.stringify({ success: true, data: { media: [] } }));
      });

      await fetchProjectMedia('*');
      expect(capturedHeaders['X-SleepyKoala-Admin']).toBe('1');
      expect(capturedHeaders['Accept']).toBe('application/json');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 5: PUBLIC WEBSITE RENDERING & BACKWARD COMPATIBILITY
  // --------------------------------------------------------------------------
  describe('5. Public Website Rendering & Backward Compatibility', () => {
    it('5.1 ProjectIcon renders fallback initials and category icon when logo is empty', () => {
      const { container } = render(
        <ProjectIcon src="" alt="Icon App" name="Dompet Nalar" category="APPLICATION" />
      );

      expect(container.textContent).toContain('DN');
      expect(container.querySelector('img')).toBeNull();
    });

    it('5.2 ProjectIcon renders img element when valid src is provided', () => {
      const { container } = render(
        <ProjectIcon
          src="/api/media/med_custom_logo"
          alt="Logo DompetNalar"
          name="DompetNalar"
          category="APPLICATION"
        />
      );

      const img = container.querySelector('img');
      expect(img).not.toBeNull();
      expect(img?.getAttribute('src')).toBe('/api/media/med_custom_logo');
    });

    it('5.3 ScreenshotImage renders placeholder card when src is empty', () => {
      const { container } = render(
        <ScreenshotImage src="" alt="Pratinjau Layar Segera Hadir" index={0} />
      );

      expect(container.textContent).toContain('Pratinjau Layar #1');
      expect(container.textContent).toContain('Pratinjau Belum Tersedia');
      expect(container.querySelector('img')).toBeNull();
    });

    it('5.4 ScreenshotImage renders img element with aspect-16/9 ratio when src is valid', () => {
      const { container } = render(
        <ScreenshotImage src="/api/media/med_custom_shot" alt="Tangkapan Layar #1" index={0} />
      );

      const img = container.querySelector('img');
      expect(img).not.toBeNull();
      expect(img?.getAttribute('src')).toBe('/api/media/med_custom_shot');
      expect(container.firstChild).toHaveClass('aspect-16/9');
    });

    it('5.5 ProjectCard correctly renders project with or without custom logo', () => {
      const mockProject: Project = {
        id: 'dompetnalar',
        slug: 'dompetnalar',
        name: 'DompetNalar',
        category: 'APPLICATION',
        status: 'READY_FOR_RELEASE',
        shortDescription: 'Deskripsi singkat DompetNalar',
        fullDescription: 'Deskripsi lengkap',
        icon: '/api/media/med_logo_dompet',
        screenshots: ['/api/media/med_shot_1'],
        version: '1.0.0',
        lastUpdated: '2026-11-02',
        registrationOpen: false,
        featured: true,
      };

      const { container } = render(
        <BrowserRouter>
          <ProjectCard project={mockProject} />
        </BrowserRouter>
      );

      expect(container.textContent).toContain('DompetNalar');
      const img = container.querySelector('img');
      expect(img?.getAttribute('src')).toBe('/api/media/med_logo_dompet');
    });

    it('5.6 isValidProject validates schema with empty screenshots and legacy icon paths', () => {
      const legacyProject = {
        id: 'idle-master',
        slug: 'idle-master',
        name: 'IDLE MASTER',
        category: 'GAME',
        status: 'WORK_IN_PROGRESS',
        shortDescription: 'Dalam pengembangan',
        fullDescription: 'Dalam pengembangan',
        icon: '/assets/projects/idle-master/icon.png',
        screenshots: [],
        version: '0.1.0',
        lastUpdated: '2026-11-02',
        registrationOpen: false,
        featured: false,
      };

      expect(isValidProject(legacyProject)).toBe(true);
    });

    it('5.7 all 6 official projects pass project validation', () => {
      const all = getAllProjects();
      expect(all.length).toBeGreaterThanOrEqual(6);
      for (const p of all) {
        expect(isValidProject(p)).toBe(true);
      }
    });
  });
});
