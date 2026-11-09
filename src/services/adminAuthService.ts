/**
 * ============================================================================
 * SLEEPYKOALA CMS — ADMIN AUTHENTICATION CLIENT SERVICE
 * 
 * Features:
 * 1. Safe client-side API layer calling Cloudflare Pages Functions auth proxy.
 * 2. Injects mandatory CSRF header (X-SleepyKoala-Admin: 1).
 * 3. Enforces credentials: 'same-origin' for HttpOnly cookie exchange.
 * 4. Zero secrets, credentials, or OTP values stored on the client.
 * ============================================================================
 */

export interface AuthApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
  cooldownSeconds?: number;
  expiresAt?: number;
}

export interface VerifyOtpData {
  email: string;
  sessionVersion: number;
  expiresInSeconds: number;
  environment?: 'production' | 'test' | 'unknown';
}

export interface SessionStatus {
  authenticated: boolean;
  email?: string;
  sessionVersion?: number;
  environment?: 'production' | 'test' | 'unknown';
  reason?: string;
}

const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-SleepyKoala-Admin': '1', // CSRF Defense-in-depth header
};

/**
 * Meminta pengiriman kode OTP 6-digit ke email administrator
 */
export async function requestAdminOtp(email: string): Promise<AuthApiResponse> {
  try {
    const response = await fetch('/api/admin/auth/request-otp', {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      credentials: 'same-origin',
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Gagal menghubungi server autentikasi: ' + (err?.message || 'Koneksi terputus'),
    };
  }
}

/**
 * Memverifikasi kode OTP 6-digit dan menerbitkan session cookie
 */
export async function verifyAdminOtp(email: string, otp: string): Promise<AuthApiResponse<VerifyOtpData>> {
  try {
    const response = await fetch('/api/admin/auth/verify-otp', {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      credentials: 'same-origin',
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Gagal memverifikasi OTP: ' + (err?.message || 'Koneksi terputus'),
    };
  }
}

/**
 * Mengakhiri sesi administrator dan menghapus session cookie
 */
export async function logoutAdmin(revokeAll: boolean = false): Promise<AuthApiResponse> {
  try {
    const response = await fetch('/api/admin/auth/logout', {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      credentials: 'same-origin',
      body: JSON.stringify({ revokeAll }),
    });

    const data = await response.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Gagal keluar: ' + (err?.message || 'Koneksi terputus'),
    };
  }
}

/**
 * Memeriksa status sesi aktif saat ini
 */
export async function getAdminSession(): Promise<SessionStatus> {
  try {
    const response = await fetch('/api/admin/auth/session', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'same-origin',
    });

    const data = await response.json();
    if (data.success && data.authenticated) {
      return {
        authenticated: true,
        email: data.email,
        sessionVersion: data.sessionVersion,
        environment: data.environment,
      };
    }

    return {
      authenticated: false,
      reason: data.reason || 'UNAUTHENTICATED',
    };
  } catch {
    return {
      authenticated: false,
      reason: 'NETWORK_ERROR',
    };
  }
}
