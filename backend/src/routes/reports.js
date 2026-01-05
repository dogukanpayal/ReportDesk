import express from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import {
  uploadReport,
  getAllReports,
  getReportById,
  updateReport,
  deleteReport,
  downloadReportFile,
  getMyReports,
  updateReportStatus,
  updateBulkReportStatus,
  deleteBulkReports,
  getReportEditStatus,
  semanticSearch,
  getDashboardStats
} from '../controllers/reportController.js';
import upload from '../services/uploadService.js';

const router = express.Router();

// --- İstatistik Endpoint'i (En başa ekledik) ---
router.get('/stats/summary', authenticateJWT, getDashboardStats);

// --- Rapor Listeleme ve Arama ---
router.get('/', authenticateJWT, getAllReports);
router.get('/my', authenticateJWT, getMyReports);
router.get('/semantic-search', authenticateJWT, semanticSearch);

// --- Dosya İşlemleri ---
router.get('/download/:filename', authenticateJWT, downloadReportFile);
router.post('/', authenticateJWT, upload.single('file'), uploadReport);

// --- Tekil Rapor İşlemleri ---
router.get('/:id', authenticateJWT, getReportById);
router.get('/:id/edit-status', authenticateJWT, getReportEditStatus);
router.put('/:id', authenticateJWT, upload.single('file'), updateReport);
router.delete('/:id', authenticateJWT, deleteReport);

// --- Durum Güncelleme ve Toplu İşlemler ---
router.put('/bulk/status', authenticateJWT, requireRole('Yonetici'), updateBulkReportStatus);
router.put('/:id/status', authenticateJWT, requireRole('Yonetici'), updateReportStatus);
router.delete('/bulk', authenticateJWT, deleteBulkReports);

export default router;