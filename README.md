# Unspoken — anonymous confession wall

Write an anonymous confession to your crush, see it posted to a public wall
as "Confession #1", "Confession #2"... and let people reply to it. Includes
a password-protected `/admin` page for moderation, and a QR code that links
straight to the confession form.

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

## How it works

- `/` — landing page with a QR code linking to `/confess`.
- `/confess` — the anonymous submission form. On submit, redirects to `/wall`.
- `/wall` — every confession, numbered in the order they were posted, each
  with a reply box anyone can use.
- `/admin` — enter `ADMIN_PASSWORD` to see the same wall with delete buttons
  for confessions and individual replies, plus a logout button. There's no
  separate `/admin/dashboard` route — this one page shows either the login
  form or the dashboard depending on whether you're logged in.

Admin login works without a database-backed session table: on successful
login, the server sets an `httpOnly` cookie whose value is an HMAC of a
fixed string signed with `ADMIN_SECRET`. Only the server can produce a
valid value, so the cookie itself is the proof of login.

## Notes / things to adjust for your own use

- There's no rate limiting or profanity filter — for a public deployment
  you'll likely want to add one (e.g. a simple word-block list, or a
  service like Akismet) before sharing the link widely.
- Messages are capped at 1000 characters, replies at 500 — change the
  `MAX_*_LENGTH` constants in `app/api/confessions/route.ts` and
  `app/api/confessions/[id]/reply/route.ts` if you want different limits.
- Everything is anonymous by design: there's no way, even for the admin, to
  see who posted what.
