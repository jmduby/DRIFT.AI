# Build & Verify
You will: ensure dev server is running, and verify all key routes respond.

## Steps
1) If http://localhost:3000-3002 is not reachable, run `cd apps/web && pnpm dev` (background).
2) Verify routes: `/`, `/login`, `/dashboard`, `/results`. Report HTTP code and time-to-first-paint.
3) If any route throws, show stack snippet + suspected file.