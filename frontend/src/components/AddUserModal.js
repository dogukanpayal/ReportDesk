import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  InputAdornment
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { createUser } from '../services/userService';

const AddUserModal = ({ open, onClose, onUserAdded }) => {
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Calisan' // Varsayılan rol
  });
  
  // Form validation state
  const [errors, setErrors] = useState({});
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form değişikliği
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Hata mesajını temizle
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Şifre görünürlüğünü değiştir
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Form doğrulama - Backend ile uyumlu
  const validateForm = () => {
    const newErrors = {};
    
    // Ad kontrolü (backend ile aynı kurallar)
    if (!formData.firstName || typeof formData.firstName !== 'string') {
      newErrors.firstName = 'Ad alanı zorunludur';
    } else {
      const trimmed = formData.firstName.trim();
      if (trimmed.length < 2) {
        newErrors.firstName = 'Ad en az 2 karakter olmalıdır';
      } else if (trimmed.length > 50) {
        newErrors.firstName = 'Ad en fazla 50 karakter olabilir';
      }
    }
    
    // Soyad kontrolü (backend ile aynı kurallar)
    if (!formData.lastName || typeof formData.lastName !== 'string') {
      newErrors.lastName = 'Soyad alanı zorunludur';
    } else {
      const trimmed = formData.lastName.trim();
      if (trimmed.length < 2) {
        newErrors.lastName = 'Soyad en az 2 karakter olmalıdır';
      } else if (trimmed.length > 50) {
        newErrors.lastName = 'Soyad en fazla 50 karakter olabilir';
      }
    }
    
    // Email kontrolü (backend ile aynı kurallar)
    if (!formData.email || typeof formData.email !== 'string') {
      newErrors.email = 'Email alanı zorunludur';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Geçerli bir email adresi giriniz';
      }
    }
    
    // Şifre kontrolü (backend ile aynı kurallar)
    if (!formData.password || typeof formData.password !== 'string') {
      newErrors.password = 'Şifre alanı zorunludur';
    } else {
      if (formData.password.length < 8) {
        newErrors.password = 'Şifre en az 8 karakter olmalıdır';
      } else if (formData.password.length > 128) {
        newErrors.password = 'Şifre en fazla 128 karakter olabilir';
      }
    }
    
    // Rol kontrolü
    if (!formData.role) {
      newErrors.role = 'Rol seçimi zorunludur';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Formu gönder
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form doğrulama
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Backend ile uyumlu olması için verileri hazırla
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase(), // Case-insensitive
        password: formData.password,
        role: formData.role
      };
      
      await createUser(userData);
      onUserAdded();
      handleReset();
    } catch (err) {
      setError(err.message || 'Kullanıcı eklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  // Formu sıfırla
  const handleReset = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'Calisan'
    });
    setErrors({});
    setError(null);
  };
  
  // Modal kapatıldığında formu sıfırla
  const handleClose = () => {
    handleReset();
    onClose();
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #e0e0e0',
        bgcolor: '#f8f9fa'
      }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          Yeni Kullanıcı Ekle
        </Typography>
        <IconButton 
          edge="end" 
          color="inherit" 
          onClick={handleClose} 
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 4 }}>
        {/* Hata mesajı */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Ad ve Soyad */}
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <TextField
              name="firstName"
              label="Ad"
              value={formData.firstName}
              onChange={handleChange}
              fullWidth
              required
              error={Boolean(errors.firstName)}
              helperText={errors.firstName}
            />
            <TextField
              name="lastName"
              label="Soyad"
              value={formData.lastName}
              onChange={handleChange}
              fullWidth
              required
              error={Boolean(errors.lastName)}
              helperText={errors.lastName}
            />
          </Box>
          
          {/* Email */}
          <TextField
            name="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            required
            error={Boolean(errors.email)}
            helperText={errors.email}
          />
          
          {/* Şifre */}
          <TextField
            name="password"
            label="Şifre"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            fullWidth
            required
            error={Boolean(errors.password)}
            helperText={errors.password}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={togglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          {/* Rol */}
          <FormControl fullWidth required error={Boolean(errors.role)}>
            <InputLabel id="role-label">Rol</InputLabel>
            <Select
              labelId="role-label"
              name="role"
              value={formData.role}
              onChange={handleChange}
              label="Rol"
            >
              <MenuItem value="Yonetici">Yönetici</MenuItem>
              <MenuItem value="Calisan">Çalışan</MenuItem>
            </Select>
            {errors.role && (
              <Typography variant="caption" color="error">
                {errors.role}
              </Typography>
            )}
          </FormControl>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e0e0e0' }}>
        <Button 
          onClick={handleClose} 
          color="inherit"
          disabled={loading}
        >
          İptal
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
          sx={{
            bgcolor: '#3C8D40',
            '&:hover': { bgcolor: '#2E7D32' }
          }}
        >
          {loading ? 'Ekleniyor...' : 'Kullanıcı Ekle'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddUserModal;
