import React, { useState, useEffect } from 'react';
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
  InputAdornment,
  Switch,
  FormControlLabel
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { updateUser } from '../services/userService';

const EditUserModal = ({ open, onClose, user, onUserEdited }) => {
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: ''
  });
  
  // Form validation state
  const [errors, setErrors] = useState({});
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  
  // Kullanıcı verilerini forma doldur
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        password: '',
        role: user.role || 'Calisan'
      });
    }
  }, [user]);
  
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
  
  // Şifre değiştirme durumu
  const handleChangePasswordToggle = (e) => {
    setChangePassword(e.target.checked);
    if (!e.target.checked) {
      setFormData(prev => ({
        ...prev,
        password: ''
      }));
      setErrors(prev => ({
        ...prev,
        password: null
      }));
    }
  };
  
  // Şifre görünürlüğünü değiştir
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Form doğrulama
  const validateForm = () => {
    const newErrors = {};
    
    // Ad kontrolü
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Ad alanı zorunludur';
    }
    
    // Soyad kontrolü
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Soyad alanı zorunludur';
    }
    
    // Email kontrolü
    if (!formData.email.trim()) {
      newErrors.email = 'Email alanı zorunludur';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Geçerli bir email adresi giriniz';
      }
    }
    
    // Şifre kontrolü (sadece şifre değiştiriliyorsa)
    if (changePassword) {
      if (!formData.password) {
        newErrors.password = 'Şifre alanı zorunludur';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Şifre en az 6 karakter olmalıdır';
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
      // Şifre değiştirilmiyorsa gönderme
      const dataToSend = { ...formData };
      if (!changePassword) {
        delete dataToSend.password;
      }
      
      await updateUser(user.id, dataToSend);
      onUserEdited();
    } catch (err) {
      setError(err.message || 'Kullanıcı güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  // Formu sıfırla
  const handleReset = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        password: '',
        role: user.role || 'Calisan'
      });
    }
    setErrors({});
    setError(null);
    setChangePassword(false);
  };
  
  // Modal kapatıldığında formu sıfırla
  const handleClose = () => {
    handleReset();
    onClose();
  };
  
  if (!user) return null;
  
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
          Kullanıcı Düzenle
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
          
          {/* Şifre Değiştirme Switch */}
          <FormControlLabel
            control={
              <Switch 
                checked={changePassword} 
                onChange={handleChangePasswordToggle}
                color="primary"
              />
            }
            label="Şifreyi değiştir"
          />
          
          {/* Şifre (sadece değiştiriliyorsa göster) */}
          {changePassword && (
            <TextField
              name="password"
              label="Yeni Şifre"
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
          )}
          
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
          {loading ? 'Güncelleniyor...' : 'Güncelle'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditUserModal;
