# Add Environment Variables to Vercel

## Step-by-Step Instructions

### Step 1: Navigate to Environment Variables

1. Go to: https://vercel.com/dashboard
2. Click on your **spotify-album-fetcher** project
3. Click **Settings** (top menu)
4. Click **Environment Variables** (left sidebar)

### Step 2: Add First Variable - SPOTIFY_CLIENT_ID

1. Click **"Add New"** button
2. Fill in the form:
   ```
   Key: SPOTIFY_CLIENT_ID
   Value: aaf084b2e7a546179248446421e385f1
   ```
3. **IMPORTANT**: Check all three boxes:
   - ☑ Production
   - ☑ Preview  
   - ☑ Development
4. Click **"Save"**

### Step 3: Add Second Variable - SPOTIFY_CLIENT_SECRET

1. Click **"Add New"** button again
2. Fill in:
   ```
   Key: SPOTIFY_CLIENT_SECRET
   Value: 3a20dfd3166143b68e2713818ebbdc17
   ```
3. Check all three environments:
   - ☑ Production
   - ☑ Preview
   - ☑ Development
4. Click **"Save"**

### Step 4: Add Third Variable - SPOTIFY_REDIRECT_URI

1. Click **"Add New"** button again
2. Fill in:
   ```
   Key: SPOTIFY_REDIRECT_URI
   Value: https://spotify-album-fetcher.vercel.app/api/spotify/callback
   ```
3. Check all three environments:
   - ☑ Production
   - ☑ Preview
   - ☑ Development
4. Click **"Save"**

### Step 5: Verify

You should now see three variables listed:
- ✅ SPOTIFY_CLIENT_ID
- ✅ SPOTIFY_CLIENT_SECRET
- ✅ SPOTIFY_REDIRECT_URI

Each should show: `Production, Preview, Development` under "Environments"

### Step 6: Redeploy

1. Go to **Deployments** tab (top menu)
2. Find your latest deployment
3. Click the **"..."** menu (three dots) on the right
4. Click **"Redeploy"**
5. Confirm it says "Redeploy to Production"
6. Wait for deployment to complete (status will show "Ready")

### Step 7: Test

After redeploy completes:

1. Visit: https://spotify-album-fetcher.vercel.app/api/spotify/auth
2. Should return JSON with `authUrl` (not an error)
3. Try signing in on your app

---

## Important Notes

- **No quotes**: Don't put quotes around the values
- **No spaces**: Make sure there are no leading/trailing spaces
- **Case sensitive**: Variable names are case-sensitive (`SPOTIFY_CLIENT_ID` not `spotify_client_id`)
- **All environments**: Make sure Production, Preview, and Development are all checked
- **Redeploy required**: You MUST redeploy after adding variables for them to take effect

---

## Troubleshooting

### Variables not showing up?
- Refresh the page
- Make sure you're in the right project
- Check that you clicked "Save" after adding each variable

### Still getting "credentials not configured"?
- Verify all three environments are checked for each variable
- Make sure you redeployed after adding variables
- Check the deployment logs to see if variables are being read

### Need to edit a variable?
- Click on the variable name
- Update the value
- Make sure environments are still checked
- Save and redeploy

