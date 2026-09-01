# Background music setup

The new Music tab stores one administrator-selected track in the existing PostgreSQL database as a singleton record. It does not write to the Vercel filesystem, so the selected track remains available across serverless instances.

Before the first production use, apply the updated Prisma schema against the production database from the project root:

```bash
DATABASE_URL="<production pooled url>" DATABASE_URL_UNPOOLED="<production direct url>" npx prisma db push
```

The upload accepts MP3, WAV, OGG, M4A, AAC, and WebM files up to 3MB. The track is fetched by the public site on initial visit and every 10 seconds, so changes made in the Music tab reach open tabs without a redeploy.

Browsers commonly block audible autoplay until a visitor interacts with the page. The public listener attempts to start automatically, then exposes a small “tap for music” control when the browser requires a gesture. This fallback is intentional and cannot be bypassed safely from application code.
