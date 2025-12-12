// Security Middleware - Güvenlik ve Rate Limiting
import rateLimit from 'express-rate-limit';

// Rate limiting configuration
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again in 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many requests',
    message: 'Please try again in 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security headers middleware
export function securityHeaders(req, res, next) {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // CORS headers (if needed)
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  next();
}

// Request sanitization middleware
export function sanitizeInput(req, res, next) {
  // Remove potentially dangerous characters from string inputs
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  };

  // Sanitize body
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }

  // Sanitize query parameters
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    }
  }

  next();
}

// Request logging middleware (for security monitoring)
export function securityLogging(req, res, next) {
  const startTime = Date.now();
  
  // Log suspicious activities
  const suspiciousPatterns = [
    /script/i,
    /javascript/i,
    /<script/i,
    /eval\(/i,
    /alert\(/i,
    /document\./i,
    /window\./i
  ];

  const checkSuspicious = (obj, path = '') => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        const value = obj[key];
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(value)) {
            console.warn(`🚨 Suspicious input detected at ${path}.${key}:`, value);
          }
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        checkSuspicious(obj[key], `${path}.${key}`);
      }
    }
  };

  // Check request body and query for suspicious content
  if (req.body) checkSuspicious(req.body, 'body');
  if (req.query) checkSuspicious(req.query, 'query');

  // Log request details
  const logData = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    duration: Date.now() - startTime
  };

  // Only log in development or for errors
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Request:', logData);
  }

  next();
}

// Error handling middleware
export function securityErrorHandler(err, req, res, next) {
  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    console.error('Security error:', err.message);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }

  // In development, show more details
  console.error('Security error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: err.message,
    stack: err.stack
  });
}
