This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Vendor Matching & Learning

The application includes a sophisticated vendor matching system that automatically identifies vendors from invoice text and learns from user feedback to improve accuracy over time.

### Features

- **Brand-aware matching**: Uses company brands (e.g., 'rumpke', 'acme') for more accurate vendor identification
- **Multi-factor scoring**: Combines brand matching, name similarity, account numbers, state, and address information
- **Teachable system**: When matching confidence is medium (gray-band), users can select the correct vendor to teach the system
- **Alias learning**: Automatically adds observed vendor names as aliases for future matching
- **Auto-matching**: High-confidence matches (≥0.78 score) are applied automatically
- **Gray-band selection**: Medium-confidence matches (0.55-0.77) prompt user selection
- **Debug endpoints**: Comprehensive debugging tools for understanding matching behavior

### Scoring Algorithm

The vendor matcher uses a weighted scoring system:
- **45% Brand matching**: 1.0 if brands match exactly, 0 otherwise
- **30% Name similarity**: Token-based similarity between invoice text and vendor names/aliases
- **20% Account numbers**: 1.0 if any account number matches, 0 otherwise  
- **5% Location**: State matching (if brand also matches) or address token overlap

### API Endpoints

#### Matching & Learning
- `POST /api/reconcile` - Main invoice reconciliation with vendor matching
- `POST /api/vendors/learn-alias` - Teach system new vendor aliases
- `POST /api/contracts/ingest` - Ingest contracts with brand extraction and normalization

#### Debug Endpoints
- `GET /api/debug/vendors` - List all vendors with counts and sample data
- `GET /api/debug/vendor/{id}` - Get detailed vendor information
- `POST /api/debug/match` - Test vendor matching with custom text

### Usage Flow

1. **Upload Invoice**: PDF text is extracted and analyzed
2. **Vendor Matching**: System scores all vendors using the multi-factor algorithm
3. **Auto-match (≥0.78)**: High-confidence matches are applied automatically
4. **Gray-band (0.55-0.77)**: User selects correct vendor from candidate list
5. **Learning**: System saves user selection as alias for future matching
6. **Contract Context**: When vendor is matched, contract terms enhance reconciliation analysis

### Data Storage

Vendor data is stored in `data/vendors.json` with the following structure:
- `primary_name`: Normalized primary vendor name
- `brand`: Extracted brand identifier (e.g., 'rumpke')
- `aliases`: Array of alternative names learned from user selections
- `identifiers`: Account numbers, emails, phones, addresses, and state
- `contract_summary`: Associated contract terms and line items

### Example

```json
{
  "primary_name": "RUMPKE OF KENTUCKY, INC",
  "brand": "rumpke",
  "aliases": ["Rumpke Waste & Recycling", "RUMPKE KENTUCKY"],
  "identifiers": {
    "account_numbers": ["HH-2489-KY", "ACCT-001"],
    "state": "KY"
  }
}
```

## New Navigation (Feature Flag)

The application includes a new navigation layout that can be toggled via feature flag.

### Configuration

Add to your `.env.local` file:

```bash
NEXT_PUBLIC_NEW_NAV=1
```

**Default**: `0` (disabled) - maintains existing navigation layout

### Navigation Changes

#### New Navigation (`NEXT_PUBLIC_NEW_NAV=1`)
- **Header Layout**: Dashboard | Vendors | [Profile Icon]
- **Home Route**: `/` renders dashboard directly (no redirect)
- **Dashboard Route**: `/dashboard` remains accessible for deep links
- **Hidden Link**: "Results" removed from global navigation (still accessible via URL)
- **Breadcrumbs**: Added to invoice detail pages
- **Analysis Link**: Added to invoice details when localStorage data exists
- When enabled, primary links are right-aligned next to the profile menu.

#### Legacy Navigation (`NEXT_PUBLIC_NEW_NAV=0` or unset)
- **Header Layout**: Login | Dashboard | Vendors | Results (unchanged)
- **Home Route**: `/` redirects to `/dashboard` (unchanged)
- **All Routes**: Remain exactly as before

### Testing

Run navigation-specific smoke tests:

```bash
# Test new navigation behavior
NEXT_PUBLIC_NEW_NAV=1 pnpm run test:smoke:nav

# Test legacy navigation behavior  
NEXT_PUBLIC_NEW_NAV=0 pnpm run test:smoke:nav

# All navigation tests
pnpm run test:smoke:nav
```

### Routes Preserved

All existing routes remain functional:
- `/` - Home (redirect in legacy, dashboard in new nav)
- `/dashboard` - Dashboard page (always works)
- `/vendors` - Vendor listing
- `/vendors/[id]` - Vendor details  
- `/vendors/[id]/invoices/[invId]` - Invoice details
- `/results` - Analysis view (hidden from nav in new mode, but URL still works)
- `/login` - Login page

### Rollback Instructions

To revert to legacy navigation:

1. Remove or set `NEXT_PUBLIC_NEW_NAV=0` in `.env.local`
2. Restart development server: `pnpm run dev`
3. Verify: Results link should appear in global navigation

### Implementation Files

Key files modified for this feature:
- `src/app/components/TopNav.tsx` - Feature-flagged navigation rendering
- `src/app/page.tsx` - Conditional dashboard rendering vs redirect
- `src/app/dashboard/page.tsx` - Shared dashboard component usage  
- `src/app/_components/Dashboard.tsx` - Extracted shared dashboard logic
- `src/app/vendors/[vendorId]/invoices/[invoiceId]/page.tsx` - Added breadcrumbs and analysis link
- `tests/nav.smoke.spec.ts` - Navigation behavior testing
