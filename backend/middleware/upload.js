const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,xls,xlsx,png,jpg,jpeg,zip,txt').split(',');
const MAX_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '10');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (ALLOWED.includes(ext)) return cb(null, true);
    cb(new Error(`File type .${ext} not allowed. Allowed: ${ALLOWED.join(', ')}`));
  },
});

module.exports = { upload, UPLOAD_DIR };
