# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Drift.ai is an AI-powered invoice reconciliation system for nursing home AP teams. Users upload contracts to create vendor profiles, then upload invoices for AI-powered discrepancy detection against contract terms.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Supabase, OpenAI API, Playwright

## Development Commands

### Core Development
- `pnpm dev` - Start development server (uses Turbopack)
- `pnpm build` - Build for production (uses Turbopack) 
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Testing (from apps/web/)
- `pnpm test:e2e` - Run Playwright end-to-end tests
- `pnpm test:e2e:ui` - Run Playwright tests with UI mode  
- `pnpm test:smoke` - Run smoke tests for vendor functionality
- `pnpm test:smoke:nav` - Run navigation smoke tests
- `pnpm test:vendors` - Run vendor delete/restore tests

### Single Test Execution
- `pnpm test:e2e tests/vendor-e2e.spec.ts` - Run specific test file
- `pnpm test:e2e --grep "vendor creation"` - Run tests matching pattern

### Apps Structure
- Root project uses pnpm workspace setup
- Main application is in `apps/web/` directory
- Run commands from root (pnpm handles workspace routing)

## Architecture Overview

### Monorepo Structure
- **Root**: Workspace management with pnpm, shared configs
- **apps/web/**: Main Next.js application (primary development focus)
- **src/**: Root-level shared components (minimal usage)

### Apps/Web Application Structure

#### Next.js App Router Layout
```
src/app/
├── layout.tsx              # Root layout with TopNav, fonts, theming
├── page.tsx               # Dashboard (root route)
├── dashboard/             # Dashboard page and data endpoints
├── vendors/               # Vendor management
│   ├── page.tsx          # Vendor listing with soft delete
│   ├── new/              # Contract upload & vendor creation
│   ├── [vendorId]/       # Vendor detail pages
│   └── unmatched/        # Unmatched invoice handling
├── results/              # Results aggregation page
└── api/                  # Server-side API routes
```

#### API Routes Architecture
- **RESTful design** following Next.js App Router conventions
- **Vendor operations**: `/api/vendors/*` - CRUD, restore, contract management
- **Invoice operations**: `/api/invoices/*` - upload, assignment, reconciliation  
- **Dashboard data**: `/api/dashboard/*` - KPIs and summary data
- **File processing**: `/api/contracts/ingest` - contract processing pipeline

### Core Data Flow
1. **Contract Processing**: Upload → AI extraction → Review → Vendor creation
2. **Invoice Processing**: Upload → AI reconciliation against contract → Findings generation  
3. **Evidence System**: Clickable links from findings to specific document locations
4. **Vendor Matching**: Sophisticated matching system with name similarity, account numbers

### Key Entities (TypeScript)
- **Vendor**: Primary name (unique), DBA, category, contract terms, audit trail
- **Invoice**: File-based with line items, amounts, vendor matching, mismatches
- **LineItem**: Item details with quantities, prices, dates for reconciliation
- **Mismatch**: Typed discrepancies (overbilling, missing_item, wrong_date, other)
- **VendorMatch**: Matching confidence with multiple strategies

### Design System (Dark Theme)
- **Colors**: App bg #0A0A0A, surfaces #121212-#1A1A1A, text #F5F5F5/#C9C9C9
- **Brand**: Maroon #800020, steel blue #4682B4, muted gold #D4A017
- **Status**: Success #22C55E, warning #EAB308, error #EF4444
- **Typography**: Inter (headings), Roboto (body), 12px border radius
- **Layout**: 12-col grid, sticky headers, collapsible left sidebar

### AI Processing Rules
- 1-minute timeout for all AI operations
- No rule parsers - uses OpenAI Vision API
- Line-by-line invoice processing (no grouping)
- Contract Reconciliation Summary is read-only reference
- Evidence anchors: `{ doc: contract|invoice, page, bbox?, quoted_text }`

## Visual Development Workflow (Playwright MCP)

When modifying frontend code:
1. Launch headed Chromium at `http://localhost:3000`
2. Capture BEFORE/AFTER screenshots at 1280×832 to `.claude/logs/screens/`
3. Compare against acceptance criteria from PRDs in `/context`
4. Iterate until criteria pass or blocker identified

### Acceptance Criteria
- Dark theme palette with AA contrast
- Drag & Drop PDF upload with clear states
- Color-coded flags (success #22C55E, warning #EAB308, error #EF4444)
- Two-pane evidence viewer (Contract | Invoice) with jump-to-page

## Development Guidelines

### Code Organization Patterns

#### Directory Structure
```
apps/web/src/
├── app/                   # Next.js App Router (pages + API routes)
├── components/            # Shared UI components (ui/ subfolder)
├── lib/                   # Utilities and business logic
│   ├── store/            # Data schemas and store logic
│   ├── match/            # Vendor matching algorithms  
│   ├── pdf/              # PDF processing utilities
│   ├── openai/           # AI integration
│   └── flags.ts          # Feature flags (dashPro, uiPolishPhase2)
├── server/               # Server-side data access layer
├── types/                # Domain type definitions
└── middleware.ts         # Route middleware (redirects)
```

#### Key Patterns
- **Feature flags**: `dashPro()` and `uiPolishPhase2()` for progressive features
- **Zod schemas**: Type-safe validation in `/lib/store/schemas`  
- **Server layer**: Clean separation in `/server/` for data operations
- **Component limits**: Prefer composition, keep under 200 lines
- **No new UI libs** without approval - extend existing system

### Key Business Rules
- Primary vendor names must be unique (case-insensitive)
- Invoice processing: complete batch failure if any item fails
- High findings require confirmation modal for dismissal
- All AI operations have 1-minute timeout
- Soft delete with 30-day restore window

### Error Handling Philosophy
- **Fail loudly** - no graceful fallbacks that hide errors
- **Actionable messages** - specific guidance for timeouts and failures
- **Typed error codes**: `VENDOR_DUPLICATE`, `AI_PROCESSING_TIMEOUT`, etc.
- **HTTP status mapping**: 409 for duplicates, 410 for expired restores
- **Client-side patterns**: Loading states, error boundaries, retry mechanisms

## Testing Strategy

### E2E Test Coverage
- Vendor creation workflow (contract upload → review → creation)
- Invoice upload and processing
- Navigation between major sections
- Delete/restore functionality

### Test Organization (apps/web/tests/)
- `vendor-e2e.spec.ts` - Full vendor workflow  
- `simple.e2e.spec.ts` - Basic vendor operations
- `smoke.vendor.spec.ts` - Vendor smoke tests
- `nav.smoke.spec.ts` - Navigation tests
- `vendors.delete.restore.spec.ts` - Delete/restore functionality
- `invoice-upload-flow.spec.ts` - Invoice processing flows

### Playwright Configuration
- Base URL: `http://localhost:3000`
- 30-second test timeout
- Auto-starts dev server with `pnpm dev`
- Chrome-only in CI, full browser matrix locally

## Important Context Files

- `/context/PRD-Core.md` - Complete product requirements and business logic
- `/context/PRD-UI-UX.md` - Visual design specifications and user flows
- Read these before implementing new features or major changes

## Development Workflow

1. **Explore**: Map routes/components, read PRDs in `/context`
2. **Plan**: Create PR-sized steps with specific function/test names
3. **Execute**: Minimal diffs, run lint/build, maintain changelog
4. **Visual QA**: Use Playwright MCP workflow for UI changes

## Security Notes

- Supabase auth with email/password
- File storage in private buckets with 15-min signed URLs
- No PHI data in v1
- Hosted on Vercel (US region)