import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Alert, 
  Paper,
  Card,
  CardContent,
  Avatar,
  InputAdornment,
  IconButton,
  CircularProgress,
  Fade,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  Business as BusinessIcon
} from '@mui/icons-material';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Unique key for consistent rendering
  const [loginKey, setLoginKey] = useState(Date.now());

  useEffect(() => {
    // Login sayfasına geldiğinde logout timestamp'i temizle
    sessionStorage.removeItem('logoutTimestamp');
    
    // User varsa ve loading false ise yönlendir
    if (user && !loading) {
      navigate('/dashboard');
    }
    
    // Her login sayfası yüklendiğinde unique key'i güncelle
    setLoginKey(Date.now());
  }, [user, navigate, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(form.email, form.password);
      // Yönlendirme useEffect ile yapılacak
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      key={loginKey}
      sx={{
        minHeight: '100vh',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        px: 2
      }}
    >
      <Container maxWidth="sm">
        <Fade in={true} timeout={800}>
          <Card
            sx={{
              borderRadius: 4,
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              maxWidth: 480,
              mx: 'auto'
            }}
          >
            {/* Header Section */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #3C8D40 0%, #2E7D32 100%)',
                p: 4,
                textAlign: 'center',
                color: 'white'
              }}
            >
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  fontSize: '2.5rem'
                }}
              >
                <BusinessIcon sx={{ fontSize: '2.5rem' }} />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                ReportDesk
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                Hesabınıza giriş yapın
              </Typography>
            </Box>

            {/* Form Section */}
            <CardContent sx={{ p: 4 }}>
              <Fade in={true} timeout={1000}>
                <Box>
                  {error && (
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mb: 3, 
                        borderRadius: 2,
                        '& .MuiAlert-message': {
                          width: '100%'
                        }
                      }}
                    >
                      {error}
                    </Alert>
                  )}

                  <form key={`form-${loginKey}`} onSubmit={handleSubmit}>
                    <TextField
                      key={`email-${loginKey}`}
                      label="E-posta"
                      type="email"
                      fullWidth
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      required
                      disabled={isLoading}
                      sx={{ 
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          fontSize: '1rem',
                          backgroundColor: 'white !important',
                          // Otomatik tamamlama mavi rengini tamamen kaldır
                          '& input': {
                            backgroundColor: 'white !important',
                            '&:-webkit-autofill': {
                              WebkitBoxShadow: '0 0 0 1000px white inset !important',
                              WebkitTextFillColor: '#000000 !important',
                              backgroundColor: 'white !important',
                              transition: 'background-color 5000s ease-in-out 0s !important',
                            },
                            '&:-webkit-autofill:hover': {
                              WebkitBoxShadow: '0 0 0 1000px white inset !important',
                              WebkitTextFillColor: '#000000 !important',
                              backgroundColor: 'white !important',
                            },
                            '&:-webkit-autofill:focus': {
                              WebkitBoxShadow: '0 0 0 1000px white inset !important',
                              WebkitTextFillColor: '#000000 !important',
                              backgroundColor: 'white !important',
                            },
                            '&:-webkit-autofill:active': {
                              WebkitBoxShadow: '0 0 0 1000px white inset !important',
                              WebkitTextFillColor: '#000000 !important',
                              backgroundColor: 'white !important',
                            }
                          }
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '1rem'
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon sx={{ color: '#3C8D40' }} />
                          </InputAdornment>
                        )
                      }}
                    />

                    <TextField
                      key={`password-${loginKey}`}
                      label="Şifre"
                      type={showPassword ? 'text' : 'password'}
                      fullWidth
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      required
                      disabled={isLoading}
                      sx={{ 
                        mb: 4,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          fontSize: '1rem',
                          backgroundColor: 'white !important',
                          // Otomatik tamamlama mavi rengini tamamen kaldır
                          '& input': {
                            backgroundColor: 'white !important',
                            '&:-webkit-autofill': {
                              WebkitBoxShadow: '0 0 0 1000px white inset !important',
                              WebkitTextFillColor: '#000000 !important',
                              backgroundColor: 'white !important',
                              transition: 'background-color 5000s ease-in-out 0s !important',
                            },
                            '&:-webkit-autofill:hover': {
                              WebkitBoxShadow: '0 0 0 1000px white inset !important',
                              WebkitTextFillColor: '#000000 !important',
                              backgroundColor: 'white !important',
                            },
                            '&:-webkit-autofill:focus': {
                              WebkitBoxShadow: '0 0 0 1000px white inset !important',
                              WebkitTextFillColor: '#000000 !important',
                              backgroundColor: 'white !important',
                            },
                            '&:-webkit-autofill:active': {
                              WebkitBoxShadow: '0 0 0 1000px white inset !important',
                              WebkitTextFillColor: '#000000 !important',
                              backgroundColor: 'white !important',
                            }
                          }
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '1rem'
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon sx={{ color: '#3C8D40' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={togglePasswordVisibility}
                              edge="end"
                              disabled={isLoading}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={isLoading}
                      startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                      sx={{
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        borderRadius: 2,
                        backgroundColor: '#3C8D40',
                        '&:hover': {
                          backgroundColor: '#2E7D32',
                        },
                        '&:disabled': {
                          backgroundColor: '#A5D6A7',
                        }
                      }}
                    >
                      {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                    </Button>
                  </form>

                  {/* Footer Info */}
                  <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Güvenli giriş için bilgilerinizi doğru girdiğinizden emin olun
                    </Typography>
                  </Box>
                </Box>
              </Fade>
            </CardContent>
          </Card>
        </Fade>
      </Container>
    </Box>
  );
} 