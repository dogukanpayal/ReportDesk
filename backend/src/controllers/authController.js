import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Environment validation
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

// Input validation helpers
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (password.length > 128) {
    return { valid: false, message: 'Password must be less than 128 characters' };
  }
  return { valid: true };
};

const validateName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: 'Name is required' };
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, message: 'Name must be at least 2 characters' };
  }
  if (trimmed.length > 50) {
    return { valid: false, message: 'Name must be less than 50 characters' };
  }
  return { valid: true, value: trimmed };
};

export async function register(req, res) {
  const { email, password, firstName, lastName } = req.body;
  
  // Input validation
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Email format validation
  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Password validation
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ message: passwordValidation.message });
  }

  // Name validation
  const firstNameValidation = validateName(firstName);
  if (!firstNameValidation.valid) {
    return res.status(400).json({ message: `First name: ${firstNameValidation.message}` });
  }

  const lastNameValidation = validateName(lastName);
  if (!lastNameValidation.valid) {
    return res.status(400).json({ message: `Last name: ${lastNameValidation.message}` });
  }

  try {
    // Check if user exists (case-insensitive)
    const existing = await User.findOne({ 
      where: { email: email.toLowerCase() } 
    });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    // Hash password with configurable rounds
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    
    // Create user
    const user = await User.create({ 
      email: email.toLowerCase(), 
      passwordHash, 
      role: 'Calisan', 
      firstName: firstNameValidation.value, 
      lastName: lastNameValidation.value 
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        firstName: user.firstName, 
        lastName: user.lastName 
      },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        firstName: user.firstName, 
        lastName: user.lastName 
      },
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ message: 'Registration failed' });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  
  // Input validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  // Email format validation
  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  try {
    // Find user (case-insensitive)
    const user = await User.findOne({ 
      where: { email: email.toLowerCase() } 
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.json({
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Login failed' });
  }
} 