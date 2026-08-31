# Confession Wall Integration

This folder is a **new, separate project copy** assembled from `confession-wall(1).zip`. Neither uploaded ZIP archive was modified.

## What was preserved from the supplementary project

The project retains its Next.js 14 App Router architecture, PostgreSQL/Prisma setup, paper-note visual design, QR sharing, and password-protected administration flow.

## Logic carried over from the original working project

| Area | Integrated behavior |
|---|---|
| Confession input | Requires a sender nickname (`fromName`), recipient name (`toName`), and message. |
| Validation | Sender and recipient names are limited to 100 characters; confessions are limited to 2,000 characters; replies are limited to 1,000 characters. |
| Numbering | The persistent database ID is displayed as the confession number. |
| Listing | Public and admin walls show active records newest first. |
| Replies | Replies are public and shown newest first on their associated confession. |
| Moderation | Admin deletion now uses a soft delete (`isDeleted`) for confessions and replies, rather than permanently removing rows. |

## Database setup

The Prisma schema changed to add `fromName`, `toName`, and `isDeleted` fields. Use a fresh PostgreSQL database or apply a migration appropriate to any existing deployment before running the app:

```bash
npm install
npx prisma db push
npm run dev
```

For Vercel, set the environment variables documented in `.env.example`, then deploy this new project directory. The original ZIP files remain unchanged in the upload location.
