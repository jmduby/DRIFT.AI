# Visual Iterate (Playwright)
You are improving the current page visually until acceptance criteria pass.

## Context
- Spec: /context/PRD-UI-UX.md
- Brand tokens: /apps/web/src/theme/tokens.ts & global.css
- Route under test: {{route || "http://localhost:3000"}}

## Steps
1) Launch Playwright (headed) at {{route}}; take `BEFORE` screenshot (1280×832).
2) List visual defects against spec (spacing, contrast, focus rings, dark palette).
3) Patch code in /apps/web/src to fix top 3 issues.
4) Rebuild/refresh; take `AFTER` screenshot.
5) If acceptance criteria not met, repeat up to 3 cycles; otherwise stop.

## Deliverables
- Summary of fixes with file/line references.
- BEFORE/AFTER screenshot paths.
- Remaining gaps (if any) with exact tasks.
