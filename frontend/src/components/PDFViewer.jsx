import { useState } from "react";
import { X, FileText, Download, ZoomIn, ZoomOut } from "lucide-react";
import { useTimer } from "../contexts/TimerContext";

function PDFViewer({ pdfUrl, title, materialId, onClose }) {
  const [zoom, setZoom] = useState(100);
  const { isStudying, materialId: activeMatId, startTimer, stopTimer } = useTimer();

  const isThisMaterialActive = isStudying && activeMatId === materialId;

  function handleZoomIn() {
    setZoom(zoom + 10);
  }

  function handleZoomOut() {
    if (zoom > 50) setZoom(zoom - 10);
  }

  function handleStartStudy() {
    startTimer(materialId, title);
  }

  async function handleStopStudy() {
    await stopTimer();
  }

  function handleDownload() {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = title + ".pdf";
    link.click();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="size-5 text-purple-600" />
          <h2 className="font-semibold text-gray-800">{title}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Timer Controls */}
          {!isStudying ? (
            <button
              onClick={handleStartStudy}
              className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
            >
              Start Studying
            </button>
          ) : isThisMaterialActive ? (
            <button
              onClick={handleStopStudy}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors animate-pulse"
            >
              Stop Timer
            </button>
          ) : null}

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-white rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="size-4 text-gray-600" />
            </button>
            <span className="px-3 text-sm font-medium text-gray-700">{zoom}%</span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-white rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="size-4 text-gray-600" />
            </button>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Download PDF"
          >
            <Download className="size-5 text-gray-600" />
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="size-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* PDF Display Area */}
      <div className="flex-1 overflow-auto bg-gray-900 p-8">
        <div className="max-w-5xl mx-auto bg-white shadow-2xl">
          <iframe
            src={pdfUrl}
            className="w-full h-screen border-0"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
            title={title}
          />
        </div>
      </div>

      {/* Footer Info */}
      {isThisMaterialActive && (
        <div className="bg-purple-600 text-white p-3 text-center text-sm font-medium">
          📚 Study session in progress - Timer is running in the background
        </div>
      )}
    </div>
  );
}

export default PDFViewer;
