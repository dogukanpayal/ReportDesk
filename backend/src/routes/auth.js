import express from 'express';
import { register, login } from '../controllers/authController.js';
import { authRateLimit, securityHeaders, sanitizeInput, securityLogging } from '../middleware/security.js';

const router = express.Router();

// Apply security middleware to all auth routes
router.use(securityHeaders);
router.use(sanitizeInput);
router.use(securityLogging);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Yeni kullanıcı kaydı
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Kullanıcı email adresi
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 128
 *                 pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$'
 *                 description: Kullanıcı şifresi (en az 8 karakter, büyük harf, küçük harf ve rakam içermeli)
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: Kullanıcı adı (2-50 karakter)
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: Kullanıcı soyadı (2-50 karakter)
 *               role:
 *                 type: string
 *                 enum: [Calisan, Yonetici]
 *                 description: Kullanıcı rolü
 *     responses:
 *       201:
 *         description: Kullanıcı başarıyla oluşturuldu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Geçersiz veri veya validation hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "All fields are required"
 *       409:
 *         description: Email zaten kullanımda
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email already registered"
 */
router.post('/register', authRateLimit, register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Kullanıcı girişi
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Kullanıcı email adresi
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 128
 *                 description: Kullanıcı şifresi (8-128 karakter)
 *     responses:
 *       200:
 *         description: Başarılı giriş
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Geçersiz email veya şifre
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid credentials"
 *       400:
 *         description: Geçersiz veri
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email and password required"
 */
router.post('/login', authRateLimit, login);

export default router; 