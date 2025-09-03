# DRIFT.AI — Core PRD (paste full text here)
DRIFT.AI — PRD v1 (Single Facility)
Last updated: 2025-08-25
0) Executive Summary
What it is: A dark-mode, ultra-simple web app for nursing-home AP teams. Users upload a contract to auto-create a Vendor profile, then upload invoices under that vendor. An AI engine (no rule parsers) reads both documents, flags discrepancies, and provides clickable evidence back to the exact spot in each file. Findings are High/Medium/Low, each with a clear breakdown and a separate Variance line; totals roll up across the facility.
Why it matters: Operators routinely overpay due to manual reviews and buried contracts. This tool surfaces real, defensible savings with minimal friction and clean traceability.
v1 scope: Single facility; one user role (full access); manual uploads only; no integrations yet; evidence viewer and CSV exports included.
1) Look & Feel (Visual System)
Overall vibe: Premium Silicon Valley dark theme; clean, quiet, and highly legible. No visual clutter.
Colors (dark-mode first):
* Backgrounds: #0A0A0A (app), #121212–#1A1A1A (surfaces)
* Text: #F5F5F5 (primary), #C9C9C9 (secondary)
* Brand accents: maroon #800020, steel blue #4682B4, muted gold #D4A017
* Semantics: success #22C55E, warning #EAB308, error #EF4444, info #60A5FA
* Variance colors: muted maroon (overcharge), muted steel blue (undercharge), gray for zero
Typography: Inter (headings), Roboto (body). Sizes: H1 48–72, H2 36, H3 28, body 18–20, caption 14–16. Line height 1.4–1.6.
Layout: 12-col grid, generous whitespace, sticky page headers, cards with 12px radius, focus rings #4682B4.
Navigation: Left sidebar collapsible/compact/hidden; state persists.
Accessibility: WCAG AA+ contrast; full keyboard nav; Reduce-Motion support.
2) Core Information Architecture
Global tabs: Dashboard, Vendors, Reports (+ minimal Settings for Audit & Invites)
Vendor profile tabs: Summary, Invoices, Reports
3) Data Model (Entities)
Vendors (auto-created from contract):
* Primary name (AI-extracted, matches contract exactly, must be unique)
* DBA/Display name (AI-suggested nickname, user-editable, duplicates allowed)
* Category (AI, 2-3 words)
* Contract file path
* Contract summary (AI)
* Contract Reconciliation Summary (AI-generated, read-only)
* Effective date, renewal/end date (explicit or derived + explanation)
* Date added
* All fields editable post-creation through vendor profile
* One active contract per vendor
Contracts: PDF/DOCX/PNG/JPG, no size limits. Replace overwrites and re-extracts. Processing timeout: 1 minute.
Invoices: Upload only inside Vendor → Invoices. PDF/DOCX/PNG/JPG/CSV, no size limits, batch ≤5 (ZIP flatten; skip unsupported). Invoice # uniqueness per vendor; if missing, generate VENDORCODE-DOSYYYYMMDD[-YYYYMMDD]-SEQ (fallback VENDORCODE-YYYYMM-SEQ), where VENDORCODE = first 8 chars of vendor name (uppercased). Store invoice total, summary, findings (H/M/L), dispute draft (if any High), evidence anchors, service period (if detected), read status, uploader, timestamps.
Findings: Title; short explanation; breakdown (contract terms, invoice values, Variance line with amount + basis), priority (AI-determined), evidence refs, relevance (Pending → Relevant/Not relevant), type (Price/Fee/OutsideTerm/Duplicate/DiscountMissing/Other).
4) AI & Evidence (AI-Only)
Model: OpenAI premium tier for maximum accuracy.
Approach: No rule parsers/OCR pipeline. Pages rendered to images and read by AI Vision.
Contract Processing: Two-step reconciliation approach:
1. AI creates a "Contract Reconciliation Summary" containing all AP-relevant terms, rates, conditions, and allowable charges needed for invoice reconciliation
2. Invoice items are reconciled against this structured summary, not the raw contract text
Contract Reconciliation Summary: AI-generated structured summary of all AP-relevant contract terms for invoice reconciliation. User cannot edit this summary - it serves as the definitive reference for invoice matching.
Reconciliation Scope: Flag only AP-related discrepancies where invoice items are not aligned with contract terms or are not addressed in the contract. This includes:
* Pricing discrepancies (rates, quantities, calculations)
* Unauthorized fees or charges
* Missing contracted discounts
* Items invoiced but not covered in contract
* Payment terms violations
* Service period misalignments
Processing Timeouts: 1-minute timeout for all AI processing. If exceeded, show error: "Processing timeout. Please try uploading fewer or smaller files for faster processing."
Vendor Naming:
* Primary Name: Extracted exactly as appears in contract (AI determines official name)
* DBA/Display Name: AI suggests a shorter/common nickname, user can edit
* Uniqueness: Primary names must be unique (case-insensitive); DBA names can be similar
Finding Priority: AI determines High/Medium/Low based on trained criteria. No manual thresholds in v1. AI considers both dollar amounts and contract violation severity.
Line Item Processing: AI reviews every line item individually. Each discrepancy flagged separately (no grouping). Granular approach prevents missed savings.
Variance Edge Cases: Partial deliveries, pro-rated services, change orders all flagged. User determines legitimacy through relevance toggles. AI brings everything to attention; user makes business decisions.
Renewal Derivation Complexity: AI must handle complex renewal scenarios including:
* Auto-renewal clauses with notice periods (30/60/90 days)
* Evergreen contracts with periodic rate adjustments
* Multi-year terms with extension options
* Conditional renewals based on performance metrics
* Derived dates include confidence level and explanation in tooltip
Evidence anchors: { doc: contract|invoice, page, bbox? (optional), quoted_text } used to create clickable highlights in summaries/findings.
Viewer: Side-by-side Contract | Invoice with "View Full Documents" button always accessible in Invoice Report header. Jump to page; if bbox exists, draw box; otherwise bold the quoted snippet overlay and scroll.
5) Step-by-Step Workflows
5.1 Create Vendor from Contract
1. User clicks Upload Contract (Vendors)
2. App presigns → upload file → 1-minute processing timeout
3. Live Scan runs (steps: Reading → Extracting → Deriving → Building Contract Reconciliation Summary). Minimum 8-10 seconds. Timeout after 1 minute with clear error message.
4. Contract Review Screen:
    * All fields editable except Contract Reconciliation Summary
    * Primary Vendor Name: Extracted from contract (editable if needed)
    * DBA/Display Name: AI-suggested nickname (user-editable)
    * Effective Date, Renewal/End Date, Category (all editable)
    * Contract Reconciliation Summary: Read-only preview (user cannot edit)
    * Field validation: Date format checking, realistic date ranges
    * Clear "Submit" button to confirm all extracted fields + summary
    * Show preview: "You're about to create vendor '[NAME]' with DBA '[DBA_NAME]'"
    * "Confirm & Create Vendor" button enabled after review
5. Vendor Name Validation:
    * Check Primary Name uniqueness (case-insensitive)
    * If duplicate: "Vendor '[NAME]' already exists. Please choose a different primary name or update the existing vendor's contract"
    * DBA names can be similar/duplicate
6. On success → Vendor Profile → Summary shows confirmed information
Timeout Handling: Show error: "Processing took longer than expected. Try uploading smaller files or fewer pages for faster processing."
Failure states: Keep file; show retry guidance ("Try clearer scan"). Allow manual field entry if AI extraction fails.
5.1b Edit Existing Vendor Profile
Location: Vendor Profile → Summary → "Edit Vendor Details" button
Process:
1. Opens same review screen as contract creation
2. All fields editable (Primary Name, DBA, Dates, Category)
3. Contract field changes trigger: "Re-generate Contract Summary?" prompt
4. If Yes → runs AI re-extraction (1-minute timeout)
5. Audit logs all field changes
5.2 Replace Contract (existing Vendor)
1. In Summary, click Replace Contract → upload → Contract Review step (same as 5.1)
2. Live Scan (≥8s minimum) → fields re-extracted and presented for review
3. User reviews and confirms changes
4. Contract Reconciliation Summary regenerated
5. Audit action recorded. Past invoices remain unchanged; future reconciliations use latest contract.
5.3 Upload Invoices (Vendor → Invoices)
1. Click Upload Invoices → drag up to 5 files (ZIP allowed; folders flattened; unsupported skipped with counts). Progressive upload with 1-minute processing timeout per batch.
2. Aggregate Live Scan (minimum 5-7 seconds per invoice) shows steps: Reading invoices → Matching to Contract Reconciliation Summary → Finding discrepancies → Drafting summaries. Shows "Processed X/Y". 1-minute total timeout.
3. Batch Processing: If ANY invoice in batch fails/timeouts → entire batch fails
4. Timeout Handling: "Processing timeout. Please try uploading fewer files or smaller files."
5. On completion → back to Invoices list with new rows briefly highlighted
5.4 Review an Invoice (Invoice Report)
Header: Shows highest priority badge, Invoice total, Total variance (confirmed sum only - excludes findings marked Not relevant), Toggle New/Reviewed, "View Full Documents" button always visible.
Summary card: Freeform AI narrative with inline clickable highlights to evidence.
Variance Review card: Findings grouped High → Medium → Low. Each shows title, explanation, breakdown (contract terms, invoice values, Variance line), Relevance toggle with confirmation modal for High findings, View evidence.
High-Value Confirmation Modal: When marking High findings as "Not relevant":
* Modal shows: "You're about to dismiss findings worth $[AMOUNT]. This may result in missed savings. Are you sure?"
* Requires explicit "Confirm Dismissal" button click
* Shows total dollar impact being dismissed
Bulk Actions:
* "Mark all Relevant" - no confirmation needed
* "Mark all Not relevant" - triggers confirmation modal if any High findings included
Dispute draft: Available if any High finding; editable text; copy to clipboard.
Refresh anchors: Re-links evidence only (no full re-run).
5.5 Evidence Viewing
Clicking any inline highlight or View evidence opens the viewer: Contract left | Invoice right. Jump to page; show bbox highlight if provided, else bold the quoted snippet overlay and scroll.
5.6 Exports
CSV Generation: Generated in real-time (no caching). Accepts potential slower performance for data accuracy. Progress indicators for large exports.
Export Types: Invoices CSV (summary), Findings CSV (detail) (default Relevant+Pending; toggle to include NotRelevant), Disputes CSV (High only).
CSV spec: UTF-8, comma-sep, quote as needed, dates YYYY-MM-DD, numbers 2 decimals, no $.
5.7 Delete / Restore
Soft delete a Vendor or Invoice from its detail screen; 30-day restore window. No Trash page in v1. Links to deleted items become invalid until restored.
5.8 Dashboard (Facility)
Default window: Current Month (MTD).
3 Primary KPI Cards:
1. Total Active Vendors (count)
2. Total Drift ($ variance found during reconciliation - confirmed amounts only)
3. Total Invoices Processed (count, current period)
Lists: Attention (High findings), Top 3 Offenders (expand to 10), Renewals (30d) with derivation explanation and confidence tooltip. No trend arrows.
6) Reports
Facility Reports: Filters (date, vendor, priority, relevance). Window defaults to MTD.
Vendor Reports: Variance trendline (last 12 months), renewal countdown (derived tooltip). Same export set as facility, scoped to vendor.
Real-time Generation: All reports and exports generated on-demand with progress indicators.
7) API Surfaces (v1)
Files: POST /files/presign → { uploadUrl, storageKey }.
Vendors:
* POST /vendors/from-contract { storageKey } → returns extraction results for review
* POST /vendors/confirm-contract { extractedData, userCorrections } → creates vendor after user review
* PUT /vendors/:id/profile { fieldUpdates } → update vendor fields
* POST /vendors/:id/regenerate-summary → trigger AI re-extraction
* POST /vendors/:id/replace-contract { storageKey } → returns updated extraction for review
* POST /vendors/:id/confirm-replace { extractedData, userCorrections } → confirms replacement
* POST /vendors/:id/delete|restore
* GET /vendors/:id/audit → field-level change history
Invoices: POST /invoices { vendorId, storageKey }; POST /invoices/:id/review { readStatus }; POST /invoices/:id/findings/:findingId/relevance { state }; POST /invoices/:id/delete|restore.
Evidence: GET /evidence/presign { doc, vendorId?, invoiceId? }.
Reports: GET /reports/invoices.csv|findings.csv|disputes.csv.
Jobs: GET /jobs/:id (UI shows Live Scan and auto-advance rules).
Enhanced Error Codes:
* AI_PROCESSING_TIMEOUT (1-minute limit exceeded)
* FILE_TOO_COMPLEX (suggest smaller/fewer files)
* VENDOR_DUPLICATE (primary name already exists)
* CONTRACT_EXTRACTION_FAILED
* INVOICE_DUPLICATE
* UNSUPPORTED_TYPE
* NOT_FOUND
* UNAUTHORIZED
Processing Limits: All AI operations: 1-minute timeout with clear error messaging and actionable guidance.
8) Security & Data Handling
Hosting: Vercel. Region: US. No PHI in v1.
Auth: Email+password; invites by email (Supabase default sender).
Storage: Supabase private bucket; signed URLs (15 min) bound to session; invalid when soft-deleted.
File Handling: No size limits. Progressive upload with real-time progress. 1-minute processing timeout with clear error messaging. Upload concurrency 5 per user.
Vendor Uniqueness:
* Primary names must be unique (case-insensitive)
* DBA/Display names can be similar or duplicate
* AI extracts primary name exactly from contract
Backups: DB retention 30 days. No malware scan in v1.
Audit Trail (expanded granularity):
* Field-level changes: DBA name edits, date modifications, category updates
* Relevance toggles: Individual finding relevance changes
* Bulk actions: Mark all relevant/not relevant
* Vendor edits: All profile field modifications
* Contract operations: Upload, replace, re-extract summary
* Material actions: upload/replace/review_toggle/set_relevance/export/delete/restore/download
Audit Columns: timestamp, user, entity type, entity name, field changed, old value, new value, action type. Visible to all users.
9) Final Decisions (reflected)
* Accuracy over cost (premium OpenAI models; no hard spend cap in v1—monitor usage).
* Vendor duplicates: Block creation; user must choose different primary name.
* VENDORCODE: Auto from vendor name (first 8 uppercase chars).
* Negatives: Show in parentheses (e.g., ($123.45)).
* CSV: Standard format, real-time generation.
* Hosting: Vercel. Invites: Supabase default sender. Test data: Start with real redacted docs.
10) Build Plan (2 Sprints)
Sprint 1: App shell (dark theme, sidebar), auth, Vendors E2E (upload → Live Scan → Contract Review → Summary/Terms, Replace, duplicate-name blocking, soft delete, audit), Invoices list skeleton.
Sprint 2: Invoices upload (≤5, ZIP, Live Scan aggregate, batch failure), reconciliation + findings + dispute draft, evidence viewer, variance review (bulk toggles with confirmations), Dashboard with 3 KPIs, Reports/CSVs (real-time), invite by email, soft-delete restore, vendor editing.
11) Acceptance Criteria
Contract Processing:
* Contract upload requires user review and confirmation of extracted fields before vendor creation
* All fields editable with validation; submit button required for vendor creation
* Contract Reconciliation Summary AI-generated, read-only, serves as definitive reference
Vendor Management:
* Full profile editing post-creation with audit trail
* Primary name from contract (unique required), DBA name AI-suggested (editable, duplicates allowed)
* Vendor name uniqueness strictly enforced
Invoice Processing:
* Invoices upload only within Vendor; duplicates by (vendor + normalized invoice number) blocked
* Complete batch failure if any invoice fails; no partial processing
* Invoice Report shows one dynamic Total variance (confirmed only) and updates live with relevance changes
AI & Evidence:
* AI flags every discrepancy individually (line-by-line processing)
* AI determines finding priority without manual thresholds
* Evidence links from summaries/findings open correct document page with bbox or bolded snippet overlay
* Processing speed: 1-minute timeout for all AI operations with actionable error messages
User Protection:
* High-Value Protection: Confirmation modal with explicit button click required for dismissing High findings
* Field-level change tracking for all user actions
Data & Exports:
* CSV exports reflect filters and confirmed totals; negative values use parentheses
* Real-time exports with progress indicators
* Comprehensive audit logs for every material action
Dashboard Focus: 3 primary KPIs (Active Vendors, Total Drift, Invoices Processed)
System Performance: Smooth experience priority with clear guidance when timeouts occur; soft delete/restore works within 30 days.





* 

