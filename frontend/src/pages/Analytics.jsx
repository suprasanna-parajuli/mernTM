import { useState, useEffect } from "react";
import { TrendingUp, BookOpen, Clock, Target, BarChart3 } from "lucide-react";
import axios from "axios";

const Analytics = ({ onLogout }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("http://localhost:4000/api/progress/analytics/gp", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAnalytics(data.analytics);
    } catch (error) {
      console.error(error);
      setError("Failed to load analytics");
      if (error.response?.status === 401) onLogout?.();
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full size-12 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
          {error}
        </div>
      </div>
    );
  }

  const totalHours = Math.floor(analytics.totalStudyTime / 60);
  const totalMinutes = analytics.totalStudyTime % 60;

  const maxWeeklyMinutes = Math.max(...analytics.weeklyChart.map(d => d.minutes), 1);

  return (
    <div className="p-4 md:p-6 min-h-screen bg-gradient-to-br from-purple-50 via-white to-fuchsia-50">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center gap-3">
          <BarChart3 className="text-purple-500" size={36} />
          Study Analytics
        </h1>
        <p className="text-gray-600 mt-2">Track your progress and study patterns</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <BookOpen className="text-purple-600" size={24} />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-600">{analytics.totalSubjects}</p>
              <p className="text-sm text-gray-500 mt-1">Subjects</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-fuchsia-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-fuchsia-100 rounded-xl">
              <Target className="text-fuchsia-600" size={24} />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-fuchsia-600">{analytics.totalMaterials}</p>
              <p className="text-sm text-gray-500 mt-1">Materials</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100 hover:shadow-md transition-all col-span-1 md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Clock className="text-blue-600" size={24} />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">
                {totalHours}h {totalMinutes}m
              </p>
              <p className="text-sm text-gray-500 mt-1">Total Study Time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <TrendingUp className="text-purple-500" />
          Weekly Study Time
        </h2>
        <div className="flex items-end justify-between gap-2 h-64">
          {analytics.weeklyChart.map((day) => {
            const height = (day.minutes / maxWeeklyMinutes) * 100;
            const hours = Math.floor(day.minutes / 60);
            const mins = day.minutes % 60;

            return (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center" style={{ height: '200px' }}>
                  <div
                    className="w-full bg-gradient-to-t from-purple-500 to-fuchsia-400 rounded-t-lg transition-all hover:opacity-80 relative group"
                    style={{ height: `${height}%`, minHeight: day.minutes > 0 ? '20px' : '0' }}
                  >
                    {day.minutes > 0 && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {hours}h {mins}m
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600">{day.day}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subject Progress */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Subject Progress</h2>

        {analytics.subjectProgress.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No subjects added yet</p>
        ) : (
          <div className="space-y-4">
            {analytics.subjectProgress.map((subject) => {
              const hoursSpent = Math.floor(subject.timeSpent / 60);
              const minutesSpent = subject.timeSpent % 60;
              const targetHours = Math.floor(subject.targetTime / 60);

              return (
                <div
                  key={subject.subjectId}
                  className="p-5 rounded-xl bg-gradient-to-r from-purple-50 to-fuchsia-50 border border-purple-100 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800">{subject.subject}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {subject.completedMaterials} / {subject.totalMaterials} materials completed
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {subject.progress}%
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all"
                        style={{ width: `${subject.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="size-4 text-purple-500" />
                      <span>
                        {hoursSpent}h {minutesSpent}m / {targetHours}h
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="size-4 text-fuchsia-500" />
                      <span>Difficulty: {subject.difficulty}/5</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
