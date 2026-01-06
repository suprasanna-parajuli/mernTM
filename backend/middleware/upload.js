import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory path (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure storage for PDF files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save PDFs to uploads/pdfs folder
    cb(null, path.join(__dirname, "../uploads/pdfs"));
  },
  filename: function (req, file, cb) {
    // Create unique filename: userId_timestamp_originalname
    const uniqueName = `${req.user.id}_${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  },
});

// File filter - only allow PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true); // Accept file
  } else {
    cb(new Error("Only PDF files are allowed!"), false); // Reject file
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

export default upload;
