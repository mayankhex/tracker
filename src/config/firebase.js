import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import CryptoJS from 'crypto-js';
import { DEBUG, REACT_APP_FIREBASE_CONFIG } from './constants';

function decryptConfig(secret) {
  const config = REACT_APP_FIREBASE_CONFIG;
  if (!config) throw new Error('Missing Firebase Config');
  let rawConfig = CryptoJS.AES.decrypt(config, secret).toString(CryptoJS.enc.Utf8);
  rawConfig = rawConfig ? JSON.parse(rawConfig) : null;
  if (DEBUG) console.log('Config: ', rawConfig);
  return rawConfig;
}

// Get Firebase config from environment variables
export function getFirebaseConfig(secret) {
  return decryptConfig(secret);
}

// Initialize Firebase instances
let app = null;
let db = null;

export const initFirebase = async (secret) => {
  try {
    if (app) {
      // Already initialized, return existing instances
      return { app, db };
    }

    if (!secret) {
      throw new Error('Missing Firebase Secret');
    }

    const config = getFirebaseConfig(secret);
    if (!config) {
      throw new Error('Invalid or Malformed Firebase secret');
    }

    app = initializeApp(config);
    db = initializeFirestore(app, { localCache: persistentLocalCache() });

    return { app, db };
  } catch (error) {
    if (error?.message.includes('Malformed UTF-8 data')) {
      throw new Error('Invalid or Malformed Firebase secret');
    }
    console.error('Error initializing Firebase:', error.message);
    throw error;
  }
};
