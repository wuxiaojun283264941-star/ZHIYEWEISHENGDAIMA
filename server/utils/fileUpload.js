import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads/reports');

/** Ensure upload directory exists */
export function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  return UPLOAD_DIR;
}

/** Generate unique filename for uploaded report */
export function generateReportFilename(taskId, employeeId, originalName) {
  const ext = path.extname(originalName) || '.pdf';
  const timestamp = Date.now();
  return `${taskId}_${employeeId}_${timestamp}${ext}`;
}

/** Get full file path for a report */
export function getReportFilePath(filename) {
  return path.join(UPLOAD_DIR, filename);
}

/** Validate file is PDF and within size limit */
export function validateReportFile(file) {
  const maxSize = parseInt(process.env.MAX_FILE_SIZE || '20971520');
  if (file.filesize > maxSize) {
    throw new Error('文件大小超过20MB限制');
  }
  const ext = path.extname(file.filename).toLowerCase();
  if (ext !== '.pdf') {
    throw new Error('仅支持PDF格式文件');
  }
  return true;
}

/** Save uploaded file to disk */
export async function saveUploadedFile(file, filename) {
  ensureUploadDir();
  const filePath = path.join(UPLOAD_DIR, filename);
  const buffer = await file.toBuffer();
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

/** Delete file from disk */
export function deleteFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}
