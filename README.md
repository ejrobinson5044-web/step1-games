# Step 1 Arcade

Twenty lightweight HTML study games for USMLE Step 1 active recall and transfer practice.

## What's Included

- 20 games
- 800 total questions
- Shared `arcade_upgrade.js` engine
- Daily warm-up mode
- 20-question timed block mode
- Clinical Transfer mode with selected vignette-style stems
- Endless streak mode
- Missed-item review mode
- Lightweight missed-question flashcards with Again / Hard / Good scheduling
- Mark-unsure tracking that feeds the flashcard deck
- Local browser progress via `localStorage`
- Optional Supabase email/password login with cloud progress sync
- Keyboard answers with `1-4` or `A-D`
- Semantic button controls and visible focus states

Open `index.html` to launch the arcade.

## Optional Cloud Sync

Cloud sync is off by default. The games still work locally with no setup.

To enable accounts and cross-device progress:

1. Create a Supabase project.
2. In Supabase Auth, enable email/password sign-ins.
3. Open Supabase SQL Editor and run `supabase_schema.sql`.
4. Open `supabase_config.js` and paste your public project URL and anon key:

```js
window.STEP1_SUPABASE_CONFIG = {
  url: "https://your-project.supabase.co",
  anonKey: "your-public-anon-key"
};
```

The anon key is safe to publish for this static site when Row Level Security is enabled. Do not put a service-role key in this repo.

Each signed-in student gets one private `step1_progress` row. The app stays local-first and syncs missed items, flashcards, scores, and attempts after login.
