# 🌸 Buddy to Buddy — Cozy Pastel Camera & Memories Sanctuary

> A heartwarming, claymorphism-styled camera application and memory sanctuary powered by **React 18, TypeScript, Tailwind CSS, Google Firebase Firestore, and Google Workspace Gmail API**.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://buddy-to-buddy-camera-quitsaurabhverma2008-9330s-projects.vercel.app)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase)](https://firebase.google.com/)

🔗 **Live Production URL:** [https://buddy-to-buddy-camera-quitsaurabhverma2008-9330s-projects.vercel.app](https://buddy-to-buddy-camera-quitsaurabhverma2008-9330s-projects.vercel.app)

---

## 📸 App Preview & Visuals

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          🌸 BUDDY TO BUDDY                              │
│                 Welcome to your cozy pastel sanctuary                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐   │
│   │   [📷]   [🖼️]     │  │      [ 🖼️ ]       │  │ [⚙️] [🗑️] [✈️] [🔔]│   │
│   │   Camera   Add    │  │     Memories      │  │       Tools       │   │
│   │  Capture & Add    │  │     Sanctuary     │  │  Instant Action   │   │
│   └───────────────────┘  └───────────────────┘  └───────────────────┘   │
│                                                                         │
│   • 📷 Live Camera Viewfinder with Filters, Grid, Timer & HD Shutter    │
│   • 🖼️ Personal Gallery Upload with Auto-Tagging & Date Stamping        │
│   • ☁️ Google Cloud Firestore Real-time Multi-Device Synchronization     │
│   • 🔔 Google Workspace Gmail Alerts to uniquegksaurabh@gmail.com       │
│   • 💬 Cozy Companion AI Chat & Interactive Community Moments           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### 1. 📷 Live Viewfinder & HD Capture
- **Real-Time Camera Stream**: Proactive camera permission handling with front/rear lens switching.
- **Pastel & Nostalgic Filters**: Instant live filters (`Normal`, `Warm Glow`, `Pastel Dream`, `Vintage Mono`, `Emerald Garden`).
- **Interactive Controls**: Flash modes (Auto/On/Off), aspect ratios (4:3 / 1:1 / 16:9), 3s/10s timer, and alignment grid overlays.
- **Audio Feedback**: Custom procedural Web Audio chime and shutter sound synthesizer.

### 2. 🖼️ Device Gallery & Memories Storage
- **Direct System Upload**: Seamlessly pick and import high-res photos from phone, tablet, or desktop storage.
- **Metadata Tagging**: Custom tags, captions, date stamps, and favorite bookmarking.
- **Photo Exporter & Downloader**: Export polaroid cards, download high-res files, and copy shareable links.

### 3. ☁️ Google Firebase Firestore Realtime Persistence
- **Live Sync Engine**: All captures, favorites, tags, and edits sync in real-time across devices.
- **Zero Data Loss**: Resilient architecture with local fallback caching when offline.
- **Cloud Security Rules**: Enforced security schema for user records, community posts, and companion chats.

### 4. 🔔 Instant Email Alerts (Google Workspace Gmail API)
- **Direct Email Trigger**: Tap the 🔔 notification bell to send live alerts directly to `uniquegksaurabh@gmail.com`.
- **Customizable Sender & Note**: Allows entering personalized messages with automatic memory counts and timestamps.
- **Polished HTML Template**: Formatted responsive email design with pastel badges and delivery status tracking.

### 5. 💬 Companion Chat & Community Feed
- **Buddy Companion**: Interactive caring chat assistant stored persistently in Cloud Firestore.
- **Community Feed**: Discover and share sweet moments with animated heart likes and confetti celebrations.

---

## 🛠️ Tech Stack & Libraries

- **Frontend Core**: React 18, TypeScript, Vite
- **Styling & Design System**: Tailwind CSS v4, Claymorphism Soft 3D Aesthetics, Smooth Transitions
- **Icons**: `lucide-react`, Google Material Symbols
- **Cloud Database & Auth**: Google Firebase (Firestore & Firebase Auth)
- **Email Delivery**: Google Workspace Gmail API (`/gmail/v1/users/me/messages/send`)
- **Animations & Delight**: `motion/react`, `canvas-confetti`, Web Audio API Sound Engine

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/quitsaurabhverma2008-sketch/buddy-to-buddy-camera.git
   cd buddy-to-buddy-camera
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start local development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000` (or `http://localhost:5173`).

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## 🌐 Deploy to Vercel

You can deploy this project to Vercel with one click:

```bash
npx vercel --prod
```

Or connect the GitHub repository `quitsaurabhverma2008-sketch/buddy-to-buddy-camera` directly inside your [Vercel Dashboard](https://vercel.com/new).

---

## 📄 License

This project is licensed under the MIT License — feel free to customize and share! 🌸
