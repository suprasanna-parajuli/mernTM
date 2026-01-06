import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const TimerContext = createContext();

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useTimer must be used within TimerProvider");
  }
  return context;
}

export function TimerProvider({ children, onLogout }) {
  const [isStudying, setIsStudying] = useState(false);
  const [materialId, setMaterialId] = useState(null);
  const [materialName, setMaterialName] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Load timer from localStorage on mount
  useEffect(() => {
    const savedTimer = localStorage.getItem("activeTimer");
    if (savedTimer) {
      const timer = JSON.parse(savedTimer);
      setIsStudying(true);
      setMaterialId(timer.materialId);
      setMaterialName(timer.materialName);
      setStartTime(timer.startTime);
    }
  }, []);

  // Update elapsed time every second
  useEffect(() => {
    if (!isStudying || !startTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isStudying, startTime]);

  function startTimer(id, name) {
    const now = Date.now();
    const timerData = {
      materialId: id,
      materialName: name,
      startTime: now
    };

    localStorage.setItem("activeTimer", JSON.stringify(timerData));
    setIsStudying(true);
    setMaterialId(id);
    setMaterialName(name);
    setStartTime(now);
    setElapsedSeconds(0);
  }

  async function stopTimer() {
    if (!materialId || !startTime) return;

    const timeSpentMinutes = Math.floor((Date.now() - startTime) / 60000);

    if (timeSpentMinutes < 1) {
      alert("Study for at least 1 minute to record a session");
      clearTimer();
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:4000/api/materials/${materialId}/timer/stop/gp`,
        { timeSpent: timeSpentMinutes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Trigger custom event to refresh streak display
      window.dispatchEvent(new Event("streakUpdated"));

      clearTimer();
      return true;
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        onLogout?.();
      }
      return false;
    }
  }

  function clearTimer() {
    localStorage.removeItem("activeTimer");
    setIsStudying(false);
    setMaterialId(null);
    setMaterialName("");
    setStartTime(null);
    setElapsedSeconds(0);
  }

  const value = {
    isStudying,
    materialId,
    materialName,
    elapsedSeconds,
    startTimer,
    stopTimer,
    clearTimer
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
}
