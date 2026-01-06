import { useState, useEffect, useMemo } from "react";
import { BookOpen, Plus, Filter, SortDesc, SortAsc, TrendingUp, Search } from "lucide-react";
import SubjectItem from "../components/SubjectItem";
import SubjectModal from "../components/SubjectModal";
import axios from "axios";

const API_BASE = "http://localhost:4000/api/subjects";

const Subjects = ({ onLogout }) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("priority");
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch subjects from backend
  async function fetchSubjects() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No auth token found");

      const { data } = await axios.get(`${API_BASE}/gp`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Make sure we get an array
      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data?.subjects)
          ? data.subjects
          : [];
      setSubjects(arr);
    } catch (error) {
      console.error(error);
      setError(error.message || "Could not load subjects");
      if (error.response?.status === 401) onLogout?.();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubjects();
  }, []);

  // Filter and sort subjects
  const filteredAndSortedSubjects = useMemo(() => {
    // First filter by search query
    let filtered = subjects;
    if (searchQuery) {
      filtered = subjects.filter(subject =>
        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Then sort
    const sorted = [...filtered];
    if (sortBy === "priority") {
      sorted.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
    } else if (sortBy === "newest") {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "examDate") {
      sorted.sort((a, b) => new Date(a.examDate) - new Date(b.examDate));
    }
    return sorted;
  }, [subjects, sortBy, searchQuery]);

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
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 max-w-md">
          <p className="font-medium mb-2">Error loading subjects</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchSubjects}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 min-h-screen overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="text-purple-500" /> My Subjects
          </h1>
          <p className="text-sm text-gray-800 mt-1 ml-7">
            {filteredAndSortedSubjects.length} subject
            {filteredAndSortedSubjects.length !== 1 && "s"} {searchQuery && "found"}
          </p>
        </div>

        <div className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-purple-100 w-full md:w-auto">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <Filter className="size-4 text-purple-500" />
            <span className="text-sm">Sort By:</span>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500 md:hidden text-sm"
          >
            <option value="priority">Priority Score</option>
            <option value="newest">Newest First</option>
            <option value="examDate">Exam Date</option>
          </select>

          <div className="hidden md:flex space-x-1 bg-purple-50 p-1 rounded-lg ml-3">
            <button
              onClick={() => setSortBy("priority")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                sortBy === "priority"
                  ? "bg-white text-purple-700 shadow-sm border border-purple-100"
                  : "text-gray-600 hover:text-purple-700 hover:bg-purple-100/50"
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              Priority
            </button>
            <button
              onClick={() => setSortBy("newest")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                sortBy === "newest"
                  ? "bg-white text-purple-700 shadow-sm border border-purple-100"
                  : "text-gray-600 hover:text-purple-700 hover:bg-purple-100/50"
              }`}
            >
              <SortDesc className="w-3 h-3" />
              Newest
            </button>
            <button
              onClick={() => setSortBy("examDate")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                sortBy === "examDate"
                  ? "bg-white text-purple-700 shadow-sm border border-purple-100"
                  : "text-gray-600 hover:text-purple-700 hover:bg-purple-100/50"
              }`}
            >
              <SortAsc className="w-3 h-3" />
              Exam Date
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subjects by name or tags..."
            className="w-full pl-10 pr-4 py-3 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
          />
        </div>
      </div>

      <div
        className="hidden md:block p-5 border-2 border-dashed border-purple-200 rounded-xl hover:border-purple-400 transition-colors cursor-pointer mb-6 bg-purple-50/50 group"
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-center justify-center gap-3 text-gray-500 group-hover:text-purple-600 transition-colors">
          <div className="size-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
            <Plus className="text-purple-500" size={18} />
          </div>
          <span className="font-medium">Add New Subject</span>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAndSortedSubjects.length === 0 ? (
          <div className="p-8 bg-white rounded-xl shadow-sm border border-purple-100 text-center">
            <div className="max-w-xs mx-auto py-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {searchQuery ? (
                  <Search className="size-8 text-purple-500" />
                ) : (
                  <BookOpen className="size-8 text-purple-500" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {searchQuery ? "No subjects found" : "No subjects yet"}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : "Start by adding your first subject to track"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Create New Subject
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredAndSortedSubjects.map((subject) => (
            <SubjectItem
              key={subject._id || subject.id}
              subject={subject}
              onRefresh={fetchSubjects}
              onLogout={onLogout}
            />
          ))
        )}
      </div>

      <SubjectModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          fetchSubjects();
        }}
        subjectToEdit={null}
        onSave={() => {
          setShowModal(false);
          fetchSubjects();
        }}
        onLogout={onLogout}
      />
    </div>
  );
};

export default Subjects;
