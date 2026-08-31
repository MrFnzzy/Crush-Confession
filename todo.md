# Secret Crush Wall TODO

- [x] Define database schema for confessions and replies in `drizzle/schema.ts`
- [x] Apply database migrations using `webdev_execute_sql`
- [x] Implement backend tRPC procedures for public confessions and replies in `server/routers.ts`
- [x] Implement admin-only tRPC procedures for message moderation
- [x] Design the global theme and responsive layout in `client/src/index.css`
- [x] Build the public confession wall with newest-first sorting and numbering in `client/src/pages/Home.tsx`
- [x] Build the anonymous submission form with QR code generation
- [x] Build the reply system for individual confessions
- [x] Build the role-gated admin dashboard at `/admin`
- [x] Add input validation and anti-abuse safeguards (length limits, etc.)
- [x] Create Vitest unit tests for core business logic
- [x] Document GitHub and Vercel deployment steps
- [x] Perform final responsive UI polish and behavior validation
