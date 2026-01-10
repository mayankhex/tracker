// Firebase Configuration
// Reads from .env file automatically

import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import CryptoJS from 'crypto-js';
import { REACT_APP_ENV, DEBUG } from './constants';

const encryptedConfig = {
  apiKey: 'U2FsdGVkX197kPyyOC87+9/XblYmm6TSdYrzUxkHqf3M6Hq71laAeeS/ihqur6sEef1v0FVeO16HYshFcC0sfw==',
  authDomain: 'U2FsdGVkX196SCs2q48CoxQPUq8V5PubVyFwQw3LYJYzG/+IRWzSxjuAUTpSrXxG',
  projectId: 'U2FsdGVkX1+JFAfl1Xkn6jzSEZ+AfDvus7yz9h2a9eg=',
  storageBucket: 'U2FsdGVkX1/G6xFg03ev6mEBJETsqHd6JLZy1bOCk9iFG5VxFp9kQOf4BuwN6W7GvLJmmsE27jTZMLZv3gyjig==',
  messagingSenderId: 'U2FsdGVkX18aEacQkZms0hiL859bnxniTWDRBKLqnxE=',
  appId: 'U2FsdGVkX18XSLPoqE4r7Z4Nqi3fJgxYDBPCjr/YetTihP7VnsxGno70GB/PFN8PX3KhQiCUaMdhr1ECoqPTUg==',
  measurementId: 'U2FsdGVkX19X0Gl48g7yTfpsmp959gzzMY2mlds/SDU=',
};

function decryptConfig(config, secret) {
  const oldConfig = Object.entries(config).reduce((acc, [key, value]) => {
    acc[key] = CryptoJS.AES.decrypt(value, secret).toString(CryptoJS.enc.Utf8);
    return acc;
  }, {});
  if (DEBUG) console.log(oldConfig);
  return oldConfig;
}

// Get Firebase config from environment variables
export const getFirebaseConfig = (secret) => {
  return decryptConfig(encryptedConfig, secret);
};

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
    if (config && config.apiKey === '' && config.apiKey === encryptedConfig.apiKey) {
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
