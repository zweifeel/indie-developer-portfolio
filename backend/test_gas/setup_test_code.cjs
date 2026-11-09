const crypto = require('crypto');
const fs = require('fs');

const testSecret = crypto.randomBytes(32).toString('hex');
let code = fs.readFileSync('backend/gas/Code.gs', 'utf8');

code = code.replace(
  'STUDIO_NAME: "SleepyKoala Studio",',
  'STUDIO_NAME: "SleepyKoala Studio (Test Environment)",\n  TEST_SECRET: "' + testSecret + '",'
);

code = code.replace(
  'var expectedSecret = scriptProperties.getProperty("APPS_SCRIPT_SECRET");',
  'var expectedSecret = scriptProperties.getProperty("APPS_SCRIPT_SECRET") || DEFAULT_CONFIG.TEST_SECRET;'
);

// In sendOwnerNotificationEmail, mock sending email so no real emails are sent to the user during tests
code = code.replace(
  /function sendOwnerNotificationEmail\(ownerEmail, data\) \{[\s\S]*?console\.log\("Email terkirim ke: " \+ ownerEmail\);\s*\}/,
  `function sendOwnerNotificationEmail(ownerEmail, data) {
  if (data.simulateEmailFailure) {
    throw new Error("Simulated Gmail quota exceeded / network outage");
  }
  console.log("[TEST MOCK EMAIL] Notifikasi tersimulasi aman ke: " + ownerEmail + " untuk tester: " + data.testerName);
  return true;
}`
);

// Support passing simulateEmailFailure through payload
code = code.replace(
  'appVersion: appVersion',
  'appVersion: appVersion,\n          simulateEmailFailure: payload.simulateEmailFailure === true'
);

// Also add a diagnostic query helper function to inspect row count and rows in test sheet without modifying it
code += `

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
`;

fs.writeFileSync('backend/test_gas/Code.gs', code, 'utf8');
fs.writeFileSync('backend/test_gas/.test_secret', testSecret, 'utf8');
console.log('Successfully prepared backend/test_gas/Code.gs with test secret.');
