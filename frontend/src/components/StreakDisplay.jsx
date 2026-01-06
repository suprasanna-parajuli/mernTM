import { useState, useEffect } from "react";
import { Flame, Trophy, Calendar } from "lucide-react";
import axios from "axios";

const StreakDisplay = ({ onLogout }) => {
  const [streak, setStreak] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalStudyDays: 0,
    lastStudyDate: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreak();

    // Listen for streak updates from timer stop
    const handleStreakUpdate = () => {
      fetchStreak();
    };

    window.addEventListener("streakUpdated", handleStreakUpdate);

    return () => {
      window.removeEventListener("streakUpdated", handleStreakUpdate);
    };
  }, []);

  const fetchStreak = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No auth token found");

      const { data } = await axios.get("http://localhost:4000/api/streak/gp", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setStreak(data.streak);
      }
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        onLogout?.();
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-100 to-red-100 rounded-full">
        <div className="size-4 rounded-full bg-orange-300 animate-pulse" />
        <span className="text-xs font-medium text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-100 to-red-100 rounded-full border border-orange-200 hover:shadow-md transition-all duration-300 group cursor-pointer">
      <Flame
        className={`size-4 ${streak.currentStreak > 0 ? "text-orange-600 animate-pulse" : "text-gray-400"}`}
      />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold text-orange-700">
            {streak.currentStreak}
          </span>
          <span className="text-xs text-gray-600">day{streak.currentStreak !== 1 ? "s" : ""}</span>
        </div>

        {streak.longestStreak > 0 && (
          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
            <Trophy className="size-3 text-yellow-600" />
            <span className="text-xs font-semibold text-gray-700">
              {streak.longestStreak}
            </span>
          </div>
        )}

        {streak.totalStudyDays > 0 && (
          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
            <Calendar className="size-3 text-purple-600" />
            <span className="text-xs font-semibold text-gray-700">
              {streak.totalStudyDays}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreakDisplay;
