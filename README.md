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

## Design System

### Style Foundation (Phase 2.1)

This project implements a **Terzo-inspired, enterprise dark theme** with a comprehensive design token system and reusable UI primitives.

#### Feature Flag
Enable the style foundation with:
```bash
NEXT_PUBLIC_THEME_FOUNDATION=1
```

#### Design Tokens
- **Colors**: Terzo-inspired brand colors (violet/purple), accent blues/teals, semantic colors
- **Typography**: Inter (headings), system fonts (body), with proper spacing scale
- **Shadows**: Consistent elevation system with `shadow-elev-1` and `shadow-elev-2`
- **Radii**: Standardized border radius (`--radius-lg`, `--radius-md`)

#### UI Primitives
- **Card**: `<Card>`, `<CardHeader>`, `<CardContent>` - Foundation surfaces with glass effects
- **KpiTile**: Metric display cards with animations and hover states
- **Badge**: Status indicators with semantic color tones

#### How to Use
```tsx
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { KpiTile } from '@/components/ui/kpi-tile';
import { Badge } from '@/components/ui/badge';

// Basic card
<Card className="hover:shadow-elev-2 transition-shadow">
  <CardHeader>
    <h3>Section Title</h3>
  </CardHeader>
  <CardContent>
    <p>Content goes here</p>
  </CardContent>
</Card>

// KPI metric
<KpiTile label="Revenue" value="$1,234" deltaLabel="vs last month" />

// Status badge
<Badge tone="success">Active</Badge>
```

#### How to Rollback
To disable the style foundation:
```bash
NEXT_PUBLIC_THEME_FOUNDATION=0
```
Or revert the commit:
```bash
git revert <commit-hash>
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
