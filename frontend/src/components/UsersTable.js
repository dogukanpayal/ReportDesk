import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  IconButton,
  Chip,
  Typography,
  useTheme,
  useMediaQuery,
  Pagination,
  Select,
  MenuItem,
  Card
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AvatarIcon from '@mui/icons-material/Person';

// Rol renklerini belirle
const roleColors = {
  'Yonetici': 'warning', // Turuncu renk (incelenmedi etiketi gibi)
  'Calisan': 'primary',
};

// Rol Türkçe çevirileri
const roleTurkish = {
  'Yonetici': 'Yönetici',
  'Calisan': 'Çalışan',
};

const UsersTable = ({
  users,
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onEditUser,
  onDeleteUser,
  currentUser
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  // localStorage'dan sıralama değerlerini yükle
  useEffect(() => {
    const savedSortField = localStorage.getItem('usersSortField') || '';
    const savedSortDirection = localStorage.getItem('usersSortDirection') || 'asc';
    
    setSortField(savedSortField);
    setSortDirection(savedSortDirection);
  }, []);

  // Sıralama işlemi
  const handleSort = (field) => {
    let newDirection = 'asc';
    
    if (sortField === field) {
      // Aynı sütuna tekrar tıklandığında yönü değiştir
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    
    setSortField(field);
    setSortDirection(newDirection);
    localStorage.setItem('usersSortField', field);
    localStorage.setItem('usersSortDirection', newDirection);
  };

  // Kullanıcıları sırala
  const sortUsers = (usersToSort) => {
    if (!sortField) return usersToSort;

    return [...usersToSort].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Ad Soyad için özel sıralama
      if (sortField === 'fullName') {
        aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
        bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
      }

      // Tarih için özel sıralama
      if (sortField === 'createdAt') {
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
      }

      // String karşılaştırma
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };
  
  // Tarih formatla - UTC+3 saat dilimi ekle
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    
    // Geçerli tarih kontrolü
    if (isNaN(date.getTime())) return '-';
    
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Istanbul'
    });
  };

  return (
    <>
      {/* Kullanıcılar Tablosu */}
      {isMobile ? (
        // Mobil Card Layout
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {users.length > 0 ? (
            sortUsers(users).map((user) => (
              <Card key={user.id} sx={{ 
                p: 2, 
                borderRadius: 2,
                backgroundColor: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s ease'
              }}>
                {/* Kullanıcı Bilgileri */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600, 
                    color: '#1C1F2A',
                    fontSize: '16px',
                    mb: 1
                  }}>
                    {user.firstName} {user.lastName}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ 
                    color: '#666',
                    fontSize: '14px',
                    mb: 1
                  }}>
                    {user.email}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip 
                      label={roleTurkish[user.role] || user.role} 
                      color={roleColors[user.role] || 'default'} 
                      size="small"
                      sx={{ fontSize: '12px' }}
                    />
                    <Typography variant="caption" sx={{ color: '#999' }}>
                      {formatDate(user.createdAt)}
                    </Typography>
                  </Box>
                </Box>
                
                {/* İşlem Butonları */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  justifyContent: 'flex-end',
                  borderTop: '1px solid #f0f0f0',
                  pt: 1.5
                }}>
                  <IconButton 
                    size="small" 
                    onClick={() => onEditUser(user)}
                    disabled={currentUser && currentUser.id === user.id}
                    title={currentUser && currentUser.id === user.id ? "Kendi hesabınızı buradan düzenleyemezsiniz" : "Düzenle"}
                    sx={{ 
                      color: currentUser && currentUser.id === user.id ? '#BDBDBD' : '#2196F3',
                      backgroundColor: currentUser && currentUser.id === user.id ? '#F5F5F5' : '#E3F2FD',
                      cursor: currentUser && currentUser.id === user.id ? 'not-allowed' : 'pointer',
                      '&:hover': { 
                        backgroundColor: currentUser && currentUser.id === user.id ? '#F5F5F5' : '#BBDEFB',
                        transform: currentUser && currentUser.id === user.id ? 'none' : 'scale(1.05)'
                      },
                      transition: 'all 0.3s ease',
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px'
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => onDeleteUser(user)}
                    title="Sil"
                    sx={{ 
                      backgroundColor: '#FFEBEE',
                      '&:hover': { 
                        backgroundColor: '#FFCDD2',
                        transform: 'scale(1.05)'
                      },
                      transition: 'all 0.3s ease',
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px'
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Card>
            ))
          ) : (
            <Card sx={{ 
              p: 3, 
              textAlign: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: 2
            }}>
              <Typography variant="body1" color="text.secondary">
                Kullanıcı bulunamadı
              </Typography>
            </Card>
          )}
        </Box>
      ) : (
        // Masaüstü Tablo Layout
        <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
          <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{ 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: '#f5f5f5' },
                  userSelect: 'none'
                }}
                onClick={() => handleSort('fullName')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Ad Soyad
                  {sortField === 'fullName' && (
                    <Box component="span" sx={{ 
                      color: '#000000',
                      fontSize: '12px',
                      fontWeight: 'normal'
                    }}>
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </Box>
                  )}
                </Box>
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: '#f5f5f5' },
                  userSelect: 'none'
                }}
                onClick={() => handleSort('email')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Email
                  {sortField === 'email' && (
                    <Box component="span" sx={{ 
                      color: '#000000',
                      fontSize: '12px',
                      fontWeight: 'normal'
                    }}>
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </Box>
                  )}
                </Box>
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: '#f5f5f5' },
                  userSelect: 'none'
                }}
                onClick={() => handleSort('role')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Rol
                  {sortField === 'role' && (
                    <Box component="span" sx={{ 
                      color: '#000000',
                      fontSize: '12px',
                      fontWeight: 'normal'
                    }}>
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </Box>
                  )}
                </Box>
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: '#f5f5f5' },
                  userSelect: 'none'
                }}
                onClick={() => handleSort('createdAt')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Kayıt Tarihi
                  {sortField === 'createdAt' && (
                    <Box component="span" sx={{ 
                      color: '#000000',
                      fontSize: '12px',
                      fontWeight: 'normal'
                    }}>
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </Box>
                  )}
                </Box>
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length > 0 ? (
              sortUsers(users).map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={roleTurkish[user.role] || user.role} 
                      color={roleColors[user.role] || 'default'} 
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      onClick={() => onEditUser(user)}
                      disabled={currentUser && currentUser.id === user.id}
                      title={currentUser && currentUser.id === user.id ? "Kendi hesabınızı buradan düzenleyemezsiniz" : "Düzenle"}
                      sx={{ 
                        color: currentUser && currentUser.id === user.id ? '#BDBDBD' : '#2196F3',
                        cursor: currentUser && currentUser.id === user.id ? 'not-allowed' : 'pointer',
                        '&:hover': { 
                          backgroundColor: currentUser && currentUser.id === user.id ? 'transparent' : '#E3F2FD',
                          transform: currentUser && currentUser.id === user.id ? 'none' : 'scale(1.05)'
                        },
                        transition: 'all 0.3s ease',
                        width: '40px',
                        height: '40px',
                        borderRadius: '4px'
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => onDeleteUser(user)}
                      title="Sil"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    Kullanıcı bulunamadı
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
        )}
      

    </>
  );
};

export default UsersTable;
