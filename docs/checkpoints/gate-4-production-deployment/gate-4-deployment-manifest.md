# GATE 4 DEPLOYMENT MANIFEST

| Component | Target Platform | Version / Identifier | URL | Verification |
|---|---|---|---|---|
| Edge Proxy & Frontend | Cloudflare Pages | `2c3cced9-d419-4bba-9577-03bb6353d987` | `https://sleepykoala.pages.dev` | HTTP 200 Live |
| Static Build Artifacts | Cloudflare CDN | `dist/` (8 uploaded assets) | `https://sleepykoala.pages.dev/assets/*` | HTTP 200 Live |
| CMS & Registration Backend | Google Apps Script | Deployment `AKfycbxcX7x7Q_g4WCMjtsohpcL9Z3tbkSnueA60_yY5vU1TOcaMWy6W6E6_HVakgsKZ0v6P5A` (Version 3) | `https://script.google.com/macros/s/AKfycbxcX7x7Q_g4WCMjtsohpcL9Z3tbkSnueA60_yY5vU1TOcaMWy6W6E6_HVakgsKZ0v6P5A/exec` | HTTP 200 Live |
| Master Database | Google Sheets | Container-Bound Database | `TesterRegistrations`, `CMS_Projects`, `CMS_Media`, `CMS_AuditLogs`, `CMS_Settings` | 6 Projects Seeded |
| Media Asset Storage | Google Drive | `SleepyKoala_CMS_Media` (Free 15GB) | Scoped via `drive.file` | Integrated |
