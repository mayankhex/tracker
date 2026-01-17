import { useState } from 'react';
import AddTasks from '../components/AddTasks';
import TaskList from '../components/TaskList';
import DatePicker from '../components/DatePicker';
import { getTodayDateString } from '../utils';
import DateSection from '../components/DateSection';

export default function BulkTask() {
  const [tasks, setTasks] = useState([]);
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [endDate, setEndDate] = useState(getTodayDateString());

  return (
    <div className="tasks-section">
      <h2>Bulk Tasks</h2>
      <DateSection>
        <DatePicker label="Start Date" date={startDate} setDate={setStartDate} max={endDate} />
        <DatePicker
          label="End Date"
          date={endDate}
          setDate={setEndDate}
          min={startDate}
          max={getTodayDateString(new Date(new Date().setFullYear(new Date().getFullYear() + 1)))}
        />
      </DateSection>
      <AddTasks tasks={tasks} setTasks={setTasks} startDate={startDate} endDate={endDate} />

      <TaskList bulk={true} startDate={startDate} endDate={endDate} tasks={tasks} setTasks={setTasks} />

      {tasks.length === 0 && <div id="empty-list">No tasks for this day. Add one above!</div>}
    </div>
  );
}
