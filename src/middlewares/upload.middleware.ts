import multer from 'multer';
import { ApiError } from '../utils/ApiError';

export const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new ApiError(400, 'Only PDF files are allowed'));
    }
    cb(null, true);
  }
});
