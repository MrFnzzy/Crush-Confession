# Unspoken — anonymous confession wall

Write an anonymous confession to your crush, see it posted to a public wall
as "Confession #1", "Confession #2"... and let people reply to it. Includes
a password-protected `/admin` page for moderation, and a QR code that links
straight to the confession form.

Also includes:
- **Gif picker** — attach a gif from a searchable library when composing a confession. Works out of the box with Giphy's shared demo key; set `NEXT_PUBLIC_GIPHY_API_KEY` or `NEXT_PUBLIC_TENOR_API_KEY` (Tenor takes priority if both are set) for your own rate limits — see `.env.example`.
- **"Guess who it is"** — senders can hide the crush's name behind blanks and let readers guess. The name never reaches the browser until someone gets it exactly right, which triggers a sparkle reveal. Guesses are checked server-side, so it's a real guessing game, not just a CSS blur.
- **Search bar** on the wall — filter live by name, message, sender, or reply text.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Prisma + Postgres (works with [Neon](https://neon.tech), [Supabase](https://supabase.com),
  or Vercel Postgres — all have free tiers)
- `qrcode.react` for the QR code

## 1. Get a free Postgres database

Vercel's serverless functions can't write to a local file, so this needs a
real database even for local development — pick one:

- **Neon** (recommended, generous free tier): [neon.tech](https://neon.tech) → create a
  project → copy the connection string.
- **Supabase**: [supabase.com](https://supabase.com) → new project → Settings → Database →
  connection string (use the "Connection pooling" one).
- **Vercel Postgres**: from your Vercel dashboard → Storage → Create Database.

## 2. Local setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

```
DATABASE_URL="postgresql://..."      # from step 1
ADMIN_PASSWORD="pick-a-password"     # what you'll type at /admin
ADMIN_SECRET="run: openssl rand -hex 32"
NEXT_PUBLIC_GIPHY_API_KEY=""         # optional, see .env.example
```

Push the schema to your database, then run the dev server:

```bash
npx prisma db push
npm run dev
```

Visit `http://localhost:3000`.

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## 4. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub repo.
2. In **Environment Variables**, add the same three values from your `.env`:
   `DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_SECRET`.
3. Deploy. Vercel runs `prisma generate` automatically via the `postinstall`
   script, and `next build` runs `prisma generate` again just in case.
4. Once it's live, the QR code on the homepage and in `/admin` will
   automatically point at your real Vercel URL (it's generated in the
   browser from `window.location.origin`).

If you add a custom domain later, no code changes are needed — the QR code
picks it up automatically.

## 5. (Optional) Turn on reply notifications

Anyone who posts a confession (or taps the 🔔 on any confession) can opt in
to a real push notification when a reply lands — no account, no email, just
a subscription tied to their browser (standard Web Push).

1. Generate a VAPID keypair:
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Add all three to your `.env` (and to Vercel's env vars for production):
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
   VAPID_PRIVATE_KEY="..."
   VAPID_SUBJECT="mailto:you@example.com"
   ```
3. Push the new table to your database (see the section below).

If you skip this, the 🔔 buttons and post-submit prompt simply don't
appear — nothing else in the app depends on it.

**Known limits:** the subscription lives on that specific browser/device —
clearing site data, switching devices, or using a different browser loses
it for good (there's no account to re-link to). On iOS, Safari only
supports push for a site added to the Home Screen as a PWA; a plain Safari
tab can't receive it.

## How it works

- `/` — landing page with a QR code linking to `/confess`.
- `/confess` — the anonymous submission form. Sender can optionally sign with
  a nickname; leaving it blank posts as "Anonymous". On submit, redirects to
  `/wall`.
- `/wall` — every confession, numbered in the order they were posted, each
  with a ♡ "relate" button (one tap per browser, tracked in localStorage), a
  🔔 "notify me" button (see below), and a reply box anyone can use, also
  with an optional nickname. A toggle at the top switches between "Newest"
  and "Most related".
- 🔔 notifications — tapping "notify me" on a confession (or accepting the
  prompt right after posting one) subscribes that browser to a push
  notification the moment someone replies to it. See "Turn on reply
  notifications" above to set it up.
- `/admin` — enter `ADMIN_PASSWORD` to see the same wall with delete buttons
  for confessions and individual replies, plus a logout button. There's no
  separate `/admin/dashboard` route — this one page shows either the login
  form or the dashboard depending on whether you're logged in.

Admin login works without a database-backed session table: on successful
login, the server sets an `httpOnly` cookie whose value is an HMAC of a
fixed string signed with `ADMIN_SECRET`. Only the server can produce a
valid value, so the cookie itself is the proof of login.

## If you're updating an existing deployment

The schema now includes `senderNickname` (on both confessions and replies)
and `relateCount`. If you already pushed the old schema to your database,
run this once more, locally, with your production `DATABASE_URL` in `.env`:

```bash
npx prisma db push
```

No data is lost — it just adds the new columns.

The same command also creates the `ConfessionPushSubscription` table used by
reply notifications — run it again after pulling this update even if you're
not setting up push notifications yet; it's a no-op for the rest of the app
either way.

## Notes / things to adjust for your own use

- There's no rate limiting or profanity filter — for a public deployment
  you'll likely want to add one (e.g. a simple word-block list, or a
  service like Akismet) before sharing the link widely.
- Messages are capped at 1000 characters, replies at 500 — change the
  `MAX_*_LENGTH` constants in `app/api/confessions/route.ts` and
  `app/api/confessions/[id]/reply/route.ts` if you want different limits.
- Everything is anonymous by design: there's no way, even for the admin, to
  see who posted what.
