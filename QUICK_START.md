# 🚀 Quick Start Guide

## The Problem
You're seeing "This site can't be reached" because:
1. ❌ Node.js is not installed
2. ❌ Dependencies haven't been installed
3. ❌ The development server isn't running

## Solution: Install Node.js

### Easiest Method (Recommended for macOS):

1. **Download Node.js:**
   - Open your browser and go to: **https://nodejs.org/**
   - Click the big green "Download Node.js (LTS)" button
   - This will download a `.pkg` file

2. **Install it:**
   - Double-click the downloaded `.pkg` file
   - Follow the installation wizard (just click "Continue" and "Install")
   - Enter your password when prompted

3. **Restart your terminal:**
   - Close this terminal window completely
   - Open a new terminal window
   - OR run: `source ~/.zshrc`

4. **Verify installation:**
   ```bash
   node --version
   npm --version
   ```
   You should see version numbers (like `v20.x.x` and `10.x.x`)

## After Installing Node.js:

1. **Install project dependencies:**
   ```bash
   cd /Users/user/Documents/spot
   npm install
   ```
   This will take 1-2 minutes the first time.

2. **Set up Spotify API (optional for now, but needed to fetch albums):**
   - Create `.env.local` file:
     ```bash
     cp env.example .env.local
     ```
   - Get credentials from https://developer.spotify.com/dashboard
   - Add them to `.env.local`

3. **Start the server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   - Go to: **http://localhost:3000**

## Still Having Issues?

If Node.js is installed but you still see "command not found":
- Make sure you restarted your terminal after installation
- Try opening a completely new terminal window
- Check if Node.js is in a different location:
  ```bash
   /usr/local/bin/node --version
   ```

