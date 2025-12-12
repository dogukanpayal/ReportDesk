import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Button, 
  Container, 
  Typography, 
  Box, 
  TextField, 
  Card, 
  CardContent, 
  Divider, 
  Alert,
  Paper,
  Avatar,
  IconButton,
  InputAdornment,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Logout as LogoutIcon,
  Delete as DeleteIcon,
  Visibility,
  VisibilityOff,
  Save as SaveIcon,
  Edit as EditIcon,
  Security as SecurityIcon,
  AccountCircle as AccountIcon
} from '@mui/icons-material';
// Supabase import kaldırıldı - artık backend üzerinden API çağrıları yapılıyor
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../services/userService';

export default function SettingsPage() {
  const { user: authUser, logout, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  useEffect(() => {
    async function fetchProfile() {
      if (!authUser) return;
      
      try {
        // Backend API'den profil bilgilerini al
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/users/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setForm({ firstName: data.firstName, lastName: data.lastName, email: data.email });
        } else {
          console.error('Profil bilgileri alınamadı:', response.status);
        }
      } catch (error) {
        console.error('Profil bilgileri alınırken hata:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [authUser]);

  const handleLogout = () => {
    try {
      console.log('Logout button clicked');
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsUpdating(true);
    
    console.log('=== Frontend handleUpdate Debug ===');
    console.log('Sending form data:', form);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Response headers:', response.headers);
      
      if (response.ok) {
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        let updatedUser;
        try {
          updatedUser = JSON.parse(responseText);
          console.log('Parsed response:', updatedUser);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          setError('Sunucudan gelen yanıt işlenemedi');
          return;
        }
        
        setProfile(updatedUser);
        
        // AuthContext'teki kullanıcı bilgilerini güncelle
        setUser(updatedUser);
        console.log('AuthContext user updated successfully');
        
        // Form state'ini de güncelle
        setForm({
          firstName: updatedUser.firstName || '',
          lastName: updatedUser.lastName || '',
          email: updatedUser.email || ''
        });
        
        setSuccess('Profil başarıyla güncellendi!');
        console.log('=== Frontend handleUpdate Success ===');
        console.log('Updated form state:', {
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email
        });
      } else {
        const errorText = await response.text();
        console.log('Error response text:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          console.error('Error response JSON parse error:', parseError);
          errorData = { message: 'Bilinmeyen hata' };
        }
        
        console.log('Parsed error data:', errorData);
        setError(errorData.message || 'Güncelleme başarısız.');
      }
    } catch (err) {
      console.error('=== Frontend handleUpdate Error ===');
      console.error('Fetch error:', err);
      console.error('=== End Frontend handleUpdate Error ===');
      setError('Güncelleme sırasında hata oluştu.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setIsChangingPassword(true);
    
    console.log('=== Frontend handlePasswordChange Debug ===');
    console.log('Password form data:', { 
      currentPassword: passwordForm.currentPassword ? '***' : 'empty',
      newPassword: passwordForm.newPassword ? '***' : 'empty',
      confirmPassword: passwordForm.confirmPassword ? '***' : 'empty'
    });
    
    // Şifre eşleşme kontrolü
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Yeni şifreler eşleşmiyor');
      setIsChangingPassword(false);
      return;
    }
    
    // Şifre uzunluk kontrolü
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Yeni şifre en az 6 karakter olmalıdır');
      setIsChangingPassword(false);
      return;
    }
    
    try {
      console.log('Calling changePassword API...');
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      console.log('Password change successful');
      setPasswordSuccess('Şifre başarıyla güncellendi!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      console.log('=== Frontend handlePasswordChange Success ===');
    } catch (err) {
      console.error('=== Frontend handlePasswordChange Error ===');
      console.error('Password change error:', err);
      console.error('Error message:', err.message);
      console.error('=== End Frontend handlePasswordChange Error ===');
      setPasswordError(err.message || 'Şifre güncellenemedi.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Hesabınızı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/users/me`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          logout();
          navigate('/login');
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Hesap silinemedi.');
        }
      } catch (err) {
        setError('Hesap silinirken hata oluştu.');
      }
    }
  };

  if (!authUser) return null;
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }
  
  if (!profile) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mt: 2 }}>
          Profil bilgileri yüklenemedi
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>

      {/* Alerts */}
      <Box sx={{ mb: 3 }}>
        {error && (
          <Alert 
            severity="error" 
            onClose={() => setError('')} 
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert 
            severity="success" 
            onClose={() => setSuccess('')} 
            sx={{ mb: 2 }}
          >
            {success}
          </Alert>
        )}
      </Box>

      {/* Profile Update Section */}
      <Card 
        component="form" 
        onSubmit={handleUpdate} 
        sx={{ 
          mb: 4, 
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid rgba(0,0,0,0.05)'
        }}
      >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <PersonIcon sx={{ mr: 2, color: '#3C8D40', fontSize: '1.5rem' }} />
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#1C1F2A' }}>
                Profil Bilgilerimi Güncelle
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 3, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                label="Ad"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              <TextField
                label="Soyad"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Box>
            
            <TextField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            
            <Button 
              type="submit" 
              variant="contained" 
              disabled={isUpdating}
              startIcon={isUpdating ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              sx={{ 
                borderRadius: 2,
                px: 4,
                py: 1.5,
                backgroundColor: '#3C8D40',
                '&:hover': {
                  backgroundColor: '#2E7D32',
                }
              }}
            >
              {isUpdating ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
            </Button>
          </CardContent>
        </Card>

      {/* Password Change Section */}
      <Card 
        component="form" 
        onSubmit={handlePasswordChange} 
        sx={{ 
          mb: 4, 
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid rgba(0,0,0,0.05)'
        }}
      >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <LockIcon sx={{ mr: 2, color: '#4CAF50', fontSize: '1.5rem' }} />
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#1C1F2A' }}>
                Şifre Değiştir
              </Typography>
            </Box>
            
            {passwordError && (
              <Alert 
                severity="error" 
                onClose={() => setPasswordError('')} 
                sx={{ mb: 3 }}
              >
                {passwordError}
              </Alert>
            )}
            {passwordSuccess && (
              <Alert 
                severity="success" 
                onClose={() => setPasswordSuccess('')} 
                sx={{ mb: 3 }}
              >
                {passwordSuccess}
              </Alert>
            )}
            
            <TextField
              label="Mevcut Şifre"
              name="currentPassword"
              type={showPasswords.current ? 'text' : 'password'}
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
              fullWidth
              variant="outlined"
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility('current')}
                      edge="end"
                    >
                      {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            <TextField
              label="Yeni Şifre"
              name="newPassword"
              type={showPasswords.new ? 'text' : 'password'}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              fullWidth
              variant="outlined"
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility('new')}
                      edge="end"
                    >
                      {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            <TextField
              label="Yeni Şifre Tekrar"
              name="confirmPassword"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              fullWidth
              variant="outlined"
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility('confirm')}
                      edge="end"
                    >
                      {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            <Button 
              type="submit" 
              variant="contained" 
              disabled={isChangingPassword}
              startIcon={isChangingPassword ? <CircularProgress size={20} color="inherit" /> : <SecurityIcon />}
              sx={{ 
                borderRadius: 2,
                px: 4,
                py: 1.5,
                backgroundColor: '#4CAF50',
                '&:hover': {
                  backgroundColor: '#3C8D40',
                }
              }}
            >
              {isChangingPassword ? 'Değiştiriliyor...' : 'Şifre Değiştir'}
            </Button>
          </CardContent>
        </Card>

      {/* Account Operations Section */}
      <Card 
        sx={{ 
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid rgba(0,0,0,0.05)'
        }}
      >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <EditIcon sx={{ mr: 2, color: '#3C8D40', fontSize: '1.5rem' }} />
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#1C1F2A' }}>
                Hesap İşlemleri
              </Typography>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              p: 3,
              borderRadius: 2,
              bgcolor: '#f8f9fa',
              mb: 2
            }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 500, mb: 0.5 }}>
                  Çıkış Yap
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hesabınızdan güvenli bir şekilde çıkış yapın
                </Typography>
              </Box>
              <Button 
                variant="outlined" 
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  borderColor: '#3C8D40',
                  color: '#3C8D40',
                  '&:hover': {
                    borderColor: '#2E7D32',
                    backgroundColor: 'rgba(60, 141, 64, 0.1)'
                  }
                }}
              >
                Çıkış Yap
              </Button>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              p: 3,
              borderRadius: 2,
              bgcolor: '#fff5f5',
              border: '1px solid #fed7d7'
            }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 500, mb: 0.5, color: '#e53e3e' }}>
                  Hesabı Sil
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hesabınızı kalıcı olarak silin. Bu işlem geri alınamaz.
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                color="error" 
                onClick={handleDelete}
                startIcon={<DeleteIcon />}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #ff5252 0%, #e53935 100%)',
                  }
                }}
              >
                Hesabı Sil
              </Button>
            </Box>
          </CardContent>
        </Card>
    </Container>
  );
} 