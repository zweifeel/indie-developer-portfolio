/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — REGISTRATION API CLIENT SERVICE
 * Handles communication with Cloudflare Pages Functions proxy (/api/register-tester)
 * ============================================================================
 */

export interface RegistrationPayload {
  testerName: string;
  testerEmail: string;
  projectId: string;
  projectName: string;
  appVersion?: string;
  honeypot?: string;
}

export interface RegistrationResponse {
  success: boolean;
  message: string;
  error?: string | null;
  isDuplicate?: boolean;
  projectId?: string;
  maskedEmail?: string;
  timestamp?: string;
}

const API_ENDPOINT = '/api/register-tester';
const CLIENT_TIMEOUT_MS = 12000; // 12 seconds

/**
 * Mengirimkan data pendaftaran penguji ke backend same-origin proxy
 */
export async function registerTester(
  payload: RegistrationPayload
): Promise<RegistrationResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse JSON
    let data: RegistrationResponse;
    try {
      data = (await response.json()) as RegistrationResponse;
    } catch {
      throw new Error('Respons dari server pendaftaran tidak dapat diproses.');
    }

    if (!response.ok && !data.success) {
      return {
        success: false,
        error: data.error || 'API_ERROR',
        message: data.message || 'Terjadi kesalahan saat memproses pendaftaran.',
      };
    }

    return data;
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    const errName = (err as { name?: string })?.name;
    const errMsg = (err as { message?: string })?.message;

    if (errName === 'AbortError') {
      return {
        success: false,
        error: 'TIMEOUT',
        message:
          'Permintaan pendaftaran timeout (melebihi 12 detik). Mohon periksa koneksi internet Anda dan coba kembali.',
      };
    }

    if (errMsg) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: errMsg || 'Gagal terhubung ke server pendaftaran. Silakan coba kembali nanti.',
      };
    }

    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      message: 'Terjadi kesalahan yang tidak terduga. Silakan coba kembali nanti.',
    };
  }
}
