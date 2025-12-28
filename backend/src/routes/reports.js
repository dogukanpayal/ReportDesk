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
} from '../controllers/reportController.js';
import upload from '../services/uploadService.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Report:
 *       type: object
 *       required:
 *         - filePath
 *         - userId
 *         - status
 *         - date
 *       properties:
 *         id:
 *           type: integer
 *           description: Rapor ID'si
 *         filePath:
 *           type: string
 *           description: Dosya yolu
 *         notes:
 *           type: string
 *           maxLength: 255
 *           description: Rapor notları
 *         userId:
 *           type: string
 *           format: uuid
 *           description: Kullanıcı ID'si
 *         status:
 *           type: string
 *           enum: [Submitted, Reviewed, Not Reviewed]
 *           description: Rapor durumu
 *         date:
 *           type: string
 *           format: date
 *           description: Rapor tarihi
 *         uploader_first_name:
 *           type: string
 *           description: Yükleyen kullanıcının adı
 *         uploader_last_name:
 *           type: string
 *           description: Yükleyen kullanıcının soyadı
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Oluşturulma zamanı
 *         updated_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Güncellenme zamanı
 */

/**
 * @swagger
 * /reports:
 *   get:
 *     summary: Tüm raporları getir (Yöneticiler için)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Sayfa numarası
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Sayfa başına rapor sayısı
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Tarih filtresi
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Submitted, Reviewed, Not Reviewed]
 *         description: Durum filtresi
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Kullanıcı ID filtresi
 *     responses:
 *       200:
 *         description: Başarılı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalItems:
 *                   type: integer
 *                 reports:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Report'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *       401:
 *         description: Yetkilendirme hatası
 *       403:
 *         description: Yetkisiz erişim
 */
router.get('/', authenticateJWT, getAllReports);

/**
 * @swagger
 * /reports/my:
 *   get:
 *     summary: Giriş yapmış kullanıcının raporlarını getir
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Sayfa numarası
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Sayfa başına rapor sayısı
 *     responses:
 *       200:
 *         description: Başarılı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalItems:
 *                   type: integer
 *                 reports:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Report'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *       401:
 *         description: Yetkilendirme hatası
 */
router.get('/my', authenticateJWT, getMyReports);

// --- YENİ EKLENEN SEMANTİK ARAMA ROUTE'U ---
/**
 * @swagger
 * /reports/semantic-search:
 * get:
 * summary: Yapay zeka destekli semantik arama
 * tags: [Reports]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: query
 * name: query
 * required: true
 * schema:
 * type: string
 * description: 'Aranacak metin (Örn: "Şirketin finansal durumu")'
 * responses:
 * 200:
 * description: Başarılı
 * 400:
 * description: Arama terimi eksik
 */
router.get('/semantic-search', authenticateJWT, semanticSearch);
// -------------------------------------------

router.get('/download/:filename', authenticateJWT, downloadReportFile);

/**
 * @swagger
 * /reports/download/{filename}:
 *   get:
 *     summary: Rapor dosyasını indir
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Dosya adı
 *     responses:
 *       200:
 *         description: Dosya başarıyla indirildi
 *       401:
 *         description: Yetkilendirme hatası
 *       404:
 *         description: Dosya bulunamadı
 */
router.get('/download/:filename', authenticateJWT, downloadReportFile);

/**
 * @swagger
 * /reports:
 *   post:
 *     summary: Yeni rapor yükle
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Rapor dosyası (PDF, DOC, DOCX, XLS, XLSX, TXT, max 50MB)
 *               notes:
 *                 type: string
 *                 maxLength: 255
 *                 description: Rapor notları (opsiyonel)
 *     responses:
 *       201:
 *         description: Rapor başarıyla yüklendi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       400:
 *         description: Geçersiz veri
 *       401:
 *         description: Yetkilendirme hatası
 */
router.post('/', authenticateJWT, upload.single('file'), uploadReport);

/**
 * @swagger
 * /reports/{id}:
 *   get:
 *     summary: ID ile rapor getir
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Rapor ID'si
 *     responses:
 *       200:
 *         description: Başarılı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       401:
 *         description: Yetkilendirme hatası
 *       404:
 *         description: Rapor bulunamadı
 */
router.get('/:id', authenticateJWT, getReportById);

/**
 * @swagger
 * /reports/{id}/edit-status:
 *   get:
 *     summary: Rapor düzenleme durumunu kontrol et (24 saat)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Rapor ID'si
 *     responses:
 *       200:
 *         description: Başarılı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 canEdit:
 *                   type: boolean
 *                 timeRemaining:
 *                   type: object
 *                   properties:
 *                     remainingHours:
 *                       type: integer
 *                     remainingMinutes:
 *                       type: integer
 *       401:
 *         description: Yetkilendirme hatası
 *       404:
 *         description: Rapor bulunamadı
 */
router.get('/:id/edit-status', authenticateJWT, getReportEditStatus);

/**
 * @swagger
 * /reports/{id}/status:
 *   put:
 *     summary: Rapor durumunu güncelle (Sadece yöneticiler)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Rapor ID'si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Submitted, Reviewed]
 *                 description: Yeni durum
 *     responses:
 *       200:
 *         description: Durum başarıyla güncellendi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       401:
 *         description: Yetkilendirme hatası
 *       403:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Rapor bulunamadı
 */
// Bulk status update endpoint - ÖNCE gelmeli!
router.put('/bulk/status', authenticateJWT, requireRole('Yonetici'), updateBulkReportStatus);

router.put('/:id/status', authenticateJWT, requireRole('Yonetici'), updateReportStatus);

/**
 * @swagger
 * /reports/{id}:
 *   put:
 *     summary: Raporu güncelle (24 saat limitli)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Rapor ID'si
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Yeni dosya (opsiyonel, PDF, DOC, DOCX, XLS, XLSX, TXT, max 50MB)
 *               notes:
 *                 type: string
 *                 maxLength: 255
 *                 description: Yeni notlar (opsiyonel)
 *     responses:
 *       200:
 *         description: Rapor başarıyla güncellendi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       400:
 *         description: Geçersiz veri veya 24 saat süresi doldu
 *       401:
 *         description: Yetkilendirme hatası
 *       403:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Rapor bulunamadı
 */
router.put('/:id', authenticateJWT, upload.single('file'), updateReport);

/**
 * @swagger
 * /reports/{id}:
 *   delete:
 *     summary: Raporu sil
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Rapor ID'si
 *     responses:
 *       200:
 *         description: Rapor başarıyla silindi
 *       401:
 *         description: Yetkilendirme hatası
 *       403:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Rapor bulunamadı
 */
// Bulk delete endpoint - ÖNCE gelmeli!
router.delete('/bulk', authenticateJWT, deleteBulkReports);

router.delete('/:id', authenticateJWT, deleteReport);

/**
 * @swagger
 * /reports/bulk-status:
 *   post:
 *     summary: Toplu rapor durumu güncelle
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reportIds
 *               - status
 *             properties:
 *               reportIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Güncellenecek rapor ID'leri
 *               status:
 *                 type: string
 *                 enum: [Submitted, Reviewed, Not Reviewed]
 *                 description: Yeni durum
 *     responses:
 *       200:
 *         description: Durumlar başarıyla güncellendi
 *       400:
 *         description: Geçersiz veri
 *       401:
 *         description: Yetkilendirme hatası
 */
router.post('/bulk-status', authenticateJWT, updateBulkReportStatus);

/**
 * @swagger
 * /reports/bulk-delete:
 *   delete:
 *     summary: Toplu rapor silme
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reportIds
 *             properties:
 *               reportIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Silinecek rapor ID'leri
 *     responses:
 *       200:
 *         description: Raporlar başarıyla silindi
 *       400:
 *         description: Geçersiz veri
 *       401:
 *         description: Yetkilendirme hatası
 */
router.delete('/bulk-delete', authenticateJWT, deleteBulkReports);

export default router; 