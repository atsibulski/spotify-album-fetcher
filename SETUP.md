# Setup Instructions

## Step 1: Install Node.js

You need Node.js to run this Next.js application. Choose one of these methods:

### Option A: Official Installer (Easiest)
1. Visit [https://nodejs.org/](https://nodejs.org/)
2. Download the LTS (Long Term Support) version for macOS
3. Run the installer and follow the instructions
4. Restart your terminal

### Option B: Using Homebrew
1. Install Homebrew (if not already installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
2. Install Node.js:
   ```bash
   brew install node
   ```

### Option C: Using nvm (Node Version Manager)
1. Install nvm:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   ```
2. Restart your terminal or run:
   ```bash
   source ~/.zshrc
   ```
3. Install Node.js:
   ```bash
   nvm install --lts
   nvm use --lts
   ```

## Step 2: Verify Installation

After installing Node.js, verify it's working:
```bash
node --version
npm --version
```

You should see version numbers for both commands.

## Step 3: Install Project Dependencies

Once Node.js is installed, run:
```bash
cd /Users/user/Documents/spot
npm install
```

## Step 4: Set Up Spotify API Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create app"
4. Fill in the app details:
   - App name: (any name you want)
   - App description: (optional)
   - Redirect URI: `http://localhost:3000` (for now)
   - Check the terms and click "Save"
5. Copy your **Client ID** and **Client Secret**

6. Create `.env.local` file:
   ```bash
   cp env.example .env.local
   ```

7. Edit `.env.local` and add your credentials:
   ```
   SPOTIFY_CLIENT_ID=aaf084b2e7a546179248446421e385f1
   SPOTIFY_CLIENT_SECRET=3a20dfd3166143b68e2713818ebbdc17
   ```

## Step 5: Start the Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Troubleshooting

- **"command not found: node"**: Node.js is not installed or not in your PATH. Try restarting your terminal after installation.
- **"This site can't be reached"**: Make sure the dev server is running (`npm run dev`)
- **Spotify API errors**: Verify your credentials in `.env.local` are correct

