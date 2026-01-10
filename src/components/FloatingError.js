import { useConfig } from '../App';
import './FloatingError.css';

export default function FloatingError() {
  const { error, setError } = useConfig();
  return (
    <div id="floating-error">
      {error}
      <button onClick={() => setError(null)} className="cross-btn">
        ❌
      </button>
    </div>
  );
}
