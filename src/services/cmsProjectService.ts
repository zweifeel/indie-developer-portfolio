/**
 * ============================================================================
 * SLEEPYKOALA CMS — ADMIN PROJECT SERVICE (CLIENT-SIDE)
 * ============================================================================
 */

export interface CmsProject {
  id: string;
  slug: string;
  name: string;
  category: 'APPLICATION' | 'GAME';
  status: 'READY_FOR_RELEASE' | 'RELEASED' | 'PRE_REGISTRATION' | 'CLOSED_TESTING' | 'INTERNAL_TESTING' | 'WORK_IN_PROGRESS' | 'COMING_SOON';
  shortDescription: string;
  fullDescription: string;
  tagline?: string;
  iconUrl?: string;
  icon?: string;
  featureGraphicUrl?: string;
  screenshots: string[];
  version: string;
  lastUpdated: string;
  playStoreUrl?: string;
  testingUrl?: string;
  registrationOpen: boolean;
  testerRequirementDays?: number;
  featured: boolean;
  tags: string[];
  technicalHighlights: string[];
  capabilities: Array<{ title: string; description: string; icon: string }>;
  vision?: string;
  publishState: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  updatedAt?: string;
}

export interface CmsAuditLog {
  timestamp: string;
  action: string;
  targetId: string;
  adminEmail: string;
  clientIp: string;
  details: Record<string, any>;
}

export async function fetchAdminProjects(): Promise<{ success: boolean; data?: CmsProject[]; error?: string; message?: string }> {
  try {
    const res = await fetch('/api/admin/projects', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-SleepyKoala-Admin': '1',
      },
      credentials: 'same-origin',
    });
    const json = await res.json();
    if (json.success) {
      const rawProjects = Array.isArray(json.projects)
        ? json.projects
        : Array.isArray(json.data?.projects)
          ? json.data.projects
          : Array.isArray(json.data)
            ? json.data
            : null;

      if (rawProjects !== null) {
        return { success: true, data: rawProjects };
      }
      return {
        success: false,
        error: 'INVALID_RESPONSE_FORMAT',
        message: json.message || 'Format data proyek yang diterima tidak valid.',
      };
    }
    return { success: false, error: json.error, message: json.message || 'Gagal memuat data proyek.' };
  } catch (err: any) {
    return { success: false, error: 'NETWORK_ERROR', message: err.message };
  }
}

export async function saveAdminProject(project: Partial<CmsProject>): Promise<{ success: boolean; data?: any; error?: string; message?: string }> {
  try {
    const res = await fetch('/api/admin/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-SleepyKoala-Admin': '1',
      },
      credentials: 'same-origin',
      body: JSON.stringify({ project }),
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, error: 'NETWORK_ERROR', message: err.message };
  }
}

export async function reorderAdminProjects(orderedIds: string[]): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const res = await fetch('/api/admin/projects', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-SleepyKoala-Admin': '1',
      },
      credentials: 'same-origin',
      body: JSON.stringify({ orderedIds }),
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, error: 'NETWORK_ERROR', message: err.message };
  }
}

export async function fetchAdminAuditLogs(): Promise<{ success: boolean; data?: CmsAuditLog[]; error?: string; message?: string }> {
  try {
    const res = await fetch('/api/admin/audit-logs', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-SleepyKoala-Admin': '1',
      },
      credentials: 'same-origin',
    });
    const json = await res.json();
    if (json.success) {
      const rawLogs = Array.isArray(json.logs)
        ? json.logs
        : Array.isArray(json.data?.logs)
          ? json.data.logs
          : Array.isArray(json.data)
            ? json.data
            : null;

      if (rawLogs !== null) {
        return { success: true, data: rawLogs };
      }
      return {
        success: false,
        error: 'INVALID_RESPONSE_FORMAT',
        message: json.message || 'Format data audit logs yang diterima tidak valid.',
      };
    }
    return { success: false, error: json.error, message: json.message || 'Gagal memuat audit log.' };
  } catch (err: any) {
    return { success: false, error: 'NETWORK_ERROR', message: err.message };
  }
}
