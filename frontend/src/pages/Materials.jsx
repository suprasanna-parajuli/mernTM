import { useState, useEffect, useMemo } from "react";
import { FileText, Plus, Filter, SortDesc, SortAsc, Tag, Search } from "lucide-react";
import MaterialItem from "../components/MaterialItem";
import MaterialModal from "../components/MaterialModal";
import axios from "axios";

const API_BASE = "http://localhost:4000/api/materials";

const Materials = ({ onLogout }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const [filterTag, setFilterTag] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch materials from backend
  async function fetchMaterials() {
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
        : Array.isArray(data?.materials)
          ? data.materials
          : [];
      setMaterials(arr);
    } catch (error) {
      console.error(error);
      setError(error.message || "Could not load materials");
      if (error.response?.status === 401) onLogout?.();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMaterials();
  }, []);

  // Filter and sort materials with search
  const filteredAndSortedMaterials = useMemo(() => {
    let filtered = materials;

    // Filter by search query
    if (searchQuery) {
      filtered = materials.filter(material =>
        material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.subject?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by tag
    if (filterTag !== "all") {
      filtered = filtered.filter(material => material.tag === filterTag);
    }

    // Sort
    const sorted = [...filtered];
    if (sortBy === "newest") {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "progress") {
      sorted.sort((a, b) => (b.progress || 0) - (a.progress || 0));
    } else if (sortBy === "timeSpent") {
      sorted.sort((a, b) => (b.timeSpent || 0) - (a.timeSpent || 0));
    }
    return sorted;
  }, [materials, sortBy, filterTag, searchQuery]);

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
          <p className="font-medium mb-2">Error loading materials</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchMaterials}
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
            <FileText className="text-purple-500" /> Study Materials
          </h1>
          <p className="text-sm text-gray-800 mt-1 ml-7">
            {filteredAndSortedMaterials.length} material
            {filteredAndSortedMaterials.length !== 1 && "s"} {searchQuery && "found"}
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {/* Tag Filter */}
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="px-3 py-2 border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm bg-white"
          >
            <option value="all">All Types</option>
            <option value="study">Study</option>
            <option value="revision">Revision</option>
            <option value="notes">Notes</option>
            <option value="reference">Reference</option>
            <option value="assignment">Assignment</option>
          </select>

          {/* Sort Options */}
          <div className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-purple-100 w-full md:w-auto">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <Filter className="size-4 text-purple-500" />
              <span className="text-sm">Sort:</span>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500 md:hidden text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="progress">By Progress</option>
              <option value="timeSpent">By Time Spent</option>
            </select>

            <div className="hidden md:flex space-x-1 bg-purple-50 p-1 rounded-lg ml-3">
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
                onClick={() => setSortBy("progress")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  sortBy === "progress"
                    ? "bg-white text-purple-700 shadow-sm border border-purple-100"
                    : "text-gray-600 hover:text-purple-700 hover:bg-purple-100/50"
                }`}
              >
                <Tag className="w-3 h-3" />
                Progress
              </button>
              <button
                onClick={() => setSortBy("timeSpent")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  sortBy === "timeSpent"
                    ? "bg-white text-purple-700 shadow-sm border border-purple-100"
                    : "text-gray-600 hover:text-purple-700 hover:bg-purple-100/50"
                }`}
              >
                <SortAsc className="w-3 h-3" />
                Time Spent
              </button>
            </div>
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
            placeholder="Search by title, subject, or tag..."
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
          <span className="font-medium">Add Study Material</span>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAndSortedMaterials.length === 0 ? (
          <div className="p-8 bg-white rounded-xl shadow-sm border border-purple-100 text-center">
            <div className="max-w-xs mx-auto py-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {searchQuery ? (
                  <Search className="size-8 text-purple-500" />
                ) : (
                  <FileText className="size-8 text-purple-500" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {searchQuery ? "No materials found" : "No materials yet"}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : "Start by adding study materials to track your progress"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Add Material
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredAndSortedMaterials.map((material) => (
            <MaterialItem
              key={material._id || material.id}
              material={material}
              onRefresh={fetchMaterials}
              onLogout={onLogout}
            />
          ))
        )}
      </div>

      <MaterialModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          fetchMaterials();
        }}
        materialToEdit={null}
        onSave={() => {
          setShowModal(false);
          fetchMaterials();
        }}
        onLogout={onLogout}
      />
    </div>
  );
};

export default Materials;
