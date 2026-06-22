# LogDesk Credentials Setup Guide

Listen up! Grab a coffee, sit down, and focus, because we are going to connect your LogDesk application to the real world! ☕

This guide contains the absolute most detailed, step-by-step walkthrough to get every single API key, URL, and secret token you need. We're going to break down Google AI Studio, Firebase Realtime Database, and Cloudinary.

At the very bottom of this file, you will find the **Variables configuration section** containing a code placeholder block. Once you have gathered your keys, **replace the placeholder strings inside the quotes**, save this file, and let me know. I will then read this file and generate your `.env` file for you automatically!

---

## 1. Google Gemini API Key (Google AI Studio)

We need the brain of LogDesk! Google Gemini 2.5 Flash will do the heavy lifting of reading the handwritten logbooks and converting them to structured JSON.

### Step-by-Step Walkthrough:

1. Open your browser and navigate to: **[Google AI Studio](https://aistudio.google.com/)**
2. Sign in using your standard Google account (Gmail/Workspace).
3. Once the workspace loads, look at the **top-left sidebar**. You will see a prominent button that says **"Get API Key"** (usually with a key icon next to it). Click it.
4. On the API Keys page, look for the blue button that says **"Create API Key"** and click it.
5. A popup dialog will appear. You have two choices:
   - **"Create API Key in new project"**: Select this if you want Google to automatically set up a new Google Cloud project for you (Recommended for simplicity!).
   - **"Create API Key in existing project"**: Select this if you want to use the same project you created for Firebase (keeps your Google Cloud resources organized under one name).
6. Once the key is generated, click the **"Copy"** button to copy the key to your clipboard. The key will start with the characters `AIzaSy...`.
7. Paste this key into the `GEMINI_API_KEY` placeholder in the CONFIG_KEYS block at the bottom of this file.

---

## 2. Firebase Realtime Database

We need real-time data sync! When our Vercel backend extracts structured data, it writes it to Firebase. Firebase then instantly streams that data to your live dashboard.

### Step-by-Step Walkthrough:

1. Navigate to the **[Firebase Console](https://console.firebase.google.com/)** in your browser.

2. Sign in with your Google account.

3. Click the big card that says **"Add project"** (or "Create a project").
   
   - **Step 1 of 3 (Project name)**: Enter a name like `LogDesk` and click **"Continue"**.
   - **Step 2 of 3 (Google Analytics)**: Toggle **Google Analytics OFF** (this is just an investor demo, and turning it off will make project creation much faster!). Click **"Create project"**.
   - **Step 3 of 3 (Provisioning)**: Wait a few seconds for Firebase to set up your project resources. Once it finishes, click **"Continue"**.

4. You are now on the project home dashboard. Look at the left-hand navigation menu:
   
   - Expand the **"Build"** dropdown menu (if it is collapsed).
   - Click on **"Realtime Database"**.

5. On the Realtime Database landing page, click the blue button that says **"Create Database"**.

6. A setup wizard will open:
   
   - **Database location**: Choose your database location. The default (usually `us-central1` or `europe-west1`) is perfect. Click **"Next"**.
   - **Security rules**: Select **"Start in locked mode"** (this is the secure default). Click **"Enable"**.

7. Once the database is initialized, you will see a screen with your database URL at the top of the page. It looks like this: `https://[your-project-id]-default-rtdb.firebaseio.com/`. 
   
   - Hover over this URL and copy it. This is your database URL.
   - Paste it into the `FIREBASE_DB_URL` placeholder at the bottom of this file.

8. **Configure Database Security Rules (Crucial!):**
   
   - Click on the **"Rules"** tab located at the top of the Realtime Database page (next to "Data").
   
   - Replace the entire JSON rules block with the code below. This allows anyone on the internet to read your data (so the dashboard works without heavy login overhead), but blocks anyone from writing to your database unless they have the secret key:
     
     ```json
     {
       "rules": {
         ".read": true,
         ".write": false
       }
     }
     ```
   
   - Click the blue **"Publish"** button to save the rules.

9. **Get the Database Secret Token:**
   
   - In the top-left corner of the Firebase console, locate the gear icon next to **"Project Overview"**. Click it and select **"Project settings"**.
   - Navigate to the **"Service accounts"** tab at the top.
   - On the left-side sub-menu under Service Accounts, click on the **"Database secrets"** link (Note: this is a legacy mechanism, but it is the fastest way to authorize serverless writes without importing heavy SDKs!).
   - Hover over the masked token under the "Secret" column and click **"Show"**.
   - Click the **"Copy"** button to grab the secret token string.
   - Paste this key into the `FIREBASE_SECRET` placeholder at the bottom of this file.

---iVM7YYLRiXZtWNkHUCRBmrBK7Sa35CTBU1gIcCM2

## 3. Cloudinary

We need a permanent archive for our raw images! When an operator uploads a logbook scan, it gets saved to Cloudinary so we can store high-quality image URLs alongside our database records.

### Step-by-Step Walkthrough:

1. Navigate to: **[Cloudinary](https://cloudinary.com/)**

2. Click **"Sign Up for Free"** and create your account.

3. Once your account is verified and you log in, you will be taken to your **Console Dashboard**.

4. Look at the top center of your dashboard page. You will see a card titled **"Product Environment Credentials"** containing three important values:
   
   - **Cloud Name** (e.g., `dxyz12345`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (This will be masked. Click the eye icon next to it or click "View API Secret" to unmask it).

5. Copy these three values one by one and paste them into their respective placeholders inside the CONFIG_KEYS block at the bottom of this file:
   
   - `CLOUDINARY_CLOUD_NAME`dw1cmxw2j
   
   - `CLOUDINARY_API_KEY`512485141679127
   
   - `CLOUDINARY_API_SECRET`
     
     **********

---CLOUDINARY_URL=cloudinary://512485141679127:**********@dw1cmxw2j

## 4. Local Authentication PINs and Secrets

We need to secure access to both the Upload page and the Viewer dashboard.

- `UPLOAD_PIN`: The 4-digit PIN the operator types to unlock the camera scanning console (e.g. `"1234"`)9810.
- `VIEWER_PIN`: The 4-digit PIN the audience/investors type to unlock the live dashboard (e.g. `"5678"`).9980
- `SESSION_SECRET`: A long, random sequence of numbers and letters (e.g., `"my_ultra_secure_session_secret_9988776655"`) used by the serverless function to securely sign session JSON Web Tokens (JWT). This prevents session tampering!my_ultra_secure_session_secret_0968716655

---

# CONFIGURATION VARIABLES: PASTE YOUR KEYS HERE

Please replace the values inside the quotes with your actual credentials. Do not delete the quotes! Once you have saved this file, let me know!

```javascript
// ==========================================
// PASTE YOUR ACTUAL CREDENTIALS BELOW:
// ==========================================

const CONFIG_KEYS = {
  UPLOAD_PIN: "9810",             // Change to your desired 4-digit upload PIN
  VIEWER_PIN: "9980",             // Change to your desired 4-digit viewer PIN
  SESSION_SECRET: "90375759999110130886", // Change to a long random secret string

  GEMINI_API_KEY: "YOUR_GEMINI_API_KEY_HERE",

 // Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyASaTVRTtI-3_CTKvuO6G4OBrvnVGGJTAM",
  authDomain: "visio-log.firebaseapp.com",
  databaseURL: "https://visio-log-default-rtdb.firebaseio.com",
  projectId: "visio-log",
  storageBucket: "visio-log.firebasestorage.app",
  messagingSenderId: "1032305774025",
  appId: "1:1032305774025:web:c83d7bc661c9ca49c6ec18",
  measurementId: "G-ZQPLC76F1W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

  CLOUDINARY_CLOUD_NAME: "dw1cmxw2j",
  CLOUDINARY_API_KEY: "512485141679127",
  CLOUDINARY_API_SECRET: "UU0cMw81xAX_tchMSHv6L0DLtOA"
};
```
