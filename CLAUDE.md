# Drift.ai — Agent Operating Rules (Frontend + UX)

## Visual Development Workflow (Playwright MCP)
When you modify frontend code:
1) Launch a headed Chromium window at `http://localhost:3000` (or current route).
2) Capture **BEFORE** and **AFTER** screenshots at 1280×832 to `.claude/logs/screens/`.
3) Compare screenshots against acceptance criteria, PRDs, and style tokens.
4) Iterate until acceptance criteria pass OR a clear blocker is identified.

### Acceptance Criteria (UI/UX PRD v1)
- Dark theme palette, AA contrast, Inter/Roboto, 12px radius, sticky headers.
- Drag & Drop PDF upload: clear empty/drag/reject/selected states.
- Results: flags are color-coded (success #22C55E, warning #EAB308, error #EF4444).
- Evidence viewer: two-pane Contract | Invoice, jump-to page works.

## Explore → Plan → Execute
- **Explore:** Map routes/components and read PRDs in `/context`.
- **Plan:** Produce PR-sized steps w/ function + test names. No silent fallbacks.
- **Execute:** Minimal diffs; run lint/build; update changelog.

## Guardrails
- No new UI libs without approval. Prefer composition; <200 line components.
- Fail loudly; do not add “graceful fallbacks” that hide errors.
- If context missing (files, sample PDFs), pause and ask.

# Drift.ai — Agent Operating Rules (Frontend + UX)

## Visual Development Workflow (Playwright MCP)
When you modify frontend code:
1) Launch a headed Chromium window at `http://localhost:3000` (or current route).
2) Capture **BEFORE** and **AFTER** screenshots at 1280×832 to `.claude/logs/screens/`.
3) Compare screenshots against acceptance criteria, PRDs, and style tokens.
4) Iterate until acceptance criteria pass OR a clear blocker is identified.

### Acceptance Criteria (UI/UX PRD v1)
- Dark theme palette, AA contrast, Inter/Roboto, 12px radius, sticky headers.
- Drag & Drop PDF upload: clear empty/drag/reject/selected states.
- Results: flags are color-coded (success #22C55E, warning #EAB308, error #EF4444).
- Evidence viewer: two-pane Contract | Invoice, jump-to page works.

## Explore → Plan → Execute
- **Explore:** Map routes/components and read PRDs in `/context`.
- **Plan:** Produce PR-sized steps w/ function + test names. No silent fallbacks.
- **Execute:** Minimal diffs; run lint/build; update changelog.

## Guardrails
- No new UI libs without approval. Prefer composition; <200 line components.
- Fail loudly; do not add “graceful fallbacks” that hide errors.
- If context is missing (files, sample PDFs), pause and ask.
## Long-Run Loop Defaults
- Assume you have write access; don’t ask for permission inside `apps/web`.
- Prefer **repeat up to 3 cycles** per route before raising a blocker.
- Screenshot size: 1280×832 to `.claude/logs/screens/`.
- Commit small sets of changes with clear messages:
  - feat(ui): improve contrast on /
  - fix(results): color-coded mismatch badges
- Only pause on: missing data, failing build you cannot fix with small diffs, or unclear product intent.