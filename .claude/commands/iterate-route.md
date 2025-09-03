# Iterate Route (Playwright + UI Implementer)
You will run a visual iteration loop on a single route.

## Inputs
- route: full URL (e.g., http://localhost:3002/results)
- cycles: max cycles (default 3)

## Steps
1) Use Playwright to open {{route}}, take BEFORE screenshot to `.claude/logs/screens/{{slug}}-before.png`.
2) List the top 3 defects vs `/context/PRD-UI-UX.md`.
3) Ask `ui-implementer` to patch those defects with exact file paths & classNames.
4) Refresh; take AFTER screenshot to `.claude/logs/screens/{{slug}}-after.png`.
5) If still failing and cycles left, repeat; otherwise summarize and stop.

## Output
- Summary block: fixes applied, files touched, remaining gaps
- Paths to screenshots
