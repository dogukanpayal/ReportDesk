import Report from '../models/Report.js';
import User from '../models/User.js';
import path from 'path';
import fs from 'fs';
import { Op } from 'sequelize';
import sequelize from '../utils/db.js';
import { triggerAIAnalysis } from '../services/aiService.js';

// Bugünün tarihini YYYY-MM-DD formatında al
function getTodayDate() {
  const today = new Date();
  
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// Supabase removed - using local file storage

const getPagination = (page, size) => {
  const limit = size ? +size : 10; // Default limit is 10
  const offset = page ? (page - 1) * limit : 0;
  return { limit, offset };
};

const getPagingData = (data, page, limit) => {
  const { count: totalItems, rows: reports } = data;
  const currentPage = page ? +page : 1;
  const totalPages = Math.ceil(totalItems / limit);
  return { totalItems, reports, totalPages, currentPage };
};

export async function uploadReport(req, res) {
  if (!req.file) return res.status(400).json({ message: 'File is required' });
  
  // Input validation
  const { notes } = req.body;
  
  // Notlar validasyonu
  if (notes !== undefined) {
    if (typeof notes !== 'string') {
      return res.status(400).json({ 
        message: 'Notlar string formatında olmalıdır',
        error: 'INVALID_NOTES_TYPE'
      });
    }
    
    if (notes.length > 255) {
      return res.status(400).json({ 
        message: 'Notlar 255 karakterden uzun olamaz',
        error: 'NOTES_TOO_LONG'
      });
    }
    
    // XSS koruması - tehlikeli karakterler
    const dangerousChars = /<script|javascript:|on\w+\s*=/i;
    if (dangerousChars.test(notes)) {
      return res.status(400).json({ 
        message: 'Notlar güvenli olmayan karakterler içeriyor',
        error: 'UNSAFE_NOTES'
      });
    }
  }
  
  try {
    // req.user'dan kullanıcı bilgilerini al
    const { id: userId, firstName, lastName } = req.user;

    // Tarih oluşturma - doğal tarih kullan
    const currentDate = new Date();
    
    const report = await Report.create({
      filePath: req.file.filename,
      originalFileName: req.file.originalname, // Orijinal dosya adını kaydet
      notes: notes || null, // Validated notes
      status: 'Not Reviewed', // Status'u Not Reviewed olarak set et
      userId: userId,
      date: currentDate, // Doğal tarih
      uploader_first_name: firstName, // Mevcut sütunu kullan
      uploader_last_name: lastName,   // Mevcut sütunu kullan
    });

    triggerAIAnalysis({
            id: report.id,
            filePath: report.filePath,
            originalFileName: report.originalFileName
        });
    
    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating report:', error.message);
    res.status(500).json({ 
      message: 'Rapor oluşturulurken hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export const getAllReports = async (req, res) => {
  try {
    const { page = 1, size = 10, sortBy, sortOrder, date, status, userId, search } = req.query;
    const where = {};
    
    // Tarih filtresi - tam gün aralığı
    if (date && date.trim() !== '') {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0); // Günün başlangıcı
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999); // Günün sonu
      
      where.created_at = { 
        [Op.between]: [startDate, endDate] 
      };
    }
    
    // Durum filtresi
    if (status && status.trim() !== '') {
      where.status = status;
    }
    
    // Kullanıcı ID filtresi - userId varsa her zaman uygula
    if (userId && userId.trim() !== '') {
      where.userId = userId;
    }
    
    // Debug log - sadece development ortamında
    if (process.env.NODE_ENV === 'development') {
      console.log('getAllReports - User role:', req.user?.role, 'Filter:', userId);
    }

    // Arama filtresi (çalışan adı, notlar veya email) - SQL injection korumalı
    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      where[Op.or] = [
        { notes: { [Op.iLike]: `%${searchTerm}%` } },
        { uploader_first_name: { [Op.iLike]: `%${searchTerm}%` } },
        { uploader_last_name: { [Op.iLike]: `%${searchTerm}%` } },
        // Güvenli CONCAT kullanımı - parameterized query
        sequelize.literal(`CONCAT(uploader_first_name, ' ', uploader_last_name) ILIKE :search`),
        { '$User.email$': { [Op.iLike]: `%${searchTerm}%` } }
      ];
    }

    // Pagination
    const { limit, offset } = getPagination(page, size);

    const order = [];
    const sortField = sortBy || 'created_at';
    const sortDirection = sortOrder || 'desc';

    if (sortField === 'employee') {
      order.push([User, 'firstName', sortDirection]);
      order.push([User, 'lastName', sortDirection]);
    } else {
      order.push([sortField, sortDirection]);
    }
    
    const data = await Report.findAndCountAll({
      where,
      attributes: [
        'id', 'filePath', 'notes', 'status', 'date', 'userId',
        'created_at', 'updated_at', 'uploader_first_name', 'uploader_last_name',
        'originalFileName'
      ],
      include: [{
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'email'],
        required: false // LEFT JOIN for better performance
      }],
      order,
      limit,
      offset,
      replacements: search ? { search: `%${search}%` } : {},
      distinct: true // Avoid duplicate rows in count
    });
    
    const plainRows = data.rows.map(row => {
      const plainRow = row.get({ plain: true });
      
      // User join'den doğru uploader bilgilerini al
      if (plainRow.User) {
        plainRow.uploader_first_name = plainRow.User.firstName;
        plainRow.uploader_last_name = plainRow.User.lastName;
        plainRow.email = plainRow.User.email; // Email bilgisini ekle
      }
      
      // Tarih alanlarını güvenli hale getir
      if (plainRow.created_at) {
        try {
          const date = new Date(plainRow.created_at);
          if (isNaN(date.getTime())) {
            console.warn('Invalid created_at date in report:', plainRow.id, plainRow.created_at);
            plainRow.created_at = null;
          }
        } catch (error) {
          console.warn('Error processing created_at date in report:', plainRow.id, plainRow.created_at, error);
          plainRow.created_at = null;
        }
      } else {
        console.warn('created_at is missing for report:', plainRow.id);
      }
      
      if (plainRow.updated_at) {
        try {
          const date = new Date(plainRow.updated_at);
          if (isNaN(date.getTime())) {
            console.warn('Invalid updated_at date in report:', plainRow.id, plainRow.updated_at);
            plainRow.updated_at = null;
          }
        } catch (error) {
          console.warn('Error processing updated_at date in report:', plainRow.id, plainRow.updated_at, error);
          plainRow.updated_at = null;
        }
      } else {
        console.log('updated_at is null for report:', plainRow.id, '(this is normal for new reports)');
      }
      
      return plainRow;
    });
    
    const response = getPagingData({ ...data, rows: plainRows }, page, limit);
    
    res.json(response);
  } catch (err) {
    console.error('Error fetching reports:', err.message);
    res.status(500).json({ 
      message: 'Raporlar getirilirken hata oluştu',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export async function getMyReports(req, res) {
  try {
    const { page = 1, size = 10, sortBy, sortOrder, date, status, search } = req.query;
    const where = { userId: req.user.id }; // Filter by logged-in user
    
    // Tarih filtresi - tam gün aralığı
    if (date && date.trim() !== '') {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0); // Günün başlangıcı
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999); // Günün sonu
      
      where.created_at = { 
        [Op.between]: [startDate, endDate] 
      };
      
      // Debug log - sadece development ortamında
      if (process.env.NODE_ENV === 'development') {
        console.log('getMyReports - Date filter:', { input: date, start: startDate, end: endDate });
      }
    }
    
    // Durum filtresi
    if (status && status.trim() !== '') {
      where.status = status;
    }

    // Arama filtresi (notlar, çalışan adı veya email) - SQL injection korumalı
    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      where[Op.or] = [
        { notes: { [Op.iLike]: `%${searchTerm}%` } },
        { uploader_first_name: { [Op.iLike]: `%${searchTerm}%` } },
        { uploader_last_name: { [Op.iLike]: `%${searchTerm}%` } },
        // Güvenli CONCAT kullanımı - parameterized query
        sequelize.literal(`CONCAT(uploader_first_name, ' ', uploader_last_name) ILIKE :search`),
        { '$User.email$': { [Op.iLike]: `%${searchTerm}%` } }
      ];
    }

    const { limit, offset } = getPagination(page, size);

    const order = [];
    const sortField = sortBy || 'created_at';
    const sortDirection = sortOrder || 'desc';

    // No need to sort by employee here since it's always the same user
    order.push([sortField, sortDirection]);
    
    const data = await Report.findAndCountAll({
      where,
      attributes: [
        'id', 'filePath', 'notes', 'status', 'date', 'userId',
        'created_at', 'updated_at', 'uploader_first_name', 'uploader_last_name',
        'originalFileName'
      ],
      include: [{ 
        model: User, 
        attributes: ['id', 'firstName', 'lastName', 'email'],
        required: false // LEFT JOIN for better performance
      }],
      order,
      limit,
      offset,
      replacements: search ? { search: `%${search}%` } : {},
      distinct: true // Avoid duplicate rows in count
    });

    const plainRows = data.rows.map(row => {
      const plainRow = row.get({ plain: true });
      
      // User join'den doğru uploader bilgilerini al
      if (plainRow.User) {
        plainRow.uploader_first_name = plainRow.User.firstName;
        plainRow.uploader_last_name = plainRow.User.lastName;
        plainRow.email = plainRow.User.email; // Email bilgisini ekle
      }
      
      // Tarih alanlarını güvenli hale getir
      if (plainRow.created_at) {
        try {
          const date = new Date(plainRow.created_at);
          if (isNaN(date.getTime())) {
            console.warn('Invalid created_at date in report:', plainRow.id, plainRow.created_at);
            plainRow.created_at = null;
          }
        } catch (error) {
          console.warn('Error processing created_at date in report:', plainRow.id, plainRow.created_at, error);
          plainRow.created_at = null;
        }
      } else {
        console.warn('created_at is missing for report:', plainRow.id);
      }
      
      if (plainRow.updated_at) {
        try {
          const date = new Date(plainRow.updated_at);
          if (isNaN(date.getTime())) {
            console.warn('Invalid updated_at date in report:', plainRow.id, plainRow.updated_at);
            plainRow.updated_at = null;
          }
        } catch (error) {
          console.warn('Error processing updated_at date in report:', plainRow.id, plainRow.updated_at, error);
          plainRow.updated_at = null;
        }
      } else {
        console.log('updated_at is null for report:', plainRow.id, '(this is normal for new reports)');
      }
      
      return plainRow;
    });
    
    const response = getPagingData({ ...data, rows: plainRows }, page, limit);

    res.json(response);
  } catch (err) {
    console.error('Error fetching my reports:', err.message);
    res.status(500).json({ 
      message: 'Raporlarım getirilirken hata oluştu',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Input validation
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Geçerli bir rapor ID\'si gerekli' });
    }

    if (!status || typeof status !== 'string') {
      return res.status(400).json({ message: 'Durum bilgisi gerekli' });
    }

    const validStatuses = ['Submitted', 'Reviewed', 'Not Reviewed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Geçersiz durum. Geçerli durumlar: ' + validStatuses.join(', ')
      });
    }

    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ message: 'Rapor bulunamadı' });
    }

    // Sadece status alanını güncelle, updated_at'i değiştirme
    await report.update({ status }, { fields: ['status'] });

    res.json(report.get({ plain: true }));
  } catch (err) {
    console.error('Error updating report status:', err.message);
    res.status(500).json({ 
      message: 'Rapor durumu güncellenirken hata oluştu',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Bulk status update fonksiyonu
export const updateBulkReportStatus = async (req, res) => {
  try {
    const { reportIds, status } = req.body;

    // Validation
    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({ message: 'Report IDs array is required.' });
    }

    if (!status || !['Submitted', 'Reviewed', 'Not Reviewed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status provided.' });
    }

    // Debug log - sadece development ortamında
    if (process.env.NODE_ENV === 'development') {
      console.log('Bulk status update:', { reportIds: reportIds.length, status });
    }

    // Bulk update - sadece status alanını güncelle
    const result = await Report.update(
      { status: status },
      { 
        where: { 
          id: reportIds 
        },
        fields: ['status'] // Sadece status alanını güncelle
      }
    );

    // Debug log - sadece development ortamında
    if (process.env.NODE_ENV === 'development') {
      console.log('Bulk update completed:', { updatedCount: result[0] });
    }

    res.json({ 
      message: `${result[0]} rapor durumu güncellendi`,
      updatedCount: result[0]
    });

  } catch (err) {
    console.error('Error updating bulk report status:', err, err.stack);
    res.status(500).json({ message: 'Failed to update bulk report status.' });
  }
};

export async function getReportById(req, res) {
  const { id } = req.params;
  try {
    const report = await Report.findByPk(id, {
      include: [{ model: User, attributes: ['id', 'email', 'role'] }],
    });
    if (!report) return res.status(404).json({ message: 'Report not found' });

    // Only owner or manager can view
    if (req.user.role !== 'manager' && req.user.id !== report.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch report', error: err.message });
  }
}

export async function downloadReportFile(req, res) {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({ message: 'Filename is required' });
    }

    // Güvenlik: Path traversal ve tehlikeli karakterler kontrolü
    const dangerousPatterns = [
      /\.\./,           // Path traversal
      /[\/\\]/,         // Directory separators
      /[<>:"|?*]/,      // Windows forbidden characters
      /[\x00-\x1f]/,    // Control characters
      /^\./,            // Hidden files
      /\.$/,            // Files ending with dot
      /^$/,             // Empty filename
      /^CON$|^PRN$|^AUX$|^NUL$|^COM[1-9]$|^LPT[1-9]$/i // Windows reserved names
    ];
    
    if (dangerousPatterns.some(pattern => pattern.test(filename))) {
      console.warn('Suspicious filename detected:', filename);
      return res.status(400).json({ message: 'Invalid filename' });
    }
    
    // Dosya adı uzunluğu kontrolü
    if (filename.length > 255) {
      return res.status(400).json({ message: 'Filename too long' });
    }

    const directoryPath = path.resolve('uploads');
    const filePath = path.join(directoryPath, filename);

    // Dosya var mı kontrol et
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return res.status(404).json({ message: 'File not found' });
    }

    // Dosya istatistiklerini al
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return res.status(400).json({ message: 'Not a file' });
    }

    // Rapor bilgilerini bul (filename ile)
    const report = await Report.findOne({
      where: { filePath: filename }
    });

    let downloadFilename = filename; // Varsayılan olarak orijinal dosya adı

    if (report) {
      // Orijinal dosya adını kullan
      if (report.originalFileName) {
        downloadFilename = report.originalFileName;
      }
    }

    // Debug log - sadece development ortamında (sensitive data olmadan)
    if (process.env.NODE_ENV === 'development') {
      console.log('File download:', { 
        originalFilename: filename, 
        downloadFilename, 
        size: stats.size
      });
    }

    // Dosyayı yeni isimle indir
    res.download(filePath, downloadFilename, (err) => {
      if (err) {
        console.error('File download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Download failed' });
        }
      } else {
        // Debug log - sadece development ortamında
        if (process.env.NODE_ENV === 'development') {
          console.log('File downloaded successfully:', { original: filename, downloaded: downloadFilename });
        }
      }
    });
  } catch (error) {
    console.error('Download function error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal server error during download' });
    }
  }
}

export async function updateReport(req, res) {
  const { id } = req.params;
  const { notes } = req.body;
  
  // Notlar validasyonu
  if (notes !== undefined && notes.length > 255) {
    return res.status(400).json({ 
      message: 'Notlar 255 karakterden uzun olamaz',
      error: 'NOTES_TOO_LONG'
    });
  }
  
  try {
    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You can only edit your own reports' });
    }

    // 24 saat kontrolü
    if (!report.isEditable()) {
      return res.status(400).json({ 
        message: 'Report cannot be edited after 24 hours',
        timeRemaining: report.getTimeRemaining()
      });
    }

    // Dosya güncelleme kontrolü
    if (req.file) {
      // Dosya validasyonu
      const allowedFileTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];
      
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'];
      
      // MIME type kontrolü
      if (!allowedFileTypes.includes(req.file.mimetype)) {
        // Dosya uzantısı kontrolü (fallback)
        const fileExtension = req.file.originalname.toLowerCase().substring(req.file.originalname.lastIndexOf('.'));
        if (!allowedExtensions.includes(fileExtension)) {
          return res.status(400).json({ 
            message: 'Desteklenmeyen dosya türü. Sadece PDF, DOC, DOCX, XLS, XLSX ve TXT dosyaları kabul edilir.',
            error: 'INVALID_FILE_TYPE'
          });
        }
      }

      // Dosya adı uzunluğu kontrolü (255 karakter)
      if (req.file.originalname.length > 255) {
        return res.status(400).json({ 
          message: 'Dosya adı çok uzun. Maksimum 255 karakter olmalıdır.',
          error: 'FILENAME_TOO_LONG'
        });
      }

      // Dosya adı karakter kontrolü (sadece alfanumerik, tire ve alt çizgi)
      const validFilenameRegex = /^[a-zA-Z0-9\-\_\.]+$/;
      if (!validFilenameRegex.test(req.file.originalname)) {
        return res.status(400).json({ 
          message: 'Dosya adında sadece harf, rakam, tire (-) ve alt çizgi (_) kullanılabilir.',
          error: 'INVALID_FILENAME'
        });
      }

      // Eski dosyayı storage'dan sil
      try {
        if (report.filePath && supabase) {
          // Supabase Storage'dan dosyayı sil
          const { error } = await supabase.storage
            .from('reports')
            .remove([report.filePath]);
          
          if (error) {
            console.error('Error deleting old file from storage:', error);
          }
        } else {
          // Supabase yapılandırılmamışsa, sadece log
          console.log('Supabase not configured, skipping file deletion from storage');
        }
      } catch (storageError) {
        console.error('Storage error:', storageError);
        // Storage hatası olsa bile devam et
      }
      
      report.filePath = req.file.filename;
      report.originalFileName = req.file.originalname; // Orijinal dosya adını da güncelle
    }

    // Notları güncelle
    if (notes !== undefined) {
      report.notes = notes;
    }

    await report.save();

    const updatedReportWithUser = await Report.findByPk(id, {
      include: [{ model: User, attributes: ['id', 'email', 'firstName', 'lastName', 'role'] }],
    });

    res.json(updatedReportWithUser.get({ plain: true }));
  } catch (err) {
    console.error('updateReport error:', err, err.stack);
    res.status(500).json({ message: 'Failed to update report', error: err.message });
  }
}

// Rapor düzenleme durumunu kontrol et (24 saat)
export async function getReportEditStatus(req, res) {
  const { id } = req.params;
  try {
    // Debug log - sadece development ortamında (sensitive data olmadan)
    if (process.env.NODE_ENV === 'development') {
      console.log('getReportEditStatus:', { userId: req.user.id, role: req.user.role, reportId: id });
    }
    
    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Debug log - sadece development ortamında
    if (process.env.NODE_ENV === 'development') {
      console.log('Report data:', { id: report.id, userId: report.userId, status: report.status });
    }

    // Yetki kontrolü - sadece rapor sahibi
    if (report.userId !== req.user.id) {
      // Debug log - sadece development ortamında
      if (process.env.NODE_ENV === 'development') {
        console.log('Permission denied: User cannot access this report');
      }
      return res.status(403).json({ 
        message: 'Forbidden: You can only check your own reports'
      });
    }

    const timeInfo = report.getTimeRemaining();
    
    // Debug log - sadece development ortamında
    if (process.env.NODE_ENV === 'development') {
      console.log('Time info:', timeInfo);
    }
    
    res.json({
      canEdit: timeInfo.canEdit,
      timeRemaining: timeInfo,
      createdAt: report.created_at,
      lastModifiedAt: report.lastModifiedAt
    });
  } catch (err) {
    console.error('getReportEditStatus error:', err, err.stack);
    res.status(500).json({ message: 'Failed to get report edit status', error: err.message });
  }
}

export async function deleteReport(req, res) {
  const { id } = req.params;
  try {
    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.userId !== req.user.id && req.user.role !== 'Yonetici') {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own reports' });
    }
    
    // Optional: Delete the file from the server
    // const filePath = path.resolve('uploads', report.filePath);
    // fs.unlink(filePath, (err) => {
    //   if (err) console.error("Failed to delete file:", err);
    // });

    await report.destroy();
    res.status(204).send();
  } catch (err) {
    console.error('deleteReport error:', err, err.stack);
    res.status(500).json({ message: 'Failed to delete report', error: err.message });
  }
}



// Toplu silme fonksiyonu
export async function deleteBulkReports(req, res) {
  try {
    const { reportIds } = req.body;
    
    // Debug log - sadece development ortamında
    if (process.env.NODE_ENV === 'development') {
      console.log('Bulk delete request:', { reportCount: reportIds.length });
    }
    
    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({ message: 'Report IDs array is required' });
    }

    // Kullanıcının yetkisini kontrol et
    const reports = await Report.findAll({
      where: { id: reportIds }
    });

    // Sadece yöneticiler tüm raporları silebilir, çalışanlar sadece kendi raporlarını
    const canDeleteAll = req.user.role === 'Yonetici';
    const unauthorizedReports = reports.filter(report => 
      !canDeleteAll && report.userId !== req.user.id
    );

    if (unauthorizedReports.length > 0) {
      return res.status(403).json({ 
        message: 'Some reports cannot be deleted due to insufficient permissions' 
      });
    }

    // Toplu silme işlemi
    const result = await Report.destroy({
      where: { 
        id: reportIds,
        ...(req.user.role !== 'Yonetici' && { userId: req.user.id })
      }
    });

    res.json({ 
      message: `${result} rapor başarıyla silindi`,
      deletedCount: result
    });
  } catch (err) {
    console.error('Error deleting bulk reports:', err, err.stack);
    res.status(500).json({ message: 'Failed to delete bulk reports' });
  }
} 