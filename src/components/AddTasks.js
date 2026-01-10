import { useState } from 'react';
import { REACT_APP_ENV } from '../config/constants';
import { useConfig } from '../App';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { executeCallbackForDateRange } from '../utils';

export default function AddTasks({ tasks, setTasks, startDate, endDate }) {
  const { db, setError } = useConfig();

  const [taskInput, setTaskInput] = useState('');
  const [addingTask, setAddingTask] = useState(false);

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

    try {
      const addTaskDocs = [];
      const bulkId = Date.now();
      const tasksCollection = collection(db, 'env', REACT_APP_ENV, 'tasks');
      await executeCallbackForDateRange(startDate, endDate, async (date) => {
        const newTask = {
          text: taskText,
          date: date,
          completed: false,
          bulkId: `bulkId-${bulkId}`,
          createdAt: Timestamp.now(),
        };
        await addDoc(tasksCollection, newTask)
          .then((doc) => (newTask.id = doc.id))
          .then(() => setTasks([...tasks, newTask]));
      });
    } catch (err) {
      console.error('Firestore Error (addTask):', {
        code: err.code,
        message: err.message,
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

  return (
    <div className="input-section">
      <input
        type="text"
        value={taskInput}
        onChange={(e) => setTaskInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && addTask()}
        placeholder="Add a new task..."
        className="item-input"
      />
      <button onClick={addTask} id="btn" className="btn btn-primary" disabled={!taskInput.trim() || addingTask}>
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
  );
}
