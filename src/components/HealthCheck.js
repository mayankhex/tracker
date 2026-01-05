import { useEffect, useState, useRef } from 'react';
import { initFirebase } from '../config/firebase';
import { collection, addDoc, getDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import './HealthCheck.css';
import { REACT_APP_ENV } from '../config/firebase';
import { useConfig } from '../App';

const healthCheckType = {
  CONFIG: 'config',
  WRITE: 'write',
  READ: 'read',
  DELETE: 'delete'
}

export default function HealthCheck() {
  const { db, setDb, setShowHealthCheck } = useConfig();

  const inputSecretRef = useRef(null);
  const [error, setError] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [errorQuickFix, setErrorQuickFix] = useState(null);

  const addTestResult = (id, test, status, message) => {
    setTestResults(prev => {
      const index = prev.findIndex(result => result?.id == id);
      if(index != -1) {
        prev[index] = { id, test, status, message, timestamp: new Date() };
        return prev;
      } else {
        return [...prev, { id, test, status, message, timestamp: new Date() }]
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
        test: 'health-check'
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Write operation timed out')), 10000)
      )
    ]);
    addTestResult(healthCheckType.WRITE, 'Write Test', 'success', 'Write successful', true);

    // Test 2: Read from Firestore (quick test using getDoc)
    const testDocRef = doc(db, 'healthCheck', testDoc.id);
    addTestResult(healthCheckType.READ, 'Read Test', 'testing', 'Reading test document...', true);
    const docSnapshot = await Promise.race([
      getDoc(testDocRef),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Read operation timed out')), 10000)
      )
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
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Delete operation timed out')), 10000)
      )
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
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firebase initialization timed out')), 15000)
      );
      const { db } =  await Promise.race([initPromise, timeoutPromise]);
      addTestResult(healthCheckType.CONFIG, 'Verified Firebase Config', 'success', 'Firebase connected', true);

      setDb(db);
      await runConnectionTest(db);
      // Launch immediately after success
      setShowHealthCheck(false);
    } catch (err) {
      // Cleanup session
      sessionStorage.removeItem('scrt');
      console.error('Configuration check failed:', err);

      let errorMessage = 'Error: ';

      if (err.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check Firestore security rules.';
        setErrorQuickFix('Update rules to allow read/write:- \n' +
          'rules_version = \'2\'; \n' +
          'service cloud.firestore { \n' + 
          '\tmatch /databases/{database}/documents {\n' + 
          '\t\t match /{document=**} {\n' + 
          '\t\t\t allow read, write: if true;\n' + 
          '\t\t}\n' + 
          '\t}\n' + 
          '}\n');
      } else if (err.code === 'unavailable') {
        errorMessage = 'Firestore unavailable.';
        setErrorQuickFix('Please ensure: \n' +
          '1) Firestore Database is enabled in Firebase Console, \n' +
          '2) Your network connection is working, \n' +
          '3) Firebase configuration is correct.'
        );
      } else if (err.code === 'invalid-argument' || err.message?.includes('API key')) {
        errorMessage = 'Invalid Firebase configuration.';
        setErrorQuickFix('Please verify: \n' +
          '1) API Key is correct, \n' +
          '2) Project ID matches your Firebase project, \n' +
          '3) App ID is correct.'
        );
      } else {
        errorMessage += err.message || 'Please check your Firebase configuration and try again.';
      }
      console.log('Err: ', err);
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
  }

  useEffect(()=>{
    
  }, [db]);

  useEffect(()=> {
    addTestResult(healthCheckType.CONFIG, 'Verify Firebase Config', '', 'Check Firebase Config');
    addTestResult(healthCheckType.WRITE, 'Write Test', '', 'Check firebase write');
    addTestResult(healthCheckType.READ, 'Read Test', '', 'Check firebase read', true);
    addTestResult(healthCheckType.DELETE, 'Delete Test', '', 'Check firebase delete', true);
    const secret = sessionStorage.getItem('scrt');
    if(secret) {
      runConfigValidation(secret);
    }
  }, [])

  return (
    <div className="connection-test">
      <div className="container">
        <h1>Perform Health Check</h1>
        <form onSubmit={handleSecretSubmit} 
          className="secret-input"
        >
          <input
            type="text"
            placeholder="Enter Secret"
            ref={inputSecretRef}
            autoFocus={true}
          />
          <button type="submit">Health Check</button>
        </form>

        {error && (
          <div className="error-message">
            <h3>❌ Health Check Failed</h3>
            <p>{error}</p>
            <p className="error-help">
              <div style={{ whiteSpace: "pre-wrap", tabSize: 2 }}>{errorQuickFix}</div>
              See <strong>TROUBLESHOOTING.md</strong> for detailed solutions.
            </p>
          </div>
        )}

        {(!testing || !error) && (
          <div className="test-progress">
            <h3>Checks</h3>
            <div className="test-results">
              {testResults.map((result, index) => (
                <div key={index} className={`test-result test-result-${result.status}`}>
                  <span className="test-status">
                    {result.status === 'success' && '✅'}
                    {result.status === 'error' && '❌'}
                    {result.status === 'testing' && '⏳'}
                  </span>
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
    </div>
  );
}

