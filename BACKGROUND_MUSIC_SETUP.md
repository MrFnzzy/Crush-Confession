# Background music setup

The Music tab stores a playlist of up to 10 administrator-uploaded tracks in the existing PostgreSQL database. It does not write to the Vercel filesystem, so the playlist remains available across serverless instances.

Before the first production use, apply the updated Prisma schema against the production database from the project root:

```bash
DATABASE_URL="<production pooled url>" DATABASE_URL_UNPOOLED="<production direct url>" npx prisma db push
```

The upload accepts MP3, WAV, OGG, M4A, AAC, and WebM files up to 10MB each, up to 10 tracks total. Tracks play in the order they were added and loop back to the start of the playlist. The playlist is fetched by the public site on initial visit and every 10 seconds, so changes made in the Music tab reach open tabs without a redeploy.

Browsers commonly block audible autoplay until a visitor interacts with the page. The public listener attempts to start automatically, then falls back to starting on the visitor's first tap/click/keypress anywhere on the page (not just the dedicated music button) — this fallback is intentional and cannot be bypassed safely from application code.
