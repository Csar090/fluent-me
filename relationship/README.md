# Relationship System web frontend

This branch adds an HTTPS-hosted Relationship System frontend under /relationship/ without changing the existing Fluency app.

Architecture:
GitHub Pages frontend → Apps Script API → Google Sheets + Gemini.

Why: microphone recording requires a normal secure web context; Apps Script HTML Service is sandboxed.

The frontend supports:
- Speak via MediaRecorder/getUserMedia
- Write
- Gemini transcription through the Apps Script backend
- comprehensive field assessment
- focused clarification questions
- explicit Ignore for this record
- completeness gate
- save to Needs Your Review
- dashboard/review/insight backend loading

The existing Apps Script business logic remains authoritative. The backend must expose the RPC bridge and be deployed as /exec. Put that URL in relationship/config.js or enter it once in the Backend connection panel.

This branch intentionally does not modify the root Fluency application.
