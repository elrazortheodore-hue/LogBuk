# LogBuk

LogBuk is a production-ready enterprise logbook digitization platform. It provides a real-time bridge between physical written records and structured digital data.

## Overview

- **Mobile First Operator Upload**: Operators use the mobile-optimized upload portal (`/upload`) to scan physical logbook pages.
- **Real-Time Live Viewer**: Audience and administrators use the dashboard (`/viewer`) to see new records appear instantly with fluid animations.
- **Automated Processing Engine**: Images are processed intelligently on the backend.
- **Enterprise Ready**: Clean corporate aesthetics, robust PIN authentication, spreadsheet-style controls, and Excel export support.

---

## Setup Instructions

LogBuk is a vanilla JavaScript application designed to be deployed instantly on Vercel without a build step. It relies on Vercel Serverless Functions (`/api/*`) for backend processing and authentication.

### Local Development

1. **Clone the repository:**
   ```bash
   git clone <https://github.com/elrazortheodore-hue/LogBuk>
   cd LogBuk
   ```

2. **Install Vercel CLI & Dependencies:**
   ```bash
   npm install -g vercel
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example template and fill in the values:
   ```bash
   cp .env.example .env.local
   ```
   *(See Configuration sections below for where to obtain keys).*

4. **Start the local development server:**
   ```bash
   vercel dev
   ```
   The application will be available at `http://localhost:3000`.

### Production Deployment

LogBuk deploys directly to Vercel without code modifications.

1. Install the Vercel GitHub App or use the Vercel CLI:
   ```bash
   vercel --prod
   ```
2. Configure all environment variables in the Vercel Project Settings matching `.env.local`.
3. Vercel automatically maps `/upload` and `/viewer` via `vercel.json`.

---

## Configuration

### Firebase Configuration

Firebase Realtime Database is used for instant synchronization.
1. Create a Firebase project.
2. Provision a **Realtime Database**.
3. **Database Rules**: Set rules to allow public reads, but restrict writes.
   ```json
   {
     "rules": {
       ".read": true,
       ".write": false
     }
   }
   ```
4. Set `FIREBASE_DB_URL` to your database URL (e.g., `https://project-id-default-rtdb.firebaseio.com/`).
5. Obtain the legacy Database Secret from Firebase Settings > Service Accounts > Database Secrets and set `FIREBASE_SECRET`.

### Cloudinary Configuration

Cloudinary permanently archives logbook scans.
1. Create a free Cloudinary account.
2. In the Dashboard, locate your Cloud Name, API Key, and API Secret.
3. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.

### Backend Processing Configuration

Google Gemini 2.5 Flash powers the intelligent backend extraction pipeline.
1. Obtain an API key from Google AI Studio.
2. Set `GEMINI_API_KEY`.
*(Note: As per requirements, all AI and LLM terminology is strictly hidden from the frontend and user interfaces).*

### Authentication Configuration

Set 4-digit PINs for operator and viewer access.
- `UPLOAD_PIN`: (e.g. `1234`) Unlocks the upload portal.
- `VIEWER_PIN`: (e.g. `5678`) Unlocks the live dashboard.
- `SESSION_SECRET`: A long random string used to securely sign JSON Web Tokens.

---

*This application is built for live investor demonstrations and enterprise pilots.*
