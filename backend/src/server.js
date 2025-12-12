import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import sequelize from './utils/db.js';
import User from './models/User.js';
import Report from './models/Report.js';
import authRoutes from './routes/auth.js';
import reportRoutes from './routes/reports.js';
import userRoutes from './routes/users.js'; // Import new user routes
import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import cron from 'node-cron'; // Import cron for scheduling
import { generateDailyWarnings } from './controllers/userController.js'; // Import cron job functions

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Debug middleware: log all incoming requests
app.use((req, res, next) => {
  console.log('Gelen istek:', req.method, req.url);
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve('uploads')));

// Swagger Konfigürasyonu
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ReportDesk API',
      version: '1.0.0',
      description: 'Rapor yönetim sistemi API dokümantasyonu',
      contact: {
        name: 'API Support',
        email: 'support@reportdesk.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'] // API dosyalarının yolları
};

const specs = swaggerJsdoc(swaggerOptions);

// Swagger UI Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'ReportDesk API Documentation'
}));

// Routes
app.use('/auth', authRoutes);
app.use('/reports', reportRoutes);
app.use('/users', userRoutes); // Mount new user routes

// Health check
app.get('/', (req, res) => res.send('API is running'));

// Database connection test and start server
console.log('=== Database Connection Test ===');
console.log('Database config:', {
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT
});

sequelize.authenticate().then(() => {
  console.log('Database connection established successfully');
  console.log('=== Database Connection Completed ===');
  
  // Otomatik Günlük Uyarı Sistemi - Hafta içi her gün 09:00'te çalışır
  cron.schedule('1 18 * * 1-5', async () => {
    try {
      console.log('🕐 Otomatik günlük uyarı sistemi çalışıyor...');
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD formatında bugünün tarihi
      
      // Mock request ve response objeleri oluştur
      const mockReq = { 
        body: { date: today },
        user: { role: 'Yonetici' } // Yönetici yetkisi ver
      };
      
      const mockRes = {
        json: (data) => {
          console.log('✅ Otomatik günlük uyarılar oluşturuldu:', data);
          return data;
        },
        status: (code) => ({
          json: (data) => {
            console.log('❌ Hata kodu:', code, 'Hata:', data);
            return data;
          }
        })
      };
      
      // generateDailyWarnings fonksiyonunu çağır
      await generateDailyWarnings(mockReq, mockRes);
      
    } catch (error) {
      console.error('❌ Otomatik günlük uyarı oluşturulurken hata:', error);
    }
  }, {
    scheduled: true,
    timezone: "Europe/Istanbul"
  });
  
  console.log('⏰ Otomatik günlük uyarı sistemi aktif: Hafta içi her gün 09:55');
  
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('=== Database Connection Failed ===');
  console.error('Failed to connect to database:', err);
  console.error('Error stack:', err.stack);
  console.error('=== End Database Error ===');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err, err.stack);
  
  // Multer dosya yükleme hataları için özel mesajlar
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ 
      message: 'Dosya boyutu çok büyük. Maksimum 10 MB olmalıdır.',
      error: 'FILE_TOO_LARGE'
    });
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ 
      message: 'Çok fazla dosya yüklemeye çalışıyorsunuz. Tek seferde 1 dosya yükleyebilirsiniz.',
      error: 'TOO_MANY_FILES'
    });
  }
  
  // Dosya türü ve adı validasyon hataları
  if (err.message && err.message.includes('Desteklenmeyen dosya türü')) {
    return res.status(400).json({ 
      message: err.message,
      error: 'INVALID_FILE_TYPE'
    });
  }
  
  if (err.message && err.message.includes('Dosya adı çok uzun')) {
    return res.status(400).json({ 
      message: err.message,
      error: 'FILENAME_TOO_LONG'
    });
  }
  
  if (err.message && err.message.includes('Dosya adında sadece')) {
    return res.status(400).json({ 
      message: err.message,
      error: 'INVALID_FILENAME'
    });
  }
  
  res.status(500).json({ message: 'Internal server error', error: err.message });
}); 