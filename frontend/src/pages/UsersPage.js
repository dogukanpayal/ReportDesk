import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Container,
  Breadcrumbs,
  Link,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import UsersTable from '../components/UsersTable';
import Pagination from '../components/Pagination';
import AddUserModal from '../components/AddUserModal';
import EditUserModal from '../components/EditUserModal';
import DeleteUserConfirmModal from '../components/DeleteUserConfirmModal';
import { getUsers, deleteUser } from '../services/userService';

const UsersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    // localStorage'dan kaydedilmiş değeri al, yoksa varsayılan 10 kullan
    const saved = localStorage.getItem('usersPageSize');
    return saved ? parseInt(saved, 10) : 10;
  });
  const [search, setSearch] = useState(''); // API çağrıları için
  const [inputValue, setInputValue] = useState(''); // Input görünümü için
  const [roleFilter, setRoleFilter] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // Yönetici yetkisi kontrolü
  useEffect(() => {
    if (user && user.role !== 'Yonetici') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // localStorage'dan filtre değerlerini yükle
  useEffect(() => {
    const savedSearch = localStorage.getItem('usersSearchTerm') || '';
    const savedRoleFilter = localStorage.getItem('usersRoleFilter') || '';
    
    if (savedSearch) {
      setInputValue(savedSearch);
      setSearch(savedSearch);
    }
    if (savedRoleFilter) {
      setRoleFilter(savedRoleFilter);
    }
  }, []);

  // fetchUsers fonksiyonunu useCallback ile optimize et
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Page değerinin geçerli olduğundan emin ol
      const validPage = isNaN(page) || page < 0 ? 0 : page;
      const validRowsPerPage = isNaN(rowsPerPage) || rowsPerPage < 1 ? 10 : rowsPerPage;
      
      const data = await getUsers(validPage, validRowsPerPage, search, roleFilter);
      setUsers(data.users);
      setTotalCount(data.totalCount);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Kullanıcılar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, roleFilter]);

  // Sayfa yüklendiğinde ve filtreleme/sayfalama değiştiğinde kullanıcıları getir
  useEffect(() => {
    if (user && user.role === 'Yonetici') {
      fetchUsers();
    }
  }, [fetchUsers, user]);

  // Kullanıcılar sayfasına her geldiğinde verileri yenile
  useEffect(() => {
    if (user && user.role === 'Yonetici') {
      // Pencere odaklandığında da yenile
      const handleFocus = () => {
        fetchUsers();
      };
      
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [user, fetchUsers]);

  // Sayfa değişikliği - Pagination component 0 bazlı sayfa numarası geçer
  const handlePageChange = (newPage) => {
    // Pagination component 0 bazlı sayfa numarası geçer
    const pageNumber = parseInt(newPage, 10);
    if (!isNaN(pageNumber) && pageNumber >= 0) {
      setPage(pageNumber);
    } else {
      // Geçersiz sayfa numarası durumunda 0'a sıfırla
      console.warn('Invalid page number received:', newPage, 'resetting to 0');
      setPage(0);
    }
  };

  // Sayfa başına gösterilen öğe sayısı değişikliği
  const handleRowsPerPageChange = (value) => {
    // Geçerli bir sayı olduğundan emin ol ve 1-50 arasında sınırla
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      const newPageSize = Math.min(50, numValue);
      setRowsPerPage(newPageSize);
      setPage(0); // İlk sayfaya dön
      localStorage.setItem('usersPageSize', newPageSize.toString());
    }
  };

  // Debounced arama fonksiyonu
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId;
      return (value) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setSearch(value);
          setPage(0);
        }, 300); // 300ms gecikme
      };
    })(),
    []
  );

  // Arama değişikliği - gerçek zamanlı güncelleme
  const handleSearchChange = (value) => {
    // Input değerini hemen güncelle (UI için)
    setInputValue(value);
    // Debounced arama için değeri geçir
    debouncedSearch(value);
    // localStorage'a kaydet
    if (value) {
      localStorage.setItem('usersSearchTerm', value);
    } else {
      localStorage.removeItem('usersSearchTerm');
    }
  };

  // Rol filtresi değişikliği - localStorage'a kaydet
  const handleRoleFilterChange = (value) => {
    setRoleFilter(value);
    setPage(0);
    localStorage.setItem('usersRoleFilter', value);
  };

  // Kullanıcı ekleme modalını aç
  const handleAddUser = () => {
    setAddModalOpen(true);
  };

  // Kullanıcı düzenleme modalını aç
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  // Kullanıcı silme modalını aç
  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  // Kullanıcı ekleme başarılı
  const handleUserAdded = () => {
    setAddModalOpen(false);
    showToast('Kullanıcı başarıyla eklendi', 'success');
    fetchUsers();
  };

  // Kullanıcı düzenleme başarılı
  const handleUserEdited = () => {
    setEditModalOpen(false);
    showToast('Kullanıcı başarıyla güncellendi', 'success');
    fetchUsers();
  };

  // Kullanıcı silme işlemi
  const handleUserDeleted = async () => {
    if (!selectedUser) return;
    
    try {
      await deleteUser(selectedUser.id);
      setDeleteModalOpen(false);
      showToast('Kullanıcı başarıyla silindi', 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Kullanıcı silinirken bir hata oluştu', 'error');
    }
  };

  // Toast mesajı göster
  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  // Toast kapat
  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  if (user && user.role !== 'Yonetici') {
    return null; // Yönetici değilse hiçbir şey gösterme
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Başlık ve Breadcrumbs */}
      <Box sx={{ 
        mb: 4,
        textAlign: { xs: 'center', md: 'left' }
      }}>
        {/* Ana Başlık */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'center', md: 'flex-start' },
          gap: { xs: 2, md: 3 },
          mb: 3,
          p: { xs: 2, md: 3 },
          backgroundColor: '#F8F9FA',
          borderRadius: 3,
          border: '1px solid #E9ECEF',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          {/* Başlık Metni */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: { xs: 'center', md: 'flex-start' }
          }}>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 700, 
                color: '#1C1F2A', 
                mb: 0.5,
                fontSize: { xs: '24px', md: '32px' },
                textAlign: { xs: 'center', md: 'left' }
              }}
            >
              Kullanıcılar
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '14px', md: '16px' },
                textAlign: { xs: 'center', md: 'left' }
              }}
            >
              Sistem kullanıcılarını yönetin ve düzenleyin
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Hata mesajı */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Kullanıcı ekleme butonu */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end',
        mb: 3 
      }}>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={handleAddUser}
          sx={{
            backgroundColor: '#3C8D40',
            '&:hover': { backgroundColor: '#2E7D32' },
            minHeight: '36px',
            height: '36px',
            textTransform: 'none',
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            fontWeight: 500,
            borderRadius: 1,
            px: { xs: 1, sm: 2 },
            py: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          Yeni Kullanıcı Ekle
        </Button>
      </Box>



      {/* Arama ve Filtreler */}
      <Paper sx={{ 
        width: '100%', 
        borderRadius: 2, 
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        mb: 3,
        p: 3
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2, 
          alignItems: { xs: 'stretch', md: 'center' }
        }}>
          {/* Arama Çubuğu */}
          <TextField
            placeholder="Kullanıcı ara..."
            variant="outlined"
            size="small"
            value={inputValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            sx={{ 
              minWidth: { xs: '100%', md: 300 },
              flexGrow: 1
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: inputValue && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => handleSearchChange('')}
                    title="Aramayı temizle"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          {/* Rol Filtresi */}
          <FormControl variant="outlined" size="small" sx={{ 
            minWidth: { xs: '100%', md: 150 }
          }}>
            <InputLabel id="role-filter-label">Rol</InputLabel>
            <Select
              labelId="role-filter-label"
              value={roleFilter}
              onChange={(e) => handleRoleFilterChange(e.target.value)}
              label="Rol"
            >
              <MenuItem value="">Tümü</MenuItem>
              <MenuItem value="Yonetici">Yönetici</MenuItem>
              <MenuItem value="Calisan">Çalışan</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Pagination - Üst kısım */}
      <Pagination
        page={page}
        totalCount={totalCount}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        rowsPerPageOptions={[5, 10, 20, 50]}
        showUserCount={true}
        sx={{ mb: 2 }}
      />

      {/* Kullanıcılar tablosu */}
      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress />
          </Box>
        ) : (
          <UsersTable
            users={users}
            totalCount={totalCount}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            currentUser={user}
          />
        )}
      </Paper>

      {/* Kullanıcı ekleme modalı */}
      <AddUserModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onUserAdded={handleUserAdded}
      />

      {/* Kullanıcı düzenleme modalı */}
      {selectedUser && (
        <EditUserModal
          open={editModalOpen}
          user={selectedUser}
          onClose={() => setEditModalOpen(false)}
          onUserEdited={handleUserEdited}
        />
      )}

      {/* Kullanıcı silme onay modalı */}
      {selectedUser && (
        <DeleteUserConfirmModal
          open={deleteModalOpen}
          user={selectedUser}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleUserDeleted}
        />
      )}

      {/* Toast bildirimleri */}
      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UsersPage;
