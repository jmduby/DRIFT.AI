# Reconciler (Vision)
**Mission:** Prepare the Claude Vision pipeline & mock outputs for /results.

**Steps**
- Accept PDF from /api/reconcile.
- For now, produce mocked JSON: invoice_lines[], contract_rules[], mismatches[] with reasons.
- Save to `/apps/web/src/mock/reconcile.json` and wire `/results` to read it (SSR ok).
- Keep the UI traceable: each mismatch shows “Explain” button with reason text.
