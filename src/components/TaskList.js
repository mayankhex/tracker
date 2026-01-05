import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { REACT_APP_ENV } from '../config/firebase';
import { useConfig } from '../App';

export default function TaskList({ startDate, endDate }) {
  const { db, setDb, setError, setShowHealthCheck } = useConfig();

  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load tasks for selected date
  const loadTasks = async () => {
    if (!db) {
      setError('Firebase not initialized. Please configure first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tasksCollection = collection(db, 'env', REACT_APP_ENV, 'tasks');
      const tasksQuery = query(
        tasksCollection,
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date') // Ensures results are returned in chronological order
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
      setError(err.message);
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
      date: startDate,
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
      const tasksCollection = collection(db, 'env', REACT_APP_ENV, 'tasks');
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
      const taskDoc = doc(db, 'env', REACT_APP_ENV, 'tasks', id);
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
      const taskDoc = doc(db, 'env', REACT_APP_ENV, 'tasks', id);
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
    if (db) {
      loadTasks();
    }
  }, [startDate, endDate, db]);

  return (<>
    <div className="tasks-section">
      <h2>Tasks ({tasks.length})</h2>
      {/* Add Task Section */}
      <div className="input-section">
        <input
          type="text"
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTask()}
          placeholder="Add a new task..."
          className="item-input"
        />
        <button
          onClick={addTask}
          id='btn'
          className="btn btn-primary"
          disabled={!taskInput.trim() || addingTask}
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
    </div></>
  );
}