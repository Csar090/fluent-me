# Relationship System — migration staging

This is the staging copy for the Relationship System GitHub frontend.

Target structure requested by the user:
- New top-level repository: R&D
- Relationship System under that repository
- Existing fluent-me repository remains the Fluency application and should not become the permanent home of Relationship System.

Current connector limitation:
The connected GitHub integration can create branches/files/commits in existing repositories, but it does not expose repository creation. Therefore this branch is retained only as staging until the empty R&D repository exists.

Architecture:
GitHub Pages HTTPS frontend → Apps Script HTTP RPC bridge → Google Sheets + Gemini.

Workflow invariant:
Saved draft → Needs Your Review immediately.
Reviewed + unresolved → Pending Completion.
Only Reviewed records → Insights / Daily Summary.

Backend package required: Relationship System v1.5 Review Visibility + API.
