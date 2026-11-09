/**
 * SleepyKoala Studio — Website Content & Settings Service
 * Milestone 6.6
 */

import { useState, useEffect } from 'react';
import { SiteSettings, DEFAULT_SITE_SETTINGS } from '../types/settings';

export interface SettingsApiResponse {
  success: boolean;
  settings?: SiteSettings;
  data?: { settings?: SiteSettings };
  error?: string;
  message?: string;
}

/**
 * Fetch public published website settings.
 * Resilient fallback: returns DEFAULT_SITE_SETTINGS on error or offline.
 */
export async function fetchPublicSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch('/api/settings', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      return DEFAULT_SITE_SETTINGS;
    }

    const json: SettingsApiResponse = await res.json();
    if (json.success) {
      const data = json.settings || json.data?.settings;
      if (data && data.status === 'published') {
        return {
          ...DEFAULT_SITE_SETTINGS,
          ...data,
          branding: { ...DEFAULT_SITE_SETTINGS.branding, ...(data.branding || {}) },
          homepage: { ...DEFAULT_SITE_SETTINGS.homepage, ...(data.homepage || {}) },
          about: { ...DEFAULT_SITE_SETTINGS.about, ...(data.about || {}) },
          navigation: Array.isArray(data.navigation) && data.navigation.length > 0 ? data.navigation : DEFAULT_SITE_SETTINGS.navigation,
          footer: { ...DEFAULT_SITE_SETTINGS.footer, ...(data.footer || {}) },
          seo: { ...DEFAULT_SITE_SETTINGS.seo, ...(data.seo || {}) },
        };
      }
    }
    return DEFAULT_SITE_SETTINGS;
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

/**
 * Fetch admin settings (can be draft or published).
 */
export async function fetchAdminSiteSettings(): Promise<{ success: boolean; settings?: SiteSettings; error?: string; message?: string }> {
  try {
    const res = await fetch('/api/admin/settings', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-SleepyKoala-Admin': '1',
      },
      credentials: 'same-origin',
    });

    const json = await res.json();
    if (json.success) {
      const settings = json.settings || json.data?.settings || DEFAULT_SITE_SETTINGS;
      return { success: true, settings };
    }
    return { success: false, error: json.error, message: json.message || 'Gagal memuat pengaturan website.' };
  } catch (err: any) {
    return { success: false, error: 'NETWORK_ERROR', message: err.message };
  }
}

/**
 * Save admin settings (draft or publish).
 */
export async function saveAdminSiteSettings(
  settings: Partial<SiteSettings>,
  publish: boolean = false
): Promise<{ success: boolean; settings?: SiteSettings; error?: string; message?: string }> {
  try {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-SleepyKoala-Admin': '1',
      },
      credentials: 'same-origin',
      body: JSON.stringify({ settings, publish }),
    });

    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, error: 'NETWORK_ERROR', message: err.message };
  }
}

/**
 * React Hook for public components to consume dynamic website settings with fallback.
 */
export function useSiteSettings(): { settings: SiteSettings; loading: boolean } {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    fetchPublicSiteSettings().then((result) => {
      if (mounted) {
        setSettings(result);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) {
        setSettings(DEFAULT_SITE_SETTINGS);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return { settings, loading };
}
