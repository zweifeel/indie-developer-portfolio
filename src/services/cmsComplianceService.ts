/**
 * SleepyKoala Studio — Play Console Compliance Service
 * Milestone 6.6
 */

import { ProjectCompliance } from '../types/compliance';

export interface PublicComplianceResponse {
  success: boolean;
  project?: {
    id: string;
    slug: string;
    name: string;
  };
  privacyPolicy?: ProjectCompliance['privacyPolicy'] | null;
  deleteAccount?: ProjectCompliance['deleteAccount'] | null;
  error?: string;
  message?: string;
}

export interface AdminComplianceListResponse {
  success: boolean;
  complianceRecords?: ProjectCompliance[];
  data?: { complianceRecords?: ProjectCompliance[] };
  error?: string;
  message?: string;
}

export interface AdminComplianceSaveResponse {
  success: boolean;
  compliance?: ProjectCompliance;
  error?: string;
  message?: string;
}

/**
 * Fetch public compliance data for a specific project slug.
 * Fail-closed policy: Returns null if unconfigured, draft, or unauthenticated/offline.
 */
export async function fetchPublicCompliance(slug: string): Promise<PublicComplianceResponse> {
  try {
    const res = await fetch(`/api/compliance/${encodeURIComponent(slug)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      return {
        success: false,
        error: res.status === 404 ? 'NOT_FOUND' : 'HTTP_ERROR',
        message: res.status === 404 ? 'Halaman kebijakan kepatuhan tidak ditemukan atau belum dipublikasikan.' : `HTTP error: ${res.status}`,
      };
    }

    const json = await res.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: err.message || 'Gagal memuat informasi kepatuhan.',
    };
  }
}

/**
 * Fetch all compliance records for admin view.
 */
export async function fetchAdminComplianceList(): Promise<AdminComplianceListResponse> {
  try {
    const res = await fetch('/api/admin/compliance', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-SleepyKoala-Admin': '1',
      },
      credentials: 'same-origin',
    });

    const json = await res.json();
    if (json.success) {
      const records = json.complianceRecords || json.data?.complianceRecords || [];
      return { success: true, complianceRecords: records };
    }
    return { success: false, error: json.error, message: json.message || 'Gagal memuat daftar kepatuhan.' };
  } catch (err: any) {
    return { success: false, error: 'NETWORK_ERROR', message: err.message };
  }
}

/**
 * Save or update compliance records for a project in admin.
 */
export async function saveAdminCompliance(
  compliance: Partial<ProjectCompliance>,
  action?: 'save_draft' | 'publish_privacy' | 'publish_delete_account' | 'unpublish_privacy' | 'unpublish_delete_account'
): Promise<AdminComplianceSaveResponse> {
  try {
    const res = await fetch('/api/admin/compliance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-SleepyKoala-Admin': '1',
      },
      credentials: 'same-origin',
      body: JSON.stringify({ compliance, action }),
    });

    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, error: 'NETWORK_ERROR', message: err.message };
  }
}
