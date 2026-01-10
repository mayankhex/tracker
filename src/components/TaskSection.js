import { useState } from 'react';
import AddTasks from './AddTasks';
import TaskList from './TaskList';

export default function TaskSection({ startDate, endDate }) {
  const [tasks, setTasks] = useState([]);

  return (
    <div className="tasks-section">
      <h2>Tasks ({tasks.length})</h2>

      <AddTasks tasks={tasks} setTasks={setTasks} startDate={startDate} endDate={endDate} />

      <TaskList tasks={tasks} setTasks={setTasks} startDate={startDate} endDate={endDate} />

      {tasks.length === 0 && <div id="empty-list">No tasks for this day. Add one above!</div>}
    </div>
  );
}
