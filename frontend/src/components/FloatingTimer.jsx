import { Clock, X } from "lucide-react";
import { useTimer } from "../contexts/TimerContext";
import { useState } from "react";

const FloatingTimer = ({ onRefresh }) => {
  const { materialName, elapsedSeconds, stopTimer } = useTimer();
  const [stopping, setStopping] = useState(false);

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  async function handleStop() {
    setStopping(true);
    const success = await stopTimer();
    if (success) {
      onRefresh?.();
    }
    setStopping(false);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fadeIn">
      <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-2xl shadow-2xl p-4 min-w-[280px] border-2 border-white">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="size-4 animate-pulse" />
              <span className="text-xs font-medium opacity-90">Studying Now</span>
            </div>
            <p className="font-bold text-sm truncate">{materialName}</p>
          </div>
          <button
            onClick={handleStop}
            disabled={stopping}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold font-mono">
            {hours > 0 && `${String(hours).padStart(2, '0')}:`}
            {String(minutes).padStart(2, '0')}:
            {String(seconds).padStart(2, '0')}
          </div>
          <button
            onClick={handleStop}
            disabled={stopping}
            className="px-4 py-2 bg-white text-purple-600 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {stopping ? "Saving..." : "Stop"}
          </button>
        </div>

        <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white animate-pulse"
            style={{ width: `${(elapsedSeconds % 60) * (100/60)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default FloatingTimer;
