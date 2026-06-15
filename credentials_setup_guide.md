# LogDesk Credentials Setup Guide

Hey! Grab a coffee, sit down, and listen up because we are about to hook up your LogDesk application to the real world! ☕

This guide will walk you through exactly how to get every single API key and URL needed for your project. At the very bottom of this file, there is a **Variables configuration section**. 

Once you have gathered your keys, **paste them into the placeholders in the section at the bottom of this file**, save it, and let me know. I will then read this file and generate the `.env` file for you automatically!

---

## 1. Google Gemini API (AI Studio)

We need the brain of the operation! Gemini 2.5 Flash is going to do the heavy lifting of reading the handwritten logbooks and converting them to structured JSON.

### Step-by-Step Instructions:
1. Navigate to the [Google AI Studio](https://aistudio.google.com/) website.
2. Sign in with your Google account.
3. Click on the prominent **"Get API Key"** button (usually in the top-left sidebar).
4. Click **"Create API Key"**.
5. You can choose to associate it with an existing Google Cloud project or create a new one. Select **"Create API Key in new project"**.
6. Copy the generated API Key. It starts with `AIzaSy...`.
7. Put it in the `GEMINI_API_KEY` placeholder below.

---

## 2. Firebase Realtime Database

We need real-time data sync! When the backend processes a logbook, it writes it to Firebase, which immediately streams it to your live dashboard.

### Step-by-Step Instructions:
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add project"** and follow the prompts to create a new project (e.g., named "LogDesk"). You can disable Google Analytics for this demo if you want to keep it simple.
3. Once the project is ready, look at the left-hand sidebar. Under the **"Build"** menu, click **"Realtime Database"**.
4. Click **"Create Database"**.
5. Select your database location (choose the one closest to you or Vercel's deployment region, usually `us-central1`).
6. For **Security Rules**, start in **test mode** or **locked mode**. (Test mode makes it easy, but you must configure it so it allows public reads and restricts writes). 
   Go to the **Rules** tab and paste these rules, then click **Publish**:
   ```json
   {
     "rules": {
       ".read": true,
       ".write": false
     }
   }
   ```
7. Go to the **Data** tab. Copy your database URL. It looks like this: `https://your-project-id-default-rtdb.firebaseio.com/`. Copy this URL.
8. Put it in the `FIREBASE_DB_URL` placeholder below.
9. **Now, you need the Secret!** 
   - Click the gear icon next to "Project Overview" in the top-left sidebar and select **"Project settings"**.
   - Go to the **"Service accounts"** tab.
   - Click on **"Database secrets"** (this is a legacy menu item, but it is the fastest way to authenticate REST writes).
   - Click **"Show"** next to the secret token and copy it.
10. Put it in the `FIREBASE_SECRET` placeholder below.

---

## 3. Cloudinary

We need a permanent archive for our raw images! When an operator uploads a photo, it goes straight to Cloudinary first so we have a permanent URL.

### Step-by-Step Instructions:
1. Go to [Cloudinary](https://cloudinary.com/) and sign up for a free account.
2. Once you are logged in, navigate to your **Console Dashboard**.
3. Right on the dashboard home page, you will see your **Product Environment Credentials**:
   - **Cloud Name**
   - **API Key**
   - **API Secret** (Click "View API Secret" or the eye icon to show it).
4. Copy these three values and paste them into the respective placeholders below:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

---

## 4. Local App Authentication Secrets

We need to secure the upload portal and the dashboard. 
- You need a 4-digit PIN for operators (`UPLOAD_PIN`).
- You need a 4-digit PIN for viewers (`VIEWER_PIN`).
- You need a secure string to sign the session JSON Web Tokens (`SESSION_SECRET`).

---

# PLACEHOLDERS: PASTE YOUR KEYS HERE

Please replace the values inside the quotes with your actual credentials. Once done, let me know!

```javascript
// ==========================================
// PASTE YOUR ACTUAL CREDENTIALS BELOW:
// ==========================================

const CONFIG_KEYS = {
  UPLOAD_PIN: "1234",             // Change to your desired 4-digit upload PIN
  VIEWER_PIN: "5678",             // Change to your desired 4-digit viewer PIN
  SESSION_SECRET: "logdesk_super_secret_session_jwt_key_123456", // Change to a long random secret string
  
  GEMINI_API_KEY: "PASTE_YOUR_GEMINI_API_KEY_HERE",
  
  FIREBASE_DB_URL: "PASTE_YOUR_FIREBASE_DB_URL_HERE",
  FIREBASE_SECRET: "PASTE_YOUR_FIREBASE_SECRET_HERE",
  
  CLOUDINARY_CLOUD_NAME: "PASTE_YOUR_CLOUDINARY_CLOUD_NAME_HERE",
  CLOUDINARY_API_KEY: "PASTE_YOUR_CLOUDINARY_API_KEY_HERE",
  CLOUDINARY_API_SECRET: "PASTE_YOUR_CLOUDINARY_API_SECRET_HERE"
};
```
