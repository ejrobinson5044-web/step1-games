# Step 1 Arcade

Twenty lightweight HTML study games for USMLE Step 1 active recall and transfer practice.

## What's Included

- 20 games
- 800 total questions
- Shared `arcade_upgrade.js` engine
- Global Review Hub for whole-arcade review
- Adaptive "Today's 20" mixed block across all games
- Daily warm-up mode
- 20-question timed block mode
- Clinical Transfer mode with selected vignette-style stems
- Endless streak mode
- Missed-item review mode
- Lightweight missed-question flashcards with Again / Hard / Good scheduling
- Missed-question reason tags to separate content gaps from stem misreads
- Mark-unsure tracking that feeds the flashcard deck
- Local browser progress via `localStorage`
- Optional Supabase email/password login with cloud progress sync
- Installable offline-friendly app shell via the web manifest and service worker
- Author Mode for drafting Step-style items and checking for obvious answer leaks
- Keyboard answers with `1-4` or `A-D`
- Semantic button controls and visible focus states

Open `index.html` to launch the arcade.

## Review Hub

Open `review_hub.html` for the whole-platform study view.

- `Start Today's 20` builds a mixed block from due cards, missed items, weak games, and fresh questions.
- `Review Due Cards` opens a lightweight spaced-review queue from missed and marked-unsure items.
- Weak areas are ranked from wrong answers, missed items, and prior attempts across all games.
- Progress stays local first and syncs to the signed-in account when cloud sync is configured.

## Author Mode

Open `author.html` when adding new questions. It creates a ready-to-paste question object and flags:

- exact answer text leaking into the stem
- stems that are probably too short for Step-style transfer
- duplicate answer choices

For a full export of the embedded question banks, run `node tools/extract_questions.mjs` from the project folder.

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

The latest schema also supports deleting cloud progress and deleting an account from inside the app. If you added cloud sync before those controls existed, rerun the current `supabase_schema.sql` in Supabase SQL Editor.

## Sign-in Visibility

When `supabase_config.js` has a valid project URL and anon key, a `Sign in` chip appears at the top of the home page, the Review Hub, and each game. If the chip does not show after a deployment, hard refresh the page once so the browser gets the newest `cloud_sync.js`.
