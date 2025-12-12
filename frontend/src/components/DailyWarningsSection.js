import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Chip,
  Collapse,
  CircularProgress,
  IconButton,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Alert,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import {
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  BookmarkAdd as BookmarkAddIcon,
  BookmarkRemove as BookmarkRemoveIcon,
  Bookmark as BookmarkIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { 
  getDailyWarnings, 
  getSavedWarnings,
  markDailyWarningAsRead, 
  saveDailyWarning, 
  unsaveDailyWarning,
  deleteDailyWarning 
} from '../services/dashboardService.js';
import Pagination from './Pagination';

const DailyWarningsSection = ({ user }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const queryClient = useQueryClient();
  const [warningsOpen, setWarningsOpen] = useState(false);
  const [savingWarnings, setSavingWarnings] = useState(new Set());
  const [unsavingWarnings, setUnsavingWarnings] = useState(new Set());
  const [deletingWarnings, setDeletingWarnings] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    // localStorage'dan kaydedilmiş değeri al, yoksa varsayılan 10 kullan
    const saved = localStorage.getItem('dailyWarningsPageSize');
    return saved ? parseInt(saved, 10) : 10;
  });
  const [savedWarningsOpen, setSavedWarningsOpen] = useState(false);
  const [savedWarningsPage, setSavedWarningsPage] = useState(1);
  const [savedWarningsPageSize, setSavedWarningsPageSize] = useState(() => {
    // localStorage'dan kaydedilmiş değeri al, yoksa varsayılan 10 kullan
    const saved = localStorage.getItem('savedWarningsPageSize');
    return saved ? parseInt(saved, 10) : 10;
  });

  // React Query hook - günlük uyarılar için
  const { 
    data: dailyWarningsData, 
    isLoading: warningsLoading, 
    error: warningsError
  } = useQuery({
    queryKey: ['dailyWarnings', currentPage, pageSize],
    queryFn: () => getDailyWarnings(currentPage, pageSize),
    enabled: !!user && user.role === 'Yonetici',
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // React Query hook - kaydedilmiş uyarılar için
  const { 
    data: savedWarningsData, 
    isLoading: savedWarningsLoading, 
    error: savedWarningsError
  } = useQuery({
    queryKey: ['savedWarnings', savedWarningsPage, savedWarningsPageSize],
    queryFn: () => getSavedWarnings(savedWarningsPage, savedWarningsPageSize),
    enabled: !!user && user.role === 'Yonetici',
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: markDailyWarningAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyWarnings', currentPage, pageSize] });
      queryClient.invalidateQueries({ queryKey: ['savedWarnings'] });
    },
  });

  const saveWarningMutation = useMutation({
    mutationFn: saveDailyWarning,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyWarnings', currentPage, pageSize] });
      queryClient.invalidateQueries({ queryKey: ['savedWarnings'] });
    },
  });

  const unsaveWarningMutation = useMutation({
    mutationFn: unsaveDailyWarning,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyWarnings', currentPage, pageSize] });
      queryClient.invalidateQueries({ queryKey: ['savedWarnings'] });
    },
  });

  const deleteWarningMutation = useMutation({
    mutationFn: deleteDailyWarning,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyWarnings', currentPage, pageSize] });
      queryClient.invalidateQueries({ queryKey: ['savedWarnings'] });
    },
  });

  // Handlers
  const handleMarkAsRead = useCallback(async (warningId) => {
    try {
      await markAsReadMutation.mutateAsync(warningId);
    } catch (error) {
      console.error('Error marking warning as read:', error);
    }
  }, [markAsReadMutation]);

  const handleSaveWarning = useCallback(async (warningId) => {
    try {
      setSavingWarnings(prev => new Set(prev).add(warningId));
      await saveWarningMutation.mutateAsync(warningId);
    } catch (error) {
      console.error('Error saving warning:', error);
      alert('Uyarı kaydedilirken hata oluştu: ' + error.message);
    } finally {
      setSavingWarnings(prev => {
        const newSet = new Set(prev);
        newSet.delete(warningId);
        return newSet;
      });
    }
  }, [saveWarningMutation]);

  const handleUnsaveWarning = useCallback(async (warningId) => {
    try {
      setUnsavingWarnings(prev => new Set(prev).add(warningId));
      await unsaveWarningMutation.mutateAsync(warningId);
    } catch (error) {
      console.error('Error unsaving warning:', error);
      alert('Uyarı kayıttan çıkarılırken hata oluştu: ' + error.message);
    } finally {
      setUnsavingWarnings(prev => {
        const newSet = new Set(prev);
        newSet.delete(warningId);
        return newSet;
      });
    }
  }, [unsaveWarningMutation]);

  const handleDeleteWarning = useCallback(async (warningId) => {
    try {
      if (!confirm('Bu uyarıyı silmek istediğinizden emin misiniz?')) {
        return;
      }
      
      setDeletingWarnings(prev => new Set(prev).add(warningId));
      await deleteWarningMutation.mutateAsync(warningId);
    } catch (error) {
      console.error('Error deleting warning:', error);
      alert('Uyarı silinirken hata oluştu: ' + error.message);
    } finally {
      setDeletingWarnings(prev => {
        const newSet = new Set(prev);
        newSet.delete(warningId);
        return newSet;
      });
    }
  }, [deleteWarningMutation]);

  // Pagination handlers
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
    localStorage.setItem('dailyWarningsPageSize', newPageSize.toString());
  };

  // Saved warnings pagination handlers
  const handleSavedWarningsPageChange = (newPage) => {
    setSavedWarningsPage(newPage);
  };

  const handleSavedWarningsPageSizeChange = (newPageSize) => {
    setSavedWarningsPageSize(newPageSize);
    setSavedWarningsPage(1); // Reset to first page when changing page size
    localStorage.setItem('savedWarningsPageSize', newPageSize.toString());
  };

  // Computed values
  const warnings = dailyWarningsData?.warnings || [];
  const totalWarnings = dailyWarningsData?.pagination?.totalCount || 0;
  const unreadCount = warnings.filter(w => !w.isRead).length;
  
  // Saved warnings computed values
  const savedWarnings = savedWarningsData?.warnings || [];
  const totalSavedWarnings = savedWarningsData?.pagination?.totalCount || 0;

  // Toggle warnings section
  const toggleWarnings = () => setWarningsOpen(!warningsOpen);
  
  // Toggle saved warnings section
  const toggleSavedWarnings = () => setSavedWarningsOpen(!savedWarningsOpen);

  if (!user || user.role !== 'Yonetici') {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: isMobile ? 2 : 3,
          bgcolor: 'background.paper',
          borderRadius: 1,
          boxShadow: 1,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' }
        }}
        onClick={toggleWarnings}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <WarningIcon 
            color="warning" 
            sx={{ fontSize: isMobile ? 20 : 24 }} 
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              fontWeight="bold"
              color="text.primary"
            >
              Bildirimler
            </Typography>
            {unreadCount > 0 && (
              <Box
                sx={{
                  bgcolor: 'warning.main',
                  color: 'white',
                  borderRadius: '50%',
                  width: isMobile ? 20 : 24,
                  height: isMobile ? 20 : 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  fontWeight: 'bold',
                  minWidth: isMobile ? 20 : 24
                }}
              >
                {unreadCount}
              </Box>
            )}
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {totalWarnings} uyarı
          </Typography>
          <ExpandMoreIcon
            sx={{
              transform: warningsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
              color: 'text.secondary'
            }}
          />
        </Box>
      </Box>

      {/* Content */}
      <Collapse in={warningsOpen}>
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: '4px',
            boxShadow: 1,
            mt: 1,
            maxHeight: isMobile ? '400px' : '500px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {warningsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : warningsError ? (
            <Alert severity="error" sx={{ m: 2 }}>
              Uyarılar yüklenirken hata oluştu: {warningsError.message}
            </Alert>
          ) : warnings.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Henüz uyarı bulunmuyor
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Günlük uyarılar mesai sonunda otomatik oluşturulur
              </Typography>
            </Box>
          ) : (
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <List sx={{ p: 0 }}>
                {warnings.map((warning, index) => (
                <React.Fragment key={warning.id}>
                  <ListItem
                    sx={{
                      p: 2,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: 'white',
                      '&:hover': { 
                        bgcolor: '#f5f5f5',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, width: '100%' }}>
                      {/* Basit Avatar */}
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: warning.isRead ? '#e0e0e0' : '#ff9800',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <PersonIcon sx={{ color: 'white', fontSize: 20 }} />
                      </Box>
                      
                      {/* İçerik */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography 
                            variant="body1" 
                            fontWeight={warning.isRead ? "normal" : "bold"}
                            color="text.primary"
                            sx={{ fontSize: '0.9rem' }}
                          >
                            {warning.employeeName}
                          </Typography>
                          {!warning.isRead && (
                            <Box
                              sx={{
                                bgcolor: '#ff9800',
                                color: 'white',
                                px: 1,
                                py: 0.25,
                                borderRadius: 0.5,
                                fontSize: '0.7rem',
                                fontWeight: 'bold'
                              }}
                            >
                              YENİ
                            </Box>
                          )}
                        </Box>
                        
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ mb: 1, fontSize: '0.85rem', lineHeight: 1.4 }}
                        >
                          {warning.message}
                        </Typography>
                        
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ fontSize: '0.75rem' }}
                        >
                          {new Date(warning.date).toLocaleDateString('tr-TR')} • {warning.time}
                        </Typography>
                      </Box>
                      
                      {/* Basit Aksiyon Butonları */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(warning.id);
                          }}
                          sx={{ 
                            color: warning.isRead ? '#f44336' : '#4caf50',
                            p: 0.5
                          }}
                        >
                          {warning.isRead ? <CancelIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                        </IconButton>
                        
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (warning.isSaved) {
                              handleUnsaveWarning(warning.id);
                            } else {
                              handleSaveWarning(warning.id);
                            }
                          }}
                          disabled={savingWarnings.has(warning.id) || unsavingWarnings.has(warning.id)}
                          sx={{ 
                            color: '#1977d3',
                            p: 0.5
                          }}
                        >
                          {warning.isSaved ? <BookmarkRemoveIcon fontSize="small" /> : <BookmarkAddIcon fontSize="small" />}
                        </IconButton>
                        
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWarning(warning.id);
                          }}
                          disabled={deletingWarnings.has(warning.id)}
                          sx={{ 
                            color: '#f44336',
                            p: 0.5
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </ListItem>
                </React.Fragment>
                ))}
              </List>
            </Box>
          )}
          
          {/* Footer */}
          {warnings.length > 0 && (
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
              {/* Pagination - Footer içinde */}
              <Pagination
                page={currentPage - 1} // 1-bazlı currentPage'i 0-bazlı page'e çevir
                totalCount={totalWarnings}
                rowsPerPage={pageSize}
                onPageChange={(newPage) => handlePageChange(newPage + 1)} // 0-bazlı page'i 1-bazlı currentPage'e çevir
                onRowsPerPageChange={handlePageSizeChange}
                sx={{ 
                  backgroundColor: 'transparent',
                  boxShadow: 'none',
                  p: 0,
                  mb: 0,
                  '& .MuiBox-root': {
                    flexDirection: 'row',
                    gap: isMobile ? 0.5 : 0,
                    alignItems: 'center',
                    flexWrap: isMobile ? 'wrap' : 'nowrap',
                    justifyContent: isMobile ? 'center' : 'space-between'
                  },
                  '& .MuiFormControl-root': {
                    minWidth: isMobile ? '60px' : '80px'
                  },
                  '& .MuiTypography-root': {
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  },
                  '& .MuiIconButton-root': {
                    padding: isMobile ? '4px' : '8px'
                  }
                }}
              />
            </Box>
          )}
        </Box>
      </Collapse>

      {/* Kaydedilmiş Bildirimler Bölümü */}
      <Box sx={{ mb: 3, mt: 2 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: isMobile ? 2 : 3,
            bgcolor: 'background.paper',
            borderRadius: 1,
            boxShadow: 1,
            cursor: 'pointer',
            '&:hover': { bgcolor: 'action.hover' }
          }}
          onClick={toggleSavedWarnings}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <BookmarkIcon 
              color="primary" 
              sx={{ fontSize: isMobile ? 20 : 24 }} 
            />
            <Typography 
              variant={isMobile ? "body1" : "h6"} 
              fontWeight="bold"
              color="text.primary"
              sx={{ whiteSpace: 'nowrap' }}
            >
              Kaydedilmiş Bildirimler
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ExpandMoreIcon
              sx={{
                transform: savedWarningsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
                color: 'text.secondary'
              }}
            />
          </Box>
        </Box>

        {/* Content */}
        <Collapse in={savedWarningsOpen}>
          <Box
            sx={{
              bgcolor: 'background.paper',
              borderRadius: '4px',
              boxShadow: 1,
              mt: 1,
              maxHeight: isMobile ? '400px' : '500px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {savedWarningsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : savedWarningsError ? (
              <Alert severity="error" sx={{ m: 2 }}>
                Kaydedilmiş uyarılar yüklenirken hata oluştu: {savedWarningsError.message}
              </Alert>
            ) : savedWarnings.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Henüz kaydedilmiş uyarı bulunmuyor
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Bildirimleri kaydetmek için bookmark butonunu kullanın
                </Typography>
              </Box>
            ) : (
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <List sx={{ p: 0 }}>
                  {savedWarnings.map((warning, index) => (
                  <React.Fragment key={warning.id}>
                    <ListItem
                      sx={{
                        p: 2,
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: 'white',
                        '&:hover': { 
                          bgcolor: '#f5f5f5',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, width: '100%' }}>
                        {/* Basit Avatar */}
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: 'success.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <PersonIcon sx={{ color: 'white', fontSize: 20 }} />
                        </Box>
                        
                        {/* İçerik */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography 
                              variant="body1" 
                              fontWeight="normal"
                              color="text.primary"
                              sx={{ fontSize: '0.9rem' }}
                            >
                              {warning.employeeName}
                            </Typography>
                            {!warning.isRead && (
                              <Box
                                sx={{
                                  bgcolor: 'success.main',
                                  color: 'white',
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: 1,
                                  fontSize: '0.7rem',
                                  fontWeight: 'bold'
                                }}
                              >
                                Yeni
                              </Box>
                            )}
                          </Box>
                          
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ mb: 1, fontSize: '0.85rem' }}
                          >
                            {warning.message}
                          </Typography>
                          
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ fontSize: '0.75rem' }}
                          >
                            {new Date(warning.date).toLocaleDateString('tr-TR')} • {warning.time}
                          </Typography>
                        </Box>
                        
                        {/* Butonlar */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnsaveWarning(warning.id);
                            }}
                            disabled={unsavingWarnings.has(warning.id)}
                            sx={{ 
                              color: '#1977d3',
                              '&:hover': { 
                                bgcolor: 'rgba(25, 119, 211, 0.1)' 
                              }
                            }}
                          >
                            <BookmarkRemoveIcon />
                          </IconButton>
                          
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWarning(warning.id);
                            }}
                            disabled={deletingWarnings.has(warning.id)}
                            sx={{ 
                              color: 'error.main',
                              '&:hover': { bgcolor: 'error.50' }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </ListItem>
                    
                    {index < savedWarnings.length - 1 && (
                      <Divider variant="inset" component="li" />
                    )}
                  </React.Fragment>
                  ))}
                </List>
              </Box>
            )}
            
            {/* Footer */}
            {savedWarnings.length > 0 && (
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
                {/* Pagination - Footer içinde */}
                <Pagination
                  page={savedWarningsPage - 1} // 1-bazlı savedWarningsPage'i 0-bazlı page'e çevir
                  totalCount={totalSavedWarnings}
                  rowsPerPage={savedWarningsPageSize}
                  onPageChange={(newPage) => handleSavedWarningsPageChange(newPage + 1)} // 0-bazlı page'i 1-bazlı savedWarningsPage'e çevir
                  onRowsPerPageChange={handleSavedWarningsPageSizeChange}
                  sx={{ 
                    backgroundColor: 'transparent',
                    boxShadow: 'none',
                    p: 0,
                    mb: 0,
                    '& .MuiBox-root': {
                      flexDirection: 'row',
                      gap: isMobile ? 0.5 : 0,
                      alignItems: 'center',
                      flexWrap: isMobile ? 'wrap' : 'nowrap',
                      justifyContent: isMobile ? 'center' : 'space-between'
                    },
                    '& .MuiFormControl-root': {
                      minWidth: isMobile ? '60px' : '80px'
                    },
                    '& .MuiTypography-root': {
                      fontSize: isMobile ? '0.75rem' : '0.875rem'
                    },
                    '& .MuiIconButton-root': {
                      padding: isMobile ? '4px' : '8px'
                    }
                  }}
                />
              </Box>
            )}
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
};

export default DailyWarningsSection;
