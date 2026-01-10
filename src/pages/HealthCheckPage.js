import { collection, addDoc, getDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { useEffect, useState, useRef } from 'react';

import { initFirebase } from '../config/firebase';
import { DEBUG } from '../config/constants';
import { useConfig } from '../App';
import './HealthCheckPage.css';

const healthCheckType = {
  CONFIG: 'config',
  WRITE: 'write',
  READ: 'read',
  DELETE: 'delete',
};
const STATUS = { success: '✅', error: '❌', testing: '⏳' };

export default function HealthCheck() {
  const { setDb, updatePath } = useConfig();

  const inputSecretRef = useRef(null);
  const [error, setError] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [errorQuickFix, setErrorQuickFix] = useState(null);

  const addTestResult = (id, test, status, message) => {
    setTestResults((prev) => {
      const index = prev.findIndex((result) => result?.id == id);
      if (index != -1) {
        prev[index] = { id, test, status, message, timestamp: new Date() };
        return prev;
      } else {
        return [...prev, { id, test, status, message, timestamp: new Date() }];
      }
    });
  };

  const runConnectionTest = async (db) => {
    // Test 1: Write to Firestore (quick test)
    addTestResult(healthCheckType.WRITE, 'Write Test', 'testing', 'Writing test document...');
    const testCollection = collection(db, 'healthCheck');
    const testDoc = await Promise.race([
      addDoc(testCollection, {
        timestamp: Timestamp.now(),
        test: 'health-check',
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Write operation timed out')), 10000)),
    ]);
    addTestResult(healthCheckType.WRITE, 'Write Test', 'success', 'Write successful', true);

    // Test 2: Read from Firestore (quick test using getDoc)
    const testDocRef = doc(db, 'healthCheck', testDoc.id);
    addTestResult(healthCheckType.READ, 'Read Test', 'testing', 'Reading test document...', true);
    const docSnapshot = await Promise.race([
      getDoc(testDocRef),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Read operation timed out')), 10000)),
    ]);
    if (docSnapshot.exists()) {
      addTestResult(healthCheckType.READ, 'Read Test', 'success', 'Read successful', true);
    } else {
      addTestResult(healthCheckType.READ, 'Read Test', 'error', 'Document not found', false);
      throw new Error('Unable to read document');
    }

    // Cleanup
    addTestResult(healthCheckType.DELETE, 'Delete Test', 'testing', 'Deleting test document...', true);
    await Promise.race([
      deleteDoc(testDocRef).catch(() => {
        addTestResult(healthCheckType.DELETE, 'Delete Test', 'error', 'Delete failed', false);
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Delete operation timed out')), 10000)),
    ]);
    addTestResult(healthCheckType.DELETE, 'Delete Test', 'success', 'Deleted successful', true);

    return true;
  };

  const runConfigValidation = async (secret) => {
    setTesting(true);
    setTestResults([]);
    setError(null);

    try {
      // Initialize Firebase (with timeout)
      addTestResult(healthCheckType.CONFIG, 'Verifying Firebase Config', 'testing', 'Connecting to Firebase...');
      const initPromise = initFirebase(secret);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase initialization timed out')), 15000));
      const { db } = await Promise.race([initPromise, timeoutPromise]);
      addTestResult(healthCheckType.CONFIG, 'Verified Firebase Config', 'success', 'Firebase connected', true);

      setDb(db);
      await runConnectionTest(db);
      // Launch immediately after success
      updatePath('/daily-task');
    } catch (err) {
      // Cleanup session
      sessionStorage.removeItem('scrt');
      if (DEBUG) console.error('Configuration check failed:', err);

      let errorMessage = 'Error: ';

      if (err.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check Firestore security rules.';
        setErrorQuickFix(
          "Update rules to allow read/write:- \nrules_version = '2'; \nservice cloud.firestore { \n\tmatch /databases/{database}/documents {\n\t\t match /{document=**} {\n\t\t\t allow read, write: if true;\n\t\t}\n\t}\n}\n",
        );
      } else if (err.code === 'unavailable') {
        errorMessage = 'Firestore unavailable.';
        setErrorQuickFix(
          'Please ensure: \n1) Firestore Database is enabled in Firebase Console\n2) Your network connection is working\n3) Firebase configuration is correct',
        );
      } else if (err.code === 'invalid-argument' || err.message?.includes('API key')) {
        errorMessage = 'Invalid Firebase configuration.';
        setErrorQuickFix('Please verify: \n1) API Key is correct\n2) Project ID matches your Firebase project, \n3) App ID is correct');
      } else {
        errorMessage += err.message || 'Please check your Firebase configuration and try again.';
      }
      setError(errorMessage);
    } finally {
      setTesting(false);
    }
  };

  const handleSecretSubmit = (e) => {
    e.preventDefault();
    const secret = inputSecretRef.current.value;
    sessionStorage.setItem('scrt', secret);
    runConfigValidation(secret);
  };

  useEffect(() => {
    addTestResult(healthCheckType.CONFIG, 'Verify Firebase Config', '', 'Check Firebase Config');
    addTestResult(healthCheckType.WRITE, 'Write Test', '', 'Check firebase write');
    addTestResult(healthCheckType.READ, 'Read Test', '', 'Check firebase read', true);
    addTestResult(healthCheckType.DELETE, 'Delete Test', '', 'Check firebase delete', true);
    const secret = sessionStorage.getItem('scrt');
    if (secret) {
      runConfigValidation(secret);
    }
  }, []);

  return (
    <div className="container">
      <form onSubmit={handleSecretSubmit} className="secret-input">
        <input type="text" placeholder="Enter Secret" ref={inputSecretRef} autoFocus={true} />
        <button type="submit">Health Check</button>
      </form>

      {error && (
        <div className="error-message">
          <h3>Health Check Failed ❌</h3>
          <p>{error}</p>
          {errorQuickFix && <div id="quick-fix">{errorQuickFix}</div>}
        </div>
      )}

      {(!testing || !error) && (
        <div className="test-progress">
          <h3>Checks</h3>
          <div className="test-results">
            {testResults.map((result, index) => (
              <div key={index} className={`test-result test-result-${result.status}`}>
                <span className="test-status">{STATUS[result.status]}</span>
                <div className="test-info">
                  <div className="test-name">{result.test}</div>
                  <div className="test-message">{result.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
