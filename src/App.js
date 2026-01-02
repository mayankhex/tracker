import { useState, useEffect } from 'react';
import './App.css';
import ConnectionTest from './components/HealthCheck';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';

import { getTodayDateString } from './utils';
import DailySummary from './components/DailySummary';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [error, setError] = useState(null);
  const [taskInput, setTaskInput] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayDateString(1));
  const [db, setDb] = useState(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [showConnectionTest, setShowConnectionTest] = useState(true);

  // Handle successful connection test
  const handleConnectionTestSuccess = (firestoreDb, firebaseConfig) => {
    setDb(firestoreDb);
    setIsConfigured(true);
    setShowConnectionTest(false);
    setError(null);
    // Load data once connection is confirmed
    if (firestoreDb) {
      loadTasks(firestoreDb);
    }
  };

  // Load tasks for selected date
  const loadTasks = async (firestoreDb = db) => {
    if (!firestoreDb) {
      setError('Firebase not initialized. Please configure first.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const tasksCollection = collection(firestoreDb, 'tasks');
      const tasksQuery = query(
        tasksCollection, 
        where('date', '==', selectedDate)
      );
      const tasksSnapshot = await getDocs(tasksQuery);
      
      const tasksList = [];
      tasksSnapshot.forEach((doc) => {
        tasksList.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        });
      });
      
      // Sort manually by createdAt
      tasksList.sort((a, b) => a.createdAt - b.createdAt);
      setTasks(tasksList);

    } catch (err) {
      // Provide specific error messages based on error code
      console.error('Firestore Error:', {
        code: err.code,
        message: err.message,
        stack: err.stack
      });
      
      let errorMessage = 'Error loading data. ';
      
      if (err.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your Firestore security rules. ' +
          'Make sure your rules allow read/write access. For development, use: ' +
          'rules_version = \'2\'; service cloud.firestore { match /databases/{database}/documents { match /{document=**} { allow read, write: if true; } } }';
      } else if (err.code === 'unavailable') {
        errorMessage = 'Firestore unavailable. This could be: 1) Network connection issue, 2) Firestore not enabled in Firebase Console, or 3) Incorrect Firebase configuration. ' +
          'Please check your Firebase Console → Firestore Database is enabled.';
      } else if (err.code === 'unauthenticated') {
        errorMessage = 'Authentication required. Please check your Firebase configuration.';
      } else if (err.code === 'invalid-argument') {
        errorMessage = 'Invalid Firebase configuration. Please verify your API key, Project ID, and App ID in .env file.';
      } else if (err.message?.includes('offline') || err.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else {
        errorMessage += err.message || 'Please check your Firebase configuration and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Add a new task
  const addTask = async () => {
    if (!taskInput.trim() || addingTask) return;

    if (!db) {
      setError('Firebase not initialized. Please configure first.');
      return;
    }

    const taskText = taskInput.trim();
    setTaskInput(''); // Clear input immediately for better UX
    setError(null);
    setAddingTask(true);
    
    const newTask = {
      text: taskText,
      date: selectedDate,
      completed: false,
      createdAt: Timestamp.now()
    };

    // Optimistic update - add to UI immediately
    const tempId = 'temp-' + Date.now();
    const optimisticTask = {
      id: tempId,
      ...newTask,
      createdAt: new Date()
    };
    setTasks(prevTasks => [...prevTasks, optimisticTask].sort((a, b) => a.createdAt - b.createdAt));

    try {
      const tasksCollection = collection(db, 'tasks');
      const docRef = await addDoc(tasksCollection, newTask);
      
      // Replace optimistic task with real one from server
      setTasks(prevTasks => {
        const filtered = prevTasks.filter(t => t.id !== tempId);
        const newTasks = [...filtered, {
          id: docRef.id,
          ...newTask,
          createdAt: newTask.createdAt.toDate()
        }];
        return newTasks.sort((a, b) => a.createdAt - b.createdAt);
      });
    } catch (err) {
      // Rollback optimistic update on error
      setTasks(prevTasks => prevTasks.filter(t => t.id !== tempId));
      
      console.error('Firestore Error (addTask):', {
        code: err.code,
        message: err.message
      });
      
      let errorMessage = 'Error adding task. ';
      
      if (err.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your Firestore security rules allow write access.';
      } else if (err.code === 'unavailable') {
        errorMessage = 'Firestore unavailable. Please check your Firebase configuration and ensure Firestore is enabled.';
      } else if (err.message?.includes('offline') || err.message?.includes('network')) {
        errorMessage = 'Network error. Task will be saved when connection is restored.';
      } else {
        errorMessage += err.message || 'Please check your Firebase configuration.';
      }
      
      setError(errorMessage);
      setTaskInput(taskText); // Restore input text on error
    } finally {
      setAddingTask(false);
    }
  };

  // Delete a task
  const deleteTask = async (id) => {
    if (!db) {
      setError('Firebase not initialized. Please configure first.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const taskDoc = doc(db, 'env', process.env.NODE_ENV, 'tasks', id);
      await deleteDoc(taskDoc);
      await loadTasks();
    } catch (err) {
      setError(err.message);
      console.error('Error deleting task:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle task completion
  const toggleTask = async (id, currentStatus) => {
    if (!db) {
      setError('Firebase not initialized. Please configure first.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const taskDoc = doc(db, 'env', process.env.NODE_ENV, 'tasks', id);
      await updateDoc(taskDoc, {
        completed: !currentStatus
      });
      await loadTasks();
    } catch (err) {
      setError(err.message);
      console.error('Error updating task:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reload data when date changes or when db becomes available
  useEffect(() => {
    if (db && isConfigured) {
      loadTasks();
    }
  }, [selectedDate, db, isConfigured]);

  // Show connection test screen first
  if (showConnectionTest) {
    return (
      <ConnectionTest 
        onSuccess={handleConnectionTestSuccess}
      />
    );
  }

  return (
    <div className="App">
      <div className="container">
        <h1>Daily Task Tracker</h1>
          {/* Date Selector */}
          <div className="date-section">
            <label htmlFor="date-selector" className="date-label">Start Date:</label>
            <input
              type="date"
              id="date-selector"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-input"
              max={getTodayDateString(1)}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* Add Task Section */}
          <div className="input-section">
            <input
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              placeholder="Add a new task..."
              className="item-input"
              disabled={!isConfigured}
            />
            <button 
              onClick={addTask}
              id='btn'
              className="btn btn-primary"
              disabled={!isConfigured || !taskInput.trim() || addingTask}
            >
              {addingTask ? (
                <span className="button-content">
                  <span className="spinner"></span>
                  Adding...
                </span>
              ) : (
                'Add Task'
              )}
            </button>
          </div>

          {/* Tasks Section */}
          <div className="tasks-section">
            <h2>Tasks ({tasks.length})</h2>
            
            <div className="tasks-list">
              {tasks.map((task) => (
                <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                  <div className="task-content">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id, task.completed)}
                      className="task-checkbox"
                      disabled={loading}
                    />
                    <span 
                      className="task-text"
                      onClick={() => toggleTask(task.id, task.completed)}
                    >
                      {task.text}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    id='btn'
                    className="btn btn-delete"
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
            
            {!loading && tasks.length === 0 && (
              <div className="empty-state">No tasks for this day. Add one above!</div>
            )}
          </div>

          {/* Daily Summary Section */}
          <DailySummary db={db} selectedDate={selectedDate} setError={setError}/>
      </div>
    </div>
  );
}

export default App;
