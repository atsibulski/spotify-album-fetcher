# GitHub Setup Guide

## Step-by-Step Instructions

### 1. Configure Git (One-time setup)

Run these commands with YOUR information:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

**Note**: Use the email associated with your GitHub account.

### 2. Create GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the **"+"** icon (top right) → **"New repository"**
3. Repository name: `spotify-album-fetcher` (or any name you like)
4. Choose **Public** or **Private**
5. **DO NOT** check "Initialize with README"
6. Click **"Create repository"**

### 3. Add and Commit Your Files

Run these commands in your project directory:

```bash
# Add all files (respects .gitignore)
git add .

# Commit with a message
git commit -m "Initial commit: Spotify Album Fetcher app"

# Check status (optional - see what will be committed)
git status
```

### 4. Connect to GitHub and Push

After creating the repository on GitHub, you'll see a page with setup instructions.
Copy the repository URL (looks like: `https://github.com/yourusername/spotify-album-fetcher.git`)

Then run:

```bash
# Add GitHub as remote (replace with YOUR repository URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**If prompted for credentials:**
- Use a **Personal Access Token** (not your password)
- See "GitHub Authentication" section below

### 5. Verify

Go to your GitHub repository page - you should see all your files!

---

## GitHub Authentication

GitHub no longer accepts passwords. You need a **Personal Access Token**:

### Create Personal Access Token:

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click **"Generate new token (classic)"**
3. Give it a name: `spotify-app-deployment`
4. Select scopes: Check **`repo`** (full control of private repositories)
5. Click **"Generate token"**
6. **COPY THE TOKEN** (you won't see it again!)

### Use Token:

When you run `git push`, it will ask for:
- **Username**: Your GitHub username
- **Password**: Paste your Personal Access Token (not your actual password)

---

## Quick Command Reference

```bash
# Check git status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push

# See remote repository
git remote -v

# Pull latest changes
git pull
```

---

## Next Steps After Pushing to GitHub

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New Project"
4. Import your repository
5. Add environment variables
6. Deploy!

---

## Troubleshooting

### "Repository not found"
- Check that the repository URL is correct
- Make sure you have access to the repository

### "Authentication failed"
- Use Personal Access Token, not password
- Make sure token has `repo` scope

### "Permission denied"
- Check your GitHub username and token are correct
- Try regenerating the token

### Files not showing up
- Check `.gitignore` - some files are intentionally excluded
- Make sure you ran `git add .` before committing

