# How to Connect to GitHub Repository

## Quick Steps

### 1. First, commit your files locally:

```bash
cd /Users/user/Documents/spot
git add .
git commit -m "Initial commit: Spotify Album Fetcher app"
```

### 2. Create GitHub Repository

1. Go to: https://github.com/new
2. Repository name: `spotify-album-fetcher` (or any name)
3. Choose Public or Private
4. **DO NOT** check "Initialize with README"
5. Click "Create repository"

### 3. Copy Your Repository URL

After creating, GitHub shows a page with a URL like:
```
https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

Copy this URL!

### 4. Connect Local Repository to GitHub

Run this command (replace with YOUR repository URL):

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

**Example:**
```bash
git remote add origin https://github.com/johnsmith/spotify-album-fetcher.git
```

### 5. Verify Connection

Check that it's connected:
```bash
git remote -v
```

You should see:
```
origin  https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git (fetch)
origin  https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git (push)
```

### 6. Push Your Code

```bash
git branch -M main
git push -u origin main
```

**When prompted:**
- **Username**: Your GitHub username
- **Password**: Use a Personal Access Token (see below)

---

## GitHub Authentication

GitHub requires a **Personal Access Token** (not your password):

### Create Token:

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: `spotify-app-deployment`
4. Check **`repo`** scope
5. Click "Generate token"
6. **COPY THE TOKEN** (you won't see it again!)

### Use Token:

When `git push` asks for password, paste your token.

---

## Troubleshooting

### "remote origin already exists"
If you already added a remote, remove it first:
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### "Repository not found"
- Check the URL is correct
- Make sure the repository exists on GitHub
- Verify you have access to it

### "Authentication failed"
- Use Personal Access Token, not password
- Make sure token has `repo` scope

### "Permission denied"
- Check username is correct
- Verify token is valid
- Try regenerating the token

---

## Complete Example

```bash
# 1. Navigate to project
cd /Users/user/Documents/spot

# 2. Add and commit files
git add .
git commit -m "Initial commit"

# 3. Add remote (replace with YOUR URL)
git remote add origin https://github.com/yourusername/spotify-album-fetcher.git

# 4. Verify
git remote -v

# 5. Push
git branch -M main
git push -u origin main
```

