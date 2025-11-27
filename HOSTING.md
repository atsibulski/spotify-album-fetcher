# Hosting Guide for Spotify Album Fetcher

This guide covers multiple hosting options for your Next.js application. Choose the one that best fits your needs.

## ⚠️ Important Pre-Deployment Steps

### 1. Update Spotify Redirect URI

Before deploying, you **must** update your Spotify app's redirect URI:

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Select your app
3. Click "Edit Settings"
4. Add your production redirect URI (e.g., `https://yourdomain.com/api/spotify/callback`)
5. Save changes

### 2. File Storage Consideration

⚠️ **Important**: Your app currently uses file-based storage (`data/users.json`, `data/shelves.json`). This works locally but has limitations in production:

- **Serverless platforms** (Vercel, Netlify): File storage is **ephemeral** - data will be lost on each deployment
- **Solutions**: 
  - Migrate to a database (recommended for production)
  - Use a persistent volume (Docker/Railway)
  - Use a file storage service (S3, Cloudinary)

---

## Option 1: Vercel (Recommended for Next.js) ⭐

**Best for**: Quick deployment, automatic HTTPS, zero-config Next.js support

### Pros:
- ✅ Made by Next.js creators - perfect integration
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Zero-config deployment
- ✅ Automatic deployments from Git
- ✅ Edge functions support

### Cons:
- ❌ File storage is ephemeral (data lost on redeploy)
- ❌ Need to migrate to database for persistent storage

### Steps:

1. **Install Vercel CLI** (optional, can also use web UI):
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```
   Follow the prompts:
   - Link to existing project or create new
   - Confirm project settings
   - Add environment variables when prompted

3. **Set Environment Variables**:
   - Go to your project on [vercel.com](https://vercel.com)
   - Settings → Environment Variables
   - Add:
     ```
     SPOTIFY_CLIENT_ID=your_client_id
     SPOTIFY_CLIENT_SECRET=your_client_secret
     SPOTIFY_REDIRECT_URI=https://your-app.vercel.app/api/spotify/callback
     ```

4. **Update Spotify Redirect URI**:
   - Use your Vercel URL: `https://your-app.vercel.app/api/spotify/callback`

5. **Redeploy** (if needed):
   ```bash
   vercel --prod
   ```

### Alternative: Deploy via GitHub

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click "Add New Project"
4. Import your repository
5. Add environment variables
6. Deploy!

---

## Option 2: Railway

**Best for**: Full-stack apps needing persistent storage

### Pros:
- ✅ Persistent file storage (volumes)
- ✅ Easy database integration
- ✅ Simple deployment
- ✅ Free tier available ($5 credit/month)

### Cons:
- ⚠️ Costs money after free credit
- ⚠️ Slightly more complex than Vercel

### Steps:

1. **Sign up**: Go to [railway.app](https://railway.app) and sign in with GitHub

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo" (or use Railway CLI)

3. **Configure Environment Variables**:
   - Go to your project → Variables
   - Add:
     ```
     SPOTIFY_CLIENT_ID=your_client_id
     SPOTIFY_CLIENT_SECRET=your_client_secret
     SPOTIFY_REDIRECT_URI=https://your-app.up.railway.app/api/spotify/callback
     NODE_ENV=production
     ```

4. **Add Persistent Volume** (for file storage):
   - Go to your project → Volumes
   - Click "New Volume"
   - Mount path: `/app/data`
   - This will persist your JSON files

5. **Update Spotify Redirect URI**:
   - Use your Railway URL: `https://your-app.up.railway.app/api/spotify/callback`

6. **Deploy**:
   - Railway auto-deploys on git push
   - Or use Railway CLI: `railway up`

---

## Option 3: Render

**Best for**: Simple deployments with persistent storage

### Pros:
- ✅ Free tier available
- ✅ Persistent disk storage
- ✅ Automatic HTTPS
- ✅ Easy setup

### Cons:
- ⚠️ Free tier spins down after inactivity
- ⚠️ Slower cold starts on free tier

### Steps:

1. **Sign up**: Go to [render.com](https://render.com) and sign in

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure**:
   - **Name**: Your app name
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for better performance)

4. **Add Environment Variables**:
   ```
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   SPOTIFY_REDIRECT_URI=https://your-app.onrender.com/api/spotify/callback
   NODE_ENV=production
   ```

5. **Add Persistent Disk** (for file storage):
   - Go to your service → Settings → Persistent Disk
   - Mount path: `/opt/render/project/src/data`
   - Size: 1GB (free tier)

6. **Deploy**:
   - Click "Create Web Service"
   - Render will build and deploy automatically

---

## Option 4: Netlify

**Best for**: Static sites and serverless functions

### Pros:
- ✅ Free tier available
- ✅ Great for static sites
- ✅ Automatic HTTPS

### Cons:
- ❌ File storage is ephemeral
- ⚠️ Next.js API routes run as serverless functions (may have cold starts)

### Steps:

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Build your app**:
   ```bash
   npm run build
   ```

3. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

4. **Or use Netlify UI**:
   - Push to GitHub
   - Go to [netlify.com](https://netlify.com)
   - "Add new site" → "Import from Git"
   - Select repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `.next`

5. **Set Environment Variables**:
   - Site settings → Environment variables
   - Add your Spotify credentials

---

## Option 5: Docker + Any Cloud Provider

**Best for**: Maximum control and portability

### Steps:

1. **Create Dockerfile**:
   ```dockerfile
   FROM node:18-alpine AS base

   # Install dependencies only when needed
   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app
   COPY package.json package-lock.json ./
   RUN npm ci

   # Rebuild the source code only when needed
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npm run build

   # Production image
   FROM base AS runner
   WORKDIR /app
   ENV NODE_ENV production
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs

   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

   USER nextjs
   EXPOSE 3000
   ENV PORT 3000
   CMD ["node", "server.js"]
   ```

2. **Update next.config.mjs**:
   ```javascript
   const nextConfig = {
     output: 'standalone', // Add this
     images: {
       remotePatterns: [
         {
           protocol: 'https',
           hostname: 'i.scdn.co',
         },
       ],
     },
   };
   ```

3. **Build and run**:
   ```bash
   docker build -t spotify-app .
   docker run -p 3000:3000 \
     -e SPOTIFY_CLIENT_ID=your_id \
     -e SPOTIFY_CLIENT_SECRET=your_secret \
     -e SPOTIFY_REDIRECT_URI=https://yourdomain.com/api/spotify/callback \
     spotify-app
   ```

4. **Deploy to**:
   - AWS ECS/Fargate
   - Google Cloud Run
   - Azure Container Instances
   - DigitalOcean App Platform
   - Fly.io

---

## Recommended: Migrate to Database (For Production)

For production, consider migrating from file storage to a database:

### Option A: PostgreSQL (via Supabase - Free tier)

1. **Sign up**: [supabase.com](https://supabase.com)
2. **Create database**
3. **Update `lib/db.ts`** to use PostgreSQL instead of JSON files
4. **Add connection string** to environment variables

### Option B: MongoDB Atlas (Free tier)

1. **Sign up**: [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. **Create cluster**
3. **Get connection string**
4. **Update `lib/db.ts`** to use MongoDB

### Option C: Vercel Postgres / PlanetScale

- Built-in integrations with Vercel
- Free tiers available
- Easy setup

---

## Quick Comparison

| Platform | Free Tier | Persistent Storage | Ease of Setup | Best For |
|----------|-----------|-------------------|---------------|----------|
| **Vercel** | ✅ Yes | ❌ No | ⭐⭐⭐⭐⭐ | Quick Next.js deploys |
| **Railway** | ✅ $5 credit | ✅ Yes | ⭐⭐⭐⭐ | Full-stack apps |
| **Render** | ✅ Yes | ✅ Yes | ⭐⭐⭐⭐ | Simple deployments |
| **Netlify** | ✅ Yes | ❌ No | ⭐⭐⭐⭐ | Static + serverless |
| **Docker** | Varies | ✅ Yes | ⭐⭐⭐ | Maximum control |

---

## Post-Deployment Checklist

- [ ] Update Spotify redirect URI in Spotify Developer Dashboard
- [ ] Set all environment variables in hosting platform
- [ ] Test OAuth flow (login/logout)
- [ ] Test album fetching
- [ ] Test track playback (if using Spotify Premium)
- [ ] Set up custom domain (optional)
- [ ] Enable HTTPS (usually automatic)
- [ ] Monitor logs for errors
- [ ] Consider migrating to database for persistent storage

---

## Troubleshooting

### "Redirect URI mismatch" error
- Make sure the redirect URI in your `.env` matches exactly what's in Spotify Dashboard
- Include the full path: `https://yourdomain.com/api/spotify/callback`

### Data not persisting
- File-based storage doesn't work on serverless platforms
- Migrate to a database or use a platform with persistent volumes

### Cookies not working
- Ensure `NODE_ENV=production` is set
- Check that `secure` flag is set correctly in `lib/session.ts` for HTTPS

### Build errors
- Make sure all dependencies are in `package.json`
- Check Node.js version compatibility (use Node 18+)

---

## Need Help?

- Check platform-specific documentation
- Review Next.js deployment docs: https://nextjs.org/docs/deployment
- Check your hosting platform's logs for specific errors

