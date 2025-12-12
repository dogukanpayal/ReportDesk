import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Dosya türü kontrolü
const allowedFileTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
];

// Dosya uzantısı kontrolü
const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'];

// Dosya türü validasyonu
const fileFilter = (req, file, cb) => {
  // MIME type kontrolü
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Dosya uzantısı kontrolü (fallback)
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Desteklenmeyen dosya türü. Sadece PDF, DOC, DOCX, XLS, XLSX ve TXT dosyaları kabul edilir.'), false);
    }
  }
};

// Dosya adı validasyonu
const filenameFilter = (req, file, cb) => {
  const originalName = file.originalname;
  
  // Dosya adı uzunluğu kontrolü (255 karakter)
  if (originalName.length > 255) {
    return cb(new Error('Dosya adı çok uzun. Maksimum 255 karakter olmalıdır.'), false);
  }
  
  // Özel karakter kontrolü (sadece alfanumerik, tire ve alt çizgi)
  const validFilenameRegex = /^[a-zA-Z0-9\-\_\.]+$/;
  if (!validFilenameRegex.test(originalName)) {
    return cb(new Error('Dosya adında sadece harf, rakam, tire (-) ve alt çizgi (_) kullanılabilir.'), false);
  }
  
  cb(null, true);
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Multer konfigürasyonu
const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maksimum dosya boyutu
    files: 1 // Tek seferde 1 dosya
  }
});

export default upload; 