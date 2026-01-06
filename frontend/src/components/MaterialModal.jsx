import { useEffect, useState } from "react";
import { Save, PlusCircle, X, FileText, Tag, Target, BookOpen, Upload, Sparkles } from "lucide-react";
import axios from "axios";

const API_BASE = "http://localhost:4000/api/materials";

const tagColors = {
  study: "bg-blue-100 text-blue-700 border-blue-200",
  revision: "bg-purple-100 text-purple-700 border-purple-200",
  notes: "bg-green-100 text-green-700 border-green-200",
  reference: "bg-orange-100 text-orange-700 border-orange-200",
  assignment: "bg-red-100 text-red-700 border-red-200",
};

const MaterialModal = ({ isOpen, onClose, materialToEdit, onSave, onLogout }) => {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [tag, setTag] = useState("study");
  const [fileUrl, setFileUrl] = useState("");
  const [targetHours, setTargetHours] = useState(0);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // PDF upload states
  const [uploadedPDF, setUploadedPDF] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  // Fetch user's subjects for the dropdown
  useEffect(() => {
    if (!isOpen) return;
    async function fetchSubjects() {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get("http://localhost:4000/api/subjects/gp", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubjects(data.subjects || []);
      } catch (error) {
        console.error("Failed to fetch subjects", error);
      }
    }
    fetchSubjects();
  }, [isOpen]);

  // Load material data when editing
  useEffect(() => {
    if (!isOpen) return;
    if (materialToEdit) {
      setTitle(materialToEdit.title || "");
      setSubject(materialToEdit.subject?._id || materialToEdit.subject || "");
      setTag(materialToEdit.tag || "study");
      setFileUrl(materialToEdit.fileUrl || "");
      setTargetHours(materialToEdit.targetHours || 0);
    } else {
      // Reset for new material
      setTitle("");
      setSubject("");
      setTag("study");
      setFileUrl("");
      setTargetHours(0);
      setUploadedPDF(null);
      setAiAnalysis(null);
    }
    setError(null);
  }, [isOpen, materialToEdit]);

  // Handle PDF file upload
  async function handlePDFUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("title", title || file.name);
    formData.append("tag", tag);
    formData.append("analyzeWithAI", "true"); // Enable AI analysis

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        "http://localhost:4000/api/materials/upload-pdf/gp",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFileUrl(data.fileUrl);
      setUploadedPDF(data.fileName);
      setAiAnalysis(data.aiAnalysis);

      // If title is empty, use filename
      if (!title) {
        setTitle(data.fileName.replace(".pdf", ""));
      }
    } catch (error) {
      console.error("PDF upload error:", error);
      setError("PDF upload failed: " + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!subject) {
      setError("Please select a subject first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No auth token found");

      const isEdit = Boolean(materialToEdit);
      const url = isEdit
        ? `${API_BASE}/${materialToEdit._id}/gp`
        : `${API_BASE}/gp`;

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          subject,
          tag,
          fileUrl,
          targetHours,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) return onLogout?.();
        const err = await response.json();
        throw new Error(err.message || "Failed to save material");
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
            {materialToEdit ? (
              <Save className="text-purple-500 size-5" />
            ) : (
              <PlusCircle className="text-purple-500 size-5" />
            )}
            {materialToEdit ? "Edit Material" : "Add Study Material"}
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

          {/* Material Title */}
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
              <FileText className="size-4 text-purple-500" />
              Material Title
            </label>
            <div className="flex items-center border border-purple-100 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500 transition-all duration-200">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full focus:outline-none text-sm"
                placeholder="e.g., Chapter 5 Notes, Practice Problems"
              />
            </div>
          </div>

          {/* Subject Selection */}
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
              <BookOpen className="size-4 text-purple-500" />
              Subject
            </label>
            <select
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            >
              <option value="">Select a subject</option>
              {subjects.map((subj) => (
                <option key={subj._id} value={subj._id}>
                  {subj.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tag and Target Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                <Tag className="size-4 text-purple-500" />
                Type
              </label>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className={`w-full px-4 py-2.5 border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm ${tagColors[tag]}`}
              >
                <option value="study">Study</option>
                <option value="revision">Revision</option>
                <option value="notes">Notes</option>
                <option value="reference">Reference</option>
                <option value="assignment">Assignment</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                <Target className="size-4 text-purple-500" />
                Target Hours
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={targetHours}
                onChange={(e) => setTargetHours(Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                placeholder="0"
              />
            </div>
          </div>

          {/* PDF Upload or File URL */}
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
              <FileText className="size-4 text-purple-500" />
              Study Material File
            </label>

            {/* PDF Upload Button */}
            <div className="mb-3">
              <label
                htmlFor="pdf-upload"
                className={`flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                  uploading
                    ? "border-purple-300 bg-purple-50"
                    : "border-purple-200 hover:border-purple-400 hover:bg-purple-50"
                }`}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
                    <span className="text-sm text-purple-600">Uploading PDF...</span>
                  </>
                ) : (
                  <>
                    <Upload className="size-4 text-purple-500" />
                    <span className="text-sm text-purple-600 font-medium">
                      Upload PDF File
                    </span>
                  </>
                )}
              </label>
              <input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={handlePDFUpload}
                className="hidden"
                disabled={uploading}
              />
            </div>

            {/* Show uploaded filename */}
            {uploadedPDF && (
              <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <FileText className="size-4 text-green-600" />
                <span className="text-sm text-green-700 flex-1 truncate">
                  {uploadedPDF}
                </span>
              </div>
            )}

            {/* AI Analysis Results */}
            {aiAnalysis && (
              <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-fuchsia-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="size-4 text-purple-600" />
                  <h4 className="text-sm font-semibold text-purple-900">
                    AI Analysis
                  </h4>
                </div>
                <p className="text-xs text-gray-700 mb-2">{aiAnalysis.summary}</p>
                <div className="flex gap-3 text-xs">
                  <span className="text-gray-600">
                    <strong>Difficulty:</strong> {aiAnalysis.difficulty}
                  </span>
                  <span className="text-gray-600">
                    <strong>Est. Time:</strong> {aiAnalysis.estimatedTime}h
                  </span>
                </div>
                {aiAnalysis.keyPoints && aiAnalysis.keyPoints.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-gray-700 mb-1">
                      Key Points:
                    </p>
                    <ul className="text-xs text-gray-600 space-y-0.5 list-disc list-inside">
                      {aiAnalysis.keyPoints.slice(0, 3).map((point, idx) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Manual URL Input */}
            <div className="relative">
              <label className="text-xs text-gray-500 mb-1 block">Or paste URL:</label>
              <div className="flex items-center border border-purple-100 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-purple-500 transition-all">
                <input
                  type="text"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="w-full focus:outline-none text-sm"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-md transition-all duration-200"
          >
            {loading ? (
              "Saving..."
            ) : materialToEdit ? (
              <>
                <Save className="size-4" /> Update Material
              </>
            ) : (
              <>
                <PlusCircle className="size-4" /> Add Material
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MaterialModal;
