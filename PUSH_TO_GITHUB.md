# Push Your Code to GitHub

## Quick Method: Use Personal Access Token

### Step 1: Create Token
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: `spotify-app-deployment`
4. Check **`repo`** scope
5. Click "Generate token"
6. **COPY THE TOKEN** (you won't see it again!)

### Step 2: Push with Token

**Option A: Push and enter credentials when prompted**
```bash
cd /Users/user/Documents/spot
git push -u origin main
```
- Username: `atsibulski`
- Password: Paste your token

**Option B: Embed token in URL (one-time)**
```bash
cd /Users/user/Documents/spot
git remote set-url origin https://atsibulski:YOUR_TOKEN@github.com/atsibulski/spotify-album-fetcher.git
git push -u origin main
```
Replace `YOUR_TOKEN` with your actual token.

---

## Alternative: Use SSH (More Secure)

### Step 1: Generate SSH Key
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
# Press Enter to accept default location
# Press Enter for no passphrase (or set one)
```

### Step 2: Add SSH Key to GitHub
```bash
# Copy your public key
cat ~/.ssh/id_ed25519.pub
```

1. Go to: https://github.com/settings/keys
2. Click "New SSH key"
3. Paste your public key
4. Click "Add SSH key"

### Step 3: Change Remote to SSH
```bash
cd /Users/user/Documents/spot
git remote set-url origin git@github.com:atsibulski/spotify-album-fetcher.git
git push -u origin main
```

---

## Verify Push

After pushing, refresh your GitHub page. You should see all your files!

