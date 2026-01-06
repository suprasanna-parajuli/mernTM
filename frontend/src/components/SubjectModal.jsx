import { useEffect, useState } from "react";
import {
  Save,
  PlusCircle,
  X,
  BookOpen,
  TrendingUp,
  Calendar,
  Target,
} from "lucide-react";

const API_BASE = "http://localhost:4000/api/subjects";

const difficultyColors = {
  1: "bg-green-100 text-green-700 border-green-200",
  2: "bg-blue-100 text-blue-700 border-blue-200",
  3: "bg-purple-100 text-purple-700 border-purple-200",
  4: "bg-orange-100 text-orange-700 border-orange-200",
  5: "bg-red-100 text-red-700 border-red-200",
};

const SubjectModal = ({ isOpen, onClose, subjectToEdit, onSave, onLogout }) => {
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState(3);
  const [examDate, setExamDate] = useState("");
  const [targetHours, setTargetHours] = useState(0);
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  // Load subject data when editing
  useEffect(() => {
    if (!isOpen) return;
    if (subjectToEdit) {
      setName(subjectToEdit.name || "");
      setDifficulty(subjectToEdit.difficulty || 3);
      setExamDate(subjectToEdit.examDate?.split("T")[0] || "");
      setTargetHours(subjectToEdit.targetHours || 0);
      setTags(subjectToEdit.tags ? subjectToEdit.tags.join(", ") : "");
    } else {
      // Reset for new subject
      setName("");
      setDifficulty(3);
      setExamDate("");
      setTargetHours(0);
      setTags("");
    }
    setError(null);
  }, [isOpen, subjectToEdit]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (examDate < today) {
      setError("Exam date cannot be in the past");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No auth token found");

      const isEdit = Boolean(subjectToEdit);
      const url = isEdit
        ? `${API_BASE}/${subjectToEdit._id}/gp`
        : `${API_BASE}/gp`;

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          difficulty,
          examDate,
          targetHours,
          tags: tags.split(",").map((tag) => tag.trim()).filter((tag) => tag),
        }),
      });

      if (!response.ok) {
        if (response.status === 401) return onLogout?.();
        const err = await response.json();
        throw new Error(err.message || "Failed to save subject");
      }

      const saved = await response.json();
      onSave?.(saved);
      onClose();
    } catch (error) {
      console.error(error);
      setError(error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex z-50 items-center justify-center p-4">
      <div className="bg-white border-purple-100 rounded-xl max-w-md w-full shadow-lg relative p-6 animate-fadeIn">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-500 items-center flex gap-2">
            {subjectToEdit ? (
              <Save className="text-purple-500 size-5" />
            ) : (
              <PlusCircle className="text-purple-500 size-5" />
            )}
            {subjectToEdit ? "Edit Subject" : "Create New Subject"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-100 rounded-lg transition-colors text-gray-500 hover:text-purple-700"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {/* Subject Name */}
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
              <BookOpen className="size-4 text-purple-500" />
              Subject Name
            </label>
            <div className="flex items-center border border-purple-100 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500 transition-all duration-200">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full focus:outline-none text-sm"
                placeholder="e.g., Physics, Mathematics"
              />
            </div>
          </div>

          {/* Difficulty and Exam Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                <TrendingUp className="size-4 text-purple-500" />
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className={`w-full px-4 py-2.5 border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm ${difficultyColors[difficulty]}`}
              >
                <option value={1}>1 - Easy</option>
                <option value={2}>2 - Moderate</option>
                <option value={3}>3 - Medium</option>
                <option value={4}>4 - Hard</option>
                <option value={5}>5 - Very Hard</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                <Calendar className="size-4 text-purple-500" />
                Exam Date
              </label>
              <input
                type="date"
                required
                min={today}
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              />
            </div>
          </div>

          {/* Target Hours */}
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
              <Target className="size-4 text-purple-500" />
              Weekly Target Hours
            </label>
            <div className="flex items-center border border-purple-100 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500 transition-all duration-200">
              <input
                type="number"
                min="0"
                max="168"
                value={targetHours}
                onChange={(e) => setTargetHours(Number(e.target.value))}
                className="w-full focus:outline-none text-sm"
                placeholder="Hours per week"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              How many hours per week do you want to dedicate to this subject?
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
              <BookOpen className="size-4 text-purple-500" />
              Tags (organize your way)
            </label>
            <div className="flex items-center border border-purple-100 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500 transition-all duration-200">
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full focus:outline-none text-sm"
                placeholder="e.g., 1st Semester, Midterm, Hard"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Separate tags with commas. Example: 1st Semester, Midterm
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-md transition-all duration-200"
          >
            {loading ? (
              "Saving..."
            ) : subjectToEdit ? (
              <>
                <Save className="size-4" /> Update Subject
              </>
            ) : (
              <>
                <PlusCircle className="size-4" /> Create Subject
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SubjectModal;
