# Father Heart Church App

## Quick Start (Windows)
**Option 1: The Easiest Way**
1.  Look for the file named `start_app.bat` in the file list on the left.
2.  Right-click it and choose "Reveal in File Explorer".
3.  Double-click it to start!

**Option 2: Using VS Code Terminal (Recommended)**
1.  In VS Code, look at the top menu and click **Terminal** -> **New Terminal**.
2.  Type this command and press Enter:
    ```bash
    npm install
    ```
3.  After that finishes, type this and press Enter:
    ```bash
    npm run dev
    ```
4.  Ctrl+Click the link that appears (e.g. `http://localhost:5173`) to open the app.

---

## Manual Setup
If you prefer the command line:
1. `npm install`
2. `npm run dev`

## Configuration (Important & FREE)
Everything used here is **100% Free** and requires **NO Credit Card**.

### Firebase Setup (Backend)
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Create a new project "Father Heart".
3. **Important**: If asked about "Google Analytics", you can disable it to keep things simple.
4. **Billing**: You are automatically on the **Spark Plan (Free)**. Do not upgrade. This plan is free forever for small apps.
5. **Add Web App**: Click the `</>` icon (Web), name it, and copy the `firebaseConfig`.
6. Open `src/firebase.js` in your code and paste your config there.
7. **Enable Services (Free)**:
   - **Authentication**: Go to Build > Authentication > Get Started > Email/Password > Enable.
   - **Firestore Database**: Go to Build > Firestore Database > Create Database > Start in **Test Mode** (easiest for now) or Production mode.

## Features
- **Service Roster**: `/roster`
- **Events & Maps**: `/events`
- **Teams Chat**: `/teams`
- **Admin**: `/admin` (User: `media@fathersheartministry.ca`)

## Deployment to Netlify (Free)
1. Run `npm run build` (or run `cmd /c "npm run build"` if using PowerShell).
2. Drag the created `dist` folder to [Netlify Drop](https://app.netlify.com/drop).
