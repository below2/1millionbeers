# 🍺 1,000,000 Beers Challenge Tracker

Angular 17 (standalone components + signals) + Tailwind + Supabase, deployed on Cloudflare Pages.

## 1. Supabase setup

1. Create a project at https://supabase.com.
2. Open **SQL Editor** and run the full contents of [`supabase/schema.sql`](./supabase/schema.sql).
   - This creates the `beer_logs` table, RLS policies, the `app_secrets` table
     (holding a **hashed** PIN, unreadable via the API), the `log_beer` RPC,
     the `beer_totals` view, and enables Realtime on `beer_logs`.
   - The seeded PIN is `1234`. Change it by editing the `crypt('1234', ...)`
     line before running, or later with:
     ```sql
     update public.app_secrets
     set value_hash = crypt('NEW_PIN', gen_salt('bf'))
     where key = 'shared_pin';
     ```
3. Go to **Project Settings > Data API** and copy your **Project URL** and
   **anon public key** — you'll need these next.
4. Go to **Database > Replication** and confirm `beer_logs` is enabled for
   Realtime (the SQL script does this via `alter publication`, but it's
   worth a visual check).

## 2. Local development

```bash
npm install

# Either export these once in your shell, or create a .env-style habit —
# set-env.js only reads process.env at build/start time:
export NG_APP_SUPABASE_URL="https://YOUR-PROJECT-REF.supabase.co"
export NG_APP_SUPABASE_ANON_KEY="YOUR-ANON-PUBLIC-KEY"

npm start
```

`npm start` runs `scripts/set-env.js` first, which writes those two env vars
into `src/environments/environment.ts` / `environment.prod.ts`, then starts
`ng serve`. If the env vars aren't set, it leaves whatever is already in
those files alone (handy for quick local edits) — just make sure you don't
commit real keys there long-term; the anon key is safe to expose publicly
(RLS + the RPC protect the data), but keep your PIN itself private.

## 3. Deploy to Cloudflare Pages

1. Push this repo to GitHub.
2. In the Cloudflare dashboard: **Workers & Pages > Create > Pages > Connect to Git**, pick the repo.
3. Build settings:
   | Setting | Value |
   |---|---|
   | Framework preset | Angular |
   | Build command | `npm run build` |
   | Build output directory | `dist/beer-tracker/browser` |
4. **Settings > Environment variables** — add for both Production and Preview:
   - `NG_APP_SUPABASE_URL` = your Supabase project URL
   - `NG_APP_SUPABASE_ANON_KEY` = your Supabase anon public key
5. Deploy. `npm run build` triggers `prebuild` → `scripts/set-env.js`, which
   bakes those two vars into the compiled bundle at build time (Cloudflare
   Pages is static hosting, so this build-time injection step is what stands
   in for server-side env vars).
6. The `public/_redirects` file (copied to the output root via `angular.json`
   assets config) makes all routes fall back to `index.html`, so deep links
   don't 404 — not strictly required for this single-page app today, but
   future-proofs it if you add routes later.

## 4. Changing the PIN

Re-run this in the Supabase SQL editor any time:
```sql
update public.app_secrets
set value_hash = crypt('NEW_PIN', gen_salt('bf'))
where key = 'shared_pin';
```
Anyone with the old PIN saved in `localStorage` will get an "Incorrect PIN"
error on their next submit and will need to re-enter it — that new value is
then saved locally, per the UX requirement.

## Project structure

```
src/app/
  core/
    models/beer.model.ts        # Drinker, BeerLog, LeaderboardEntry types
    services/
      supabase.service.ts       # Thin wrapper over @supabase/supabase-js
      beer-store.service.ts     # Signals-based store: state + computed stats
  components/
    hero-progress/              # Big number + progress bar toward 1,000,000
    log-beer-form/               # Drinker pills, quantity, note, PIN, submit
    leaderboard/                 # Ranked list with medals + progress bars
    stats-dashboard/             # Today / month / avg-per-day tiles
    activity-feed/               # Last 20 logs with relative timestamps
  app.component.ts               # Layout shell wiring it all together
supabase/schema.sql              # Full DB setup script
scripts/set-env.js               # Bakes env vars into environment.ts at build time
public/_redirects                # Cloudflare Pages SPA fallback rule
```
