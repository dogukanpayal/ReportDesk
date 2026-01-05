import axios from 'axios';
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

const getPagination = (page, size) => {
    const limit = size ? +size : 10;
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
    }

    if (notes && notes.length > 255) {
        return res.status(400).json({
            message: 'Notlar 255 karakterden uzun olamaz',
            error: 'NOTES_TOO_LONG'
        });
    }

    // XSS koruması
    const dangerousChars = /<script|javascript:|on\w+\s*=/i;
    if (notes && dangerousChars.test(notes)) {
        return res.status(400).json({
            message: 'Notlar güvenli olmayan karakterler içeriyor',
            error: 'UNSAFE_NOTES'
        });
    }

    try {
        const { id: userId, firstName, lastName } = req.user;
        const currentDate = new Date();

        // 1. Raporu Veritabanına Kaydet
        const report = await Report.create({
            filePath: req.file.filename,
            originalFileName: req.file.originalname,
            notes: notes || null,
            status: 'Not Reviewed',
            userId: userId,
            date: currentDate,
            uploader_first_name: firstName,
            uploader_last_name: lastName,
        });

        // 2. --- AI ANALİZİNİ TETİKLE ---
        triggerAIAnalysis({
            id: report.id,
            filePath: report.filePath,
            originalFileName: report.originalFileName
        });
        // ------------------------------

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
      startDate.setHours(0, 0, 0, 0); 
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999); 
      
      where.created_at = { 
        [Op.between]: [startDate, endDate] 
      };
    }
    
    // Durum filtresi
    if (status && status.trim() !== '') {
      where.status = status;
    }
    
    // Kullanıcı ID filtresi
    if (userId && userId.trim() !== '') {
      where.userId = userId;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('getAllReports - User role:', req.user?.role, 'Filter:', userId);
    }

    // Arama filtresi
    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      where[Op.or] = [
        { notes: { [Op.iLike]: `%${searchTerm}%` } },
        { uploader_first_name: { [Op.iLike]: `%${searchTerm}%` } },
        { uploader_last_name: { [Op.iLike]: `%${searchTerm}%` } },
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
        'originalFileName', 
        'ai_summary',
        ['ai_summary_short', 'ai_summary_short'],
        'ai_keywords' // <--- DÜZELTME 1: Bu satır eklendi. Artık keywords verisi çekiliyor.
      ],
      include: [{
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'email'],
        required: false 
      }],
      order,
      limit,
      offset,
      replacements: search ? { search: `%${search}%` } : {},
      distinct: true 
    });
    
    const plainRows = data.rows.map(row => {
      const plainRow = row.get({ plain: true });
      
      if (plainRow.User) {
        plainRow.uploader_first_name = plainRow.User.firstName;
        plainRow.uploader_last_name = plainRow.User.lastName;
        plainRow.email = plainRow.User.email; 
      }
      
      if (plainRow.created_at) {
        try {
          const date = new Date(plainRow.created_at);
          if (isNaN(date.getTime())) {
            plainRow.created_at = null;
          }
        } catch (error) {
          plainRow.created_at = null;
        }
      }
      
      if (plainRow.updated_at) {
        try {
          const date = new Date(plainRow.updated_at);
          if (isNaN(date.getTime())) {
            plainRow.updated_at = null;
          }
        } catch (error) {
          plainRow.updated_at = null;
        }
      }
      
      // Frontend uyumluluğu için mapping
      plainRow.ai_summary = plainRow.ai_summary || plainRow.aiSummary || null;
      plainRow.ai_summary_short = plainRow.ai_summary_short || plainRow.aiSummaryShort || null;
      plainRow.aiSummary = plainRow.aiSummary || plainRow.ai_summary || null;
      plainRow.aiSummaryShort = plainRow.aiSummaryShort || plainRow.ai_summary_short || null;
      
      // <--- DÜZELTME 2: Keywords mapping eklendi
      plainRow.ai_keywords = plainRow.ai_keywords || plainRow.aiKeywords || [];
      plainRow.aiKeywords = plainRow.aiKeywords || plainRow.ai_keywords || [];

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
    const where = { userId: req.user.id }; 
    
    if (date && date.trim() !== '') {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0); 
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999); 
      
      where.created_at = { 
        [Op.between]: [startDate, endDate] 
      };
    }
    
    if (status && status.trim() !== '') {
      where.status = status;
    }

    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      where[Op.or] = [
        { notes: { [Op.iLike]: `%${searchTerm}%` } },
        { uploader_first_name: { [Op.iLike]: `%${searchTerm}%` } },
        { uploader_last_name: { [Op.iLike]: `%${searchTerm}%` } },
        sequelize.literal(`CONCAT(uploader_first_name, ' ', uploader_last_name) ILIKE :search`),
        { '$User.email$': { [Op.iLike]: `%${searchTerm}%` } }
      ];
    }

    const { limit, offset } = getPagination(page, size);

    const order = [];
    const sortField = sortBy || 'created_at';
    const sortDirection = sortOrder || 'desc';

    order.push([sortField, sortDirection]);
    
    const data = await Report.findAndCountAll({
      where,
      attributes: [
        'id', 'filePath', 'notes', 'status', 'date', 'userId',
        'created_at', 'updated_at', 'uploader_first_name', 'uploader_last_name',
        'originalFileName', 
        'ai_summary',
        ['ai_summary_short', 'ai_summary_short'],
        'ai_keywords' // <--- DÜZELTME 3: getMyReports için de eklendi
      ],
      include: [{ 
        model: User, 
        attributes: ['id', 'firstName', 'lastName', 'email'],
        required: false
      }],
      order,
      limit,
      offset,
      replacements: search ? { search: `%${search}%` } : {},
      distinct: true 
    });

    const plainRows = data.rows.map(row => {
      const plainRow = row.get({ plain: true });
      
      if (plainRow.User) {
        plainRow.uploader_first_name = plainRow.User.firstName;
        plainRow.uploader_last_name = plainRow.User.lastName;
        plainRow.email = plainRow.User.email;
      }
      
      if (plainRow.created_at) {
        try {
          const date = new Date(plainRow.created_at);
          if (isNaN(date.getTime())) {
            plainRow.created_at = null;
          }
        } catch (error) {
          plainRow.created_at = null;
        }
      }
      
      if (plainRow.updated_at) {
        try {
          const date = new Date(plainRow.updated_at);
          if (isNaN(date.getTime())) {
            plainRow.updated_at = null;
          }
        } catch (error) {
          plainRow.updated_at = null;
        }
      }
      
      plainRow.ai_summary = plainRow.ai_summary || plainRow.aiSummary || null;
      plainRow.ai_summary_short = plainRow.ai_summary_short || plainRow.aiSummaryShort || null;
      plainRow.aiSummary = plainRow.aiSummary || plainRow.ai_summary || null;
      plainRow.aiSummaryShort = plainRow.aiSummaryShort || plainRow.ai_summary_short || null;
      
      // <--- DÜZELTME 4: Mapping eklendi
      plainRow.ai_keywords = plainRow.ai_keywords || plainRow.aiKeywords || [];
      plainRow.aiKeywords = plainRow.aiKeywords || plainRow.ai_keywords || [];

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

export const updateBulkReportStatus = async (req, res) => {
  try {
    const { reportIds, status } = req.body;

    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({ message: 'Report IDs array is required.' });
    }

    if (!status || !['Submitted', 'Reviewed', 'Not Reviewed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status provided.' });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Bulk status update:', { reportIds: reportIds.length, status });
    }

    const result = await Report.update(
      { status: status },
      { 
        where: { id: reportIds },
        fields: ['status'] 
      }
    );

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

    if (req.user.role !== 'manager' && req.user.id !== report.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const plain = report.get({ plain: true });
    plain.ai_summary = plain.ai_summary || plain.aiSummary || null;
    plain.ai_summary_short = plain.ai_summary_short || plain.aiSummaryShort || null;
    plain.aiSummary = plain.aiSummary || plain.ai_summary || null;
    plain.aiSummaryShort = plain.aiSummaryShort || plain.ai_summary_short || null;
    
    // <--- DÜZELTME 5: Tekil rapor çekme için de mapping eklendi
    plain.ai_keywords = plain.ai_keywords || plain.aiKeywords || [];
    plain.aiKeywords = plain.aiKeywords || plain.ai_keywords || [];

    res.json(plain);
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

    const dangerousPatterns = [
      /\.\./,           
      /[\/\\]/,         
      /[<>:"|?*]/,      
      /[\x00-\x1f]/,    
      /^\./,            
      /\.$/,            
      /^$/,             
      /^CON$|^PRN$|^AUX$|^NUL$|^COM[1-9]$|^LPT[1-9]$/i 
    ];
    
    if (dangerousPatterns.some(pattern => pattern.test(filename))) {
      console.warn('Suspicious filename detected:', filename);
      return res.status(400).json({ message: 'Invalid filename' });
    }
    
    if (filename.length > 255) {
      return res.status(400).json({ message: 'Filename too long' });
    }

    const directoryPath = path.resolve('uploads');
    const filePath = path.join(directoryPath, filename);

    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return res.status(404).json({ message: 'File not found' });
    }

    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return res.status(400).json({ message: 'Not a file' });
    }

    const report = await Report.findOne({
      where: { filePath: filename }
    });

    let downloadFilename = filename; 

    if (report) {
      if (report.originalFileName) {
        downloadFilename = report.originalFileName;
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('File download:', { 
        originalFilename: filename, 
        downloadFilename, 
        size: stats.size
      });
    }

    res.download(filePath, downloadFilename, (err) => {
      if (err) {
        console.error('File download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Download failed' });
        }
      } else {
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

    if (!report.isEditable()) {
      return res.status(400).json({ 
        message: 'Report cannot be edited after 24 hours',
        timeRemaining: report.getTimeRemaining()
      });
    }

    if (req.file) {
      const allowedFileTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];
      
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'];
      
      if (!allowedFileTypes.includes(req.file.mimetype)) {
        const fileExtension = req.file.originalname.toLowerCase().substring(req.file.originalname.lastIndexOf('.'));
        if (!allowedExtensions.includes(fileExtension)) {
          return res.status(400).json({ 
            message: 'Desteklenmeyen dosya türü. Sadece PDF, DOC, DOCX, XLS, XLSX ve TXT dosyaları kabul edilir.',
            error: 'INVALID_FILE_TYPE'
          });
        }
      }

      if (req.file.originalname.length > 255) {
        return res.status(400).json({ 
          message: 'Dosya adı çok uzun. Maksimum 255 karakter olmalıdır.',
          error: 'FILENAME_TOO_LONG'
        });
      }

      const validFilenameRegex = /^[a-zA-Z0-9\-\_\.]+$/;
      if (!validFilenameRegex.test(req.file.originalname)) {
        return res.status(400).json({ 
          message: 'Dosya adında sadece harf, rakam, tire (-) ve alt çizgi (_) kullanılabilir.',
          error: 'INVALID_FILENAME'
        });
      }

      try {
        if (report.filePath && global.supabase) {
          const { error } = await global.supabase.storage
            .from('reports')
            .remove([report.filePath]);
          
          if (error) {
            console.error('Error deleting old file from storage:', error);
          }
        }
      } catch (storageError) {
        console.error('Storage error:', storageError);
      }
      
      report.filePath = req.file.filename;
      report.originalFileName = req.file.originalname; 
    }

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

export async function getReportEditStatus(req, res) {
  const { id } = req.params;
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('getReportEditStatus:', { userId: req.user.id, role: req.user.role, reportId: id });
    }
    
    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.userId !== req.user.id) {
      return res.status(403).json({ 
        message: 'Forbidden: You can only check your own reports'
      });
    }

    const timeInfo = report.getTimeRemaining();
    
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
    
    await report.destroy();
    res.status(204).send();
  } catch (err) {
    console.error('deleteReport error:', err, err.stack);
    res.status(500).json({ message: 'Failed to delete report', error: err.message });
  }
}

export async function deleteBulkReports(req, res) {
  try {
    const { reportIds } = req.body;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Bulk delete request:', { reportCount: reportIds.length });
    }
    
    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({ message: 'Report IDs array is required' });
    }

    const reports = await Report.findAll({
      where: { id: reportIds }
    });

    const canDeleteAll = req.user.role === 'Yonetici';
    const unauthorizedReports = reports.filter(report => 
      !canDeleteAll && report.userId !== req.user.id
    );

    if (unauthorizedReports.length > 0) {
      return res.status(403).json({ 
        message: 'Some reports cannot be deleted due to insufficient permissions' 
      });
    }

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

export async function semanticSearch(req, res) {
    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ message: 'Arama terimi gereklidir.' });

        console.log(`[Semantic-Search] Arama: "${query}"`);
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        
        let queryVector;
        try {
            const aiResponse = await axios.post(`${aiServiceUrl}/embed-query`, { text: query });
            queryVector = aiResponse.data.embedding;
        } catch (aiError) {
            console.error('[Semantic-Search] AI Servisi Hatası:', aiError.message);
            return res.status(500).json({ message: 'AI servisine ulaşılamadı.' });
        }

        if (!queryVector) return res.status(500).json({ message: 'Vektör oluşturulamadı.' });

        const vectorString = JSON.stringify(queryVector);

        const results = await sequelize.query(
            `SELECT 
                r.id,
                r.file_path,
                r.original_file_name,
                r.ai_summary,
                r.ai_summary_short,
                r.ai_keywords, /* <--- DÜZELTME 6: SQL sorgusuna da eklendi */
                r.created_at,        
                r.updated_at,
                r.date,
                r.status,
                r.notes,
                r.uploader_first_name,
                r.uploader_last_name,
                r.user_id as "userId",
                u.email as "user_email",
                1 - (r.embedding <=> :vectorString) as similarity
             FROM reports r
             LEFT JOIN users u ON r.user_id = u.id
             WHERE r.embedding IS NOT NULL 
               AND (1 - (r.embedding <=> :vectorString)) > 0.40  
             ORDER BY similarity DESC
             LIMIT 5`,
            {
                replacements: { vectorString },
                type: sequelize.QueryTypes.SELECT
            }
        );

        console.log(`[Semantic-Search] ${results.length} sonuç bulundu.`);

        const finalResults = results.map(row => ({
            ...row,
            User: {
                email: row.user_email || 'Email Yok'
            }
        }));

        res.json(finalResults);

    } catch (error) {
        console.error('[Semantic-Search] Kritik Hata:', error);
        res.status(500).json({ message: 'Arama işleminde hata oluştu.', error: error.message });
    }
}

// getDashboardStats fonksiyonunu bu içerikle tamamen değiştir
export async function getDashboardStats(req, res) {
  try {
    // 1. Duygu Analizi Sayıları (Eşlemeyi garantili hale getiriyoruz)
    const sentimentResults = await Report.findAll({
      attributes: [
        'sentiment_label', 
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['sentiment_label'],
      raw: true
    });

    const sentimentCounts = sentimentResults.map(item => ({
      sentimentLabel: item.sentiment_label || 'Neutral',
      count: parseInt(item.count || 0)
    }));

    // 2. Kelime Bulutu Verisi
    const reports = await Report.findAll({ attributes: ['ai_keywords'], raw: true });
    const tagMap = {};
    reports.forEach(r => {
      const tags = r.ai_keywords || [];
      tags.forEach(tag => { tagMap[tag] = (tagMap[tag] || 0) + 1; });
    });

    const wordCloud = Object.entries(tagMap)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);

    console.log('[Dashboard-Stats] Veri Gönderiliyor:', { sentimentCounts });
    res.json({ sentimentCounts, wordCloud });
  } catch (error) {
    console.error('[Dashboard-Stats] Hata:', error);
    res.status(500).json({ message: 'İstatistik hatası' });
  }
}