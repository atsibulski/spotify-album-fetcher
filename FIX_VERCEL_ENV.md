# Fix Vercel Environment Variables Issue

## The Problem
Logs show: `❌ Missing SPOTIFY_CLIENT_ID`

This means the environment variable is not being injected into your Production deployment.

## Solution Steps

### Step 1: Verify Variables Are Set for Production

1. Go to: https://vercel.com/dashboard
2. Select your `spotify-album-fetcher` project
3. Go to **Settings** → **Environment Variables**
4. For EACH variable, check:
   - Is it listed?
   - Is **Production** checked? (This is critical!)
   - Are Preview and Development also checked?

### Step 2: If Production is NOT Checked

1. Click on the variable name to edit it
2. Make sure **Production** checkbox is checked
3. Also check **Preview** and **Development**
4. Click **Save**
5. Repeat for all three variables

### Step 3: Force Redeploy

After ensuring Production is checked:

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **"..."** menu (three dots)
4. Click **"Redeploy"**
5. Make sure it says "Redeploy to Production"
6. Wait for deployment to complete

### Step 4: Verify After Redeploy

1. Wait for deployment to finish (status: "Ready")
2. Visit: https://spotify-album-fetcher.vercel.app/api/spotify/auth
3. Should return JSON with `authUrl` (not an error)

---

## Alternative: Set Variables via Vercel CLI

If the web UI isn't working, you can use CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to your project
cd /Users/user/Documents/spot
vercel link

# Set variables
vercel env add SPOTIFY_CLIENT_ID production
# Enter value when prompted: aaf084b2e7a546179248446421e385f1

vercel env add SPOTIFY_CLIENT_SECRET production
# Enter value when prompted: 3a20dfd3166143b68e2713818ebbdc17

vercel env add SPOTIFY_REDIRECT_URI production
# Enter value when prompted: https://spotify-album-fetcher.vercel.app/api/spotify/callback

# Redeploy
vercel --prod
```

---

## Most Common Issue

**The #1 issue**: Variables are set but **Production environment is not checked**.

Make absolutely sure:
- ✅ `SPOTIFY_CLIENT_ID` has Production checked
- ✅ `SPOTIFY_CLIENT_SECRET` has Production checked  
- ✅ `SPOTIFY_REDIRECT_URI` has Production checked

Then **Redeploy**!

