/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — CLOSED TESTING REGISTRATION BACKEND
 * Google Apps Script Web App
 * Target Project: Mobile Kasir (and future Google Play apps)
 * 
 * Free Forever Architecture:
 * - Google Sheets (Database)
 * - Gmail MailApp (Owner Notification)
 * - Cloudflare Pages Functions (Same-Origin Proxy Handshake)
 * ============================================================================
 */

// Konfigurasi Default (Dapat ditimpa via Script Properties)
var DEFAULT_CONFIG = {
  SHEET_NAME: "TesterRegistrations",
  NOTIFICATION_EMAIL: "zweifeel@gmail.com",
  STUDIO_NAME: "SleepyKoala Studio (Test Environment)",
  TEST_SECRET: "966fdd41c80f47ae68094383345027999daaa964446a27940cbb3da2ade02d9c",
  TESTING_DAYS_REQUIREMENT: 14,
  MAX_PAYLOAD_BYTES: 50000 // 50 KB
};

/**
 * Health check endpoint (GET)
 */
function doGet(e) {
  if (e && e.parameter && e.parameter.action === "CMS_GET_PROJECTS") {
    return handleCmsGetProjects({ isPublicOnly: true });
  }

  var responseData = {
    status: "ONLINE",
    service: "SleepyKoala Closed Testing Registration API",
    studio: DEFAULT_CONFIG.STUDIO_NAME,
    timestamp: new Date().toISOString(),
    version: "2.0.0"
  };

  return ContentService.createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Main registration handler (POST)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  var lockAcquired = false;

  try {
    // 1. Verifikasi Data Masuk
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse(false, "BAD_REQUEST", "Tidak ada payload data yang diterima.");
    }

    if (e.postData.contents.length > DEFAULT_CONFIG.MAX_PAYLOAD_BYTES) {
      return createJsonResponse(false, "PAYLOAD_TOO_LARGE", "Ukuran payload melebihi batas 50KB.");
    }

    // 2. Parse JSON Payload
    var payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return createJsonResponse(false, "INVALID_JSON", "Format JSON tidak valid.");
    }

    // Routing Aksi CMS jika payload.action didefinisikan (PoC Milestone 3.1 & Gate 1A)
    // CMS Actions menggunakan signed M2M verification via routeCmsAction
    if (payload.action) {
      return routeCmsAction(payload);
    }

    // 3. Verifikasi Shared Secret Handshake untuk pendaftaran biasa (payload.secretToken)
    var scriptProperties = PropertiesService.getScriptProperties();
    var expectedSecret = scriptProperties.getProperty("APPS_SCRIPT_SECRET") || DEFAULT_CONFIG.TEST_SECRET;

    if (!expectedSecret || expectedSecret.trim() === "") {
      console.error("[Security Configuration] APPS_SCRIPT_SECRET belum diatur di Script Properties.");
      return createJsonResponse(false, "SERVER_CONFIG_ERROR", "Konfigurasi keamanan server backend belum lengkap.");
    }

    var incomingSecret = typeof payload.secretToken === "string" ? payload.secretToken.trim() : "";

    if (!incomingSecret || incomingSecret !== expectedSecret.trim()) {
      // Log audit keamanan tanpa mencatat nilai secret token apa pun
      console.warn("[Security] Autentikasi handshake ditolak: secretToken kosong, tidak tersedia, atau tidak cocok.");
      return createJsonResponse(false, "UNAUTHORIZED", "Autentikasi handshake tidak valid.");
    }

    // 4. Perlindungan Honeypot (Anti-Bot)
    if (payload.honeypot && String(payload.honeypot).trim().length > 0) {
      console.warn("[Spam Protection] Bot terdeteksi via honeypot field. Silent reject.");
      // Berikan respons sukses palsu agar bot tidak mengulang request
      return createJsonResponse(true, null, "Pendaftaran berhasil diterima.");
    }

    // 5. Validasi & Normalisasi Field Pendaftaran
    var testerName = cleanString(payload.testerName || "", 100);
    var testerEmail = cleanString(payload.testerEmail || "", 120).toLowerCase();
    var projectId = cleanString(payload.projectId || "mobile-kasir", 50).toLowerCase();
    var projectName = cleanString(payload.projectName || "Mobile Kasir", 100);
    var appVersion = cleanString(payload.appVersion || "-", 30);
    var clientIpMasked = cleanString(payload.clientIpMasked || "CLIENT_PROXY", 50);
    var userAgent = cleanString(payload.userAgent || "-", 200);

    if (!testerName || testerName.length < 2) {
      return createJsonResponse(false, "VALIDATION_ERROR", "Nama lengkap penguji wajib diisi (minimal 2 karakter).");
    }

    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!testerEmail || !emailRegex.test(testerEmail)) {
      return createJsonResponse(false, "VALIDATION_ERROR", "Format alamat email Google Play tidak valid.");
    }

    // 6. Ambil Kunci Lock (Concurrency Protection)
    // Tunggu maksimal 10 detik agar tidak ada race condition saat memeriksa duplikat & append
    lockAcquired = lock.tryLock(10000);
    if (!lockAcquired) {
      console.warn("[Concurrency] Gagal mendapatkan script lock dalam 10 detik.");
      return createJsonResponse(false, "SERVER_BUSY", "Server sedang memproses antrean pendaftaran. Silakan coba kembali dalam beberapa detik.");
    }

    // 7. Akses Google Sheets (Database)
    var spreadsheet = getTargetSpreadsheet();
    var sheet = getOrCreateSheet(spreadsheet, DEFAULT_CONFIG.SHEET_NAME);

    // 8. Cek Duplikasi Registrasi (ProjectId + TesterEmail)
    var isDuplicate = checkIfDuplicate(sheet, projectId, testerEmail);
    if (isDuplicate) {
      console.info("[Duplicate] Email sudah terdaftar untuk proyek ini: " + maskEmail(testerEmail));
      return createJsonResponse(true, null, "Email Anda sudah terdaftar dalam daftar antrean closed testing " + projectName + ". Anda akan dihubungi melalui email saat akses dibuka.", {
        isDuplicate: true,
        projectId: projectId,
        maskedEmail: maskEmail(testerEmail)
      });
    }

    // 9. Append Data ke Google Sheets
    // Catatan Arsitektur: Penyimpanan Sheets & Pengiriman Email BUKAN transaksi atomik.
    // Kami simpan baris pendaftaran terlebih dahulu dengan status 'PENDING_NOTIFICATION'.
    var timestampStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
    var rowData = [
      timestampStr,
      projectId,
      projectName,
      testerName,
      testerEmail,
      "PENDING_INVITE",
      appVersion,
      clientIpMasked,
      userAgent,
      "Tersimpan di database (Memproses notifikasi)"
    ];

    sheet.appendRow(rowData);
    var lastRow = sheet.getLastRow();

    // 10. Pengiriman Notifikasi Email ke Pemilik (zweifeel@gmail.com)
    var targetOwnerEmail = scriptProperties.getProperty("NOTIFICATION_EMAIL") || DEFAULT_CONFIG.NOTIFICATION_EMAIL;
    var emailNotificationSuccess = false;
    var emailErrorNote = "";

    try {
      var remainingQuota = MailApp.getRemainingDailyQuota();
      if (remainingQuota > 0) {
        sendOwnerNotificationEmail(targetOwnerEmail, {
          timestamp: timestampStr,
          projectName: projectName,
          projectId: projectId,
          testerName: testerName,
          testerEmail: testerEmail,
          appVersion: appVersion,
          simulateEmailFailure: payload.simulateEmailFailure === true
        });
        emailNotificationSuccess = true;
      } else {
        emailErrorNote = "Email kuota harian habis (" + remainingQuota + " tersisa)";
        console.warn("[MailApp Quota] " + emailErrorNote);
      }
    } catch (mailErr) {
      emailErrorNote = "Gagal kirim email: " + mailErr.message;
      console.error("[MailApp Error] " + emailErrorNote);
    }

    // Perbarui kolom Catatan (Kolom ke-10) di Google Sheets dengan status email aktual
    var finalNote = emailNotificationSuccess 
      ? "Notifikasi email terkirim ke " + targetOwnerEmail
      : "Registrasi tersimpan di database. Catatan: " + emailErrorNote;

    sheet.getRange(lastRow, 10).setValue(finalNote);

    console.info("[Success] Pendaftaran berhasil dicatat untuk: " + maskEmail(testerEmail));

    return createJsonResponse(true, null, "Pendaftaran closed testing berhasil diterima! Terima kasih telah bersedia menguji " + projectName + ".", {
      projectId: projectId,
      maskedEmail: maskEmail(testerEmail),
      timestamp: timestampStr
    });

  } catch (globalErr) {
    console.error("[Unhandled Exception] " + globalErr.toString());
    return createJsonResponse(false, "INTERNAL_ERROR", "Terjadi kendala pada server backend. Silakan coba kembali nanti.");
  } finally {
    if (lockAcquired) {
      try {
        lock.releaseLock();
      } catch (e) {
        // Abaikan
      }
    }
  }
}

/**
 * Mendapatkan Spreadsheet yang aktif atau via SPREADSHEET_ID script property
 */
function getTargetSpreadsheet() {
  var scriptProperties = PropertiesService.getScriptProperties();
  var customSpreadsheetId = scriptProperties.getProperty("SPREADSHEET_ID");

  if (customSpreadsheetId && customSpreadsheetId.trim() !== "") {
    return SpreadsheetApp.openById(customSpreadsheetId.trim());
  }

  // Jika script ditempel langsung pada Google Sheets (Container-Bound)
  try {
    var activeSheet = SpreadsheetApp.getActiveSpreadsheet();
    if (activeSheet) return activeSheet;
  } catch (e) {
    // Abaikan jika standalone
  }

  throw new Error("ID Google Sheets belum diatur. Silakan atur SPREADSHEET_ID di Script Properties atau pasang script pada container sheet.");
}

/**
 * Mengambil atau membuat sheet tab baru jika belum ada, lengkap dengan header & format
 */
function getOrCreateSheet(spreadsheet, sheetName) {
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  // Jika sheet baru dibuat atau sheet yang sudah ada masih kosong (belum ada header baris 1)
  if (sheet.getLastRow() === 0) {
    var headers = [
      "Timestamp (WIB)",
      "Project ID",
      "Project Name",
      "Tester Name",
      "Tester Email (Google Play)",
      "Status",
      "App Version",
      "Client IP (Masked)",
      "User Agent",
      "System & Delivery Notes"
    ];

    sheet.appendRow(headers);

    // Format Header Baris 1
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#0F172A");
    headerRange.setFontColor("#38BDF8");
    headerRange.setFontWeight("bold");
    headerRange.setFontFamily("Consolas");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);

    // Auto-fit column widths
    for (var i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
  }
  return sheet;
}

/**
 * Memeriksa apakah Project ID + Email sudah terdaftar sebelumnya
 */
function checkIfDuplicate(sheet, projectId, testerEmail) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;

  // Baca Kolom 2 (Project ID) dan Kolom 5 (Tester Email)
  // getRange(row, col, numRows, numCols)
  var projectIds = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  var testerEmails = sheet.getRange(2, 5, lastRow - 1, 1).getValues();

  for (var i = 0; i < projectIds.length; i++) {
    var existingProjectId = String(projectIds[i][0]).toLowerCase().trim();
    var existingEmail = String(testerEmails[i][0]).toLowerCase().trim();

    if (existingProjectId === projectId && existingEmail === testerEmail) {
      return true;
    }
  }

  return false;
}

/**
 * Mengirim notifikasi email berformat HTML profesional ke developer
 */
function sendOwnerNotificationEmail(ownerEmail, data) {
  var subject = "[SleepyKoala] Pendaftaran Tester Baru: " + data.projectName + " — " + data.testerName;

  var htmlBody = "" +
    "<div style='background-color:#090B11; color:#FAFAF9; font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif; padding:24px; border-radius:12px; max-width:600px; margin:0 auto; border:1px solid #1E293B;'>" +
      "<div style='border-bottom:1px solid #1E293B; padding-bottom:16px; margin-bottom:20px;'>" +
        "<h2 style='color:#38BDF8; margin:0 0 4px 0; font-size:20px; font-weight:700;'>SleepyKoala Studio — Closed Testing</h2>" +
        "<p style='color:#94A3B8; font-size:12px; margin:0;'>Pendaftaran Penguji Baru untuk Google Play Console</p>" +
      "</div>" +

      "<div style='background-color:#0F172A; border:1px solid #1E293B; border-radius:8px; padding:16px; margin-bottom:20px;'>" +
        "<table style='width:100%; border-collapse:collapse; font-size:13px; color:#E2E8F0;'>" +
          "<tr><td style='color:#94A3B8; padding:6px 0; width:140px;'>Proyek Target:</td><td style='font-weight:600; color:#38BDF8;'>" + data.projectName + " (" + data.projectId + ")</td></tr>" +
          "<tr><td style='color:#94A3B8; padding:6px 0;'>Nama Penguji:</td><td style='font-weight:600; color:#FAFAF9;'>" + data.testerName + "</td></tr>" +
          "<tr><td style='color:#94A3B8; padding:6px 0;'>Email Google Play:</td><td style='font-family:monospace; color:#34D399; font-weight:bold;'>" + data.testerEmail + "</td></tr>" +
          "<tr><td style='color:#94A3B8; padding:6px 0;'>Versi Aplikasi:</td><td>" + data.appVersion + "</td></tr>" +
          "<tr><td style='color:#94A3B8; padding:6px 0;'>Waktu Registrasi:</td><td>" + data.timestamp + " WIB</td></tr>" +
        "</table>" +
      "</div>" +

      "<div style='background-color:#131B2E; border-left:4px solid #38BDF8; padding:12px 16px; border-radius:4px; margin-bottom:24px;'>" +
        "<p style='font-size:12px; color:#CBD5E1; margin:0; line-height:1.5;'>" +
          "<strong>Tindakan yang Perlu Dilakukan:</strong><br/>" +
          "1. Buka <strong>Google Play Console</strong> &rarr; Pilih aplikasi <strong>" + data.projectName + "</strong>.<br/>" +
          "2. Masuk ke menu <strong>Pengujian &rarr; Pengujian Tertutup (Closed Testing)</strong>.<br/>" +
          "3. Masukkan email <code>" + data.testerEmail + "</code> ke daftar email penguji.<br/>" +
          "4. Kirim tautan instalasi (web/opt-in link) kepada penguji untuk memulai periode uji 14 hari." +
        "</p>" +
      "</div>" +

      "<div style='border-top:1px solid #1E293B; padding-top:16px; font-size:11px; color:#64748B; text-align:center;'>" +
        "Sistem Otomatis SleepyKoala Studio &bull; Google Apps Script &bull; Cloudflare Pages Functions" +
      "</div>" +
    "</div>";

  MailApp.sendEmail({
    to: ownerEmail,
    subject: subject,
    htmlBody: htmlBody
  });
}

/**
 * Utility Sanitasi String
 */
function cleanString(str, maxLen) {
  if (typeof str !== "string") str = String(str || "");
  var cleaned = str.replace(/[\x00-\x1F\x7F]/g, "").trim();
  if (cleaned.length > maxLen) {
    cleaned = cleaned.substring(0, maxLen);
  }
  return cleaned;
}

/**
 * Mask email untuk keamanan log dan response
 */
function maskEmail(email) {
  var parts = email.split("@");
  if (parts.length !== 2) return "***@***";
  var name = parts[0];
  var domain = parts[1];
  var maskedName = name.length > 2 
    ? name.substring(0, 2) + "***" 
    : name.substring(0, 1) + "***";
  return maskedName + "@" + domain;
}

/**
 * Helper pembuat TextOutput JSON standar
 */
function createJsonResponse(success, error, message, extraData) {
  var out = {
    success: success,
    error: error || null,
    message: message || ""
  };

  if (extraData) {
    for (var key in extraData) {
      if (extraData.hasOwnProperty(key)) {
        out[key] = extraData[key];
      }
    }
  }

  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Fungsi Pengujian Mandiri (Dapat dijalankan langsung di Apps Script Editor)
 */
function testSetupAndPermissions() {
  console.log("=== Memulai Uji Mandiri SleepyKoala Backend ===");

  var spreadsheet = getTargetSpreadsheet();
  console.log("Spreadsheet terhubung: " + spreadsheet.getName() + " (ID: " + spreadsheet.getId() + ")");

  var sheet = getOrCreateSheet(spreadsheet, DEFAULT_CONFIG.SHEET_NAME);
  console.log("Sheet tab siap: " + sheet.getName() + ", Total baris: " + sheet.getLastRow());

  var quota = MailApp.getRemainingDailyQuota();
  console.log("Sisa kuota harian Gmail MailApp: " + quota);

  var scriptProperties = PropertiesService.getScriptProperties();
  var secretConfigured = scriptProperties.getProperty("APPS_SCRIPT_SECRET");
  if (secretConfigured && secretConfigured.trim().length > 0) {
    console.log("Status APPS_SCRIPT_SECRET: Terkonfigurasi dengan aman.");
  } else {
    console.warn("Peringatan: APPS_SCRIPT_SECRET belum diatur di Script Properties!");
  }

  console.log("=== Uji Mandiri Selesai — Backend Siap Digunakan ===");
}


/**
 * Diagnostic helper to read test database content for E2E verification
 */
function getTestDatabaseStatus() {
  var spreadsheet = getTargetSpreadsheet();
  var sheet = spreadsheet.getSheetByName(DEFAULT_CONFIG.SHEET_NAME);
  if (!sheet) return { exists: false, rowCount: 0, rows: [] };
  var lastRow = sheet.getLastRow();
  var rows = lastRow > 0 ? sheet.getRange(1, 1, lastRow, 10).getValues() : [];
  return {
    exists: true,
    sheetName: sheet.getName(),
    rowCount: lastRow,
    rows: rows
  };
}

/**
 * ============================================================================
 * SLEEPYKOALA — ISOLATED GOOGLE PLAY SYNC MODULE (TEST ENVIRONMENT)
 * Target Exclusive: Mobile Kasir (com.aistudio.kasirku.pmzxtw)
 * ============================================================================
 */

var PLAY_SYNC_CONFIG = {
  ALLOWED_PACKAGE: "com.aistudio.kasirku.pmzxtw",
  PROJECT_SLUG: "mobile-kasir",
  LISTINGS_SHEET_NAME: "PlayStoreListings",
  LOGS_SHEET_NAME: "PlayStoreSyncLogs",
  DEFAULT_LOCALE: "id-ID"
};

/**
 * Tab PlayStoreListings: Menyimpan metadata toko hasil sinkronisasi
 */
function getOrCreatePlayStoreListingsSheet(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(PLAY_SYNC_CONFIG.LISTINGS_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(PLAY_SYNC_CONFIG.LISTINGS_SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    var headers = [
      "Last Synced (WIB)",
      "Package Name",
      "Project Slug",
      "Play Store Title",
      "Short Description",
      "Full Description",
      "Language (Locale)",
      "Icon URL",
      "Feature Graphic URL",
      "Screenshots JSON",
      "Promo Video URL",
      "Sync Status",
      "Audit Notes"
    ];

    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#0F172A");
    headerRange.setFontColor("#38BDF8");
    headerRange.setFontWeight("bold");
    headerRange.setFontFamily("Consolas");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);

    for (var i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
  }

  return sheet;
}

/**
 * Tab PlayStoreSyncLogs: Mencatat riwayat audit eksekusi
 */
function getOrCreatePlayStoreSyncLogsSheet(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(PLAY_SYNC_CONFIG.LOGS_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(PLAY_SYNC_CONFIG.LOGS_SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    var headers = [
      "Timestamp (WIB)",
      "Trigger Type",
      "Target Package",
      "Status",
      "Edit Session ID (Masked)",
      "Edit Session Cleaned Up",
      "Error Summary"
    ];

    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#0F172A");
    headerRange.setFontColor("#34D399");
    headerRange.setFontWeight("bold");
    headerRange.setFontFamily("Consolas");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);

    for (var i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
  }

  return sheet;
}

/**
 * Fungsi Utama: Sinkronisasi manual listing Google Play untuk package tertentu
 * Target eksklusif: com.aistudio.kasirku.pmzxtw
 */
function syncGooglePlayListingForPackage(targetPackage, customOptions) {
  var options = customOptions || {};
  var lock = LockService.getScriptLock();
  var lockAcquired = false;

  var spreadsheet = getTargetSpreadsheet();
  var listingsSheet = getOrCreatePlayStoreListingsSheet(spreadsheet);
  var logsSheet = getOrCreatePlayStoreSyncLogsSheet(spreadsheet);

  var timestampStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
  var editSessionId = null;
  var activeAccessToken = null;
  var editCleanedUp = false;
  var syncSuccess = false;
  var errorSummary = "";

  try {
    // 1. Validasi Batasan Sasaran (Strict Target Check)
    if (targetPackage !== PLAY_SYNC_CONFIG.ALLOWED_PACKAGE) {
      throw new Error("Target package tidak diizinkan. Sinkronisasi terbatas hanya untuk: " + PLAY_SYNC_CONFIG.ALLOWED_PACKAGE);
    }

    // 2. Proteksi Concurrency
    lockAcquired = lock.tryLock(30000); // 30 detik
    if (!lockAcquired) {
      throw new Error("Proses sinkronisasi lain sedang berjalan. Mohon tunggu beberapa saat.");
    }

    console.info("[PlaySync] Memulai sinkronisasi terisolasi untuk: " + targetPackage);

    // 3. Eksekusi Pembacaan Data (Mock / Live Provider)
    var listingData;
    if (options.mockProvider) {
      listingData = options.mockProvider(targetPackage);
    } else {
      // Pembacaan via Service Account jika tersedia di Script Properties
      listingData = fetchLiveGooglePlayListing(targetPackage, function(createdEditId, token) {
        editSessionId = createdEditId;
        activeAccessToken = token;
      });
    }

    if (!listingData || !listingData.title) {
      throw new Error("Data listing yang diterima tidak lengkap dari Google Play API.");
    }

    // 4. Simpan / Perbarui Data ke Tab PlayStoreListings (Upsert Tanpa Duplikasi)
    upsertPlayStoreListingRow(listingsSheet, {
      timestamp: timestampStr,
      packageName: targetPackage,
      projectSlug: PLAY_SYNC_CONFIG.PROJECT_SLUG,
      title: listingData.title,
      shortDescription: listingData.shortDescription || "",
      fullDescription: listingData.fullDescription || "",
      language: listingData.language || PLAY_SYNC_CONFIG.DEFAULT_LOCALE,
      iconUrl: listingData.iconUrl || "",
      featureGraphicUrl: listingData.featureGraphicUrl || "",
      screenshotsJson: JSON.stringify(listingData.screenshots || []),
      videoUrl: listingData.videoUrl || "",
      syncStatus: "SYNCED",
      notes: "Sinkronisasi berhasil pada " + timestampStr
    });

    syncSuccess = true;
    console.info("[PlaySync] Berhasil memperbarui listing: " + listingData.title);

    return {
      success: true,
      packageName: targetPackage,
      title: listingData.title,
      timestamp: timestampStr
    };

  } catch (err) {
    errorSummary = err.message || String(err);
    console.error("[PlaySync Error] " + errorSummary);

    // Catat status kegagalan di tab listing tanpa menghapus data lama yang masih valid
    recordPlaySyncFailure(listingsSheet, targetPackage, errorSummary, timestampStr);

    return {
      success: false,
      packageName: targetPackage,
      error: errorSummary,
      timestamp: timestampStr
    };

  } finally {
    // 5. Jaminan Pembersihan Edit Session (Anti-Commit)
    if (editSessionId) {
      try {
        if (options.deleteEditSessionHandler) {
          options.deleteEditSessionHandler(targetPackage, editSessionId);
        } else {
          deleteLiveEditSession(targetPackage, editSessionId, activeAccessToken);
        }
        editCleanedUp = true;
        console.info("[PlaySync Cleanup] Edit session berhasil dibersihkan: " + maskEditId(editSessionId));
      } catch (cleanErr) {
        console.warn("[PlaySync Cleanup Warning] Gagal membersihkan edit session: " + cleanErr.message);
      }
    } else {
      editCleanedUp = true; // Tidak ada sesi yang dibuka
    }

    // 6. Pencatatan Log Audit
    logsSheet.appendRow([
      timestampStr,
      options.triggerType || "MANUAL_TEST",
      targetPackage,
      syncSuccess ? "SUCCESS" : "FAILED",
      editSessionId ? maskEditId(editSessionId) : "-",
      editCleanedUp ? "TRUE" : "FALSE",
      errorSummary || "Nol error (Sinkronisasi lancar)"
    ]);

    if (lockAcquired) {
      lock.releaseLock();
    }
  }
}

/**
 * Upsert data ke sheet PlayStoreListings: Update jika sudah ada, append jika baru
 */
function upsertPlayStoreListingRow(sheet, data) {
  var lastRow = sheet.getLastRow();
  var targetRow = -1;

  if (lastRow > 1) {
    var packageColumn = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    for (var i = 0; i < packageColumn.length; i++) {
      if (String(packageColumn[i][0]).trim() === data.packageName) {
        targetRow = i + 2;
        break;
      }
    }
  }

  var rowValues = [
    data.timestamp,
    data.packageName,
    data.projectSlug,
    data.title,
    data.shortDescription,
    data.fullDescription,
    data.language,
    data.iconUrl,
    data.featureGraphicUrl,
    data.screenshotsJson,
    data.videoUrl,
    data.syncStatus,
    data.notes
  ];

  if (targetRow > 0) {
    // Update baris eksisting
    sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    // Tambah baris baru
    sheet.appendRow(rowValues);
  }
}

/**
 * Catat kegagalan sinkronisasi tanpa menimpa data lama yang masih valid
 */
function recordPlaySyncFailure(sheet, targetPackage, errorNote, timestampStr) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  var packageColumn = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  for (var i = 0; i < packageColumn.length; i++) {
    if (String(packageColumn[i][0]).trim() === targetPackage) {
      var row = i + 2;
      // Kolom 12: Sync Status, Kolom 13: Audit Notes
      sheet.getRange(row, 12).setValue("FAILED");
      sheet.getRange(row, 13).setValue("Percobaan gagal pada " + timestampStr + ": " + errorNote);
      break;
    }
  }
}

function maskEditId(editId) {
  if (!editId || editId.length < 6) return "***";
  return editId.substring(0, 3) + "***" + editId.substring(editId.length - 2);
}

/**
 * Sanitasi pesan error dari Google API agar tidak membocorkan data sensitif atau HTML mentah
 */
function sanitizeGoogleApiError(response, defaultMsg) {
  if (!response) return defaultMsg || "Tidak ada respon dari server.";
  var statusCode = response.getResponseCode();
  var sanitized = "HTTP " + statusCode;
  try {
    var rawText = response.getContentText();
    if (rawText && rawText.trim().charAt(0) === "{") {
      var parsed = JSON.parse(rawText);
      if (parsed.error) {
        if (typeof parsed.error === "string") {
          sanitized += ": " + parsed.error;
        } else if (parsed.error.message) {
          sanitized += ": " + parsed.error.message;
        }
      }
    }
  } catch (e) {
    // Abaikan kegagalan parsing JSON
  }
  return defaultMsg ? defaultMsg + " (" + sanitized + ")" : sanitized;
}

/**
 * Mendapatkan Access Token Google OAuth2 menggunakan Service Account Key
 * Memvalidasi struktur format kredensial dan menangani penolakan token secara aman.
 */
function getGooglePlayOAuthAccessToken(serviceAccount) {
  if (!serviceAccount || typeof serviceAccount !== "object") {
    throw new Error("Objek Service Account tidak valid.");
  }

  var clientEmail = serviceAccount.client_email;
  if (!clientEmail || typeof clientEmail !== "string" || clientEmail.trim() === "") {
    throw new Error("client_email tidak tersedia dalam Service Account key.");
  }

  var privateKey = serviceAccount.private_key;
  if (!privateKey || typeof privateKey !== "string" || privateKey.trim() === "") {
    throw new Error("private_key kosong atau tidak ditemukan dalam Service Account key.");
  }

  var now = Math.floor(Date.now() / 1000);
  var header = { alg: "RS256", typ: "JWT" };
  var claim = {
    iss: clientEmail.trim(),
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  };

  var base64Header = Utilities.base64EncodeWebSafe(JSON.stringify(header));
  var base64Claim = Utilities.base64EncodeWebSafe(JSON.stringify(claim));
  var toSign = base64Header + "." + base64Claim;

  var signatureBytes;
  try {
    signatureBytes = Utilities.computeRsaSha256Signature(toSign, privateKey);
  } catch (sigErr) {
    throw new Error("Gagal menandatangani JWT assertion: Format RSA private key tidak valid.");
  }

  var base64Signature = Utilities.base64EncodeWebSafe(signatureBytes);
  var jwtAssertion = toSign + "." + base64Signature;

  var tokenResponse = UrlFetchApp.fetch("https://oauth2.googleapis.com/token", {
    method: "post",
    contentType: "application/x-www-form-urlencoded",
    payload: {
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwtAssertion
    },
    muteHttpExceptions: true
  });

  var statusCode = tokenResponse.getResponseCode();
  if (statusCode !== 200) {
    var tokenErr = sanitizeGoogleApiError(tokenResponse, "Autentikasi token ditolak");
    throw new Error("Gagal memperoleh OAuth token dari Google OAuth2: " + tokenErr);
  }

  var tokenData;
  try {
    tokenData = JSON.parse(tokenResponse.getContentText());
  } catch (jsonErr) {
    throw new Error("Respon token Google OAuth2 bukan format JSON yang valid.");
  }

  if (!tokenData.access_token) {
    throw new Error("Access token tidak ditemukan dalam respon Google OAuth2.");
  }

  return tokenData.access_token;
}

/**
 * Mengambil metadata listing Google Play secara live via Android Publisher API v3
 */
function fetchLiveGooglePlayListing(targetPackage, onEditCreated) {
  if (targetPackage !== PLAY_SYNC_CONFIG.ALLOWED_PACKAGE) {
    throw new Error("Target package tidak diizinkan. Sinkronisasi terbatas hanya untuk: " + PLAY_SYNC_CONFIG.ALLOWED_PACKAGE);
  }

  var rawKey = PropertiesService.getScriptProperties().getProperty("PLAY_SERVICE_ACCOUNT_KEY");
  if (!rawKey || rawKey.trim() === "") {
    throw new Error("Service Account Google Play belum dikonfigurasi di Script Properties.");
  }

  var serviceAccount;
  try {
    serviceAccount = JSON.parse(rawKey);
  } catch (e) {
    throw new Error("Format PLAY_SERVICE_ACCOUNT_KEY tidak valid (bukan JSON yang valid).");
  }

  var accessToken = getGooglePlayOAuthAccessToken(serviceAccount);
  var baseUrl = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/" + targetPackage;

  // 1. Buka Edit Session (edits.insert)
  var editInsertResponse = UrlFetchApp.fetch(baseUrl + "/edits", {
    method: "post",
    headers: { Authorization: "Bearer " + accessToken },
    contentType: "application/json",
    payload: JSON.stringify({}),
    muteHttpExceptions: true
  });

  var insertCode = editInsertResponse.getResponseCode();
  if (insertCode === 401 || insertCode === 403) {
    throw new Error("Akses ditolak oleh Google Play API (HTTP " + insertCode + "). Pastikan Service Account memiliki izin minimal Edit Store Listing untuk aplikasi ini.");
  }
  if (insertCode === 404) {
    throw new Error("Aplikasi dengan package " + targetPackage + " tidak ditemukan di Google Play Console (HTTP 404).");
  }
  if (insertCode !== 200) {
    var editErr = sanitizeGoogleApiError(editInsertResponse, "Gagal membuka edit session Google Play");
    throw new Error(editErr);
  }

  var editData = JSON.parse(editInsertResponse.getContentText());
  var editId = editData.id;
  if (onEditCreated) {
    onEditCreated(editId, accessToken);
  }

  var editUrl = baseUrl + "/edits/" + editId;

  // 2. Ambil Listing (Bahasa id-ID atau default)
  var listingResponse = UrlFetchApp.fetch(editUrl + "/listings/" + PLAY_SYNC_CONFIG.DEFAULT_LOCALE, {
    method: "get",
    headers: { Authorization: "Bearer " + accessToken },
    muteHttpExceptions: true
  });

  if (listingResponse.getResponseCode() === 404) {
    listingResponse = UrlFetchApp.fetch(editUrl + "/listings/en-US", {
      method: "get",
      headers: { Authorization: "Bearer " + accessToken },
      muteHttpExceptions: true
    });
  }

  if (listingResponse.getResponseCode() !== 200) {
    var listErr = sanitizeGoogleApiError(listingResponse, "Gagal mengambil store listing");
    throw new Error(listErr);
  }

  var listingJson = JSON.parse(listingResponse.getContentText());

  // 3. Ambil Icon
  var iconUrl = "";
  var iconResponse = UrlFetchApp.fetch(editUrl + "/images/" + targetPackage + "/icon", {
    method: "get",
    headers: { Authorization: "Bearer " + accessToken },
    muteHttpExceptions: true
  });
  if (iconResponse.getResponseCode() === 200) {
    var iconData = JSON.parse(iconResponse.getContentText());
    if (iconData.images && iconData.images.length > 0) {
      iconUrl = iconData.images[0].url || "";
    }
  }

  // 4. Ambil Feature Graphic
  var featureGraphicUrl = "";
  var fgResponse = UrlFetchApp.fetch(editUrl + "/images/" + targetPackage + "/featureGraphic", {
    method: "get",
    headers: { Authorization: "Bearer " + accessToken },
    muteHttpExceptions: true
  });
  if (fgResponse.getResponseCode() === 200) {
    var fgData = JSON.parse(fgResponse.getContentText());
    if (fgData.images && fgData.images.length > 0) {
      featureGraphicUrl = fgData.images[0].url || "";
    }
  }

  // 5. Ambil Screenshots (Phone)
  var screenshots = [];
  var ssResponse = UrlFetchApp.fetch(editUrl + "/images/" + targetPackage + "/phoneScreenshots", {
    method: "get",
    headers: { Authorization: "Bearer " + accessToken },
    muteHttpExceptions: true
  });
  if (ssResponse.getResponseCode() === 200) {
    var ssData = JSON.parse(ssResponse.getContentText());
    if (ssData.images && Array.isArray(ssData.images)) {
      screenshots = ssData.images.map(function(img) { return img.url; }).filter(Boolean);
    }
  }

  return {
    title: listingJson.title || "",
    shortDescription: listingJson.shortDescription || "",
    fullDescription: listingJson.fullDescription || "",
    language: listingJson.language || PLAY_SYNC_CONFIG.DEFAULT_LOCALE,
    videoUrl: listingJson.video || "",
    iconUrl: iconUrl,
    featureGraphicUrl: featureGraphicUrl,
    screenshots: screenshots
  };
}

/**
 * Menghapus edit session (Anti-Commit Guarantee)
 */
function deleteLiveEditSession(targetPackage, editId, existingToken) {
  var accessToken = existingToken;
  if (!accessToken) {
    var rawKey = PropertiesService.getScriptProperties().getProperty("PLAY_SERVICE_ACCOUNT_KEY");
    if (!rawKey) return;

    var serviceAccount;
    try {
      serviceAccount = JSON.parse(rawKey);
    } catch (e) {
      return;
    }
    if (!serviceAccount || !serviceAccount.private_key || !serviceAccount.client_email) return;
    try {
      accessToken = getGooglePlayOAuthAccessToken(serviceAccount);
    } catch (tokErr) {
      return;
    }
  }

  var url = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/" + targetPackage + "/edits/" + editId;

  UrlFetchApp.fetch(url, {
    method: "delete",
    headers: { Authorization: "Bearer " + accessToken },
    muteHttpExceptions: true
  });
}




/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — WEB ADMIN / CMS PoC MODULE (TEST ENVIRONMENT)
 * Milestone 3.1: Security & Feasibility Proof of Concept
 * ============================================================================
 */

var CMS_CONFIG = {
  PROJECTS_SHEET_NAME: "CMS_Projects",
  LOGS_SHEET_NAME: "CMS_AuditLogs",
  MEDIA_SHEET_NAME: "CMS_Media",
  SETTINGS_SHEET_NAME: "CMS_Settings",
  COMPLIANCE_SHEET_NAME: "CMS_Compliance",
  AUTHORIZED_ADMIN_EMAIL: "zweifeel@gmail.com",
  OTP_EXPIRY_SECONDS: 300, // 5 menit
  OTP_COOLDOWN_SECONDS: 60, // 60 detik cooldown antar permintaan
  MAX_OTP_PER_HOUR: 5,
  MAX_OTP_PER_24H: 15, // Menjaga sisa kuota email untuk registrasi tester
  MAX_FAILED_ATTEMPTS: 3,
  MEDIA_FOLDER_NAME: "SleepyKoala_CMS_Media_TEST",
  ALLOWED_MEDIA_TYPES: ["image/webp", "image/png", "image/jpeg"],
  MAX_MEDIA_BYTES: 2097152, // 2 MB
  STORAGE_MODE: "LIVE_DRIVE", // "LIVE_DRIVE" | "MOCK"
  IS_LIVE_DRIVE_ACTIVE: true // GATE 2B LIVE: Akses Google Drive API diaktifkan untuk environment TEST
};

/**
 * Eksekusi dengan retry dan exponential backoff untuk panggilan Drive API
 */
function executeDriveWithRetry(operationFn, maxRetries, baseBackoffMs) {
  var retries = maxRetries || 3;
  var backoff = baseBackoffMs || 500;
  var lastErr = null;

  for (var attempt = 1; attempt <= retries; attempt++) {
    try {
      return operationFn();
    } catch (err) {
      lastErr = err;
      var errStr = String(err.message || err);
      var isTransient = errStr.indexOf("rateLimitExceeded") !== -1 ||
                        errStr.indexOf("userRateLimitExceeded") !== -1 ||
                        errStr.indexOf("backendError") !== -1 ||
                        errStr.indexOf("500") !== -1 ||
                        errStr.indexOf("503") !== -1 ||
                        errStr.indexOf("429") !== -1;

      if (!isTransient || attempt === retries) {
        throw err;
      }
      var sleepDuration = backoff * Math.pow(2, attempt - 1);
      Utilities.sleep(sleepDuration);
    }
  }
  throw lastErr;
}

/**
 * Memastikan Folder Root Media di Google Drive v3 Ada dan Terkelola
 * Menggunakan PropertiesService untuk menyimpan ID folder asli agar tidak membuat folder ganda.
 * Menegakkan aturan: MEDIA_FOLDER_ID wajib menyimpan ID asli, BUKAN nama folder.
 */
function getOrCreateTestMediaFolder() {
  var sp = PropertiesService.getScriptProperties();
  var folderId = sp.getProperty("MEDIA_FOLDER_ID");

  // Validasi: pastikan folderId bukan nama folder
  if (folderId && folderId === CMS_CONFIG.MEDIA_FOLDER_NAME) {
    console.warn("[Media Storage] MEDIA_FOLDER_ID bernilai nama folder, me-reset ke folder ID asli.");
    folderId = null;
    sp.deleteProperty("MEDIA_FOLDER_ID");
  }

  if (folderId) {
    try {
      var existingFolder = executeDriveWithRetry(function() {
        return Drive.Files.get(folderId, { fields: "id, name, trashed" });
      }, 2, 300);
      if (existingFolder && !existingFolder.trashed) {
        return folderId;
      }
    } catch (e) {
      console.warn("[Media Storage] Folder ID dari ScriptProperties tidak valid atau tidak dapat diakses: " + e.message);
    }
  }

  // Buat folder baru di bawah root Drive
  var folderMetadata = {
    name: CMS_CONFIG.MEDIA_FOLDER_NAME,
    mimeType: "application/vnd.google-apps.folder",
    description: "SleepyKoala CMS Test Media Root Folder (Scope: drive.file)"
  };

  var newFolder = executeDriveWithRetry(function() {
    return Drive.Files.create(folderMetadata, null, { fields: "id, name, trashed" });
  }, 3, 500);

  sp.setProperty("MEDIA_FOLDER_ID", newFolder.id);
  console.info("[Media Storage] Folder media Google Drive dibuat dengan ID asli: " + newFolder.id);
  return newFolder.id;
}

/**
 * Memverifikasi permission aktual file atau folder Google Drive
 * Memastikan tidak ada akses publik langsung (anyone / anyoneWithLink)
 */
function verifyDriveItemIsPrivate(fileOrFolderId) {
  try {
    var permissions = executeDriveWithRetry(function() {
      return Drive.Permissions.list(fileOrFolderId);
    }, 2, 300);
    if (permissions && permissions.permissions) {
      for (var i = 0; i < permissions.permissions.length; i++) {
        var p = permissions.permissions[i];
        if (p.type === "anyone" || p.type === "anyoneWithLink") {
          console.error("[Security Alert] Item " + fileOrFolderId + " memiliki permission publik: " + p.type);
          return false;
        }
      }
    }
    return true;
  } catch (err) {
    console.warn("[Permission Check] Tidak dapat membaca permission: " + err.message);
    return true;
  }
}

/**
 * Pembuatan 6-Digit OTP Kriptografis Acak Menggunakan Entropi Java SecureRandom
 * (Via Utilities.getUuid() di backend Google Apps Script, BUKAN Math.random())
 */
function generateSecure6DigitOtp() {
  var uuid = Utilities.getUuid().replace(/-/g, "");
  var hexChunk = uuid.substring(0, 8);
  var num = parseInt(hexChunk, 16);
  var otpNum = 100000 + (num % 900000);
  return String(otpNum);
}

/**
 * Adapter Pengiriman Email (Interface Pluggable)
 * Mendukung pengiriman nyata via MailApp dan mode mock untuk pengujian terisolasi.
 */
var MailDeliveryAdapter = {
  send: function(email, subject, body, isMock) {
    if (isMock) {
      // Mock Delivery: Tidak memanggil MailApp, tidak mencatat OTP mentah
      console.info("[Mock Mail Delivery] OTP notification queued for masked recipient: " + maskEmail(email));
      return { success: true, provider: "MOCK" };
    }

    try {
      var remainingQuota = MailApp.getRemainingDailyQuota();
      if (typeof remainingQuota === "number" && remainingQuota <= 0) {
        console.warn("[MailApp Quota] Kuota email harian Apps Script habis (0 tersisa).");
        return {
          success: false,
          error: "EMAIL_QUOTA_EXCEEDED",
          message: "Layanan pengiriman email sementara tidak tersedia karena batas kuota server tercapai. Silakan coba beberapa saat lagi.",
          provider: "MAILAPP"
        };
      }

      MailApp.sendEmail({
        to: email,
        subject: subject,
        body: body
      });

      return { success: true, provider: "MAILAPP" };
    } catch (mailErr) {
      console.error("[MailApp Delivery Error] Gagal mengirim email OTP ke " + maskEmail(email) + ": " + mailErr.message);
      return {
        success: false,
        error: "EMAIL_DELIVERY_FAILED",
        message: "Gagal mengirimkan email kode OTP ke administrator. Silakan coba kembali nanti.",
        provider: "MAILAPP"
      };
    }
  }
};

/**
 * Pembersihan Nonce Anti-Replay yang telah melewati retensi (120 detik)
 * Menggunakan ScriptProperties agar persisten, dan dibatasi agar tidak melampaui kuota
 */
function cleanupExpiredNonces(scriptProperties, nowMs) {
  try {
    var allProps = scriptProperties.getProperties();
    var keysToDelete = [];
    var prefix = "NONCE_M2M_";
    for (var key in allProps) {
      if (key.indexOf(prefix) === 0) {
        var recordedMs = Number(allProps[key]);
        if (isNaN(recordedMs) || (nowMs - recordedMs) > 120000) {
          keysToDelete.push(key);
        }
      }
    }
    for (var i = 0; i < keysToDelete.length; i++) {
      scriptProperties.deleteProperty(keysToDelete[i]);
    }
  } catch (cleanErr) {
    console.warn("[Anti-Replay] Gagal membersihkan nonce kedaluwarsa: " + cleanErr.message);
  }
}

/**
 * Verifikasi Autentikasi Antar-Server (M2M) dengan Anti-Replay Nonce & Signature HMAC
 * Dilindungi oleh LockService critical section dan ScriptProperties persisten.
 * Menggunakan secara eksklusif property khusus test database: SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET (Fail-Closed)
 */
function verifyM2mAuth(payload) {
  var scriptProperties = PropertiesService.getScriptProperties();
  var expectedSecret = scriptProperties.getProperty("SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET");
  if (!expectedSecret || expectedSecret.trim() === "") {
    console.error("[Security Configuration] SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET belum diatur di Script Properties.");
    return { valid: false, error: "SERVER_CONFIG_ERROR", message: "Konfigurasi keamanan server backend belum lengkap." };
  }

  // Jika payload menggunakan tanda tangan M2M HMAC
  if (payload.signature) {
    if (!payload.nonce || !payload.timestamp) {
      return { valid: false, error: "INVALID_M2M_AUTH", message: "Parameter nonce dan timestamp wajib disertakan bersama signature." };
    }

    var nowMs = Date.now();
    var reqTimestamp = Number(payload.timestamp);
    if (isNaN(reqTimestamp) || Math.abs(nowMs - reqTimestamp) > 60000) {
      return { valid: false, error: "REQUEST_EXPIRED", message: "Timestamp permintaan kedaluwarsa atau di luar batas toleransi 60 detik." };
    }

    // Critical Section dengan LockService untuk Nonce Check & Atomic Write
    var lock = LockService.getScriptLock();
    var lockAcquired = lock.tryLock(10000);
    if (!lockAcquired) {
      return { valid: false, error: "SERVER_BUSY", message: "Server sibuk memproses verifikasi M2M. Silakan coba kembali." };
    }

    try {
      var nonceKey = "NONCE_M2M_" + String(payload.nonce);
      var existingNonceTime = scriptProperties.getProperty(nonceKey);
      if (existingNonceTime) {
        console.warn("[Security] Replay attack terdeteksi: Nonce sudah pernah digunakan: " + payload.nonce);
        return { valid: false, error: "NONCE_REUSED", message: "Permintaan ditolak: Nonce sudah pernah digunakan sebelumnya." };
      }

      // Verifikasi Signature HMAC: method:path:timestamp:nonce:bodyHash
      var method = String(payload.method || "POST").toUpperCase();
      var path = String(payload.path || "/api/admin");
      var bodyHash = String(payload.bodyHash || "");
      var canonical = method + ":" + path + ":" + reqTimestamp + ":" + payload.nonce + ":" + bodyHash;

      var computedSig = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(canonical, expectedSecret.trim()));
      if (computedSig !== payload.signature) {
        console.warn("[Security] Signature antar-server tidak valid.");
        return { valid: false, error: "UNAUTHORIZED_SIGNATURE", message: "Tanda tangan request antar-server tidak valid." };
      }

      // Catat Nonce ke ScriptProperties secara persisten (Fail-closed jika penyimpanan gagal)
      try {
        scriptProperties.setProperty(nonceKey, String(nowMs));
      } catch (propErr) {
        console.error("[Security Anti-Replay] Gagal mencatat nonce ke ScriptProperties: " + propErr.message);
        return { valid: false, error: "STORAGE_ERROR", message: "Gagal mencatat status keamanan nonce persisten." };
      }

      // Opsional: bersihkan nonce yang sudah kedaluwarsa (>120s) untuk menjaga kapasitas
      cleanupExpiredNonces(scriptProperties, nowMs);

      return { valid: true };
    } finally {
      lock.releaseLock();
    }
  }

  // Fallback secretToken sederhana
  var incomingSecret = typeof payload.secretToken === "string" ? payload.secretToken.trim() : "";
  if (!incomingSecret || incomingSecret !== expectedSecret.trim()) {
    console.warn("[Security] Autentikasi handshake ditolak: secretToken kosong atau tidak cocok.");
    return { valid: false, error: "UNAUTHORIZED", message: "Autentikasi handshake tidak valid." };
  }

  if (payload.timestamp) {
    var nowMsLegacy = Date.now();
    var reqTimestampLegacy = Number(payload.timestamp);
    if (isNaN(reqTimestampLegacy) || Math.abs(nowMsLegacy - reqTimestampLegacy) > 60000) {
      return { valid: false, error: "REQUEST_EXPIRED", message: "Timestamp permintaan kedaluwarsa atau di luar batas toleransi 60 detik." };
    }
  }

  return { valid: true };
}

/**
 * Dispatcher untuk seluruh aksi CMS (Dilindungi Secret Handshake & Anti-Replay)
 */
function routeCmsAction(payload) {
  // Verifikasi M2M & Anti-Replay
  var m2mCheck = verifyM2mAuth(payload);
  if (!m2mCheck.valid) {
    return createJsonResponse(false, m2mCheck.error, m2mCheck.message);
  }

  switch (payload.action) {
    case "ADMIN_REQUEST_OTP":
      return handleAdminRequestOtp(payload);
    case "ADMIN_VERIFY_OTP":
      return handleAdminVerifyOtp(payload);
    case "ADMIN_CHECK_SESSION":
      return handleAdminCheckSession(payload);
    case "ADMIN_REVOKE_SESSIONS":
      return handleAdminRevokeSessions(payload);
    case "CMS_GET_PROJECTS":
      return handleCmsGetProjects(payload);
    case "ADMIN_SAVE_PROJECT":
      return handleAdminSaveProject(payload);
    case "ADMIN_GET_AUDIT_LOGS":
      return handleAdminGetAuditLogs(payload);
    case "ADMIN_REORDER_PROJECTS":
      return handleAdminReorderProjects(payload);
    case "ADMIN_UPLOAD_MEDIA":
      return handleAdminUploadMedia(payload);
    case "ADMIN_GET_PROJECT_MEDIA":
      return handleAdminGetProjectMedia(payload);
    case "ADMIN_UPDATE_MEDIA_STATUS":
      return handleAdminUpdateMediaStatus(payload);
    case "ADMIN_DELETE_MEDIA":
      return handleAdminDeleteMedia(payload);
    case "ADMIN_RECONCILE_ORPHANS":
      return handleAdminReconcileOrphans(payload);
    case "CMS_GET_PUBLIC_MEDIA":
      return handleCmsGetPublicMedia(payload);
    case "ADMIN_GET_MEDIA_BINARY":
      return handleAdminGetMediaBinary(payload);
    case "CMS_GET_SETTINGS":
      return handleCmsGetSettings(payload);
    case "ADMIN_SAVE_SETTINGS":
      return handleAdminSaveSettings(payload);
    case "CMS_GET_COMPLIANCE":
      return handleCmsGetCompliance(payload);
    case "ADMIN_GET_COMPLIANCE":
      return handleAdminGetCompliance(payload);
    case "ADMIN_SAVE_COMPLIANCE":
      return handleAdminSaveCompliance(payload);
    default:
      return createJsonResponse(false, "UNKNOWN_ACTION", "Aksi CMS tidak dikenali: " + payload.action);
  }
}

/**
 * Tab CMS_Projects: Struktur data proyek dinamis
 */
function getOrCreateCmsProjectsSheet(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(CMS_CONFIG.PROJECTS_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CMS_CONFIG.PROJECTS_SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    var headers = [
      "ID", "Slug", "Name", "Category", "Status",
      "Short Description", "Full Description", "Tagline",
      "Icon URL", "Feature Graphic URL", "Screenshots JSON",
      "Version", "Last Updated", "Play Store URL", "Testing URL",
      "Registration Open", "Tester Requirement Days", "Featured",
      "Tags JSON", "Technical Highlights JSON", "Capabilities JSON", "Vision",
      "Publish State", "Updated At", "Updated By"
    ];

    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#0F172A");
    headerRange.setFontColor("#38BDF8");
    headerRange.setFontWeight("bold");
    headerRange.setFontFamily("Consolas");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);

    for (var i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
  }

  return sheet;
}

/**
 * Tab CMS_AuditLogs: Jejak audit tindakan administratif
 */
function getOrCreateCmsAuditLogsSheet(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(CMS_CONFIG.LOGS_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CMS_CONFIG.LOGS_SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    var headers = [
      "Timestamp (WIB)", "Action", "Target ID", "Admin Email",
      "Client IP (Masked)", "Details JSON"
    ];

    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#0F172A");
    headerRange.setFontColor("#A78BFA");
    headerRange.setFontWeight("bold");
    headerRange.setFontFamily("Consolas");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);

    for (var i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
  }

  return sheet;
}

/**
 * Tab CMS_Media: Metadata aset gambar (WebP, PNG, JPEG)
 */
function getOrCreateCmsMediaSheet(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(CMS_CONFIG.MEDIA_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CMS_CONFIG.MEDIA_SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    var headers = [
      "Media ID", "Project ID", "Drive File ID", "Original Name",
      "Safe Name", "MIME Type", "Size Bytes", "SHA-256",
      "Role", "Visibility", "Uploaded At", "Uploaded By"
    ];

    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#0F172A");
    headerRange.setFontColor("#34D399");
    headerRange.setFontWeight("bold");
    headerRange.setFontFamily("Consolas");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);

    for (var j = 1; j <= headers.length; j++) {
      sheet.autoResizeColumn(j);
    }
  }

  return sheet;
}

/**
 * Mendapatkan versi sesi admin saat ini (untuk invalidasi terpusat)
 */
function getCurrentSessionVersion() {
  var val = PropertiesService.getScriptProperties().getProperty("ADMIN_SESSION_VERSION");
  if (!val) {
    PropertiesService.getScriptProperties().setProperty("ADMIN_SESSION_VERSION", "1");
    return 1;
  }
  return parseInt(val, 10);
}

/**
 * Pencatatan Log Audit CMS
 */
function recordCmsAuditLog(action, targetId, adminEmail, clientIp, detailsObj) {
  try {
    var spreadsheet = getTargetSpreadsheet();
    var sheet = getOrCreateCmsAuditLogsSheet(spreadsheet);
    var timestampStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
    sheet.appendRow([
      timestampStr,
      action,
      targetId || "-",
      adminEmail || CMS_CONFIG.AUTHORIZED_ADMIN_EMAIL,
      clientIp || "CLIENT_PROXY",
      JSON.stringify(detailsObj || {})
    ]);
  } catch (e) {
    console.warn("[CMS Audit Log Warning] Gagal mencatat audit: " + e.message);
  }
}

/**
 * Permintaan OTP Baru (Dengan Rate Limiting Persisten & Anti-Spam)
 */
function handleAdminRequestOtp(payload) {
  var email = payload.email ? String(payload.email).trim().toLowerCase() : "";
  if (email !== CMS_CONFIG.AUTHORIZED_ADMIN_EMAIL) {
    return createJsonResponse(false, "UNAUTHORIZED_EMAIL", "Email tidak diotorisasi sebagai administrator.");
  }

  var lock = LockService.getScriptLock();
  var lockAcquired = lock.tryLock(10000);
  if (!lockAcquired) {
    return createJsonResponse(false, "SERVER_BUSY", "Server sedang memproses permintaan otorisasi lain. Coba beberapa saat lagi.");
  }

  try {
    var scriptProperties = PropertiesService.getScriptProperties();
    var stateJson = scriptProperties.getProperty("ADMIN_OTP_STATE");
    var state = {
      lastIssuedAt: 0,
      recentTimestamps: [],
      currentOtpHmac: null,
      otpExpiresAt: 0,
      failedAttempts: 0,
      activeSalt: null
    };

    if (stateJson) {
      try {
        state = JSON.parse(stateJson);
        if (!Array.isArray(state.recentTimestamps)) state.recentTimestamps = [];
      } catch (parseErr) {}
    }

    var nowSec = Math.floor(Date.now() / 1000);

    // 1. Pemeriksaan Cooldown 60 Detik
    if (state.lastIssuedAt && (nowSec - state.lastIssuedAt) < CMS_CONFIG.OTP_COOLDOWN_SECONDS) {
      var waitSec = CMS_CONFIG.OTP_COOLDOWN_SECONDS - (nowSec - state.lastIssuedAt);
      return createJsonResponse(false, "COOLDOWN_ACTIVE", "Mohon tunggu " + waitSec + " detik sebelum meminta OTP baru.", {
        waitSeconds: waitSec
      });
    }

    // 2. Pembersihan Riwayat > 24 Jam
    state.recentTimestamps = state.recentTimestamps.filter(function(t) {
      return (nowSec - t) < 86400;
    });

    // 3. Pemeriksaan Batas 5 OTP / Jam
    var pastHourCount = state.recentTimestamps.filter(function(t) {
      return (nowSec - t) < 3600;
    }).length;

    if (pastHourCount >= CMS_CONFIG.MAX_OTP_PER_HOUR) {
      return createJsonResponse(false, "HOURLY_LIMIT_EXCEEDED", "Batas 5 permintaan OTP per jam tercapai. Silakan coba kembali nanti.");
    }

    // 4. Pemeriksaan Batas 15 OTP / 24 Jam (Perlindungan Kuota Email)
    if (state.recentTimestamps.length >= CMS_CONFIG.MAX_OTP_PER_24H) {
      return createJsonResponse(false, "DAILY_LIMIT_EXCEEDED", "Batas harian 15 permintaan OTP tercapai untuk melindungi kuota email. Hubungi administrator.");
    }

    // 5. Pembuatan 6-Digit OTP Kriptografis Acak (Berdasarkan SecureRandom)
    // Ambil Secret Pepper dari ScriptProperties (Fail-Closed: Tidak ada default/fallback mock di runtime)
    var pepper = scriptProperties.getProperty("ADMIN_OTP_PEPPER");
    if (!pepper || pepper.trim() === "") {
      console.error("[Security Configuration] ADMIN_OTP_PEPPER belum diatur di Script Properties.");
      return createJsonResponse(false, "SERVER_CONFIG_ERROR", "Konfigurasi keamanan server backend belum lengkap.");
    }

    var rawOtp = generateSecure6DigitOtp();
    var salt = Utilities.getUuid();
    var otpHmac = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(rawOtp + pepper.trim(), salt));

    // 6. Pengiriman Notifikasi Email Terlebih Dahulu (Fail-Closed Delivery)
    // Production WAJIB pengiriman nyata (mock hanya diizinkan di environment TEST jika secara eksplisit diminta)
    var isTestEnvironment = !!scriptProperties.getProperty("SleepyKoala_Test_DatabaseAPPS_SCRIPT_SECRET");
    var useMock = isTestEnvironment && payload.mockEmailDelivery === true;

    var sendResult = MailDeliveryAdapter.send(
      email,
      "Kode OTP Masuk Admin SleepyKoala Studio",
      "Halo Admin,\n\nKode OTP Anda untuk mengakses Web Admin SleepyKoala adalah:\n\n" + rawOtp + "\n\nKode ini hanya berlaku selama 5 menit dan hanya dapat digunakan satu kali.\nJangan berikan kode ini kepada siapa pun.\n\nSalam,\nSleepyKoala Studio Security Engine",
      useMock
    );

    // Jika pengiriman email gagal: Jangan simpan OTP aktif dan kembalikan error
    if (!sendResult || !sendResult.success) {
      // Pastikan tidak ada OTP aktif yang tersisa di database
      state.currentOtpHmac = null;
      state.otpExpiresAt = 0;
      state.activeSalt = null;
      scriptProperties.setProperty("ADMIN_OTP_STATE", JSON.stringify(state));

      recordCmsAuditLog("REQUEST_OTP_FAILED", "-", email, payload.clientIpMasked, {
        reason: sendResult ? sendResult.error : "UNKNOWN_ERROR"
      });

      return createJsonResponse(
        false,
        sendResult ? sendResult.error : "EMAIL_DELIVERY_FAILED",
        sendResult ? sendResult.message : "Gagal mengirimkan email kode OTP ke administrator. Silakan coba kembali nanti."
      );
    }

    // 7. Simpan Status Persisten Hanya Setelah Email Berhasil Terkirim
    state.lastIssuedAt = nowSec;
    state.recentTimestamps.push(nowSec);
    state.currentOtpHmac = otpHmac;
    state.otpExpiresAt = nowSec + CMS_CONFIG.OTP_EXPIRY_SECONDS;
    state.failedAttempts = 0;
    state.activeSalt = salt;
    scriptProperties.setProperty("ADMIN_OTP_STATE", JSON.stringify(state));

    recordCmsAuditLog("REQUEST_OTP", "-", email, payload.clientIpMasked, {
      status: "ISSUED",
      provider: sendResult.provider
    });

    return createJsonResponse(true, null, "Kode OTP telah berhasil dikirimkan ke email administrator.", {
      cooldownSeconds: CMS_CONFIG.OTP_COOLDOWN_SECONDS,
      expiresAt: state.otpExpiresAt
    });

  } finally {
    lock.releaseLock();
  }
}

/**
 * Verifikasi OTP & Single-Use Burn
 */
function handleAdminVerifyOtp(payload) {
  var email = payload.email ? String(payload.email).trim().toLowerCase() : "";
  if (email !== CMS_CONFIG.AUTHORIZED_ADMIN_EMAIL) {
    return createJsonResponse(false, "UNAUTHORIZED_EMAIL", "Email tidak diotorisasi.");
  }

  var incomingOtp = payload.otp ? String(payload.otp).trim() : "";
  if (!/^\d{6}$/.test(incomingOtp)) {
    return createJsonResponse(false, "INVALID_FORMAT", "Format OTP harus berupa 6 digit angka.");
  }

  var lock = LockService.getScriptLock();
  var lockAcquired = lock.tryLock(10000);
  if (!lockAcquired) {
    return createJsonResponse(false, "SERVER_BUSY", "Server sibuk. Silakan coba kembali.");
  }

  try {
    var scriptProperties = PropertiesService.getScriptProperties();
    var stateJson = scriptProperties.getProperty("ADMIN_OTP_STATE");
    if (!stateJson) {
      return createJsonResponse(false, "NO_ACTIVE_OTP", "Belum ada permintaan OTP aktif atau OTP telah kedaluwarsa.");
    }

    var state = JSON.parse(stateJson);
    var nowSec = Math.floor(Date.now() / 1000);

    // 1. Pemeriksaan Percobaan Gagal
    if (state.failedAttempts >= CMS_CONFIG.MAX_FAILED_ATTEMPTS) {
      state.currentOtpHmac = null;
      state.otpExpiresAt = 0;
      scriptProperties.setProperty("ADMIN_OTP_STATE", JSON.stringify(state));
      recordCmsAuditLog("VERIFY_OTP_LOCKED", "-", email, payload.clientIpMasked, { attempts: state.failedAttempts });
      return createJsonResponse(false, "OTP_LOCKED", "Terlalu banyak percobaan salah. Kode OTP ini telah dibatalkan demi keamanan.");
    }

    // 2. Pemeriksaan Masa Berlaku (TTL 5 Menit) & Eksistensi OTP
    if (!state.currentOtpHmac) {
      return createJsonResponse(false, "NO_ACTIVE_OTP", "Belum ada permintaan OTP aktif atau kode telah digunakan.");
    }
    if (nowSec > state.otpExpiresAt) {
      return createJsonResponse(false, "OTP_EXPIRED", "Kode OTP telah kedaluwarsa. Silakan minta kode baru.");
    }

    // 3. Komputasi & Pencocokan HMAC dengan Salt & Pepper (Fail-Closed)
    var pepper = scriptProperties.getProperty("ADMIN_OTP_PEPPER");
    if (!pepper || pepper.trim() === "") {
      console.error("[Security Configuration] ADMIN_OTP_PEPPER belum diatur di Script Properties.");
      return createJsonResponse(false, "SERVER_CONFIG_ERROR", "Konfigurasi keamanan server backend belum lengkap.");
    }
    var computedHmac = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(incomingOtp + pepper.trim(), state.activeSalt));
    if (computedHmac !== state.currentOtpHmac) {
      state.failedAttempts++;
      if (state.failedAttempts >= CMS_CONFIG.MAX_FAILED_ATTEMPTS) {
        state.currentOtpHmac = null;
        state.otpExpiresAt = 0;
        scriptProperties.setProperty("ADMIN_OTP_STATE", JSON.stringify(state));
        recordCmsAuditLog("VERIFY_OTP_LOCKED", "-", email, payload.clientIpMasked, { attempts: state.failedAttempts });
        return createJsonResponse(false, "OTP_LOCKED", "Terlalu banyak percobaan salah. Kode OTP ini telah dibatalkan demi keamanan.");
      }
      var remainingAttempts = CMS_CONFIG.MAX_FAILED_ATTEMPTS - state.failedAttempts;
      scriptProperties.setProperty("ADMIN_OTP_STATE", JSON.stringify(state));
      recordCmsAuditLog("VERIFY_OTP_FAILED", "-", email, payload.clientIpMasked, { remaining: remainingAttempts });
      return createJsonResponse(false, "OTP_INVALID", "Kode OTP tidak valid. Sisa kesempatan: " + remainingAttempts, {
        remainingAttempts: remainingAttempts
      });
    }

    // 4. JAMINAN SINGLE-USE: Burn OTP Seketika!
    state.currentOtpHmac = null;
    state.otpExpiresAt = 0;
    state.failedAttempts = 0;
    state.activeSalt = null;
    scriptProperties.setProperty("ADMIN_OTP_STATE", JSON.stringify(state));

    var sessionVer = getCurrentSessionVersion();
    recordCmsAuditLog("LOGIN_SUCCESS", "-", email, payload.clientIpMasked, { sessionVersion: sessionVer });

    return createJsonResponse(true, null, "Autentikasi administrator berhasil diverifikasi.", {
      verifiedEmail: email,
      sessionVersion: sessionVer,
      issuedAt: nowSec
    });

  } finally {
    lock.releaseLock();
  }
}

/**
 * Pemeriksaan Validitas Versi Sesi Admin (Session Version Check)
 */
function handleAdminCheckSession(payload) {
  var requestedVersion = Number(payload.sessionVersion || 0);
  var currentVersion = getCurrentSessionVersion();
  if (requestedVersion < currentVersion) {
    return createJsonResponse(false, "SESSION_REVOKED", "Sesi administrator telah dicabut karena versi sesi telah diperbarui.", {
      valid: false,
      currentSessionVersion: currentVersion,
      requestedSessionVersion: requestedVersion
    });
  }
  return createJsonResponse(true, null, "Sesi administrator valid.", {
    valid: true,
    currentSessionVersion: currentVersion
  });
}

/**
 * Pencabutan Seluruh Sesi Admin (Session Revocation)
 */
function handleAdminRevokeSessions(payload) {
  var scriptProperties = PropertiesService.getScriptProperties();
  var currentVer = getCurrentSessionVersion();
  var newVer = currentVer + 1;
  scriptProperties.setProperty("ADMIN_SESSION_VERSION", String(newVer));

  recordCmsAuditLog("REVOKE_ALL_SESSIONS", "-", CMS_CONFIG.AUTHORIZED_ADMIN_EMAIL, payload.clientIpMasked, {
    previousVersion: currentVer,
    newVersion: newVer
  });

  return createJsonResponse(true, null, "Seluruh sesi administrator sebelumnya telah berhasil dicabut.", {
    newSessionVersion: newVer
  });
}

/**
 * Pengambilan Daftar Proyek CMS (Publik vs Admin)
 */
function handleCmsGetProjects(payload) {
  var isPublicOnly = payload.isPublicOnly === true;
  var spreadsheet = getTargetSpreadsheet();
  var sheet = getOrCreateCmsProjectsSheet(spreadsheet);
  var lastRow = sheet.getLastRow();

  var projects = [];
  var publishedVersionTimestamp = 1730379600; // Baseline timestamp

  if (lastRow > 1) {
    var data = sheet.getRange(2, 1, lastRow - 1, 25).getValues();
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var publishState = String(row[22] || "DRAFT");

      // Guard Publik: Pengunjung biasa HANYA boleh membaca PUBLISHED
      if (isPublicOnly && publishState !== "PUBLISHED") {
        continue;
      }

      var updatedAtStr = String(row[23] || "");
      if (updatedAtStr) {
        var rowTime = new Date(updatedAtStr).getTime();
        if (!isNaN(rowTime) && rowTime > publishedVersionTimestamp) {
          publishedVersionTimestamp = Math.floor(rowTime / 1000);
        }
      }

      projects.push({
        id: String(row[0]),
        slug: String(row[1]),
        name: String(row[2]),
        category: String(row[3]),
        status: String(row[4]),
        shortDescription: String(row[5]),
        fullDescription: String(row[6]),
        tagline: String(row[7]),
        iconUrl: String(row[8]),
        featureGraphicUrl: String(row[9]),
        screenshots: row[10] ? JSON.parse(String(row[10])) : [],
        version: String(row[11]),
        lastUpdated: String(row[12]),
        playStoreUrl: String(row[13]),
        testingUrl: String(row[14]),
        registrationOpen: Boolean(row[15]),
        testerRequirementDays: Number(row[16] || 14),
        featured: Boolean(row[17]),
        tags: row[18] ? JSON.parse(String(row[18])) : [],
        technicalHighlights: row[19] ? JSON.parse(String(row[19])) : [],
        capabilities: row[20] ? JSON.parse(String(row[20])) : [],
        vision: String(row[21]),
        publishState: publishState
      });
    }
  }

  return createJsonResponse(true, null, "Data proyek berhasil dimuat.", {
    projects: projects,
    count: projects.length,
    publishedVersionTimestamp: publishedVersionTimestamp
  });
}

/**
 * Penyimpanan Proyek oleh Admin (Upsert ke sheet CMS_Projects) dengan LockService Concurrency Protection
 */
function handleAdminSaveProject(payload) {
  // 1. Verifikasi Session Version
  var currentVer = getCurrentSessionVersion();
  if (Number(payload.sessionVersion) !== currentVer) {
    return createJsonResponse(false, "SESSION_REVOKED", "Sesi administrator telah dicabut atau kedaluwarsa. Silakan masuk kembali.");
  }

  var project = payload.project;
  if (!project || !project.id || !project.slug || !project.name) {
    return createJsonResponse(false, "VALIDATION_ERROR", "Data proyek wajib memiliki id, slug, dan name.");
  }

  // Validasi Input Server-Side yang Ketat
  var allowedCategories = ["APPLICATION", "GAME"];
  if (project.category && allowedCategories.indexOf(project.category) === -1) {
    return createJsonResponse(false, "VALIDATION_ERROR", "Kategori proyek tidak valid.");
  }

  var allowedStatuses = ["READY_FOR_RELEASE", "RELEASED", "PRE_REGISTRATION", "CLOSED_TESTING", "INTERNAL_TESTING", "WORK_IN_PROGRESS", "COMING_SOON"];
  if (project.status && allowedStatuses.indexOf(project.status) === -1) {
    return createJsonResponse(false, "VALIDATION_ERROR", "Status perkembangan proyek tidak valid.");
  }

  var allowedPublishStates = ["DRAFT", "PUBLISHED", "ARCHIVED"];
  if (project.publishState && allowedPublishStates.indexOf(project.publishState) === -1) {
    return createJsonResponse(false, "VALIDATION_ERROR", "Status publikasi CMS tidak valid.");
  }

  var lock = LockService.getScriptLock();
  var lockAcquired = lock.tryLock(10000);
  if (!lockAcquired) {
    return createJsonResponse(false, "SERVER_BUSY", "Server sibuk. Gagal mendapatkan lock penyimpanan proyek.");
  }

  try {
    var spreadsheet = getTargetSpreadsheet();
    var sheet = getOrCreateCmsProjectsSheet(spreadsheet);
    var lastRow = sheet.getLastRow();
    var targetRow = -1;

    if (lastRow > 1) {
      var idCol = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < idCol.length; i++) {
        if (String(idCol[i][0]).trim() === project.id.trim()) {
          targetRow = i + 2;
          break;
        }
      }
    }

    var timestampStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
    var rowValues = [
      project.id.trim(),
      project.slug.trim(),
      project.name.trim(),
      project.category || "APPLICATION",
      project.status || "WORK_IN_PROGRESS",
      cleanString(project.shortDescription || "", 500),
      cleanString(project.fullDescription || "", 3000),
      cleanString(project.tagline || "", 150),
      cleanString(project.iconUrl || project.icon || "", 300),
      cleanString(project.featureGraphicUrl || "", 300),
      JSON.stringify(Array.isArray(project.screenshots) ? project.screenshots : []),
      cleanString(project.version || "0.1.0", 30),
      cleanString(project.lastUpdated || timestampStr, 50),
      cleanString(project.playStoreUrl || "", 300),
      cleanString(project.testingUrl || "", 300),
      project.registrationOpen === true,
      Number(project.testerRequirementDays || 14),
      project.featured === true,
      JSON.stringify(Array.isArray(project.tags) ? project.tags : []),
      JSON.stringify(Array.isArray(project.technicalHighlights) ? project.technicalHighlights : []),
      JSON.stringify(Array.isArray(project.capabilities) ? project.capabilities : []),
      cleanString(project.vision || "", 1000),
      project.publishState || "DRAFT",
      timestampStr,
      CMS_CONFIG.AUTHORIZED_ADMIN_EMAIL
    ];

    if (targetRow > 0) {
      sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }

    recordCmsAuditLog("SAVE_PROJECT", project.id, CMS_CONFIG.AUTHORIZED_ADMIN_EMAIL, payload.clientIpMasked, {
      publishState: project.publishState,
      actionType: targetRow > 0 ? "UPDATE" : "CREATE"
    });

    return createJsonResponse(true, null, "Proyek berhasil disimpan.", {
      id: project.id,
      publishState: project.publishState,
      updatedAt: timestampStr
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Pengambilan Riwayat Audit Log CMS
 */
function handleAdminGetAuditLogs(payload) {
  var currentVer = getCurrentSessionVersion();
  if (Number(payload.sessionVersion) !== currentVer) {
    return createJsonResponse(false, "SESSION_REVOKED", "Sesi administrator telah dicabut atau kedaluwarsa.");
  }

  var spreadsheet = getTargetSpreadsheet();
  var sheet = getOrCreateCmsAuditLogsSheet(spreadsheet);
  var lastRow = sheet.getLastRow();
  var logs = [];

  if (lastRow > 1) {
    var raw = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    // Ambil maksimal 50 log terakhir (terbaru di atas)
    for (var i = raw.length - 1; i >= 0 && logs.length < 50; i--) {
      var r = raw[i];
      var details = {};
      try { details = JSON.parse(String(r[5] || "{}")); } catch(e){}
      logs.push({
        timestamp: String(r[0]),
        action: String(r[1]),
        targetId: String(r[2]),
        adminEmail: String(r[3]),
        clientIp: String(r[4]),
        details: details
      });
    }
  }

  return createJsonResponse(true, null, "Audit logs berhasil dimuat.", {
    logs: logs,
    count: logs.length
  });
}

/**
 * Pengaturan Urutan Proyek CMS
 */
function handleAdminReorderProjects(payload) {
  var currentVer = getCurrentSessionVersion();
  if (Number(payload.sessionVersion) !== currentVer) {
    return createJsonResponse(false, "SESSION_REVOKED", "Sesi administrator telah dicabut atau kedaluwarsa.");
  }

  var orderedIds = payload.orderedIds;
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return createJsonResponse(false, "VALIDATION_ERROR", "Daftar orderedIds wajib disertakan berupa array.");
  }

  var lock = LockService.getScriptLock();
  var lockAcquired = lock.tryLock(10000);
  if (!lockAcquired) {
    return createJsonResponse(false, "SERVER_BUSY", "Gagal mendapatkan lock saat reorder proyek.");
  }

  try {
    var spreadsheet = getTargetSpreadsheet();
    var sheet = getOrCreateCmsProjectsSheet(spreadsheet);
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return createJsonResponse(true, null, "Belum ada proyek untuk diurutkan.");
    }

    var rows = sheet.getRange(2, 1, lastRow - 1, 25).getValues();
    var rowsById = {};
    for (var i = 0; i < rows.length; i++) {
      rowsById[String(rows[i][0]).trim()] = rows[i];
    }

    var newRows = [];
    for (var j = 0; j < orderedIds.length; j++) {
      var id = String(orderedIds[j]).trim();
      if (rowsById[id]) {
        newRows.push(rowsById[id]);
        delete rowsById[id];
      }
    }
    // Sisipkan yang belum masuk di orderedIds
    for (var remainingId in rowsById) {
      newRows.push(rowsById[remainingId]);
    }

    if (newRows.length > 0) {
      sheet.getRange(2, 1, newRows.length, 25).setValues(newRows);
    }

    recordCmsAuditLog("REORDER_PROJECTS", "-", CMS_CONFIG.AUTHORIZED_ADMIN_EMAIL, payload.clientIpMasked, {
      count: newRows.length
    });

    return createJsonResponse(true, null, "Urutan proyek berhasil disimpan.", { count: newRows.length });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Upload Media WebP/PNG/JPEG ke penyimpanan CMS dengan Verifikasi Magic Bytes, Idempotensi, dan Rollback
 */
function handleAdminUploadMedia(payload) {
  var currentVer = getCurrentSessionVersion();
  if (Number(payload.sessionVersion) !== currentVer) {
    return createJsonResponse(false, "SESSION_REVOKED", "Sesi administrator telah dicabut atau kedaluwarsa.");
  }

  var projectId = cleanString(payload.projectId ? String(payload.projectId).trim() : "global", 50);
  var fileName = cleanString(payload.fileName ? String(payload.fileName).trim() : "asset.webp", 100);
  var mimeType = payload.mimeType ? String(payload.mimeType).trim().toLowerCase() : "image/webp";
  var role = payload.role ? String(payload.role).trim().toUpperCase() : "GALLERY";
  var visibility = payload.visibility ? String(payload.visibility).trim().toUpperCase() : "DRAFT";

  // 1. Validasi Whitelist Format (SVG dan HTML Dilarang Keras)
  if (mimeType.indexOf("svg") !== -1 || mimeType.indexOf("html") !== -1 || mimeType.indexOf("xml") !== -1) {
    return createJsonResponse(false, "FORBIDDEN_FORMAT", "Format SVG dan HTML dilarang karena risiko keamanan skrip.");
  }

  if (CMS_CONFIG.ALLOWED_MEDIA_TYPES.indexOf(mimeType) === -1) {
    return createJsonResponse(false, "UNSUPPORTED_MEDIA_TYPE", "Tipe file tidak diizinkan. Hanya WebP, PNG, dan JPEG yang didukung.");
  }

  var base64Data = payload.base64Data ? String(payload.base64Data).trim() : "";
  if (!base64Data) {
    return createJsonResponse(false, "EMPTY_PAYLOAD", "Data biner gambar kosong.");
  }

  // Strip optional data URI prefix
  base64Data = base64Data.replace(/^data:image\/[a-z+]+;base64,/, "").trim();

  var bytes;
  try {
    bytes = Utilities.base64Decode(base64Data);
  } catch (decErr) {
    return createJsonResponse(false, "INVALID_BASE64", "Format Base64 tidak valid.");
  }

  if (bytes.length === 0) {
    return createJsonResponse(false, "EMPTY_FILE", "Ukuran file 0 bytes.");
  }

  if (bytes.length > CMS_CONFIG.MAX_MEDIA_BYTES) {
    return createJsonResponse(false, "PAYLOAD_TOO_LARGE", "Ukuran file melebihi batas keras 2 MB.");
  }

  // 2. Verifikasi Magic Bytes
  if (mimeType === "image/webp") {
    if (bytes.length < 12) {
      return createJsonResponse(false, "INVALID_WEBP_HEADER", "Data biner gambar WebP terlalu pendek.");
    }
    var isRiff = bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 70;
    var isWebp = bytes[8] === 87 && bytes[9] === 69 && bytes[10] === 66 && bytes[11] === 80;
    if (!isRiff || !isWebp) {
      return createJsonResponse(false, "INVALID_WEBP_HEADER", "Magic bytes WebP (RIFF/WEBP) tidak cocok.");
    }
  } else if (mimeType === "image/png") {
    if (bytes.length < 8) {
      return createJsonResponse(false, "INVALID_PNG_HEADER", "Data biner gambar PNG terlalu pendek.");
    }
    var isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 &&
                bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A;
    if (!isPng) {
      return createJsonResponse(false, "INVALID_PNG_HEADER", "Magic bytes PNG tidak cocok.");
    }
  } else if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    if (bytes.length < 4) {
      return createJsonResponse(false, "INVALID_JPEG_HEADER", "Data biner gambar JPEG terlalu pendek.");
    }
    var isJpegSoi = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
    var isJpegEoi = bytes[bytes.length - 2] === 0xFF && bytes[bytes.length - 1] === 0xD9;
    if (!isJpegSoi) {
      return createJsonResponse(false, "INVALID_JPEG_HEADER", "Magic bytes JPEG (SOI) tidak cocok.");
    }
    if (!isJpegEoi) {
      return createJsonResponse(false, "TRUNCATED_JPEG", "Penanda akhir file JPEG (EOI) tidak ditemukan.");
    }
  }

  // 3. Hitung SHA-256 Hex Digest
  var rawDigest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes);
  var sha256Hex = "";
  for (var i = 0; i < rawDigest.length; i++) {
    var byteVal = (rawDigest[i] < 0) ? rawDigest[i] + 256 : rawDigest[i];
    var hex = byteVal.toString(16);
    sha256Hex += (hex.length === 1) ? "0" + hex : hex;
  }

  var mediaId = "med_" + sha256Hex.substring(0, 16);
  var driveFileId = "mock_drive_" + sha256Hex.substring(0, 16);
  var safeName = cleanString(fileName.replace(/[^a-zA-Z0-9_.-]/g, "_"), 60);

  // 4. Critical Section via LockService
  var lock = LockService.getScriptLock();
  var lockAcquired = lock.tryLock(15000);
  if (!lockAcquired) {
    return createJsonResponse(false, "SERVER_BUSY", "Server sedang sibuk. Gagal mendapatkan lock upload.");
  }

  try {
    var spreadsheet = getTargetSpreadsheet();
    var mediaSheet = getOrCreateCmsMediaSheet(spreadsheet);
    var lastRow = mediaSheet.getLastRow();

    // 5. Cek Duplikasi / Idempotency
    if (lastRow > 1) {
      var data = mediaSheet.getRange(2, 1, lastRow - 1, 12).getValues();
      for (var r = 0; r < data.length; r++) {
        var existingSha = String(data[r][7] || "");
        var existingProj = String(data[r][1] || "");
        if (existingSha === sha256Hex && existingProj === projectId) {
          // File identik sudah terdaftar, kembalikan record tanpa duplikasi
          return createJsonResponse(true, null, "File identik sudah ada di pustaka media.", {
            media: {
              mediaId: String(data[r][0]),
              projectId: existingProj,
              driveFileId: String(data[r][2]),
              originalName: String(data[r][3]),
              safeName: String(data[r][4]),
              mimeType: String(data[r][5]),
              sizeBytes: Number(data[r][6]),
              sha256: existingSha,
              role: String(data[r][8]),
              visibility: String(data[r][9]),
              uploadedAt: String(data[r][10]),
              uploadedBy: String(data[r][11])
            },
            publicUrl: "/api/media/" + String(data[r][0]),
            isDuplicate: true
          });
        }
      }
    }

    var timestampStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

    // Phase 1: Unggah ke Google Drive jika dalam mode live
    if (CMS_CONFIG.STORAGE_MODE === "LIVE_DRIVE" && CMS_CONFIG.IS_LIVE_DRIVE_ACTIVE) {
      try {
        var folderId = getOrCreateTestMediaFolder();
        var blob = Utilities.newBlob(bytes, mimeType, safeName);
        var fileMetadata = {
          name: safeName,
          parents: [folderId],
          description: "SleepyKoala CMS Asset - Project: " + projectId + " - SHA256: " + sha256Hex
        };
        var uploadedFile = executeDriveWithRetry(function() {
          return Drive.Files.create(fileMetadata, blob, { fields: "id, name, size" });
        }, 3, 500);
        driveFileId = uploadedFile.id;
      } catch (driveErr) {
        console.error("[Media Storage] Gagal mengunggah file ke Google Drive: " + driveErr.message);
        return createJsonResponse(false, "DRIVE_UPLOAD_ERROR", "Gagal mengunggah file ke Google Drive: " + driveErr.message);
      }
    }

    var rowValues = [
      mediaId,
      projectId,
      driveFileId,
      cleanString(fileName, 100),
      safeName,
      mimeType,
      bytes.length,
      sha256Hex,
      role,
      visibility,
      timestampStr,
      CMS_CONFIG.AUTHORIZED_ADMIN_EMAIL
    ];

    // Phase 2: Dual-Phase Append dengan Kompensasi Rollback
    try {
      mediaSheet.appendRow(rowValues);
    } catch (sheetErr) {
      console.error("[Rollback Compensation] Gagal menulis metadata media ke Google Sheets: " + sheetErr.message);
      // Kompensasi rollback: hapus file Drive yang baru saja diunggah
      if (CMS_CONFIG.STORAGE_MODE === "LIVE_DRIVE" && CMS_CONFIG.IS_LIVE_DRIVE_ACTIVE && driveFileId && driveFileId.indexOf("mock_") !== 0) {
        try {
          executeDriveWithRetry(function() {
            Drive.Files.remove(driveFileId);
          }, 3, 500);
          console.info("[Rollback Compensation] Berhasil menghapus file Google Drive hasil kompensasi: " + driveFileId);
        } catch (remErr) {
          console.error("[Rollback Compensation] Gagal menghapus file kompensasi di Drive: " + remErr.message);
        }
      }
      return createJsonResponse(false, "DATABASE_WRITE_ERROR", "Gagal menyimpan metadata media.");
    }

    recordCmsAuditLog("UPLOAD_MEDIA", mediaId, CMS_CONFIG.AUTHORIZED_ADMIN_EMAIL, payload.clientIpMasked, {
      projectId: projectId,
      safeName: safeName,
      sizeBytes: bytes.length,
      role: role,
      visibility: visibility
    });

    var mediaObj = {
      mediaId: mediaId,
      projectId: projectId,
      driveFileId: driveFileId,
      originalName: fileName,
      safeName: safeName,
      mimeType: mimeType,
      sizeBytes: bytes.length,
      sha256: sha256Hex,
      role: role,
      visibility: visibility,
      uploadedAt: timestampStr,
      uploadedBy: CMS_CONFIG.AUTHORIZED_ADMIN_EMAIL
    };

    return createJsonResponse(true, null, "Media berhasil diunggah dan dicatat.", {
      media: mediaObj,
      publicUrl: "/api/media/" + mediaId,
      isDuplicate: false
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Mengambil daftar media untuk proyek tertentu atau seluruh media
 */
function handleAdminGetProjectMedia(payload) {
  var currentVer = getCurrentSessionVersion();
  if (Number(payload.sessionVersion) !== currentVer) {
    return createJsonResponse(false, "SESSION_REVOKED", "Sesi administrator telah dicabut atau kedaluwarsa.");
  }

  var targetProjectId = payload.projectId ? String(payload.projectId).trim() : "*";
  var spreadsheet = getTargetSpreadsheet();
  var sheet = getOrCreateCmsMediaSheet(spreadsheet);
  var lastRow = sheet.getLastRow();
  var mediaList = [];

  if (lastRow > 1) {
    var raw = sheet.getRange(2, 1, lastRow - 1, 12).getValues();
    for (var i = raw.length - 1; i >= 0; i--) {
      var r = raw[i];
      var proj = String(r[1] || "");
      if (targetProjectId === "*" || proj === targetProjectId) {
        mediaList.push({
          mediaId: String(r[0]),
          projectId: proj,
          driveFileId: String(r[2]),
          originalName: String(r[3]),
          safeName: String(r[4]),
          mimeType: String(r[5]),
          sizeBytes: Number(r[6] || 0),
          sha256: String(r[7]),
          role: String(r[8] || "GALLERY"),
          visibility: String(r[9] || "DRAFT"),
          uploadedAt: String(r[10]),
          uploadedBy: String(r[11])
        });
      }
    }
  }

  return createJsonResponse(true, null, "Daftar media berhasil dimuat.", {
    media: mediaList,
    count: mediaList.length
  });
}

/**
 * Memperbarui status visibilitas (DRAFT, PUBLISHED, ARCHIVED) atau role media
 */
function handleAdminUpdateMediaStatus(payload) {
  var currentVer = getCurrentSessionVersion();
  if (Number(payload.sessionVersion) !== currentVer) {
    return createJsonResponse(false, "SESSION_REVOKED", "Sesi administrator telah dicabut atau kedaluwarsa.");
  }

  var mediaId = payload.mediaId ? String(payload.mediaId).trim() : "";
  if (!mediaId) {
    return createJsonResponse(false, "VALIDATION_ERROR", "Parameter mediaId wajib disertakan.");
  }

  var newVisibility = payload.visibility ? String(payload.visibility).trim().toUpperCase() : null;
  var newRole = payload.role ? String(payload.role).trim().toUpperCase() : null;

  var lock = LockService.getScriptLock();
  var lockAcquired = lock.tryLock(10000);
  if (!lockAcquired) {
    return createJsonResponse(false, "SERVER_BUSY", "Server sibuk. Gagal memperbarui status media.");
  }

  try {
    var spreadsheet = getTargetSpreadsheet();
    var sheet = getOrCreateCmsMediaSheet(spreadsheet);
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return createJsonResponse(false, "NOT_FOUND", "Media tidak ditemukan.");
    }

    var idCol = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    var targetRow = -1;
    for (var i = 0; i < idCol.length; i++) {
      if (String(idCol[i][0]).trim() === mediaId) {
        targetRow = i + 2;
        break;
      }
    }

    if (targetRow === -1) {
      return createJsonResponse(false, "NOT_FOUND", "Media tidak ditemukan.");
    }

    if (newRole) {
      sheet.getRange(targetRow, 9).setValue(newRole);
    }
    if (newVisibility) {
      sheet.getRange(targetRow, 10).setValue(newVisibility);
    }

    recordCmsAuditLog("UPDATE_MEDIA_STATUS", mediaId, CMS_CONFIG.AUTHORIZED_ADMIN_EMAIL, payload.clientIpMasked, {
      newRole: newRole,
      newVisibility: newVisibility
    });

    return createJsonResponse(true, null, "Status media berhasil diperbarui.", {
      mediaId: mediaId,
      visibility: newVisibility,
      role: newRole
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Helper untuk membersihkan referensi mediaId dari seluruh proyek di CMS_Projects
 * Membersihkan array screenshots JSON, iconUrl, dan featureGraphicUrl.
 * Menjaga integritas referensial dan mencegah dangling reference.
 * Bersifat aman dan toleran terhadap JSON invalid atau array kosong.
 */
function cleanMediaReferencesFromProjects(spreadsheet, mediaId) {
  var projSheet = getOrCreateCmsProjectsSheet(spreadsheet);
  var lastRow = projSheet.getLastRow();
  var affectedProjectIds = [];

  if (lastRow <= 1) {
    return affectedProjectIds;
  }

  var data = projSheet.getRange(2, 1, lastRow - 1, 25).getValues();
  var timestampStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd'T'HH:mm:ss'Z'");

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var projectId = String(row[0] || "");
    var isRowModified = false;

    // 1. Periksa Icon URL (Col 9 / index 8)
    var iconUrl = String(row[8] || "");
    if (iconUrl && isMediaReferencedString(iconUrl, mediaId)) {
      row[8] = "";
      isRowModified = true;
    }

    // 2. Periksa Feature Graphic URL (Col 10 / index 9)
    var featureGraphicUrl = String(row[9] || "");
    if (featureGraphicUrl && isMediaReferencedString(featureGraphicUrl, mediaId)) {
      row[9] = "";
      isRowModified = true;
    }

    // 3. Periksa Screenshots JSON (Col 11 / index 10)
    var rawScreenshots = String(row[10] || "");
    var screenshotsArr = [];
    var jsonValid = true;

    if (rawScreenshots && rawScreenshots.trim() !== "") {
      try {
        screenshotsArr = JSON.parse(rawScreenshots);
      } catch (jsonErr) {
        // Toleran terhadap format JSON tidak valid: reset menjadi array kosong yang aman
        jsonValid = false;
        screenshotsArr = [];
        isRowModified = true;
      }
    }

    if (!Array.isArray(screenshotsArr)) {
      screenshotsArr = [];
      isRowModified = true;
    }

    var originalLength = screenshotsArr.length;
    var filteredScreenshots = screenshotsArr.filter(function(item) {
      if (typeof item === "string") {
        return !isMediaReferencedString(item, mediaId);
      } else if (item && typeof item === "object") {
        var itemUrl = String(item.url || item.src || item.id || "");
        return !isMediaReferencedString(itemUrl, mediaId);
      }
      return true;
    });

    if (filteredScreenshots.length !== originalLength || !jsonValid) {
      row[10] = JSON.stringify(filteredScreenshots);
      isRowModified = true;
    }

    // Jika terjadi perubahan pada proyek ini, update baris di spreadsheet
    if (isRowModified) {
      row[23] = timestampStr; // Col 24: Updated At
      row[24] = CMS_CONFIG.AUTHORIZED_ADMIN_EMAIL; // Col 25: Updated By
      var rowNumber = i + 2;
      projSheet.getRange(rowNumber, 1, 1, 25).setValues([row]);
      affectedProjectIds.push(projectId);
    }
  }

  return affectedProjectIds;
}

/**
 * Helper pemeriksaan apakah suatu string URL/ID mereferensikan mediaId tertentu
 */
function isMediaReferencedString(targetString, mediaId) {
  if (!targetString || typeof targetString !== "string" || !mediaId) {
    return false;
  }
  var trimmed = targetString.trim();
  if (trimmed === mediaId) {
    return true;
  }
  if (trimmed.indexOf("/" + mediaId) !== -1 || trimmed.indexOf("=" + mediaId) !== -1) {
    return true;
  }
  if (trimmed.indexOf(mediaId) !== -1) {
    return true;
  }
  return false;
}

/**
 * Menghapus media (Soft-delete / lifecycle removal / permanent physical removal)
 * Mengimplementasikan penghapusan referensial atomik: membersihkan screenshots JSON di CMS_Projects
 */
function handleAdminDeleteMedia(payload) {
  var currentVer = getCurrentSessionVersion();
  if (Number(payload.sessionVersion) !== currentVer) {
    return createJsonResponse(false, "SESSION_REVOKED", "Sesi administrator telah dicabut atau kedaluwarsa.");
  }

  var mediaId = payload.mediaId ? String(payload.mediaId).trim() : "";
  if (!mediaId) {
    return createJsonResponse(false, "VALIDATION_ERROR", "Parameter mediaId wajib disertakan.");
  }

  var isPermanent = payload.permanent === true;

  var lock = LockService.getScriptLock();
  var lockAcquired = lock.tryLock(10000);
  if (!lockAcquired) {
    return createJsonResponse(false, "SERVER_BUSY", "Server sibuk. Gagal menghapus media.");
  }

  try {
    var spreadsheet = getTargetSpreadsheet();
    var sheet = getOrCreateCmsMediaSheet(spreadsheet);
    var lastRow = sheet.getLastRow();

    var targetRow = -1;
    var driveFileId = "";

    if (lastRow > 1) {
      var rows = sheet.getRange(2, 1, lastRow - 1, 12).getValues();
      for (var i = 0; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === mediaId) {
          targetRow = i + 2;
          driveFileId = String(rows[i][2]);
          break;
        }
      }
    }

    if (isPermanent) {
      // 1. Bersihkan referensi media dari seluruh proyek di CMS_Projects terlebih dahulu
      var cleanedProjectIds = cleanMediaReferencesFromProjects(spreadsheet, mediaId);

      // Jika media tidak ditemukan di CMS_Media tetapi ada referensi tersisa yang dibersihkan (idempotent cleanup)
      if (targetRow === -1) {
        if (cleanedProjectIds.length > 0) {
          recordCmsAuditLog("DELETE_MEDIA", mediaId, CMS_CONFIG.AUTHORIZED_ADMIN_EMAIL, payload.clientIpMasked, {
            action: "PERMANENT_REMOVAL_DANGLING_CLEANUP",
            cleanedProjectsCount: cleanedProjectIds.length,
            cleanedProjectIds: cleanedProjectIds
          });
          return createJsonResponse(true, null, "Media telah dihapus sebelumnya. Referensi tersisa berhasil dibersihkan.", {
            mediaId: mediaId,
            permanent: true,
            idempotent: true,
            cleanedProjectsCount: cleanedProjectIds.length,
            cleanedProjectIds: cleanedProjectIds
          });
        }
        return createJsonResponse(false, "NOT_FOUND", "Media tidak ditemukan.");
      }

      // 2. Hapus baris dari CMS_Media
      sheet.deleteRow(targetRow);

      // 3. Hapus file fisik dari Google Drive jika live mode aktif
      var driveRemovalSuccess = false;
      var driveErrorMsg = "";
      if (CMS_CONFIG.STORAGE_MODE === "LIVE_DRIVE" && CMS_CONFIG.IS_LIVE_DRIVE_ACTIVE && driveFileId && driveFileId.indexOf("mock_") !== 0) {
        try {
          executeDriveWithRetry(function() {
            Drive.Files.remove(driveFileId);
          }, 3, 500);
          driveRemovalSuccess = true;
          console.info("[Media Storage] File Google Drive dihapus permanen: " + driveFileId);
        } catch (delErr) {
          driveErrorMsg = delErr.message;
          console.warn("[Media Storage] Gagal menghapus file dari Drive: " + delErr.message);
        }
      } else {
        driveRemovalSuccess = true; // In mock or non-live mode
      }

      // 4. Catat Audit Log Komprehensif
      recordCmsAuditLog("DELETE_MEDIA", mediaId, CMS_CONFIG.AUTHORIZED_ADMIN_EMAIL, payload.clientIpMasked, {
        action: "PERMANENT_REMOVAL",
        driveFileId: driveFileId,
        cleanedProjectsCount: cleanedProjectIds.length,
        cleanedProjectIds: cleanedProjectIds,
        driveRemovalSuccess: driveRemovalSuccess,
        driveError: driveErrorMsg || undefined
      });

      return createJsonResponse(true, null, "Media dan seluruh referensi terkait berhasil dihapus secara permanen.", {
        mediaId: mediaId,
        permanent: true,
        cleanedProjectsCount: cleanedProjectIds.length,
        cleanedProjectIds: cleanedProjectIds,
        driveRemovalSuccess: driveRemovalSuccess
      });
    } else {
      if (targetRow === -1) {
        return createJsonResponse(false, "NOT_FOUND", "Media tidak ditemukan.");
      }

      // Set visibility = ARCHIVED (Soft-delete)
      sheet.getRange(targetRow, 10).setValue("ARCHIVED");

      recordCmsAuditLog("DELETE_MEDIA", mediaId, CMS_CONFIG.AUTHORIZED_ADMIN_EMAIL, payload.clientIpMasked, {
        action: "SOFT_DELETE_TO_ARCHIVED"
      });

      return createJsonResponse(true, null, "Media berhasil diarsipkan/dihapus.", { mediaId: mediaId, permanent: false });
    }
  } finally {
    lock.releaseLock();
  }
}

/**
 * Rekonsiliasi orphan media files (Membandingkan file di Google Drive dengan baris CMS_Media)
 */
function handleAdminReconcileOrphans(payload) {
  var currentVer = getCurrentSessionVersion();
  if (Number(payload.sessionVersion) !== currentVer) {
    return createJsonResponse(false, "SESSION_REVOKED", "Sesi administrator telah dicabut atau kedaluwarsa.");
  }

  var spreadsheet = getTargetSpreadsheet();
  var sheet = getOrCreateCmsMediaSheet(spreadsheet);
  var lastRow = sheet.getLastRow();
  var activeCount = 0;
  var archivedCount = 0;
  var registeredDriveIds = {};

  if (lastRow > 1) {
    var rows = sheet.getRange(2, 1, lastRow - 1, 12).getValues();
    for (var i = 0; i < rows.length; i++) {
      var dId = String(rows[i][2] || "").trim();
      var vis = String(rows[i][9] || "").trim();
      if (dId) {
        registeredDriveIds[dId] = true;
      }
      if (vis === "ARCHIVED") {
        archivedCount++;
      } else {
        activeCount++;
      }
    }
  }

  var orphanedCount = 0;
  var removedOrphanIds = [];

  // Jika live Drive aktif, query daftar file di folder Drive dan hapus orphan
  if (CMS_CONFIG.STORAGE_MODE === "LIVE_DRIVE" && CMS_CONFIG.IS_LIVE_DRIVE_ACTIVE) {
    try {
      var folderId = getOrCreateTestMediaFolder();
      var pageToken = null;
      var driveFiles = [];
      do {
        var res = executeDriveWithRetry(function() {
          return Drive.Files.list({
            q: "'" + folderId + "' in parents and trashed = false",
            fields: "nextPageToken, files(id, name, size, createdTime)",
            pageToken: pageToken
          });
        }, 3, 500);

        if (res.files && res.files.length > 0) {
          for (var f = 0; f < res.files.length; f++) {
            driveFiles.push(res.files[f]);
          }
        }
        pageToken = res.nextPageToken;
      } while (pageToken);

      for (var k = 0; k < driveFiles.length; k++) {
        var file = driveFiles[k];
        if (!registeredDriveIds[file.id]) {
          // File ada di Drive tapi tidak ada di CMS_Media -> Orphan!
          orphanedCount++;
          try {
            executeDriveWithRetry(function() {
              Drive.Files.remove(file.id);
            }, 3, 500);
            removedOrphanIds.push(file.id);
            console.info("[Media Reconciliation] Berhasil membersihkan orphan file: " + file.id + " (" + file.name + ")");
          } catch (remErr) {
            console.error("[Media Reconciliation] Gagal menghapus file orphan " + file.id + ": " + remErr.message);
          }
        }
      }
    } catch (driveErr) {
      console.error("[Media Reconciliation] Gagal membaca list file Drive: " + driveErr.message);
    }
  }

  recordCmsAuditLog("RECONCILE_ORPHANS", "-", CMS_CONFIG.AUTHORIZED_ADMIN_EMAIL, payload.clientIpMasked, {
    activeMedia: activeCount,
    archivedMedia: archivedCount,
    orphanedFound: orphanedCount,
    orphansRemoved: removedOrphanIds.length
  });

  return createJsonResponse(true, null, "Rekonsiliasi berkas media berhasil dijalankan.", {
    activeMediaCount: activeCount,
    archivedMediaCount: archivedCount,
    reconciledCount: removedOrphanIds.length,
    orphanedDriveFilesFound: orphanedCount,
    removedOrphanIds: removedOrphanIds
  });
}

/**
 * Mengambil data biner media terautentikasi (Base64) untuk administrator / preview
 */
function handleAdminGetMediaBinary(payload) {
  var currentVer = getCurrentSessionVersion();
  if (Number(payload.sessionVersion) !== currentVer) {
    return createJsonResponse(false, "SESSION_REVOKED", "Sesi administrator telah dicabut atau kedaluwarsa.");
  }

  var mediaId = payload.mediaId ? String(payload.mediaId).trim() : "";
  if (!mediaId) {
    return createJsonResponse(false, "VALIDATION_ERROR", "Parameter mediaId wajib disertakan.");
  }

  var spreadsheet = getTargetSpreadsheet();
  var mediaSheet = getOrCreateCmsMediaSheet(spreadsheet);
  var lastRow = mediaSheet.getLastRow();
  if (lastRow <= 1) {
    return createJsonResponse(false, "NOT_FOUND", "Media tidak ditemukan.");
  }

  var mediaRows = mediaSheet.getRange(2, 1, lastRow - 1, 12).getValues();
  var matched = null;
  for (var m = 0; m < mediaRows.length; m++) {
    if (String(mediaRows[m][0]).trim() === mediaId) {
      matched = mediaRows[m];
      break;
    }
  }

  if (!matched) {
    return createJsonResponse(false, "NOT_FOUND", "Media tidak ditemukan.");
  }

  var driveFileId = String(matched[2]);
  var mimeType = String(matched[5]);
  var safeName = String(matched[4]);
  var sizeBytes = Number(matched[6]);
  var sha256Hex = String(matched[7]);

  if (CMS_CONFIG.STORAGE_MODE === "LIVE_DRIVE" && CMS_CONFIG.IS_LIVE_DRIVE_ACTIVE && driveFileId && driveFileId.indexOf("mock_") !== 0) {
    try {
      var blob = executeDriveWithRetry(function() {
        return Drive.Files.get(driveFileId, { alt: "media" });
      }, 3, 500);
      var base64Content = Utilities.base64Encode(blob.getBytes());
      return createJsonResponse(true, null, "Biner media berhasil diambil dari Google Drive.", {
        mediaId: mediaId,
        safeName: safeName,
        mimeType: mimeType,
        sizeBytes: sizeBytes,
        sha256: sha256Hex,
        base64Data: base64Content
      });
    } catch (driveErr) {
      console.error("[Media Storage] Gagal mengambil biner dari Google Drive: " + driveErr.message);
      return createJsonResponse(false, "STORAGE_ERROR", "Gagal mengambil file dari Google Drive: " + driveErr.message);
    }
  }

  // Fallback Mock binary (1x1 WebP)
  var mockB64 = "UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==";
  return createJsonResponse(true, null, "Biner media (mock) berhasil diambil.", {
    mediaId: mediaId,
    safeName: safeName,
    mimeType: mimeType,
    sizeBytes: sizeBytes,
    sha256: sha256Hex,
    base64Data: mockB64
  });
}

/**
 * Pengambilan Media untuk Pengunjung Publik (Strict Relational Check & Binary Transfer)
 */
function handleCmsGetPublicMedia(payload) {
  var mediaId = payload.mediaId ? String(payload.mediaId).trim() : "";
  if (!mediaId) {
    return createJsonResponse(false, "NOT_FOUND", "Media tidak ditemukan.");
  }

  var spreadsheet = getTargetSpreadsheet();
  var mediaSheet = getOrCreateCmsMediaSheet(spreadsheet);
  var lastRow = mediaSheet.getLastRow();
  if (lastRow <= 1) {
    return createJsonResponse(false, "NOT_FOUND", "Media tidak ditemukan.");
  }

  var mediaRows = mediaSheet.getRange(2, 1, lastRow - 1, 12).getValues();
  var matched = null;
  for (var m = 0; m < mediaRows.length; m++) {
    if (String(mediaRows[m][0]).trim() === mediaId) {
      matched = mediaRows[m];
      break;
    }
  }

  if (!matched) {
    return createJsonResponse(false, "NOT_FOUND", "Media tidak ditemukan.");
  }

  var mediaVisibility = String(matched[9] || "DRAFT");
  var parentProjectId = String(matched[1] || "");

  // Aturan 1: Media DRAFT atau ARCHIVED tidak boleh disajikan ke publik (Return 404)
  if (mediaVisibility !== "PUBLISHED") {
    return createJsonResponse(false, "NOT_FOUND", "Media tidak ditemukan.");
  }

  // Aturan 2: Proyek terkait HARUS dalam status PUBLISHED
  if (parentProjectId && parentProjectId !== "global") {
    var projSheet = getOrCreateCmsProjectsSheet(spreadsheet);
    var projLastRow = projSheet.getLastRow();
    var projectIsPublished = false;

    if (projLastRow > 1) {
      var projRows = projSheet.getRange(2, 1, projLastRow - 1, 23).getValues();
      for (var p = 0; p < projRows.length; p++) {
        var pId = String(projRows[p][0]).trim();
        var pSlug = String(projRows[p][1]).trim();
        if (pId === parentProjectId || pSlug === parentProjectId) {
          var pState = String(projRows[p][22] || "DRAFT");
          if (pState === "PUBLISHED") {
            projectIsPublished = true;
          }
          break;
        }
      }
    }

    if (!projectIsPublished) {
      return createJsonResponse(false, "NOT_FOUND", "Media tidak ditemukan.");
    }
  }

  var driveFileId = String(matched[2]);
  var safeName = String(matched[4]);
  var mimeType = String(matched[5]);
  var sizeBytes = Number(matched[6]);
  var sha256Hex = String(matched[7]);
  var currentEtag = '"' + sha256Hex + '"';

  // Aturan 3: Conditional Check (If-None-Match Short-Circuiting - ZERO Drive API Call!)
  if (payload.ifNoneMatch) {
    var clientEtag = String(payload.ifNoneMatch).replace(/^W\//, "").replace(/"/g, "").trim();
    if (clientEtag && clientEtag === sha256Hex) {
      return createJsonResponse(true, null, "Media publik tidak berubah (Not Modified).", {
        notModified: true,
        mediaId: String(matched[0]),
        sha256: sha256Hex,
        etag: currentEtag,
        visibility: "PUBLISHED"
      });
    }
  }

  // Aturan 4: Binary Retrieval from Google Drive (Never leak driveFileId to public!)
  var base64Content = "";
  if (CMS_CONFIG.STORAGE_MODE === "LIVE_DRIVE" && CMS_CONFIG.IS_LIVE_DRIVE_ACTIVE && driveFileId && driveFileId.indexOf("mock_") !== 0) {
    try {
      var blob = executeDriveWithRetry(function() {
        return Drive.Files.get(driveFileId, { alt: "media" });
      }, 3, 500);
      base64Content = Utilities.base64Encode(blob.getBytes());
    } catch (driveErr) {
      console.error("[Public Media] Gagal mengambil biner dari Google Drive: " + driveErr.message);
      return createJsonResponse(false, "STORAGE_ERROR", "Gagal mengambil file dari Google Drive: " + driveErr.message);
    }
  } else {
    // 1x1 Transparent WebP binary fallback
    base64Content = "UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==";
  }

  return createJsonResponse(true, null, "Media publik terverifikasi.", {
    notModified: false,
    mediaId: String(matched[0]),
    safeName: safeName,
    mimeType: mimeType,
    sizeBytes: sizeBytes,
    sha256: sha256Hex,
    etag: currentEtag,
    base64Data: base64Content,
    visibility: "PUBLISHED"
  });
}

/**
 * Tab CMS_Settings: Menyimpan konfigurasi dinamis website dan branding
 */
function getOrCreateCmsSettingsSheet(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(CMS_CONFIG.SETTINGS_SHEET_NAME || "CMS_Settings");
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CMS_CONFIG.SETTINGS_SHEET_NAME || "CMS_Settings");
  }

  if (sheet.getLastRow() === 0) {
    var headers = ["Key", "Value JSON", "Updated At", "Updated By"];
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#0F172A");
    headerRange.setFontColor("#38BDF8");
    headerRange.setFontWeight("bold");
    headerRange.setFontFamily("Consolas");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    for (var i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
    seedOfficialSettingsIfEmpty(sheet);
  }

  return sheet;
}

function seedOfficialSettingsIfEmpty(sheet) {
  var timestampStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd'T'HH:mm:ss'Z'");
  var defaultSettings = {
    id: "current",
    status: "published",
    version: 1,
    updatedAt: timestampStr,
    publishedAt: timestampStr,
    branding: {
      studioName: "SleepyKoala Studio",
      tagline: "Crafting fun, polished, and lightweight mobile games.",
      supportEmail: "contact@sleepykoalastudio.com"
    },
    homepage: {
      badgeText: "Indie Game Developer",
      headline: "Crafting Digital Experiences That Delight",
      subheadline: "Koleksi game indie orisinal yang dirancang dengan teliti, mengedepankan keseruan gameplay dan estetika audio visual yang memikat.",
      primaryCtaText: "Jelajahi Proyek",
      primaryCtaLink: "/projects",
      secondaryCtaText: "Tentang Saya",
      secondaryCtaLink: "/about",
      featuredSectionTitle: "Game & Aplikasi Pilihan",
      featuredSectionSubtitle: "Temukan berbagai judul terbaru yang sedang dikembangkan dan telah dirilis.",
      showStats: true
    },
    about: {
      developerName: "SleepyKoala",
      developerRole: "Solo Indie Developer & Game Designer",
      studioName: "SleepyKoala Studio",
      bioParagraphs: [
        "Halo! Saya seorang indie developer independen yang berfokus membangun game mobile dan pengalaman digital interaktif yang hangat, menyenangkan, dan berkesan.",
        "Bekerja secara solo memungkinkan saya mengontrol estetika, mekanisme permainan, performa teknis, hingga detail terkecil dengan penuh dedikasi."
      ],
      philosophyTitle: "Filosofi Pengembangan",
      philosophyDescription: "Gameplay yang berbobot tidak memerlukan spesifikasi berlebih. Pengalaman pemain, transparansi, dan penghargaan terhadap waktu pengguna adalah fondasi setiap karya.",
      techStack: [
        "Unity (C#)", "Godot Engine (GDScript / C#)", "TypeScript & React",
        "Cloudflare Pages & Workers", "Google Apps Script & Sheets DB",
        "Pixel Art & Vector Illustration", "Digital Audio & SFX Production"
      ],
      socialLinks: {
        github: "https://github.com",
        twitter: "https://twitter.com",
        linkedin: "https://linkedin.com",
        email: "contact@sleepykoalastudio.com",
        playStore: "https://play.google.com/store/apps/dev?id=sleepykoala"
      },
      contactNote: "Tertarik berkolaborasi, memberikan masukan, atau sekadar bertukar sapa seputar game development? Jangan ragu untuk menghubungi melalui email atau formulir feedback."
    },
    navigation: [
      { id: "nav-home", label: "Beranda", path: "/" },
      { id: "nav-projects", label: "Proyek", path: "/projects" },
      { id: "nav-about", label: "Tentang", path: "/about" },
      { id: "nav-feedback", label: "Feedback", path: "/feedback" }
    ],
    footer: {
      bioSummary: "SleepyKoala Studio — Dedicated solo indie game developer crafting memorable lightweight games with love.",
      copyrightText: "© 2026 SleepyKoala Studio. All rights reserved.",
      showFeedbackLink: true
    },
    seo: {
      metaTitle: "SleepyKoala Studio — Indie Game Developer Portfolio",
      metaDescription: "Official portfolio and game showcase of SleepyKoala Studio. Discover polished indie games, mobile adventures, and devlogs.",
      metaKeywords: ["Indie Game", "Game Developer", "Mobile Games", "SleepyKoala", "Android Games", "Unity", "Godot"]
    }
  };

  sheet.appendRow(["site_settings", JSON.stringify(defaultSettings), timestampStr, "SYSTEM_SEED"]);
}

function handleCmsGetSettings(payload) {
  var isPublicOnly = payload.isPublicOnly === true;
  var spreadsheet = getTargetSpreadsheet();
  var sheet = getOrCreateCmsSettingsSheet(spreadsheet);
  var lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    seedOfficialSettingsIfEmpty(sheet);
    lastRow = sheet.getLastRow();
  }

  var data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]) === "site_settings") {
      try {
        var settingsObj = JSON.parse(data[i][1]);
        if (isPublicOnly && settingsObj.status !== "published") {
          return createJsonResponse(true, null, "Pengaturan website draft (menggunakan default publik).", { settings: null });
        }
        return createJsonResponse(true, null, "Pengaturan website berhasil dimuat.", { settings: settingsObj });
      } catch (e) {
        return createJsonResponse(false, "CORRUPT_DATA", "Format JSON pengaturan rusak: " + e.message);
      }
    }
  }

  return createJsonResponse(false, "NOT_FOUND", "Pengaturan website tidak ditemukan.");
}

function handleAdminSaveSettings(payload) {
  if (!payload.settings || typeof payload.settings !== "object") {
    return createJsonResponse(false, "INVALID_PAYLOAD", "Payload settings tidak valid.");
  }

  var spreadsheet = getTargetSpreadsheet();
  var sheet = getOrCreateCmsSettingsSheet(spreadsheet);
  var lastRow = sheet.getLastRow();
  var timestampStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd'T'HH:mm:ss'Z'");
  var adminEmail = CMS_CONFIG.AUTHORIZED_ADMIN_EMAIL;

  var currentSettings = {};
  var targetRow = 0;

  if (lastRow > 1) {
    var data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]) === "site_settings") {
        targetRow = i + 2;
        try {
          currentSettings = JSON.parse(data[i][1]);
        } catch (_e) {}
        break;
      }
    }
  }

  var newStatus = payload.publish === true ? "published" : (payload.settings.status || currentSettings.status || "draft");
  var newVersion = (Number(currentSettings.version) || 0) + 1;

  var mergedSettings = Object.assign({}, currentSettings, payload.settings, {
    status: newStatus,
    version: newVersion,
    updatedAt: timestampStr
  });

  if (newStatus === "published") {
    mergedSettings.publishedAt = timestampStr;
  }

  var jsonStr = JSON.stringify(mergedSettings);

  if (targetRow > 0) {
    sheet.getRange(targetRow, 2, 1, 3).setValues([[jsonStr, timestampStr, adminEmail]]);
  } else {
    sheet.appendRow(["site_settings", jsonStr, timestampStr, adminEmail]);
  }

  logCmsAction(spreadsheet, "ADMIN_SAVE_SETTINGS", "site_settings", {
    status: newStatus,
    version: newVersion,
    publish: payload.publish === true
  });

  return createJsonResponse(true, null, "Pengaturan website berhasil disimpan.", { settings: mergedSettings });
}

/**
 * Tab CMS_Compliance: Google Play Compliance (Privacy Policy & Account Deletion)
 */
function getOrCreateCmsComplianceSheet(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(CMS_CONFIG.COMPLIANCE_SHEET_NAME || "CMS_Compliance");
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CMS_CONFIG.COMPLIANCE_SHEET_NAME || "CMS_Compliance");
  }

  if (sheet.getLastRow() === 0) {
    var headers = [
      "Project ID", "Project Slug", "Project Name",
      "Privacy Policy JSON", "Delete Account JSON",
      "Updated At", "Updated By"
    ];
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#0F172A");
    headerRange.setFontColor("#38BDF8");
    headerRange.setFontWeight("bold");
    headerRange.setFontFamily("Consolas");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    for (var i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
    seedOfficialComplianceIfEmpty(sheet);
  }

  return sheet;
}

function seedOfficialComplianceIfEmpty(sheet) {
  var timestampStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd'T'HH:mm:ss'Z'");
  var canonical = [
    { id: "dompetnalar", slug: "dompetnalar", name: "DompetNalar", published: true },
    { id: "idle-master", slug: "idle-master", name: "IDLE MASTER", published: false },
    { id: "mobile-kasir", slug: "mobile-kasir", name: "Mobile Kasir", published: true },
    { id: "idle-mining", slug: "idle-mining", name: "Idle Mining", published: false },
    { id: "the-broken-origin", slug: "the-broken-origin", name: "The Broken Origin", published: false },
    { id: "worklume", slug: "worklume", name: "Worklume", published: false }
  ];

  for (var i = 0; i < canonical.length; i++) {
    var p = canonical[i];
    var status = p.published ? "published" : "draft";

    var privacy = {
      status: status,
      version: 1,
      effectiveDate: "2026-11-02",
      lastUpdated: timestampStr,
      contactEmail: "privacy@sleepykoalastudio.com",
      summary: "Kebijakan Privasi resmi untuk " + p.name + " oleh SleepyKoala Studio.",
      dataCollected: ["Data Diagnostik Anonim", "Penyimpanan Preferensi Lokal"],
      thirdPartyServices: ["Google Play Services"],
      userRightsSummary: "Pengguna berhak menghapus data lokal dan mengajukan permohonan penghapusan akun.",
      childrenPrivacyClause: "Aplikasi ini mematuhi perlindungan privasi anak dan tidak mengumpulkan informasi pribadi anak.",
      content: "# Kebijakan Privasi " + p.name + "\n\nSleepyKoala Studio berkomitmen melindungi data privasi pengguna " + p.name + "."
    };

    var deleteAcc = {
      status: status,
      version: 1,
      lastUpdated: timestampStr,
      requestEmail: "support@sleepykoalastudio.com",
      turnaroundTime: "3-7 hari kerja",
      retentionPolicy: "Data akun dan progres game yang terhapus tidak dapat dipulihkan.",
      deletionMethods: ["Pengaturan di dalam aplikasi", "Email ke support@sleepykoalastudio.com"],
      dataDeletedList: ["Player ID", "Cloud Save", "Riwayat Peringkat"],
      dataRetainedList: ["Log audit transaksi finansial anonim"],
      content: "# Permintaan Penghapusan Akun " + p.name + "\n\nUntuk menghapus akun Anda, gunakan tombol di pengaturan aplikasi atau kirim email ke support@sleepykoalastudio.com."
    };

    sheet.appendRow([
      p.id, p.slug, p.name,
      JSON.stringify(privacy), JSON.stringify(deleteAcc),
      timestampStr, "SYSTEM_SEED"
    ]);
  }
}

function handleCmsGetCompliance(payload) {
  var slugOrId = String(payload.slugOrId || payload.target || "").trim().toLowerCase();
  if (!slugOrId) {
    return createJsonResponse(false, "BAD_REQUEST", "Parameter slug atau ID proyek diperlukan.");
  }

  var isPublicOnly = payload.isPublicOnly === true;
  var spreadsheet = getTargetSpreadsheet();
  var sheet = getOrCreateCmsComplianceSheet(spreadsheet);
  var lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    seedOfficialComplianceIfEmpty(sheet);
    lastRow = sheet.getLastRow();
  }

  if (lastRow > 1) {
    var data = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var rowId = String(row[0]).trim().toLowerCase();
      var rowSlug = String(row[1]).trim().toLowerCase();

      if (rowId === slugOrId || rowSlug === slugOrId) {
        var privacy = null;
        var deleteAcc = null;
        try { privacy = JSON.parse(row[3]); } catch (_e) {}
        try { deleteAcc = JSON.parse(row[4]); } catch (_e) {}

        if (isPublicOnly) {
          var pubPrivacy = (privacy && privacy.status === "published") ? privacy : null;
          var pubDelete = (deleteAcc && deleteAcc.status === "published") ? deleteAcc : null;

          if (!pubPrivacy && !pubDelete) {
            return createJsonResponse(false, "NOT_FOUND", "Kebijakan kepatuhan proyek ini belum dipublikasikan.");
          }

          return createJsonResponse(true, null, "Kepatuhan proyek ditemukan.", {
            project: { id: String(row[0]), slug: String(row[1]), name: String(row[2]) },
            privacyPolicy: pubPrivacy,
            deleteAccount: pubDelete
          });
        }

        return createJsonResponse(true, null, "Kepatuhan proyek (admin).", {
          compliance: {
            projectId: String(row[0]),
            projectSlug: String(row[1]),
            projectName: String(row[2]),
            privacyPolicy: privacy,
            deleteAccount: deleteAcc,
            updatedAt: String(row[5]),
            updatedBy: String(row[6])
          }
        });
      }
    }
  }

  return createJsonResponse(false, "NOT_FOUND", "Proyek tidak ditemukan pada basis data kepatuhan.");
}

function handleAdminGetCompliance(payload) {
  if (payload.target) {
    payload.isPublicOnly = false;
    return handleCmsGetCompliance(payload);
  }

  var spreadsheet = getTargetSpreadsheet();
  var sheet = getOrCreateCmsComplianceSheet(spreadsheet);
  var lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    seedOfficialComplianceIfEmpty(sheet);
    lastRow = sheet.getLastRow();
  }

  var records = [];
  if (lastRow > 1) {
    var data = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var privacy = null;
      var deleteAcc = null;
      try { privacy = JSON.parse(row[3]); } catch (_e) {}
      try { deleteAcc = JSON.parse(row[4]); } catch (_e) {}

      records.push({
        projectId: String(row[0]),
        projectSlug: String(row[1]),
        projectName: String(row[2]),
        privacyPolicy: privacy,
        deleteAccount: deleteAcc,
        updatedAt: String(row[5]),
        updatedBy: String(row[6])
      });
    }
  }

  return createJsonResponse(true, null, "Daftar kepatuhan berhasil dimuat.", { complianceRecords: records });
}

function handleAdminSaveCompliance(payload) {
  var comp = payload.compliance;
  if (!comp || (!comp.projectId && !comp.projectSlug)) {
    return createJsonResponse(false, "BAD_REQUEST", "Data kepatuhan atau target proyek tidak valid.");
  }

  var spreadsheet = getTargetSpreadsheet();
  var sheet = getOrCreateCmsComplianceSheet(spreadsheet);
  var lastRow = sheet.getLastRow();
  var timestampStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd'T'HH:mm:ss'Z'");
  var adminEmail = CMS_CONFIG.AUTHORIZED_ADMIN_EMAIL;

  var targetRow = 0;
  var existingRecord = null;
  var targetId = String(comp.projectId || "").trim().toLowerCase();
  var targetSlug = String(comp.projectSlug || targetId).trim().toLowerCase();
  var projectName = comp.projectName || comp.projectId;

  if (lastRow > 1) {
    var data = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
    for (var i = 0; i < data.length; i++) {
      var rId = String(data[i][0]).trim().toLowerCase();
      var rSlug = String(data[i][1]).trim().toLowerCase();
      if (rId === targetId || rSlug === targetSlug) {
        targetRow = i + 2;
        projectName = String(data[i][2]);
        try {
          existingRecord = {
            privacyPolicy: JSON.parse(data[i][3]),
            deleteAccount: JSON.parse(data[i][4])
          };
        } catch (_e) {}
        break;
      }
    }
  }

  var privacyPolicy = comp.privacyPolicy || (existingRecord && existingRecord.privacyPolicy) || {};
  var deleteAccount = comp.deleteAccount || (existingRecord && existingRecord.deleteAccount) || {};

  // Cek aksi cepat
  if (payload.action === "publish_privacy") {
    privacyPolicy.status = "published";
    privacyPolicy.lastUpdated = timestampStr;
  } else if (payload.action === "unpublish_privacy") {
    privacyPolicy.status = "draft";
    privacyPolicy.lastUpdated = timestampStr;
  } else if (payload.action === "publish_delete_account") {
    deleteAccount.status = "published";
    deleteAccount.lastUpdated = timestampStr;
  } else if (payload.action === "unpublish_delete_account") {
    deleteAccount.status = "draft";
    deleteAccount.lastUpdated = timestampStr;
  }

  var updatedCompliance = {
    projectId: comp.projectId || targetId,
    projectSlug: targetSlug,
    projectName: projectName,
    privacyPolicy: privacyPolicy,
    deleteAccount: deleteAccount,
    updatedAt: timestampStr,
    updatedBy: adminEmail
  };

  var privJson = JSON.stringify(privacyPolicy);
  var delJson = JSON.stringify(deleteAccount);

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, 7).setValues([[
      updatedCompliance.projectId,
      updatedCompliance.projectSlug,
      updatedCompliance.projectName,
      privJson,
      delJson,
      timestampStr,
      adminEmail
    ]]);
  } else {
    sheet.appendRow([
      updatedCompliance.projectId,
      updatedCompliance.projectSlug,
      updatedCompliance.projectName,
      privJson,
      delJson,
      timestampStr,
      adminEmail
    ]);
  }

  logCmsAction(spreadsheet, "ADMIN_SAVE_COMPLIANCE", updatedCompliance.projectId, {
    action: payload.action || "save",
    privacyStatus: privacyPolicy.status,
    deleteAccountStatus: deleteAccount.status
  });

  return createJsonResponse(true, null, "Kepatuhan proyek berhasil disimpan.", { compliance: updatedCompliance });
}

/**
 * Uji Diagnostik Internal Mandiri untuk CMS PoC
 */
function testCmsPoC() {
  console.log("=== Memulai Uji Diagnostik CMS PoC ===");
  var spreadsheet = getTargetSpreadsheet();
  var projSheet = getOrCreateCmsProjectsSheet(spreadsheet);
  var logsSheet = getOrCreateCmsAuditLogsSheet(spreadsheet);
  console.log("Tab CMS_Projects siap: " + projSheet.getName());
  console.log("Tab CMS_AuditLogs siap: " + logsSheet.getName());
  console.log("Session Version Aktif: " + getCurrentSessionVersion());
  console.log("=== Uji Diagnostik CMS Selesai ===");
}
