# GET THOSE KEYS! 🚀 KEYS & APIS SETUP GUIDE

You need to pay attention right now! We are about to connect your LogDesk application to the cloud, and for that, you need **KEYS**. Not physical keys—API keys! 

This guide is going to lecture you step-by-step on exactly what you need to do on three different websites: **Google AI Studio**, **Cloudinary**, and **Firebase**. 

Are you ready? Grab your coffee. Let's go! ☕

---

## 1. GOOGLE AI STUDIO (Gemini API) 🤖

This is the brain of your application. Gemini is going to look at your logbook scans, perform OCR, and structure it into clean JSON. Without this key, LogDesk is blind!

### Exactly What You Do:
1. **Navigate to the website:** Go to [Google AI Studio](https://aistudio.google.com/).
2. **Log In:** Use your Google account.
3. **Locate the API Key Button:** In the top-left sidebar, you will see a big button that says **"Get API key"**. Click it!
4. **Create the Key:**
   - Click **"Create API key"**.
   - You can choose to associate it with an existing Google Cloud Project, or just click **"Create API key in new project"**.
5. **Copy the Key:** A modal will pop up with a long string of letters and numbers starting with `AIzaSy...`. **Copy this immediately!**
6. **Save to `.env.local`:**
   Open your `.env.local` file and paste it:
   ```env
   GEMINI_API_KEY=your_copied_api_key_here
   ```

*Warning:* Keep this key secret! If someone steals it, they can run up your API usage limit!

---

## 2. CLOUDINARY (Image Archiving) ☁️

Every time an operator uploads an image, we archive it permanently on Cloudinary. This gives us a static, fast-loading URL that we store in Firebase.

### Exactly What You Do:
1. **Navigate to the website:** Go to [Cloudinary](https://cloudinary.com/).
2. **Sign Up / Log In:** Create a free account.
3. **Go to your Dashboard:** Once you log in, you will be redirected to the **Cloudinary Console Dashboard**.
4. **Locate your Product Environment Credentials:**
   Right on the main dashboard screen, you will see a section called **"Product Environment Credentials"** containing three critical pieces of information:
   - **Cloud Name** (e.g., `dpxxxxxxx`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (This will be hidden. Click the "eye" icon or "Reveal" to see it).
5. **Copy and Save them to `.env.local`:**
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

Now your app can upload images to the cloud!

---

## 3. FIREBASE (Real-Time Database) 🔥

This is the heartbeat of your live viewer dashboard. When Gemini finishes structuring the data, it writes it here, and the viewer instantly gets notified!

### Exactly What You Do:

#### Step A: Create the Project & Database
1. **Navigate to the console:** Go to the [Firebase Console](https://console.firebase.google.com/).
2. **Create a Project:** Click **"Add project"**. Give it a name like `LogDesk`, agree to the terms, and click **"Continue"**. (You don't need Google Analytics for this demo, so you can disable it to make the setup faster).
3. **Build a Database:**
   - In the left-hand sidebar, click on **"Build"** to expand the menu.
   - Click **"Realtime Database"**.
   - Click **"Create Database"**.
   - Select a database location closest to you (e.g., `us-central1`), click **"Next"**.
   - Start in **"Locked mode"** (we will change the rules in a second!), and click **"Enable"**.

#### Step B: Set Public Read Rules (Required for the Viewer Stream)
1. In your Realtime Database dashboard, look at the top tabs and click on **"Rules"**.
2. Replace the existing rules JSON with this exact code:
   ```json
   {
     "rules": {
       ".read": true,
       ".write": "auth != null"
     }
   }
   ```
   *Note: This allows the audience to stream database changes in real-time, but prevents anyone from writing to your database without the Firebase Secret!*
3. Click **"Publish"**.

#### Step C: Copy the Database URL
1. Click back to the **"Data"** tab.
2. At the top of your database tree, you will see a URL (e.g., `https://logdesk-default-rtdb.firebaseio.com/`). **Copy this URL!**
3. Save it to your `.env.local`:
   ```env
   FIREBASE_DB_URL=https://logdesk-default-rtdb.firebaseio.com/
   ```

#### Step D: Get the Firebase Secret (Legacy Database Secret)
Because we are using Vercel Serverless Functions with a lightweight vanilla JS architecture, we use the fast Firebase REST API using the legacy Database Secret for authorization.
1. Click the **Gear icon (Settings)** next to "Project Overview" in the top-left sidebar.
2. Click **"Project settings"**.
3. Go to the **"Service accounts"** tab.
4. In the service accounts menu, click on **"Database secrets"** (it is a secondary tab/link in that section).
5. Hover over your secret and click **"Show"**.
6. **Copy this secret!**
7. Save it to your `.env.local`:
   ```env
   FIREBASE_SECRET=your_firebase_database_secret
   ```

---

## 4. LOCAL SECURITY (Auth PINs) 🔒

Finally, you need to configure your own local security tokens in `.env.local` to protect your demo interfaces!

### Exactly What You Do:
1. **Choose your PINs:**
   - Choose a 4-digit PIN for the Operator Upload Portal (e.g. `1111`).
   - Choose a 4-digit PIN for the Viewer Dashboard (e.g. `2222`).
2. **Generate a Session Secret:**
   - You need a long random string to sign your 10-minute JWT session tokens. You can just type random letters/numbers on your keyboard.
3. Save them to your `.env.local`:
   ```env
   UPLOAD_PIN=1111
   VIEWER_PIN=2222
   SESSION_SECRET=super_long_random_secret_string_here
   ```

---

### Double Check your `.env.local` File:
Your final local environment file should look like this:

```env
UPLOAD_PIN=1111
VIEWER_PIN=2222
SESSION_SECRET=super_long_random_secret_string_here

GEMINI_API_KEY=AIzaSy...
FIREBASE_DB_URL=https://your-project-default-rtdb.firebaseio.com/
FIREBASE_SECRET=secret_token_here

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Once you have these keys inside `.env.local`, start the engine with `vercel dev` and watch your physical pages transform into real-time digital databases! 🚀🔥🤖
