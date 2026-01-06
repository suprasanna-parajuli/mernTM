import { useState } from "react";
import { MoreVertical, Clock, Tag, Target, Edit2, Trash2, Play, ExternalLink, FileText } from "lucide-react";
import axios from "axios";
import { format } from "date-fns";
import MaterialModal from "./MaterialModal";
import PDFViewer from "./PDFViewer";
import { useTimer } from "../contexts/TimerContext";

const API_BASE = "http://localhost:4000/api/materials";

const tagColors = {
  study: "bg-blue-100 text-blue-700",
  revision: "bg-purple-100 text-purple-700",
  notes: "bg-green-100 text-green-700",
  reference: "bg-orange-100 text-orange-700",
  assignment: "bg-red-100 text-red-700",
};

const MaterialItem = ({ material, onRefresh, onLogout }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const { isStudying, materialId, startTimer } = useTimer();

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No auth token found");
    return { Authorization: `Bearer ${token}` };
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${material.title}"?`)) {
      return;
    }
    try {
      await axios.delete(`${API_BASE}/${material._id}/gp`, {
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

  function handleStartTimer() {
    startTimer(material._id, material.title);
  }

  const isThisMaterialStudying = isStudying && materialId === material._id;

  // Progress percentage
  const progressPercentage = Math.min(100, Math.round(material.progress || 0));

  return (
    <>
      <div className="group p-4 sm:p-5 rounded-xl shadow-sm bg-white border-l-4 hover:shadow-md transition-all duration-300 border border-purple-100 border-l-purple-500">
        <div className="flex items-start justify-between gap-3">
          {/* Left side - Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-medium text-gray-800 truncate">
                {material.title}
              </h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${tagColors[material.tag]}`}
              >
                {material.tag}
              </span>
            </div>

            {/* Subject name */}
            {material.subject && (
              <p className="text-sm text-gray-600 mb-2">
                Subject: <span className="font-medium">{material.subject.name}</span>
              </p>
            )}

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 font-medium">Progress</span>
                <span className="text-xs font-semibold text-purple-600">
                  {progressPercentage}%
                </span>
              </div>
              <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-600 transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 text-gray-600">
                <Clock className="size-3.5 text-purple-500" />
                <span>
                  {Math.floor(material.timeSpent / 60)}h {material.timeSpent % 60}m spent
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <Target className="size-3.5 text-purple-500" />
                <span>Target: {material.targetHours}h</span>
              </div>
              {material.fileUrl && (
                <button
                  onClick={function () {
                    setShowPDFViewer(true);
                  }}
                  className="flex items-center gap-1.5 text-purple-600 hover:text-purple-700 cursor-pointer"
                >
                  <FileText className="size-3.5" />
                  <span>View PDF</span>
                </button>
              )}
            </div>
          </div>

          {/* Right side - Actions and timer */}
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
                    Edit Material
                  </button>
                  <button
                    onClick={() => handleAction("delete")}
                    className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm hover:bg-purple-50 flex items-center gap-2 transition-colors duration-200"
                  >
                    <Trash2 size={14} className="text-red-600" />
                    Delete Material
                  </button>
                </div>
              )}
            </div>

            {/* Study Timer Button */}
            {!isStudying ? (
              <button
                onClick={handleStartTimer}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 bg-green-100 text-green-700 hover:bg-green-200"
              >
                <Play className="size-3.5" />
                Study
              </button>
            ) : isThisMaterialStudying ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-100 text-purple-700">
                <Clock className="size-3.5 animate-pulse" />
                Studying...
              </div>
            ) : null}

            {/* Last studied */}
            {material.lastStudied && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap">
                <Clock className="size-3 sm:size-3.5" />
                Last: {format(new Date(material.lastStudied), "MMM dd")}
              </div>
            )}
          </div>
        </div>
      </div>

      <MaterialModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          onRefresh?.();
        }}
        materialToEdit={material}
        onSave={() => {
          setShowEditModal(false);
          onRefresh?.();
        }}
        onLogout={onLogout}
      />

      {showPDFViewer && material.fileUrl && (
        <PDFViewer
          pdfUrl={material.fileUrl}
          title={material.title}
          materialId={material._id}
          onClose={function () {
            setShowPDFViewer(false);
            onRefresh?.();
          }}
        />
      )}
    </>
  );
};

export default MaterialItem;
