import { useState } from 'react';

import DailySummary from '../components/DailySummary';
import DateSection from '../components/DateSection';
import TaskSection from '../components/TaskSection';
import DatePicker from '../components/DatePicker';
import { getTodayDateString } from '../utils';

export default function DailyTaskPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());

  return (
    <div>
      <DateSection>
        <DatePicker label="Select Date:" date={selectedDate} setDate={setSelectedDate} />
      </DateSection>

      <TaskSection startDate={selectedDate} endDate={selectedDate} />
      <DailySummary selectedDate={selectedDate} />
    </div>
  );
}
