# Vercel + Spotify Setup Guide

## Quick Checklist

- [ ] Get your Vercel deployment URL
- [ ] Add Vercel redirect URI to Spotify Developer Dashboard
- [ ] Set environment variables in Vercel
- [ ] Test the OAuth flow

---

## Step 1: Get Your Vercel URL

After deploying to Vercel, you'll get a URL like:
- `https://spotify-album-fetcher.vercel.app`
- Or your custom domain if you set one up

---

## Step 2: Update Spotify Developer Dashboard

1. Go to: https://developer.spotify.com/dashboard
2. Click on your app
3. Click **"Edit Settings"**
4. Scroll to **"Redirect URIs"**
5. Add your Vercel URL:
   ```
   https://your-app.vercel.app/api/spotify/callback
   ```
6. **Keep your local URLs** (for local testing):
   ```
   http://localhost:3000/api/spotify/callback
   http://127.0.0.1:3000/api/spotify/callback
   ```
7. Click **"Save"**

---

## Step 3: Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these variables:

   ```
   SPOTIFY_CLIENT_ID=your_client_id_here
   SPOTIFY_CLIENT_SECRET=your_client_secret_here
   SPOTIFY_REDIRECT_URI=https://your-app.vercel.app/api/spotify/callback
   ```

4. Make sure to select **Production**, **Preview**, and **Development** environments
5. Click **Save**

---

## Step 4: Redeploy (if needed)

If you added environment variables after the first deploy:
1. Go to **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**

Or Vercel will auto-redeploy when you push to GitHub.

---

## Testing

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Click "Sign in with Spotify"
3. Complete the OAuth flow
4. You should be redirected back to your Vercel app

---

## Troubleshooting

### "Redirect URI mismatch" error
- Make sure the redirect URI in Spotify Dashboard **exactly matches** your Vercel URL
- Include the full path: `https://your-app.vercel.app/api/spotify/callback`
- Check for typos (http vs https, trailing slashes, etc.)

### "Invalid client" error
- Verify `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are set correctly in Vercel
- Make sure they match your Spotify app credentials

### OAuth works but session not persisting
- Check that cookies are being set (browser DevTools → Application → Cookies)
- Verify `NODE_ENV=production` is set in Vercel (usually automatic)
- Check Vercel logs for cookie-related errors

---

## Multiple Environments

If you have multiple Vercel deployments (production, preview):
- Add redirect URIs for each environment in Spotify Dashboard
- Set environment-specific `SPOTIFY_REDIRECT_URI` in Vercel

Example:
- Production: `https://your-app.vercel.app/api/spotify/callback`
- Preview: `https://your-app-git-main.vercel.app/api/spotify/callback`

---

## Notes

- The app automatically uses `request.nextUrl.origin` for redirect URI, so it should work without setting `SPOTIFY_REDIRECT_URI` in Vercel
- However, explicitly setting it ensures consistency across all environments
- You can keep localhost URLs in Spotify Dashboard for local development

