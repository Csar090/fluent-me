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

New application sessions last eight hours and are stored durably under hashed token identifiers in Script properties. Every protected request still checks expiry and the approved-email list. Sign-out revokes the token. Valid old cache-backed sessions can migrate without extending their original expiry. Transient browser network failures do not discard sign-in.

## Telegram delivery

Run `Telegram_enablePolling` once after updating the backend. It disconnects the failing webhook without dropping pending updates, imports the waiting messages, and installs a one-minute `Telegram_poll` trigger. Keep the existing bot token, chat allowlist, database and audio folder. Cloudflare is no longer needed for ingestion.

`Telegram_getWebhookInfo` logs a sanitized delivery report: mode, last check, last receipt, and errors. The dashboard exposes the same report through **Telegram → Check delivery**. Failed downloads are retried without advancing past the failed update; files over the 12 MB handoff limit remain visible as failed imports without blocking later messages.

Do not run `Telegram_setupWebhook` while polling is enabled. A bot must use one delivery mechanism at a time.
