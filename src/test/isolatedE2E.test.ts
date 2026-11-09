import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequestPost } from '../../functions/api/register-tester';

describe('SLEEPYKOALA ISOLATED END-TO-END REGISTRATION TEST', () => {
  const TEST_ENV = {
    GAS_WEBAPP_URL: 'https://script.google.com/macros/s/AKfycbyscqhf7zXa_nicKM-fMxYhQ5Kq5vTUFJK0aGqVViAehuTzbAm-yW9bw4gAnl1AhuI26g/exec',
    APPS_SCRIPT_SECRET: 'test-isolated-secret-token-b65792c30dfa48d8b92b',
  };

  // Simulated isolated test database table (emulates Google Sheets "TesterRegistrations" tab)
  let testSheetRows: Array<Record<string, unknown>> = [];

  beforeEach(() => {
    vi.restoreAllMocks();
    testSheetRows = [
      {
        timestamp: '2026-10-31 12:00:00',
        projectId: 'mobile-kasir',
        projectName: 'Mobile Kasir',
        testerName: 'Existing Tester',
        testerEmail: 'existing.tester@gmail.com',
        status: 'PENDING_INVITE',
        appVersion: '0.9.2-beta',
        clientIpMasked: '180.252.xxx.xxx',
        userAgent: 'Mozilla/5.0 ...',
        notes: 'Notifikasi email terkirim ke zweifeel@gmail.com',
      },
    ];
  });

  // Emulates the exact Apps Script doPost(e) contract from backend/test_gas/Code.gs
  const simulateTestAppsScriptDoPost = (payload: Record<string, unknown>) => {
    // 1. Secret verification
    if (!payload.secretToken || payload.secretToken !== TEST_ENV.APPS_SCRIPT_SECRET) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Autentikasi handshake tidak valid.',
        }),
        { status: 401 }
      );
    }

    // 2. Duplicate check
    const isDuplicate = testSheetRows.some(
      (r) =>
        r.projectId === payload.projectId &&
        String(r.testerEmail).toLowerCase() === String(payload.testerEmail).toLowerCase()
    );

    if (isDuplicate) {
      return new Response(
        JSON.stringify({
          success: true,
          isDuplicate: true,
          message: 'Email Anda sudah terdaftar dalam antrean closed testing.',
          maskedEmail: 'ex***@gmail.com',
        }),
        { status: 200 }
      );
    }

    const isEmailFailure =
      payload.simulateEmailFailure === true ||
      String(payload.testerEmail).includes('email.fail');

    // 3. Database append (Google Sheets)
    const newRow = {
      timestamp: '2026-10-31 12:30:00',
      projectId: payload.projectId,
      projectName: payload.projectName,
      testerName: payload.testerName,
      testerEmail: payload.testerEmail,
      status: 'PENDING_INVITE',
      appVersion: payload.appVersion,
      clientIpMasked: payload.clientIpMasked,
      userAgent: payload.userAgent,
      notes: isEmailFailure
        ? 'Registrasi tersimpan di database. Catatan: Gagal kirim email: Simulated Gmail quota exceeded'
        : 'Notifikasi email disimulasikan ke zweifeel@gmail.com',
    };
    testSheetRows.push(newRow);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Pendaftaran closed testing berhasil diterima!',
        projectId: payload.projectId,
      }),
      { status: 200 }
    );
  };

  it('1. Registrasi valid: CF Function meneruskan, Apps Script menyimpan ke Sheets, browser menerima 200 OK', async () => {
    const initialRowCount = testSheetRows.length;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      const body = JSON.parse(init?.body as string);
      return simulateTestAppsScriptDoPost(body);
    });

    const request = new Request('http://localhost/api/register-tester', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cf-connecting-ip': '114.122.45.89',
        'user-agent': 'Chrome/130.0.0.0 Android 14',
      },
      body: JSON.stringify({
        testerName: 'Budi Test Santoso',
        testerEmail: 'budi.test@gmail.com',
        projectId: 'mobile-kasir',
        projectName: 'Mobile Kasir',
        appVersion: '0.9.2-beta',
      }),
    });

    const response = await onRequestPost({ request, env: TEST_ENV });
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('berhasil');

    // Bukti data benar-benar tersimpan di database pengujian
    expect(testSheetRows.length).toBe(initialRowCount + 1);
    const saved = testSheetRows[testSheetRows.length - 1];
    expect(saved.testerName).toBe('Budi Test Santoso');
    expect(saved.testerEmail).toBe('budi.test@gmail.com');
    expect(saved.clientIpMasked).toBe('114.122.xxx.xxx');
  });

  it('2. Registrasi dengan email tidak valid: Ditolak di layer Cloudflare Function (400)', async () => {
    const initialRowCount = testSheetRows.length;
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const request = new Request('http://localhost/api/register-tester', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testerName: 'Dewi Lestari',
        testerEmail: 'bukan-email-valid',
      }),
    });

    const response = await onRequestPost({ request, env: TEST_ENV });
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('VALIDATION_ERROR');

    // Membuktikan Apps Script tidak dipanggil dan tidak ada data bertambah
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(testSheetRows.length).toBe(initialRowCount);
  });

  it('3. Nama kosong: Ditolak di layer Cloudflare Function (400)', async () => {
    const initialRowCount = testSheetRows.length;
    const request = new Request('http://localhost/api/register-tester', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testerName: '   ',
        testerEmail: 'dewi@gmail.com',
      }),
    });

    const response = await onRequestPost({ request, env: TEST_ENV });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(testSheetRows.length).toBe(initialRowCount);
  });

  it('4. Field wajib kosong: Ditolak di layer Cloudflare Function (400)', async () => {
    const request = new Request('http://localhost/api/register-tester', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await onRequestPost({ request, env: TEST_ENV });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('VALIDATION_ERROR');
  });

  it('5. Email duplikat: Buktikan respons isDuplicate true dan TIDAK ADA baris bertambah', async () => {
    const initialRowCount = testSheetRows.length;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      const body = JSON.parse(init?.body as string);
      return simulateTestAppsScriptDoPost(body);
    });

    const request = new Request('http://localhost/api/register-tester', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testerName: 'Existing Tester',
        testerEmail: 'existing.tester@gmail.com',
        projectId: 'mobile-kasir',
      }),
    });

    const response = await onRequestPost({ request, env: TEST_ENV });
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.isDuplicate).toBe(true);

    // Buktikan tidak ada baris tambahan di Google Sheets
    expect(testSheetRows.length).toBe(initialRowCount);
  });

  it('6. Honeypot terisi: Silent pass 200 OK tanpa memanggil upstream', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const request = new Request('http://localhost/api/register-tester', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testerName: 'Spam Bot',
        testerEmail: 'bot@spam.com',
        honeypot: 'i-am-a-bot',
      }),
    });

    const response = await onRequestPost({ request, env: TEST_ENV });
    expect(response.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('7. Secret salah: Upstream Apps Script menolak dengan 401 UNAUTHORIZED', async () => {
    const initialRowCount = testSheetRows.length;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      const body = JSON.parse(init?.body as string);
      return simulateTestAppsScriptDoPost(body);
    });

    // Request dengan secret yang salah di environment
    const request = new Request('http://localhost/api/register-tester', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testerName: 'Intruder',
        testerEmail: 'intruder@test.com',
      }),
    });

    const response = await onRequestPost({
      request,
      env: { ...TEST_ENV, APPS_SCRIPT_SECRET: 'wrong-secret-token' },
    });

    expect(response.status).toBe(400); // Proxy forwards client status 400 for errors
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('UNAUTHORIZED');

    // Membuktikan tidak ada baris yang tersimpan
    expect(testSheetRows.length).toBe(initialRowCount);
  });

  it('8. JSON rusak: Ditolak 400 INVALID_JSON', async () => {
    const request = new Request('http://localhost/api/register-tester', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ broken json: true ',
    });

    const response = await onRequestPost({ request, env: TEST_ENV });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('INVALID_JSON');
  });

  it('9. Payload terlalu besar: Ditolak 413 PAYLOAD_TOO_LARGE', async () => {
    const request = new Request('http://localhost/api/register-tester', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'content-length': '70000',
      },
      body: JSON.stringify({ testerName: 'Big', testerEmail: 'big@gmail.com' }),
    });

    const response = await onRequestPost({ request, env: TEST_ENV });
    expect(response.status).toBe(413);
    const data = await response.json();
    expect(data.error).toBe('PAYLOAD_TOO_LARGE');
  });

  it('10. Apps Script timeout atau tidak tersedia: Mengembalikan 502 TIMEOUT secara aman', async () => {
    const abortErr = new Error('Upstream timeout');
    abortErr.name = 'AbortError';
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(abortErr);

    const request = new Request('http://localhost/api/register-tester', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testerName: 'Timeout User',
        testerEmail: 'timeout@gmail.com',
      }),
    });

    const response = await onRequestPost({ request, env: TEST_ENV });
    expect(response.status).toBe(502);
    const data = await response.json();
    expect(data.error).toBe('TIMEOUT');
  });

  it('11. Simulasi kegagalan notifikasi email: Buktikan data TETAP TERSIMPAN di database pengujian', async () => {
    const initialRowCount = testSheetRows.length;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      const body = JSON.parse(init?.body as string);
      return simulateTestAppsScriptDoPost(body);
    });

    const request = new Request('http://localhost/api/register-tester', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cf-connecting-ip': '202.158.10.22',
      },
      body: JSON.stringify({
        testerName: 'Email Fail Tester',
        testerEmail: 'email.fail@gmail.com',
        projectId: 'mobile-kasir',
        simulateEmailFailure: true,
      }),
    });

    const response = await onRequestPost({ request, env: TEST_ENV });
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);

    // BUKTI UTAMA: Data tetap tersimpan di database meskipun pengiriman notifikasi email gagal!
    expect(testSheetRows.length).toBe(initialRowCount + 1);
    const saved = testSheetRows[testSheetRows.length - 1];
    expect(saved.testerEmail).toBe('email.fail@gmail.com');
    expect(saved.notes).toContain('Registrasi tersimpan di database. Catatan: Gagal kirim email: Simulated Gmail quota exceeded');
  });
});
