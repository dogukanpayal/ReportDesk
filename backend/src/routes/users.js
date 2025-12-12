import express from 'express';
import { authenticateJWT, requireRole, requireAdmin, allowRoles } from '../middleware/auth.js';
import { 
  getMe, 
  updateMe, 
  deleteMe, 
  changePassword, 
  getReporters, 
  getAllUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser, 
  getDashboardStats, 
  getRecentActivities, 
  getDailyStatus,
  generateDailyWarnings,
  getDailyWarnings,
  getSavedWarnings,
  markDailyWarningAsRead,
  saveDailyWarning,
  unsaveDailyWarning,
  deleteDailyWarning
} from '../controllers/userController.js';

const router = express.Router();

// Get the currently logged-in user's profile
router.get('/me', authenticateJWT, getMe);

// Get a list of users who have submitted reports (for manager filters)
router.get('/reporters', authenticateJWT, getReporters);

// Dashboard routes (sadece yöneticiler)
router.get('/dashboard/stats', authenticateJWT, requireAdmin, getDashboardStats);
router.get('/dashboard/recent', authenticateJWT, requireAdmin, getRecentActivities);
router.get('/dashboard/daily-status', authenticateJWT, requireAdmin, getDailyStatus);

// Günlük bildirim sistemi (sadece yöneticiler)
router.post('/dashboard/generate-warnings', authenticateJWT, requireAdmin, generateDailyWarnings);
router.get('/dashboard/daily-warnings', authenticateJWT, requireAdmin, getDailyWarnings);
router.get('/dashboard/warnings/saved', authenticateJWT, requireAdmin, getSavedWarnings);
router.put('/dashboard/warnings/:id/read', authenticateJWT, requireAdmin, markDailyWarningAsRead);
router.post('/dashboard/warnings/:id/save', authenticateJWT, requireAdmin, saveDailyWarning);
router.post('/dashboard/warnings/:id/unsave', authenticateJWT, requireAdmin, unsaveDailyWarning);
router.delete('/dashboard/warnings/:id', authenticateJWT, requireAdmin, deleteDailyWarning);

// Update the currently logged-in user's profile
router.put('/me', authenticateJWT, updateMe);
router.put('/password', authenticateJWT, changePassword);
router.delete('/me', authenticateJWT, deleteMe);

// Yönetici için kullanıcı yönetimi rotaları
router.get('/', authenticateJWT, requireAdmin, getAllUsers);
router.get('/:id', authenticateJWT, requireAdmin, getUserById);
router.post('/', authenticateJWT, requireAdmin, createUser);
router.put('/:id', authenticateJWT, requireAdmin, updateUser);
router.delete('/:id', authenticateJWT, requireAdmin, deleteUser);

export default router; 