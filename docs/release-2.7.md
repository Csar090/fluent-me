# Fluency OS 2.7 repair

- A shared collapse control hides Telegram, transcription, timestamps and AI review content using the actual HTML hidden state. Refreshing content does not expand it. Choices persist on the device.
- Sticky Capture, Library, Progress and Settings navigation; section shortcuts at the side on wide screens and bottom on narrow screens; section shortcuts inside saved-record dialogs.
- One shared review renderer preserves Executive version and shows Punchier and Humorous versions in Capture and Library. A complete explicit review requests all three. Missing humorous rewrites have a direct generation button. No humor score or Executive take placeholder is displayed.
- Saved transcripts can be edited and re-transcribed from retained audio. Corrections increment the transcript revision. Old feedback is retained and identified as outdated; old timestamps are not presented as corrected word alignment.
- Record next attempt preserves title, mode, audience and practice focus, generates a new recording identity, and increments the attempt within its group. Re-reviewing an existing recording does not add an attempt.
- Progress and attempt comparison emphasize Structure, Clarity, Decisiveness, Executive presence, Impact and North Star. Missing evidence is not zero. Only reviews of the current transcript contribute, with one point per recording.
- Backend sessions survive Apps Script cache eviction and last eight hours after Google verification, subject to expiry, sign-out and the approved-email list. Temporary connection failures retain the existing token.
- Telegram uses a one-minute Apps Script inbox trigger, replacing the relay that returned HTTP 405. Pending updates are preserved. Ingestion remains independent from local transcription and explicit Gemini review.

## Verification

`npm test` exercises encrypted storage and locked access, saved-review history, correction revisions, missing scores, next-attempt identity, computed collapse visibility, cache eviction/revocation and Telegram retry offsets using synthetic fixtures. These tests make no production writes and no Gemini calls.

## Deployment and rollback

Update the existing Apps Script deployment with `backend/Code.gs`; keep its URL and properties. Run `Telegram_enablePolling` once. Publish the matching frontend files together. The dashboard identifies this release as v2.7; the backend bootstrap identifies `20260923-3`.

Previous Apps Script deployments remain available through Manage deployments. Git history preserves the prior frontend. Do not delete recordings, keys or the database to resolve a code-version mismatch.

## Operational boundaries

New Telegram media normally appears after the next scheduled check and dashboard refresh. Audio still follows the selected retention period. The browser handoff limit remains 12 MB. Local transcription needs a supported audio format and its model download. AI requires the configured Gemini key and available quota; old records are not automatically submitted for paid review.
