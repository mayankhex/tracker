import { useEffect } from 'react';
import { getTodayDateString } from '../utils';
import './DatePicker.css';

export default function DatePicker({ label, date, setDate, max, min }) {
  return (
    <div id="date-picker">
      <label id="date-label">{label}</label>
      <input
        id="date-input"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        onSelectCapture={() => console.log('up')}
        max={max || getTodayDateString()}
        min={min || getTodayDateString(new Date('2026'))}
      />
    </div>
  );
}
