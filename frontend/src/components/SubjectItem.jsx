import { useState } from "react";
import { MoreVertical, Calendar, Clock, TrendingUp, Target, Edit2, Trash2 } from "lucide-react";
import axios from "axios";
import { format, differenceInDays } from "date-fns";
import SubjectModal from "./SubjectModal";

const API_BASE = "http://localhost:4000/api/subjects";

const difficultyColors = {
  1: "bg-green-100 text-green-700",
  2: "bg-blue-100 text-blue-700",
  3: "bg-purple-100 text-purple-700",
  4: "bg-orange-100 text-orange-700",
  5: "bg-red-100 text-red-700",
};

const priorityBorderColors = {
  low: "border-green-500",
  medium: "border-purple-500",
  high: "border-fuchsia-500",
};

const SubjectItem = ({ subject, onRefresh, onLogout }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No auth token found");
    return { Authorization: `Bearer ${token}` };
  };

  // Calculate days until exam
  const daysUntilExam = differenceInDays(
    new Date(subject.examDate),
    new Date()
  );

  // Determine urgency level
  const getUrgencyLevel = () => {
    if (daysUntilExam <= 7) return "high";
    if (daysUntilExam <= 30) return "medium";
    return "low";
  };

  const urgencyLevel = getUrgencyLevel();
  const borderColor = priorityBorderColors[urgencyLevel];

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${subject.name}?`)) {
      return;
    }
    try {
      await axios.delete(`${API_BASE}/${subject._id}/gp`, {
        headers: getAuthHeaders(),
      });
      onRefresh?.();
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) onLogout?.();
    }
  };

  const handleAction = (action) => {
    setShowMenu(false);
    if (action === "edit") setShowEditModal(true);
    if (action === "delete") handleDelete();
  };

  // Priority score as percentage
  const priorityPercentage = Math.round(subject.priorityScore * 100);

  return (
    <>
      <div
        className={`group p-4 sm:p-5 rounded-xl shadow-sm bg-white border-l-4 hover:shadow-md transition-all duration-300 border border-purple-100 ${borderColor}`}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left side - Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-medium text-gray-800 truncate">
                {subject.name}
              </h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${difficultyColors[subject.difficulty]}`}
              >
                Level {subject.difficulty}
              </span>
            </div>

            {/* Tags */}
            {subject.tags && subject.tags.length > 0 && (
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                {subject.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Priority Score Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 font-medium">
                  Priority Score
                </span>
                <span className="text-xs font-semibold text-purple-600">
                  {priorityPercentage}%
                </span>
              </div>
              <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-600 transition-all duration-300"
                  style={{ width: `${priorityPercentage}%` }}
                />
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 text-gray-600">
                <Calendar className="size-3.5 text-purple-500" />
                <span className="font-medium">
                  {daysUntilExam > 0
                    ? `${daysUntilExam} days`
                    : daysUntilExam === 0
                      ? "Today!"
                      : "Passed"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <Target className="size-3.5 text-purple-500" />
                <span>{subject.targetHours}h/week</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <TrendingUp className="size-3.5 text-purple-500" />
                <span>Difficulty: {subject.difficulty}/5</span>
              </div>
            </div>
          </div>

          {/* Right side - Actions and dates */}
          <div className="flex flex-col items-end gap-2 sm:gap-3">
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 sm:p-1.5 hover:bg-purple-100 rounded-lg text-gray-500 hover:text-purple-700 transition-colors duration-200"
              >
                <MoreVertical className="size-4 sm:size-5" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-1 w-40 sm:w-48 bg-white border border-purple-100 rounded-xl shadow-lg z-10 overflow-hidden animate-fadeIn">
                  <button
                    onClick={() => handleAction("edit")}
                    className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm hover:bg-purple-50 flex items-center gap-2 transition-colors duration-200"
                  >
                    <Edit2 size={14} className="text-purple-600" />
                    Edit Subject
                  </button>
                  <button
                    onClick={() => handleAction("delete")}
                    className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm hover:bg-purple-50 flex items-center gap-2 transition-colors duration-200"
                  >
                    <Trash2 size={14} className="text-red-600" />
                    Delete Subject
                  </button>
                </div>
              )}
            </div>
            <div>
              <div
                className={`flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${
                  daysUntilExam <= 7 ? "text-red-600" : "text-gray-500"
                }`}
              >
                <Calendar className="size-3.5" />
                {format(new Date(subject.examDate), "MMM dd, yyyy")}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap">
                <Clock className="size-3 sm:size-3.5" />
                {subject.createdAt
                  ? `Added ${format(new Date(subject.createdAt), "MMM dd")}`
                  : "No date"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SubjectModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          onRefresh?.();
        }}
        subjectToEdit={subject}
        onSave={() => {
          setShowEditModal(false);
          onRefresh?.();
        }}
        onLogout={onLogout}
      />
    </>
  );
};

export default SubjectItem;
