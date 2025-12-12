import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

// JWT secret validation
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export async function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // Token format validation
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Invalid token format' });
  }

  const token = parts[1];
  
  // Development-only debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 JWT Authentication attempt');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Development-only debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ JWT decoded successfully for user:', decoded.email);
    }
    
    // Performance optimization: Use JWT data first, fallback to DB if needed
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      iat: decoded.iat,
      exp: decoded.exp
    };
    
    // Optional: Verify user still exists in DB (for security)
    // Only do this for critical operations or if user data might have changed
    if (process.env.NODE_ENV === 'production' && req.path.includes('/admin')) {
      const user = await User.findByPk(decoded.id);
      if (!user) {
        return res.status(403).json({ message: 'User not found' });
      }
      // Update req.user with latest data if needed
      req.user.role = user.role;
    }
    
    next();
  } catch (err) {
    // Development-only error logging
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ JWT verification failed:', err.message);
    }
    
    // Generic error message for security
    return res.status(403).json({ message: 'Invalid token' });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (req.user.role !== role) {
      return res.status(403).json({ message: 'Forbidden: Insufficient role' });
    }
    
    next();
  };
}

// Yönetici rolü kontrolü için middleware
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role !== 'Yonetici') {
    return res.status(403).json({ message: 'Bu işlem için yönetici yetkisi gereklidir' });
  }
  
  next();
}

// Belirli roller için erişim izni veren middleware
export function allowRoles(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!Array.isArray(roles)) {
      return res.status(500).json({ message: 'Invalid roles configuration' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz bulunmamaktadır' });
    }
    
    next();
  };
} 