import { useState, createContext, useContext, useEffect } from 'react';
import './App.css';

import HealthCheck from './pages/HealthCheckPage';
import DailyTaskPage from './pages/DailyTaskPage';
import AddBulkTasks from './pages/BulkTaskPage';
import FloatingError from './components/FloatingError';
import { REACT_APP_ENV, PAGES } from './config/constants';

export const AppContext = createContext(null);

export const useConfig = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useConfig must be used within a AppProvider');
  }
  return context;
};

export default function App() {
  const [db, setDb] = useState(null);
  const [error, setError] = useState(null);
  const [page, setPage] = useState('/');

  // updates URL without re-render
  const updatePath = (newPath) => {
    setPage(newPath);
    window.history.pushState({ path: newPath }, '', newPath);
  };

  useEffect(() => {
    console.log(page);
  }, [page]);

  return (
    <AppContext.Provider
      value={{
        updatePath,
        db,
        setDb,
        error,
        setError,
      }}
    >
      {/* Env Display */}
      {<div style={{ position: 'fixed' }}>{REACT_APP_ENV}</div>}

      {/* Error Display */}
      {error && <FloatingError />}

      {/* Page Content */}
      <div className="container">
        <h1>{PAGES[page]?.title || 'Title Not Found'}</h1>
        {((path) => {
          switch (path) {
            case '/daily-task':
              return <DailyTaskPage />;
            case '/bulk-task':
              return <AddBulkTasks />;
            default:
              return <HealthCheck />;
          }
        })(page)}
      </div>
    </AppContext.Provider>
  );
}
