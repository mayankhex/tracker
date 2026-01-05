import { useState, createContext, useContext } from 'react';
import './App.css';
import HealthCheck from './components/HealthCheck';

import { getTodayDateString } from './utils';
import DailySummary from './components/DailySummary';
import DatePicker from './components/DatePicker';
import TaskList from './components/TaskList';

export const AppContext = createContext(null);

export const useConfig = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useConfig must be used within a AppProvider");
  }
  return context;
};

export default function App() {
  const [db, setDb] = useState(null);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [showHealthCheck, setShowHealthCheck] = useState(true);

  return (
    <AppContext.Provider value={{
      db, setDb,
      error, setError,
      selectedDate, setSelectedDate,
      showHealthCheck, setShowHealthCheck
    }}>
    {<div style={{position: 'fixed'}}>{process.env.REACT_APP_ENV}</div>}
    {error && (
      <div className="floating-error">
        {error}
        <button onClick={() => setError(null)} className="cross-btn">❌</button>
      </div>
    )}
    {// Show health check screen first
    (showHealthCheck) ? (
      <HealthCheck />
    ) : (
      <div className="App">
        <div className="container">
          <h1>Daily Task Tracker</h1>
          {/* Date Selector */}
          <div className="date-section">
            <DatePicker label="Select Date:" />
          </div>

          {/* Tasks Section */}
          <TaskList startDate={selectedDate} endDate={selectedDate}/>

          {/* Daily Summary Section */}
          <DailySummary />
        </div>
      </div>
    )
    }</AppContext.Provider>
  )
}
