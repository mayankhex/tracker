# Tracker App - React + Firebase (FREE)

A React web application that connects directly to Firebase Firestore - no backend required! Uses Firebase's free tier.

## Setup Instructions

### Quick Start

1. **Install dependencies:**

```bash
npm install
```

2. **Get Firebase Config** (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed steps):
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a project (FREE)
   - Enable Firestore Database
   - Get your Firebase config from Project Settings

3. **Run the app:**

```bash
npm start
```

4. **Enter your Firebase config** in the app:
   - API Key
   - Project ID
   - App ID
   - (Others are optional)

5. **Click "Initialize Firebase"** and start using the app!

### Detailed Setup Guide

For step-by-step instructions with screenshots, see **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)**

### Alternative: Using Environment Variables

Create a `.env` file in the root directory:

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
```

The app will automatically use these values.

## Features

- ✅ **Daily Tasks** - Add multiple tasks for each day
- ✅ **Date-Based Organization** - Select any date to view/add tasks and summaries
- ✅ **Task Management** - Mark tasks as complete/incomplete, delete tasks
- ✅ **Daily Summary** - Write a summary/notes for each day
- ✅ **Persistent Storage** - All data stored in Firebase Firestore
- ✅ **All operations happen directly from React** (client-side)
- ✅ **No backend server required!**

## Notes

- All data is stored in Firebase Firestore (FREE tier)
- **Collections used:**
  - `tasks` - Stores all tasks with date field
  - `dailySummaries` - Stores daily summaries with date as document ID
- Works directly from React - no backend server needed!
- Uses Firebase's free Spark plan (1 GB storage, 10 GB/month bandwidth)
- Each task and summary is linked to a specific date (YYYY-MM-DD format)

## Firebase Features Used

- ✅ **Firestore** - NoSQL database (similar to MongoDB)
- ✅ **Real-time updates** (can be enabled)
- ✅ **Free tier** - Perfect for development and small projects
- ✅ **Client-side** - All operations happen directly from React

## Tech Stack

- React 18
- Firebase Firestore
- No backend required!
