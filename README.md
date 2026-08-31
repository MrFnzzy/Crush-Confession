# Secret Crush Wall

An elegant, polished anonymous-crush confession platform.

## Features
- **Anonymous Confessions**: Share your feelings without creating an account.
- **Public Wall**: A beautiful, newest-first wall with persistent numbering (Confession #1, #2, etc.).
- **Reply System**: Engage with confessions through anonymous replies.
- **QR Sharing**: Built-in QR code generator to share the wall or direct confession link.
- **Admin Dashboard**: Role-gated moderation at `/admin` to keep the wall safe.
- **Responsive Design**: Optimized for a premium experience on mobile and desktop.

## Deployment Instructions

### 1. Push to GitHub
1. Create a new repository on GitHub.
2. Initialize git in this project (if not already): `git init`
3. Add your GitHub repo as remote: `git remote add origin <your-repo-url>`
4. Commit and push:
   ```bash
   git add .
   git commit -m "Initial commit: Secret Crush Wall"
   git branch -M main
   git push -u origin main
   ```

### 2. Deploy to Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click "New Project" and import your GitHub repository.
3. **Environment Variables**: You must configure the following in the Vercel project settings:
   - `DATABASE_URL`: Your MySQL/TiDB connection string.
   - `JWT_SECRET`: A secure random string for session signing.
   - `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`: Your Manus OAuth credentials.
   - `OWNER_OPEN_ID`: Your Manus OpenID to grant yourself admin access.
4. **Build Settings**:
   - Framework Preset: `Other` (Vite is auto-detected)
   - Build Command: `pnpm build`
   - Output Directory: `dist`
5. Click "Deploy".

## Local Development
1. Install dependencies: `pnpm install`
2. Set up your `.env` file with the variables mentioned above.
3. Run development server: `pnpm dev`
4. Run tests: `pnpm test`
