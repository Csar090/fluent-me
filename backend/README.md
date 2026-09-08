# Fluency OS Google backend — V2

## One-time setup

1. Replace the Apps Script project's `Code.gs` with this repository's `backend/Code.gs`.
2. Keep the existing Script properties, Sheet and Drive folder. Run `setup` once; it is migration-safe and adds the `Users` sheet.
3. In Google Cloud Console create a **Web application OAuth client** for Google Identity Services.
4. Add `https://csar090.github.io` as an authorised JavaScript origin.
5. In Apps Script → Project Settings → Script properties, add:
   - `GOOGLE_CLIENT_ID`: the OAuth web client ID
   - `ALLOWED_EMAILS`: approved Gmail address(es), comma-separated
   - `GEMINI_API_KEY`: existing Gemini key
6. Deploy the backend as a web app: execute as **Me**, access **Anyone**.
7. Put the permanent `/exec` URL into `config.js` once.

## Keeping the URL permanent

For every later backend update use **Deploy → Manage deployments → Edit → New version → Deploy**.

Do not create another deployment. Editing the existing deployment updates the backend while preserving the same URL and deployment ID.

## Authentication flow

The browser sends the short-lived Google ID credential by POST. The backend verifies its audience, verified email and the `ALLOWED_EMAILS` allowlist, then issues a temporary Fluency OS session token. Gmail credentials and Gemini keys are never stored in the repository.

The previous private access token remains supported only as a migration fallback. Existing recordings and the current database are preserved.
