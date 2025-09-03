# Changelog

## [Unreleased] - Style Foundation (Phase 2.1) Complete

### Style Foundation: Terzo-inspired Design System

* **feat(ui)**: comprehensive design token system with CSS variables and HSL color space
* **feat(tailwind)**: extended Tailwind config with style foundation token mapping
* **feat(components)**: base UI primitives - Card, KpiTile, Badge with glass effects
* **feat(dashboard)**: Style Foundation dashboard with tokenized colors and refined typography
* **feat(vendors)**: Style Foundation vendors page with table styling and status badges
* **feat(gradients)**: subtle Terzo-inspired background gradients (non-intrusive)
* **feat(flags)**: NEXT_PUBLIC_THEME_FOUNDATION feature flag system (default enabled in dev)
* **refactor(design)**: unified design language with consistent shadows, radii, and spacing
* **docs**: comprehensive README section with usage examples and rollback instructions

**How to Enable**: Set `NEXT_PUBLIC_THEME_FOUNDATION=1`
**How to Rollback**: Set `NEXT_PUBLIC_THEME_FOUNDATION=0` or `git revert <commit>`

**Breaking Changes**: None - all changes are feature-flagged and backward compatible

## [Phase 2 Dashboard Polish] - Previously Complete

### Phase 2: Universal Design System Implementation ✅

* **feat(theme)**: universal CSS tokens for Terzo-inspired dark gradients and glass panels
* **feat(tailwind)**: extended Tailwind config with design system colors (violet, cyan, surface hierarchy)
* **feat(components)**: new UI primitives - KpiCard, PanelCard, Button variants with glassmorphism effects
* **feat(dashboard)**: feature-flagged dashboard with hero gradient backgrounds and modern glass panels
* **feat(animations)**: lightweight count-up animation hook (useCountUpV2) for KPI values with reduced motion support
* **feat(uploader)**: Phase 2 styled invoice uploader with unified glass cards and gradient buttons
* **style(charts)**: tuned data visualization styling with gradient bars and glow effects
* **refactor(flags)**: unified uiPolishPhase2() feature flag system across all components
* **config(flags)**: NEXT_PUBLIC_UI_POLISH_PHASE2 environment variable (default enabled in dev)

**Phase 2 Status**: Complete - Enhanced dashboard with refined gradients, unified glass cards, premium charts, and micro-interactions

**Breaking Changes**: None - all changes are feature-flagged and backward compatible


All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### 0.1.1 (2025-09-03)


### Features

* **api:** invoices get/assign vendor + vendor queries + dashboard ([4dd5e93](https://github.com/jmduby/DRIFT.AI/commit/4dd5e93b6f9d7fd81938aa5473bb42d5023d1d96))
* **api:** reconcile persists invoice + ids ([9fa7953](https://github.com/jmduby/DRIFT.AI/commit/9fa7953015ad453752c8e696b8a9d7552df686da))
* complete invoice-first flow with vendor creation and unified store ([9038d91](https://github.com/jmduby/DRIFT.AI/commit/9038d91088dca09508b904015f13ef3f8dbb81bd))
* **store:** JSON store for vendors/invoices ([3055e22](https://github.com/jmduby/DRIFT.AI/commit/3055e2266560b362ad6c50221a71e124211eeb52))
* **types:** domain types ([096bcbf](https://github.com/jmduby/DRIFT.AI/commit/096bcbfcc712b25f9136be095b478f0c3c3a8905))
* **ui:** dashboard wired to store ([7f0edca](https://github.com/jmduby/DRIFT.AI/commit/7f0edcab6e6d784efa8fa0c9a88009965500544e))
* **ui:** invoice-first page + redirect ([f8b94b2](https://github.com/jmduby/DRIFT.AI/commit/f8b94b2874410ac56605e938f7fc89bdab511ac4))
* **vendors:** add /vendors/[id]/invoices route and list ([7816aab](https://github.com/jmduby/DRIFT.AI/commit/7816aabd8fbac5ea69f5013a7eb3a162cecca24b))
