# Fluency OS Google backend

1. Create a standalone Google Apps Script project.
2. Replace `Code.gs` with this folder's `Code.gs`.
3. In Project Settings, enable **Show appsscript.json**, then replace it with this folder's manifest.
4. Run `setup` once and approve access. Copy the returned web-app token privately.
5. In Project Settings → Script properties, add `GEMINI_API_KEY`. Never place the key in GitHub or the dashboard.
6. Deploy → New deployment → Web app. Execute as **Me** and allow **Anyone**.
7. Copy the `/exec` URL into Fluency OS → Settings together with the access token.

Run `setup` again only when repairing the database or cleanup trigger. It reuses existing Sheet and Drive folder IDs.
