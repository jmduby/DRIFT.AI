# Wire Results (Mock)
Goal: show a real table on /results using mock JSON produced by reconciler.

## Steps
1) Create `apps/web/src/mock/reconcile.json` if missing (sample data with 6-12 lines).
2) Update `apps/web/src/app/results/page.tsx` to read the JSON (dynamic import on client) and render:
   - Table A: Invoice lines
   - Table B: Contract rules
   - Table C: Mismatches (✅/⚠️/❌ color-coded using theme vars)
3) Add an "Explain" button per mismatch (opens a small panel with reason text).
4) Keep components <200 lines; extract basic `<Badge>` / `<Table>` if needed.