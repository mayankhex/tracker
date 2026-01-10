import { getTodayDateString } from '../utils';
import './DatePicker.css';

export default function DatePicker({ label, date, setDate }) {
  return (
    <div id="date-picker">
      <label id="date-label">{label}</label>
      <input id="date-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} max={getTodayDateString()} />
    </div>
  );
}
