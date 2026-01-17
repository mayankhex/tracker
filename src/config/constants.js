export const REACT_APP_ENV = process.env.REACT_APP_ENV;
export const DEBUG = process.env.NODE_ENV === 'dev';
const encryptedConfig = process.env.REACT_APP_FIREBASE_CONFIG
export const PAGES = {
  '': {
    title: 'Health Check',
    path: 'health-check',
  },
  'daily-task': {
    title: 'Daily Task Tracker',
    path: 'daily-task',
  },
  'bulk-task': {
    title: 'Bulk Task Tracker',
    path: 'bulk-task',
  },
};
