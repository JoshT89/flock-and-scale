# Deployment verification

Date: 8 October 2026.

- Public app: https://flock-and-scale.vercel.app
- Vercel account: `josht89`.
- Scope: `joshuas-projects-e207ba2e` (`team_tdofCTOnkNPA3tqPKzSCJ2AS`).
- Plan: Hobby, verified before project creation. No paid resources or upgrades enabled.
- New project only: `flock-and-scale` (`prj_xjq5jRSMDN7mdqrUwoNTGTgOtSlh`).
- Deployment: `dpl_7k7YATsUjWxTuCsF3F6ARPknPvtq`, production, READY.
- Framework: Next.js 16.4.0, Node.js 24 on Vercel.
- Source: local workspace files, not a Git deployment.
- Build: basic plan-default machine, approximately 50 seconds overall; Vercel build step reported 26 seconds.

The production build was staged, verified through authenticated Vercel curl (HTTP 200 and valid app shell), promoted, then assigned to the project's already verified free `flock-and-scale.vercel.app` domain. Public access returned HTTP 200 without authentication. Deployment Protection on generated preview URLs was retained.

Local validation: strict TypeScript, production build, 8 data tests, and 13 browser tests passed. Browser coverage includes device persistence, egg totals, feeding stock deduction, recurring tasks, configured environment limits, withdrawal dates, backups, all mobile pages, image delivery, WCAG AA automated checks, offline reloads, one-tap eggs, and mortality history.

The app's error-log scan returned no errors. No paid monitoring or log drains were provisioned. The app has no live cloud database; Supabase provisioning stopped before resource creation at the human terms-acceptance step. All pre-existing Vercel and Supabase projects were left unchanged.
