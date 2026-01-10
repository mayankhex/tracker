import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { REACT_APP_ENV } from '../config/constants';
import { getTodayDateString } from '../utils';
import { useConfig } from '../App';

export default function DailySummary({ selectedDate }) {
  const { db, setError } = useConfig();

  const [enable, setEnable] = useState(false);
  const [dailySummary, setDailySummary] = useState('');

  // Save daily summary
  const saveSummary = async () => {
    setError(null);
    try {
      const summaryDocRef = doc(db, 'env', REACT_APP_ENV, 'dailySummaries', selectedDate);
      await setDoc(
        summaryDocRef,
        {
          date: selectedDate,
          summary: dailySummary.trim(),
          updatedAt: getTodayDateString(),
        },
        { merge: true },
      );
      setEnable(false);
    } catch (err) {
      setError(err.message);
      console.error('Error saving summary:', err);
    }
  };

  // Load summary for selected date
  const loadSummary = async () => {
    if (!db) {
      setError('Firebase not initialized. Please configure first.');
      return;
    }

    setError(null);

    try {
      // Load summary for selected date
      const summaryDocRef = doc(db, 'env', REACT_APP_ENV, 'dailySummaries', selectedDate);
      const summaryDoc = await getDoc(summaryDocRef);
      if (summaryDoc.exists()) {
        setDailySummary(summaryDoc.data().summary || '');
      } else {
        setDailySummary('');
      }
    } catch (err) {
      // Provide specific error messages based on error code
      console.error('Firestore Error:', {
        code: err.code,
        message: err.message,
        stack: err.stack,
      });
    }
  };

  const handleSummaryUpdate = (e) => {
    setDailySummary(e.target.value);
    setEnable(true);
  };

  useEffect(() => {
    loadSummary();
  }, [selectedDate]);

  return (
    <>
      <h2>Daily Summary</h2>
      <div className="summary-section">
        <textarea
          value={dailySummary}
          onChange={handleSummaryUpdate}
          placeholder="Write a summary of your day..."
          className="summary-textarea"
          rows={dailySummary.split('\n').length}
        />
        <button onClick={saveSummary} className="btn btn-primary" disabled={!enable}>
          Save Summary
        </button>
      </div>
    </>
  );
}
