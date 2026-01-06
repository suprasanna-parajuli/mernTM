import { useState, useEffect } from "react";
import { Calendar, RefreshCw, Settings, Sparkles, Clock } from "lucide-react";
import axios from "axios";
import WeekConfigForm from "../components/WeekConfigForm";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_SLOTS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00"
];

const Schedule = ({ onLogout }) => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [error, setError] = useState(null);

  useEffect(function () {
    fetchSchedule();
  }, []);

  async function fetchSchedule() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("http://localhost:4000/api/schedule/gp", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSchedule(data.schedule || []);
    } catch (error) {
      console.error(error);
      setError("Failed to load schedule");
      if (error.response?.status === 401) onLogout?.();
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        "http://localhost:4000/api/schedule/generate/gp",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSchedule(data.schedule || []);
    } catch (error) {
      console.error("Schedule generation error:", error);
      console.error("Error response:", error.response?.data);
      const errorMsg = error.response?.data?.message || error.message || "Failed to generate schedule";
      setError(errorMsg);
      if (error.response?.status === 401) onLogout?.();
    } finally {
      setGenerating(false);
    }
  }

  // Helper to check if a block fits in a time slot
  function getBlockForDayAndTime(day, timeSlot) {
    for (let i = 0; i < schedule.length; i++) {
      const block = schedule[i];
      if (block.day === day && block.startTime === timeSlot) {
        return block;
      }
    }
    return null;
  }

  // Get subject colors
  const subjectColors = [
    "bg-blue-100 border-blue-400 text-blue-800",
    "bg-green-100 border-green-400 text-green-800",
    "bg-purple-100 border-purple-400 text-purple-800",
    "bg-orange-100 border-orange-400 text-orange-800",
    "bg-pink-100 border-pink-400 text-pink-800",
    "bg-indigo-100 border-indigo-400 text-indigo-800",
  ];

  function getSubjectColor(subjectName) {
    let hash = 0;
    for (let i = 0; i < subjectName.length; i++) {
      hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return subjectColors[Math.abs(hash) % subjectColors.length];
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full size-12 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (showConfig) {
    return (
      <div className="p-6 min-h-screen">
        <button
          onClick={function () {
            setShowConfig(false);
          }}
          className="mb-4 text-gray-600 hover:text-purple-600 flex items-center gap-2"
        >
          ← Back to Schedule
        </button>
        <WeekConfigForm
          onSave={function () {
            setShowConfig(false);
            fetchSchedule();
          }}
          onLogout={onLogout}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 min-h-screen bg-gray-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="text-purple-500" />
            Weekly Study Schedule
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {schedule.length} study blocks scheduled this week
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={function () {
              setShowConfig(true);
            }}
            className="flex items-center gap-2 px-4 py-2 border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50"
          >
            <Settings className="size-4" />
            Settings
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-md disabled:opacity-50"
          >
            {generating ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Generate Schedule
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">
          {error}
        </div>
      )}

      {schedule.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="size-8 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No schedule yet
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Set your weekly availability and generate your personalized study schedule
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={function () {
                  setShowConfig(true);
                }}
                className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium"
              >
                Set Availability
              </button>
              <button
                onClick={handleGenerate}
                className="px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white rounded-lg text-sm font-medium"
              >
                Generate Schedule
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Timetable Header */}
          <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white p-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Clock className="size-5" />
              Your Study Timetable
            </h2>
            <p className="text-sm text-purple-100 mt-1">
              Scroll horizontally on mobile →
            </p>
          </div>

          {/* Timetable Grid - Compact */}
          <div className="overflow-auto max-h-[600px]">
            <table className="w-full border-collapse">
              <thead className="sticky top-0">
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-gray-700 text-xs sticky left-0 bg-gray-50 z-20">
                    Time
                  </th>
                  {DAYS.map(function (day) {
                    return (
                      <th
                        key={day}
                        className="border border-gray-300 px-1 py-2 text-center font-semibold text-gray-700 text-xs"
                      >
                        {day.substring(0, 3)}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map(function (timeSlot) {
                  return (
                    <tr key={timeSlot} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-2 py-1.5 font-medium text-gray-600 text-xs sticky left-0 bg-white z-10">
                        {timeSlot}
                      </td>
                      {DAYS.map(function (day) {
                        const block = getBlockForDayAndTime(day, timeSlot);

                        if (block) {
                          const colorClass = getSubjectColor(block.subject?.name || "");
                          return (
                            <td
                              key={day}
                              className={`border border-gray-300 px-1.5 py-1 ${colorClass} border-l-2`}
                            >
                              <div className="font-semibold text-xs">
                                {block.subject?.name || "Subject"}
                              </div>
                              <div className="text-[10px] mt-0.5 opacity-75">
                                {block.startTime}-{block.endTime}
                              </div>
                            </td>
                          );
                        } else {
                          return (
                            <td
                              key={day}
                              className="border border-gray-300 px-1 py-1.5 bg-white"
                            >
                              <div className="text-gray-300 text-center text-xs">-</div>
                            </td>
                          );
                        }
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <p className="text-xs text-gray-600">
              <span className="font-semibold">Tip:</span> Each colored block represents a study session.
              Click "Generate Schedule" to update based on your current subjects and availability.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
