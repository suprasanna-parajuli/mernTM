import { useState, useEffect } from "react";
import { Brain, TrendingUp, Clock, Sparkles, AlertCircle } from "lucide-react";
import axios from "axios";

function AIInsights({ onLogout }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch AI insights when page loads
  useEffect(function () {
    fetchInsights();
  }, []);

  async function fetchInsights() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const response = await axios.get("http://localhost:4000/api/ai/insights/gp", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setInsights(response.data.insights);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load AI insights");
      if (err.response?.status === 401) onLogout?.();
    } finally {
      setLoading(false);
    }
  }

  // Show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full size-12 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  // Show error message
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 max-w-md">
          <p className="font-medium mb-2">Error</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchInsights}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Not enough data yet
  if (!insights || !insights.ready) {
    return (
      <div className="p-4 md:p-6 min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="size-8 text-purple-500" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              AI Study Assistant
            </h1>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-8 text-center">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="size-10 text-purple-500 animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              AI is Learning...
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {insights?.message || "Complete at least 5 study sessions to unlock AI insights"}
            </p>
            <div className="max-w-md mx-auto">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500"
                  style={{ width: "20%" }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Keep studying to train your AI assistant!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // AI has enough data - show insights!
  const {
    totalSessions,
    bestTimeOfDay,
    bestTimeScore,
    morningSuccess,
    afternoonSuccess,
    eveningSuccess,
    recommendation
  } = insights;

  // Helper function to get color based on success rate
  function getSuccessColor(score) {
    if (score >= 75) return "bg-green-100 border-green-400 text-green-800";
    if (score >= 50) return "bg-yellow-100 border-yellow-400 text-yellow-800";
    return "bg-red-100 border-red-400 text-red-800";
  }

  function getSuccessBadge(score) {
    if (score >= 75) return "Excellent";
    if (score >= 50) return "Good";
    return "Needs Work";
  }

  return (
    <div className="p-4 md:p-6 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Brain className="size-8 text-purple-500" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                AI Study Assistant
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Powered by machine learning
              </p>
            </div>
          </div>
          <button
            onClick={fetchInsights}
            className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium"
          >
            <Sparkles className="size-4" />
            Refresh
          </button>
        </div>

        {/* Learning Progress */}
        <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">AI Training Status</h2>
              <p className="text-sm text-purple-100 mt-1">
                Analyzing your study patterns
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{totalSessions}</div>
              <div className="text-sm text-purple-100">Sessions</div>
            </div>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${Math.min(100, (totalSessions / 25) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-purple-100 mt-2">
            {totalSessions >= 25
              ? "🎉 Maximum accuracy achieved!"
              : `${25 - totalSessions} more sessions until maximum accuracy`
            }
          </p>
        </div>

        {/* Time of Day Success Rates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Morning Card */}
          <div className={`rounded-xl border-l-4 p-6 shadow-sm ${getSuccessColor(morningSuccess)}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Morning</h3>
              <Clock className="size-5" />
            </div>
            <div className="text-4xl font-bold mb-2">{morningSuccess}%</div>
            <div className="text-sm opacity-75 mb-3">Success Rate</div>
            <div className="inline-block px-3 py-1 rounded-full bg-white/50 text-xs font-medium">
              {getSuccessBadge(morningSuccess)}
            </div>
            {bestTimeOfDay === "Morning" && (
              <div className="mt-3 flex items-center gap-1 text-sm font-medium">
                <TrendingUp className="size-4" />
                Your Best Time!
              </div>
            )}
          </div>

          {/* Afternoon Card */}
          <div className={`rounded-xl border-l-4 p-6 shadow-sm ${getSuccessColor(afternoonSuccess)}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Afternoon</h3>
              <Clock className="size-5" />
            </div>
            <div className="text-4xl font-bold mb-2">{afternoonSuccess}%</div>
            <div className="text-sm opacity-75 mb-3">Success Rate</div>
            <div className="inline-block px-3 py-1 rounded-full bg-white/50 text-xs font-medium">
              {getSuccessBadge(afternoonSuccess)}
            </div>
            {bestTimeOfDay === "Afternoon" && (
              <div className="mt-3 flex items-center gap-1 text-sm font-medium">
                <TrendingUp className="size-4" />
                Your Best Time!
              </div>
            )}
          </div>

          {/* Evening Card */}
          <div className={`rounded-xl border-l-4 p-6 shadow-sm ${getSuccessColor(eveningSuccess)}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Evening</h3>
              <Clock className="size-5" />
            </div>
            <div className="text-4xl font-bold mb-2">{eveningSuccess}%</div>
            <div className="text-sm opacity-75 mb-3">Success Rate</div>
            <div className="inline-block px-3 py-1 rounded-full bg-white/50 text-xs font-medium">
              {getSuccessBadge(eveningSuccess)}
            </div>
            {bestTimeOfDay === "Evening" && (
              <div className="mt-3 flex items-center gap-1 text-sm font-medium">
                <TrendingUp className="size-4" />
                Your Best Time!
              </div>
            )}
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-6">
          <div className="flex items-start gap-4">
            <div className="size-12 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
              <Sparkles className="size-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-800 mb-2">
                AI Recommendation
              </h3>
              <p className="text-gray-700 mb-4">
                {recommendation}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="size-4 text-purple-600" />
                    <span className="font-semibold text-sm text-gray-800">
                      Peak Performance
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {bestTimeOfDay} sessions have {bestTimeScore}% success rate
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="size-4 text-blue-600" />
                    <span className="font-semibold text-sm text-gray-800">
                      Quick Tip
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Schedule difficult subjects during your peak hours
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">💡 How it works:</span> The AI analyzes your study sessions
            to find patterns in when you focus best. It learns from every session and continuously
            improves its recommendations. The more you study, the smarter it gets!
          </p>
        </div>
      </div>
    </div>
  );
}

export default AIInsights;
