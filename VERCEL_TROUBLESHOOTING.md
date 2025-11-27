# Vercel Environment Variables Troubleshooting

## Quick Checklist

- [ ] Variables added in Vercel Settings → Environment Variables
- [ ] All three environments selected (Production, Preview, Development)
- [ ] No extra spaces in variable values
- [ ] No quotes around values
- [ ] Redeployed after adding variables
- [ ] Checked Vercel logs for errors

---

## Common Issues

### Issue 1: Variables Not Applied to Current Deployment

**Problem**: Added variables but didn't redeploy

**Solution**: 
1. Go to Deployments tab
2. Click "..." → "Redeploy"
3. Or push a new commit

### Issue 2: Wrong Environment Selected

**Problem**: Variables only set for Development, but Production is deployed

**Solution**:
1. Edit each variable
2. Make sure Production, Preview, AND Development are all checked
3. Save and redeploy

### Issue 3: Typos or Extra Spaces

**Problem**: Variable name or value has typos

**Solution**:
- Variable names must be exact: `SPOTIFY_CLIENT_ID` (case-sensitive)
- Values should have no quotes: `aaf084b2e7a546179248446421e385f1` (not `"aaf084b2e7a546179248446421e385f1"`)
- No leading/trailing spaces

### Issue 4: Variables Not Visible in Runtime

**Problem**: Variables set but not accessible in code

**Solution**:
- Vercel only exposes variables that start with allowed prefixes
- Next.js automatically exposes all env vars, so this shouldn't be an issue
- Make sure you're checking the Production deployment logs

---

## How to Verify Variables Are Set

### Method 1: Check Vercel Dashboard

1. Go to Settings → Environment Variables
2. You should see all three variables listed
3. Check that they're enabled for Production

### Method 2: Check Deployment Logs

1. Go to Deployments → Latest deployment
2. Click "View Function Logs" or check "Build Logs"
3. Look for the console.log output from the auth route:
   ```
   🔐 Auth request: {
     hasClientId: true/false,
     ...
   }
   ```

### Method 3: Test API Endpoint Directly

Visit: `https://spotify-album-fetcher.vercel.app/api/spotify/auth`

If variables are set correctly, you should get JSON with `authUrl`.
If not, you'll get the error message.

---

## Step-by-Step Fix

1. **Delete and Re-add Variables** (to ensure no hidden characters):
   - Delete `SPOTIFY_CLIENT_ID`
   - Add it again with exact value: `aaf084b2e7a546179248446421e385f1`
   - Make sure Production, Preview, Development are all checked
   - Save

2. **Repeat for Other Variables**:
   - `SPOTIFY_CLIENT_SECRET`: `3a20dfd3166143b68e2713818ebbdc17`
   - `SPOTIFY_REDIRECT_URI`: `https://spotify-album-fetcher.vercel.app/api/spotify/callback`

3. **Redeploy**:
   - Go to Deployments
   - Click "..." → "Redeploy"

4. **Wait for Deployment**:
   - Wait for build to complete
   - Check deployment status is "Ready"

5. **Test**:
   - Visit: https://spotify-album-fetcher.vercel.app
   - Try "Sign in with Spotify"
   - Check browser console (F12) for errors

---

## Still Not Working?

1. **Check Vercel Logs**:
   - Deployments → Latest → View Function Logs
   - Look for `hasClientId: false` or error messages

2. **Verify Spotify Credentials**:
   - Go to Spotify Developer Dashboard
   - Make sure your Client ID and Secret are correct
   - Regenerate if needed

3. **Try a Test Deployment**:
   - Make a small change (add a comment)
   - Commit and push
   - This triggers a fresh deployment with all env vars

4. **Contact Support**:
   - Vercel has great support
   - They can check if variables are being injected correctly

