import { useConfig } from "../App";
import { getTodayDateString } from "../utils";
import "./DatePicker.css";

export default function DatePicker({ label }) {
    const { selectedDate, setSelectedDate } = useConfig();
    return (
        <div id="date-picker">
            <label htmlFor="date-selector" className="date-label">{label}</label>
            <input
                type="date"
                id="date-selector"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-input"
                max={getTodayDateString()}
            />
        </div>
    );
}