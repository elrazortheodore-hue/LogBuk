# Implementation Plan — LogBuk Real-Time Digitization Platform

This document outlines the architecture, data structures, and implementation tasks for the **LogBuk** production-ready investor demo.

## User Review Required

Please review the environment variables and the proposed connection flow:
- **Direct Client-to-Firebase Read**: The viewer client will establish a read-only stream directly to Firebase Realtime Database. To protect this data, we recommend setting Firebase Realtime Database security rules to allow read access publicly for the demo, while restricting write access to backend requests authenticated with the `FIREBASE_SECRET`.
- **JWT Session Timeout**: Tokens will expire strictly in 10 minutes. Session storage is cleared on tab close.

> [!IMPORTANT]
> The processing technologies (Gemini, AI, OCR) will be completely hidden from the user-facing interfaces, browser network payloads, and UI messages. Only corporate and professional status indicators will be visible.

---

## Proposed Changes

### Component 1: Project Setup & Vercel Configuration
We will set up the project configuration and dependency management to support standard Vercel serverless functions and asset routing.

#### [NEW] [package.json](file:///c:/Users/USER/Documents/Codes and projects/LogBuk/package.json)
Defines project dependencies:
- `@google/generative-ai` for Gemini 2.5 Flash integration.
- `cloudinary` for image storage.
- `jsonwebtoken` for issuing and validating signed 10-minute session tokens.

#### [NEW] [vercel.json](file:///c:/Users/USER/Documents/Codes and projects/LogBuk/vercel.json)
Configures clean URLs, routes requests to serverless functions, and serves static files.

#### [NEW] [.env.example](file:///c:/Users/USER/Documents/Codes and projects/LogDesk/.env.example)
Template for required backend credentials.

---

### Component 2: Backend Utilities
Encapsulates backend service integrations in clean, single-responsibility modules.

#### [NEW] [auth.js](file:///c:/Users/USER/Documents/Codes and projects/LogDesk/api/utils/auth.js)
Handles verification of `UPLOAD_PIN` and `VIEWER_PIN` against environment variables and manages signed JSON Web Token (JWT) issuance and validation with a 10-minute expiry.

#### [NEW] [firebase.js](file:///c:/Users/USER/Documents/Codes and projects/LogDesk/api/utils/firebase.js)
Provides write utility to Firebase Realtime Database using the fast legacy Database Secret REST authorization query parameter (`?auth=`).

#### [NEW] [gemini.js](file:///c:/Users/USER/Documents/Codes and projects/LogDesk/api/utils/gemini.js)
Coordinates image processing with Gemini 2.5 Flash, enforcing a structured JSON output schema matching headers and rows.

#### [NEW] [cloudinary.js](file:///c:/Users/USER/Documents/Codes and projects/LogDesk/api/utils/cloudinary.js)
Implements date-structured image uploads (`YYYY/MM/DD`) using the Cloudinary Node.js SDK.

---

### Component 3: Serverless API Routes
Endpoints responding to client requests.

#### [NEW] [verify-pin.js](file:///c:/Users/USER/Documents/Codes and projects/LogDesk/api/verify-pin.js)
Post endpoint that validates the PIN and returns a signed JWT.

#### [NEW] [process-image.js](file:///c:/Users/USER/Documents/Codes and projects/LogDesk/api/process-image.js)
Secure endpoint that accepts base64 images, uploads to Cloudinary, extracts data via Gemini, and records results in Firebase.

---

### Component 4: Static Web Interface
A cohesive design using CSS variables, corporate blue branding, responsive layouts, and smooth animations.

#### [NEW] [styles.css](file:///c:/Users/USER/Documents/Codes and projects/LogDesk/public/css/styles.css)
Global styling for corporate branding, input controls, custom spreadsheet table UI, transitions, and slide animations.

#### [NEW] [auth.js](file:///c:/Users/USER/Documents/Codes and projects/LogDesk/public/js/auth.js)
Client-side session controller that monitors token lifetime and performs redirection.

#### [NEW] [logo.svg](file:///c:/Users/USER/Documents/Codes and projects/LogDesk/public/assets/logo.svg)
Corporate SVG logo for LogBuk.

#### [NEW] [upload.html](file:///c:/Users/USER/Documents/Codes and projects/LogDesk/public/upload.html)
Mobile-first scanning screen with image selection, camera access, and status monitoring.

#### [NEW] [upload.js](file:///c:/Users/USER/Documents/Codes and projects/LogDesk/public/js/upload.js)
Handles camera/file inputs, scales/compresses files client-side, and communicates with the upload API.

#### [NEW] [viewer.html](file:///c:/Users/USER/Documents/Codes and projects/LogDesk/public/viewer.html)
Desktop-optimized viewer workspace structure containing controls, status indicators, and the table canvas.

#### [NEW] [viewer.js](file:///c:/Users/USER/Documents/Codes and projects/LogDesk/public/js/viewer.js)
Handles dynamic table assembly, live SSE Firebase listener, inline editing, sorting, filters, search, keyboard navigation, and row addition animations.

#### [NEW] [excel.js](file:///c:/Users/USER/Documents/Codes and projects/LogDesk/public/js/excel.js)
Handles client-side SheetJS dynamic Excel workbook creation and download.

---

### Component 5: Project Documentation

#### [NEW] [README.md](file:///c:/Users/USER/Documents/Codes and projects/LogDesk/README.md)
Comprehensive walkthrough detailing local execution, Firebase rules configuration, Cloudinary integration, Gemini setup, and deployment guides.

---

## Verification Plan

### Automated Tests
- Test API route responses using local fetch requests:
  - Verify `/api/verify-pin` rejects bad PINs and returns a token for valid ones.
  - Verify `/api/process-image` rejects unauthorized requests and extracts valid data for authorized ones.

### Manual Verification
- Log in to the `/upload` path and upload a mock table photo.
- Verify status progression: Uploading -> Processing -> Saving -> Completed.
- Observe the `/viewer` dashboard, check if the record appears live with a slide-in animation.
- Test inline editing, searching, keyboard navigation, and Excel export.

<!-- CHECKPOINT id="ckpt_mqfdhwgw_dntt1a" time="2026-06-15T15:33:33.728Z" note="auto" fixes=0 questions=0 highlights=0 sections="" -->
