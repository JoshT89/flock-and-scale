# Flock & Scale

A free Next.js app for backyard poultry and reptile care. Built for UK keepers with a responsive dashboard, two animal workspaces, and records that work on the device.

## Run locally

Requires Node.js 22.13+ (Vercel uses Node.js 24).

```powershell
npm ci
npm run dev
```

Open http://localhost:3000. For a production build: `npm run build`, then `npm run start`.

## Features

- Animal profiles, species, breeds/morphs, sex, health status, acquisition, parents and individual history.
- Coops, brooders and reptile habitats with keeper-configured temperature and humidity targets, manual readings, and UVB review dates.
- Egg collection, feeding with automatic supply deduction, weight, sheds, health observations and cleaning records.
- Recurring care tasks and in-app notifications.
- Prescribed treatment records and inclusive egg-withdrawal dates.
- Feed stock, latest purchase costs and consumption forecasts.
- Clutch incubation records, fertility, hatch counts and lineage.
- Egg and weight insights, biosecurity checklist, regional registration resources and a registration-review reminder.
- Real external veterinary and supplier directories.
- Validated JSON backup/restore, CSV export, and a fresh-collection flow.
- Installable manifest and offline shell after the first online visit. Animal photos require internet.

The first visit uses a labelled sample collection. In **Settings → Start my own collection**, replace it with your own records.

## Storage and costs

Records stay in this browser's `localStorage`; export regular backups. Clearing browser data removes them. There is no connected account service, cloud sync, paid API, live sensor integration, notification/email delivery, payment or advertising service.

Only free open-source dependencies are used. Remote sample photography is delivered directly from Unsplash; Next.js image transformations are disabled to avoid image-optimisation usage. Fonts are self-hosted.

The intended Vercel target is `josht89`'s Hobby workspace `joshuas-projects-e207ba2e`, **new project `flock-and-scale` only**. Never use the separate MCP connector's `ai-boffin` account or modify any existing Vercel/Supabase project. No paid plan or upgrade is authorised.

Supabase's `free` plan was confirmed as $0/month. Provisioning stopped at the human marketplace-terms acceptance step; no database was created. Do not retry provisioning without confirmed acceptance and verifying the new project's scope.

## Checks

```powershell
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

End-to-end tests cover animal persistence, egg aggregation, recurring tasks, feed deduction, habitat limits, withdrawals, backup validation and responsive navigation. Tests use isolated browser contexts and never contact or mutate Vercel/Supabase projects.

## Guidance

Medication fields store veterinary instructions; the app does not calculate doses or withdrawal periods. An egg withdrawal remains active throughout its recorded final date. Official UK resources link to GOV.UK, GOV.WALES, gov.scot, DAERA, RSPCA and RCVS. Bird flu restrictions are not fetched live; the app directs keepers to current official notices.

## Design and licences

Original interface; no paid template. Next.js and React (MIT), Lucide (ISC), DM Sans (SIL Open Font License), Zod (MIT). Sample photography from Unsplash under its free licence. See `docs/credits.md`.
