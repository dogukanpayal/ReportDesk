import React, { useState, useEffect, useCallback } from 'react';
import { Container, Grid, Typography, Box, useTheme, useMediaQuery, TextField, InputAdornment, IconButton, Fade, Tooltip, Button } from '@mui/material'; // Button eklendi
import DescriptionIcon from '@mui/icons-material/Description';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'; // <-- YENİ EKLENEN İKON

// --- TEK BİR IMPORT BLOĞU OLMALI ---
import { 
  getAllReports, 
  getMyReports, 
  updateReportStatus, 
  deleteReport, 
  updateBulkReportStatus, 
  deleteBulkReports,
  semanticSearchReports // <-- YENİ EKLENEN FONKSİYON
} from '../services/reportService';
// -----------------------------------

import ReportsTable from '../components/ReportsTable';
import Pagination from '../components/Pagination';
import UploadReportCard from '../components/UploadReportCard';
import ReportsFilter from '../components/ReportsFilter';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function ReportPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Bugünün tarihini al
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // State management - localStorage ile filtreleri koru
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    // localStorage'dan kaydedilmiş değeri al, yoksa varsayılan 10 kullan
    const saved = localStorage.getItem('reportsPageSize');
    return saved ? parseInt(saved, 10) : 10;
  });
  const [sortField, setSortField] = useState(() => {
    const saved = localStorage.getItem('reportsSortField');
    return saved || 'created_at';
  });
  const [sortDirection, setSortDirection] = useState(() => {
    const saved = localStorage.getItem('reportsSortDirection');
    return saved || 'desc';
  });
  const [search, setSearch] = useState(() => {
    const saved = localStorage.getItem('reportsSearch');
    return saved || '';
  });
  const [inputValue, setInputValue] = useState(() => {
    const saved = localStorage.getItem('reportsInputValue');
    return saved || '';
  });
  const [dateFilter, setDateFilter] = useState(() => {
    const saved = localStorage.getItem('reportsDateFilter');
    return saved || getTodayDate();
  });
  const [statusFilter, setStatusFilter] = useState(() => {
    const saved = localStorage.getItem('reportsStatusFilter');
    return saved || '';
  });
  const [uploaderFilter, setUploaderFilter] = useState(() => {
    const saved = localStorage.getItem('reportsUploaderFilter');
    return saved || '';
  });
  const [selectedReports, setSelectedReports] = useState(new Set());
  const [aiInputValue, setAiInputValue] = useState(''); 
  const [aiSearchQuery, setAiSearchQuery] = useState('');

  // React Query ile data fetching - Dashboard benzeri otomatik yenileme
  const {
    data: reportsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['reports', page, rowsPerPage, sortField, sortDirection, search, dateFilter, statusFilter, uploaderFilter, user?.role, aiSearchQuery],
    queryFn: async () => {
      if (!user) return null;

      if (aiSearchQuery && aiSearchQuery.length > 2) {
        console.log('🤖 AI Araması yapılıyor:', aiSearchQuery);
        try {
            const results = await semanticSearchReports(aiSearchQuery);
            // Sonuç boşsa bile boş array döner, tablo "Kayıt bulunamadı" gösterir.
            return {
               reports: results || [],
               totalItems: results ? results.length : 0
            };
        } catch (err) {
            console.error("AI Arama Hatası:", err);
            return { reports: [], totalItems: 0 };
        }
      }
      
      const params = {
        page: page + 1, // Backend 1-bazlı sayfa numarası bekliyor
        size: rowsPerPage,
        sortBy: sortField,
        sortOrder: sortDirection,
        search: search || undefined,
        date: dateFilter || undefined,
        status: statusFilter || undefined,
        userId: uploaderFilter || undefined
      };

      // Debug log - çalışan filtresi için
      console.log('=== ReportPage Debug ===');
      console.log('Uploader filter:', uploaderFilter);
      console.log('API params:', params);
      console.log('User role:', user.role);
      console.log('=== End Debug ===');

      // Kullanıcı rolüne göre doğru API endpoint'ini çağır
      if (user.role === 'Calisan') {
        return await getMyReports(params);
      } else {
        // Yönetici rolündeki kullanıcılar tüm raporları görebilir
        return await getAllReports(params);
      }
    },
    enabled: !!user,
    staleTime: 0, // Her zaman fresh data iste
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: true, // Pencere odaklandığında yenile
    refetchOnMount: true, // Mount olduğunda yenile
  });

  const reports = reportsData?.reports || [];
  const totalCount = reportsData?.totalItems || 0;

  // Pagination handlers - UsersPage.js benzeri
  const handlePageChange = (newPage) => {
    const pageNumber = parseInt(newPage, 10);
    if (!isNaN(pageNumber) && pageNumber >= 0) {
      setPage(pageNumber);
    }
  };

  const handleRowsPerPageChange = (value) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      const newPageSize = Math.min(50, numValue);
      setRowsPerPage(newPageSize);
      setPage(0);
      localStorage.setItem('reportsPageSize', newPageSize.toString());
    }
  };

  // Gerçek zamanlı arama için useEffect - localStorage'a kaydet
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearch(inputValue);
      setPage(0); // Arama yapıldığında sayfa 0'a dön
      localStorage.setItem('reportsSearch', inputValue);
      localStorage.setItem('reportsInputValue', inputValue);
    }, 20); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  // Raporlar sayfasına her geldiğinde verileri yenile
  useEffect(() => {
    if (user) {
      // Query cache'ini invalidate et ve yeniden fetch et
      queryClient.invalidateQueries(['reports']);
    }
  }, [user, queryClient]);



  // Filtre değişiklikleri - localStorage'a kaydet
  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    setPage(0);
    localStorage.setItem('reportsDateFilter', value);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPage(0);
    localStorage.setItem('reportsStatusFilter', value);
  };

  const handleUploaderFilterChange = (value) => {
    setUploaderFilter(value);
    setPage(0);
    localStorage.setItem('reportsUploaderFilter', value);
  };

  // Sıralama değişikliği - localStorage'a kaydet
  const handleSortChange = (field, direction) => {
    setSortField(field);
    setSortDirection(direction);
    setPage(0);
    localStorage.setItem('reportsSortField', field);
    localStorage.setItem('reportsSortDirection', direction);
  };

  // Rapor güncelleme işleyicisi
  const handleReportUpdated = async (reportId, newStatus, isDelete = false, isEdit = false) => {
    try {
      // Backend'e gönder (sadece delete ve status update için)
      if (isDelete) {
        await deleteReport(reportId);
      } else if (newStatus && !isEdit) {
        // Sadece status update için backend çağrısı yap
        await updateReportStatus(reportId, newStatus);
      }
      // Edit işlemi için backend çağrısı zaten EditReportModal'da yapıldı
      
      // React Query cache'ini invalidate et
      queryClient.invalidateQueries(['reports']);
    } catch (error) {
      console.error('Error updating report:', error);
    }
  };

  // Toplu işlem fonksiyonları
  const handleBulkStatusUpdate = async (status) => {
    if (selectedReports.size === 0) {
      console.warn('No reports selected for bulk status update');
      return;
    }
    
    try {
      const reportIds = Array.from(selectedReports);
      await updateBulkReportStatus(reportIds, status);
      queryClient.invalidateQueries(['reports']);
      setSelectedReports(new Set()); // Seçimi temizle
    } catch (error) {
      console.error('Error updating bulk report status:', error);
      throw error;
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReports.size === 0) {
      console.warn('No reports selected for bulk delete');
      return;
    }
    
    try {
      const reportIds = Array.from(selectedReports);
      await deleteBulkReports(reportIds);
      queryClient.invalidateQueries(['reports']);
      setSelectedReports(new Set()); // Seçimi temizle
    } catch (error) {
      console.error('Error deleting bulk reports:', error);
      throw error;
    }
  };

  // Yükleme başarılı işleyicisi
  const handleUploadSuccess = useCallback(() => {
    queryClient.invalidateQueries(['reports']);
  }, [queryClient]);

  if (!user) return null;

  return (
    <Box sx={{ 
      backgroundColor: '#F5F5F5',
      minHeight: '100vh',
      py: 4
    }}>
      <Container maxWidth="xl">
        {/* Raporlar Başlığı */}
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
                Raporlar
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  fontSize: { xs: '14px', md: '16px' },
                  textAlign: { xs: 'center', md: 'left' }
                }}
              >
                Raporları görüntüleyin, ekleyin ve düzenleyin
              </Typography>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={isMobile ? 1 : 4}>
          {/* Rapor Yükleme Kartı */}
          <Grid item xs={12}>
            <UploadReportCard onUploadSuccess={handleUploadSuccess} />
          </Grid>

          {/* Arama ve Filtreler Kısmı */}
          <Grid item xs={12}>
            <Box sx={{ 
              p: 3, 
              mb: isMobile ? 0.5 : 3, 
              backgroundColor: '#FFFFFF',
              borderRadius: 3,
              border: '1px solid #E9ECEF',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <Box sx={{ 
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2,
                alignItems: { xs: 'stretch', md: 'center' }
              }}>
                {/* Arama */}
                <Box sx={{ mb: 3, width: '100%' }}>
                  <TextField
                    fullWidth
                    placeholder="Yapay Zeka ile içerik ara... (Örn: 'Şirketin finansal riskleri neler?')"
                    value={aiInputValue}
                    onChange={(e) => setAiInputValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        setAiSearchQuery(aiInputValue);
                        setPage(0);
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AutoAwesomeIcon sx={{ color: 'secondary.main' }} /> {/* Mor renkli yıldız ikonu */}
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                           {aiInputValue && (
                            <IconButton onClick={() => {
                              setAiInputValue('');
                              setAiSearchQuery('');
                            }}>
                              <ClearIcon />
                            </IconButton>
                          )}
                          <Button 
                            variant="contained" 
                            color="secondary"
                            size="small"
                            onClick={() => {
                              setAiSearchQuery(aiInputValue);
                              setPage(0);
                            }}
                            sx={{ borderRadius: 2, ml: 1, textTransform: 'none' }}
                          >
                            AI Ara
                          </Button>
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 3,
                        backgroundColor: '#fff',
                        border: '2px solid',
                        borderColor: aiSearchQuery ? 'secondary.main' : 'transparent', // Aktifse çerçeve rengi değişsin
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 12px rgba(156, 39, 176, 0.15)', // Hafif mor gölge
                        '&:hover': {
                           boxShadow: '0 6px 16px rgba(156, 39, 176, 0.25)',
                        }
                      }
                    }}
                  />
                  {aiSearchQuery && (
                    <Typography variant="caption" sx={{ ml: 2, mt: 1, display: 'block', color: 'secondary.main', fontWeight: 'bold' }}>
                      ✨ "{aiSearchQuery}" için yapay zeka sonuçları gösteriliyor...
                    </Typography>
                  )}
                </Box>
                <TextField
                  placeholder="Rapor ara..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  size="small"
                  sx={{ 
                    flex: 1,
                    minWidth: { xs: '100%', md: '300px' },
                    maxWidth: { md: '400px' },
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      borderRadius: 2,
                      '& fieldset': {
                        borderColor: '#DEE2E6'
                      },
                      '&:hover fieldset': {
                        borderColor: '#ADB5BD'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#1976d2'
                      }
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#666' }} />
                      </InputAdornment>
                    ),
                    endAdornment: inputValue && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setInputValue('');
                            setSearch('');
                          }}
                          sx={{ color: '#666' }}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />

                {/* Filtreler */}
                <ReportsFilter
                  dateFilter={dateFilter}
                  statusFilter={statusFilter}
                  uploaderFilter={uploaderFilter}
                  onDateFilterChange={handleDateFilterChange}
                  onStatusFilterChange={handleStatusFilterChange}
                  onUploaderFilterChange={handleUploaderFilterChange}
                  currentUser={user}
                />
              </Box>
            </Box>
          </Grid>

          {/* Mobil Toplu İşlem Butonları - İki kutu arasındaki boşlukta (her zaman rezerve edilmiş alan) */}
          {isMobile && (
            <Grid item xs={12} sx={{ mb: 0.5 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                alignItems: 'center',
                p: 1,
                backgroundColor: selectedReports.size > 0 ? '#FFFFFF' : 'transparent',
                borderRadius: 2,
                border: selectedReports.size > 0 ? '1px solid #e9ecef' : 'none',
                boxShadow: selectedReports.size > 0 ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                minHeight: '48px' // Sabit yükseklik
              }}>
                {selectedReports.size > 0 && (
                  <Fade 
                    in={selectedReports.size > 0} 
                    timeout={400}
                    sx={{
                      transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 0.5 }}>
                      <Typography variant="caption" color="primary" sx={{ mr: 1, fontWeight: 600 }}>
                        {selectedReports.size} seçildi
                      </Typography>
                      
                      {/* Yönetici rolündeki kullanıcılar için incelendi/incelenmedi butonları */}
                      {user?.role === 'Yonetici' && (
                        <>
                          <Tooltip title="İncelendi olarak işaretle">
                            <IconButton
                              size="small"
                              onClick={() => handleBulkStatusUpdate('Reviewed')}
                              sx={{ 
                                color: 'success.main',
                                '&:hover': { 
                                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="İncelenmedi olarak işaretle">
                            <IconButton
                              size="small"
                              onClick={() => handleBulkStatusUpdate('Not Reviewed')}
                              sx={{ 
                                color: 'warning.main',
                                '&:hover': { 
                                  backgroundColor: 'rgba(255, 152, 0, 0.1)',
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      
                      <Tooltip title="Seçili raporları sil">
                        <IconButton
                          size="small"
                          onClick={() => handleBulkDelete()}
                          sx={{ 
                            color: 'error.main',
                            '&:hover': { 
                              backgroundColor: 'rgba(244, 67, 54, 0.1)',
                              transform: 'scale(1.1)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Fade>
                )}
              </Box>
            </Grid>
          )}

          {/* Raporlar Tablosu */}
          <Grid item xs={12}>
            {isLoading ? (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                py: 8
              }}>
                <Typography variant="h6" sx={{ color: '#666666' }}>
                  Raporlar yükleniyor...
                </Typography>
              </Box>
            ) : error ? (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                py: 8
              }}>
                <Typography variant="h6" sx={{ color: '#f44336' }}>
                  Raporlar yüklenirken hata oluştu
                </Typography>
              </Box>
            ) : (
              <>
                {/* Pagination - Üst kısım */}
                <Pagination
                  page={page}
                  totalCount={totalCount}
                  rowsPerPage={rowsPerPage}
                  onPageChange={handlePageChange}
                  onRowsPerPageChange={handleRowsPerPageChange}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  selectedCount={selectedReports.size}
                  onBulkStatusUpdate={handleBulkStatusUpdate}
                  onBulkDelete={handleBulkDelete}
                  currentUser={user}
                  sx={{ mb: isMobile ? 0.5 : 2 }}
                />

                <ReportsTable
                  reports={reports}
                  totalCount={totalCount}
                  page={page}
                  rowsPerPage={rowsPerPage}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  dateFilter={dateFilter}
                  statusFilter={statusFilter}
                  uploaderFilter={uploaderFilter}
                  onPageChange={handlePageChange}
                  onRowsPerPageChange={handleRowsPerPageChange}
                  onSortChange={handleSortChange}
                  onDateFilterChange={handleDateFilterChange}
                  onStatusFilterChange={handleStatusFilterChange}
                  onUploaderFilterChange={handleUploaderFilterChange}
                  onReportUpdated={handleReportUpdated}
                  currentUser={user}
                  onBulkStatusUpdate={handleBulkStatusUpdate}
                  onBulkDelete={handleBulkDelete}
                  selectedReports={selectedReports}
                  onSelectedReportsChange={setSelectedReports}
                />
              </>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
