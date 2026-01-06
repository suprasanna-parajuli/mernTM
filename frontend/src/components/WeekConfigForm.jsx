import { useState, useEffect } from "react";
import { Clock, Plus, Trash2, Save, RefreshCw } from "lucide-react";
import axios from "axios";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const WeekConfigForm = ({ onSave, onLogout }) => {
  const [totalHours, setTotalHours] = useState(40);
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWeekConfig();
  }, []);

  async function fetchWeekConfig() {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("http://localhost:4000/api/week-config/gp", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.config) {
        setTotalHours(data.config.totalAvailableHours || 40);

        // Validate and clean time blocks
        const cleanBlocks = (data.config.freeTimeBlocks || []).map(block => ({
          day: block.day || "Monday",
          startTime: validateTimeString(block.startTime) || "09:00",
          endTime: validateTimeString(block.endTime) || "10:00"
        }));

        setTimeBlocks(cleanBlocks);
      }
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) onLogout?.();
    } finally {
      setLoading(false);
    }
  }

  // Helper function to validate time strings
  function validateTimeString(time) {
    if (!time) return null;
    // Check if it's a valid time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (timeRegex.test(time)) {
      return time;
    }
    return null;
  }

  function addTimeBlock() {
    setTimeBlocks([...timeBlocks, { day: "Monday", startTime: "09:00", endTime: "10:00" }]);
  }

  function removeTimeBlock(index) {
    const updated = timeBlocks.filter((_, i) => i !== index);
    setTimeBlocks(updated);
  }

  function clearAllBlocks() {
    setTimeBlocks([]);
  }

  function updateTimeBlock(index, field, value) {
    const updated = [...timeBlocks];
    updated[index][field] = value;
    setTimeBlocks(updated);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:4000/api/week-config/gp",
        {
          totalAvailableHours: totalHours,
          freeTimeBlocks: timeBlocks
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onSave?.();
    } catch (error) {
      console.error(error);
      setError("Failed to save configuration");
      if (error.response?.status === 401) onLogout?.();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full size-8 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Clock className="text-purple-500" />
        Weekly Availability
      </h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Total Available Hours per Week
        </label>
        <input
          type="number"
          min="0"
          max="168"
          value={totalHours}
          onChange={(e) => setTotalHours(Number(e.target.value))}
          className="w-full px-4 py-2 border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Free Time Blocks
          </label>
          <div className="flex gap-2">
            {timeBlocks.length > 0 && (
              <button
                onClick={clearAllBlocks}
                className="flex items-center gap-1 text-sm bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200"
              >
                <RefreshCw className="size-4" />
                Clear All
              </button>
            )}
            <button
              onClick={addTimeBlock}
              className="flex items-center gap-1 text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200"
            >
              <Plus className="size-4" />
              Add Block
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {timeBlocks.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No time blocks added yet. Click "Add Block" to get started.
            </p>
          ) : (
            timeBlocks.map((block, index) => (
              <div key={index} className="flex gap-2 items-center bg-purple-50/50 p-3 rounded-lg">
                <select
                  value={block.day}
                  onChange={(e) => updateTimeBlock(index, "day", e.target.value)}
                  className="px-3 py-2 border border-purple-100 rounded-lg text-sm flex-1"
                >
                  {DAYS.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>

                <input
                  type="time"
                  value={block.startTime}
                  onChange={(e) => updateTimeBlock(index, "startTime", e.target.value)}
                  className="px-3 py-2 border border-purple-100 rounded-lg text-sm w-32"
                />

                <span className="text-gray-500">to</span>

                <input
                  type="time"
                  value={block.endTime}
                  onChange={(e) => updateTimeBlock(index, "endTime", e.target.value)}
                  className="px-3 py-2 border border-purple-100 rounded-lg text-sm w-32"
                />

                <button
                  onClick={() => removeTimeBlock(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-md transition-all"
      >
        {saving ? (
          "Saving..."
        ) : (
          <>
            <Save className="size-4" />
            Save Configuration
          </>
        )}
      </button>
    </div>
  );
};

export default WeekConfigForm;
