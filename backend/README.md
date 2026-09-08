# Fluency OS Google backend

1. Create a standalone Google Apps Script project.
2. Replace `Code.gs` with this folder's `Code.gs`.
3. In Project Settings, enable **Show appsscript.json**, then replace it with this folder's manifest.
4. Run `setup` once and approve access. The existing Sheet and Drive folder are preserved.
5. In Project Settings → Script properties, add `GEMINI_API_KEY`. Never place the key in GitHub or the dashboard.
6. Deploy → New deployment → Web app. Execute as **Me** and allow **Anyone**.
7. In Script properties add `GOOGLE_CLIENT_ID` and `APPROVED_EMAILS` (comma-separated Gmail addresses).
8. Put the public `/exec` URL and OAuth Web Client ID into the two deployment constants at the top of `cloud.js`.
9. Future Apps Script updates must edit the existing deployment and select **New version**. Never create a second deployment; the `/exec` URL then stays permanent.

The legacy access token remains available only as a recovery path. Normal users sign in with Google and never enter a URL, Sheet ID, folder ID, or token.

Run `setup` again only when repairing the database or cleanup trigger. It reuses existing Sheet and Drive folder IDs.
