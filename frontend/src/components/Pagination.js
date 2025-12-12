import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Tooltip,
  Fade
} from '@mui/material';
import {
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Person as PersonIcon
} from '@mui/icons-material';

const Pagination = ({
  page,
  totalCount,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  showRowsPerPage = true,
  showPageInfo = true,
  showUserCount = false,
  rowsPerPageOptions = [5, 10, 25, 50],
  // Toplu işlem props
  selectedCount = 0,
  onBulkStatusUpdate,
  onBulkDelete,
  currentUser,
  isBulkOperationLoading = false,
  sx = {}
}) => {
  const totalPages = Math.ceil(totalCount / rowsPerPage);
  const safePage = isNaN(page) ? 0 : page;
  const isFirstPage = safePage === 0;
  const isLastPage = safePage >= totalPages - 1;

  const handlePageChange = (newPage) => {
    const pageNumber = parseInt(newPage, 10);
    if (!isNaN(pageNumber) && pageNumber >= 0 && pageNumber < totalPages) {
      onPageChange(pageNumber);
    }
  };

  const handleRowsPerPageChange = (event) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value > 0) {
      onRowsPerPageChange(Math.min(50, value));
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between',
      alignItems: 'center',
      p: 2,
      mb: 2,
      backgroundColor: '#FFFFFF',
      borderRadius: 2,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      ...sx
    }}>
       {/* Sol tarafta sayfa başına öğe sayısı */}
       {showRowsPerPage && (
         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
           <FormControl size="small" sx={{ 
             minWidth: { xs: 60, sm: 80 },
             '& .MuiSelect-select': {
               padding: { xs: '6px 8px', sm: '8px 12px' },
               fontSize: { xs: '0.75rem', sm: '0.875rem' }
             }
           }}>
             <Select
               value={rowsPerPage}
               onChange={handleRowsPerPageChange}
               sx={{ 
                 backgroundColor: 'white',
                 borderRadius: 2,
                 height: { xs: 32, sm: 40 },
                 '& .MuiOutlinedInput-notchedOutline': {
                   borderColor: '#DEE2E6'
                 },
                 '&:hover .MuiOutlinedInput-notchedOutline': {
                   borderColor: '#ADB5BD'
                 },
                 '&:focus .MuiOutlinedInput-notchedOutline': {
                   borderColor: '#1976d2'
                 }
               }}
             >
               {rowsPerPageOptions.map((option) => (
                 <MenuItem key={option} value={option} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                   {option}
                 </MenuItem>
               ))}
             </Select>
           </FormControl>
           <Typography variant="body2" color="text.secondary" sx={{ 
             fontSize: { xs: '0.75rem', sm: '0.875rem' },
             display: { xs: 'none', sm: 'block' }
           }}>
             öğe göster
           </Typography>
         </Box>
       )}

      {/* Ortada kullanıcı sayısı veya toplu işlem butonları */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        {showUserCount ? (
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#1d87e3',
              fontWeight: 500,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            <PersonIcon sx={{ fontSize: '1rem' }} />
            Toplam {totalCount} kullanıcı
          </Typography>
        ) : selectedCount > 0 ? (
          <Fade 
            in={selectedCount > 0} 
            timeout={400}
            sx={{
              transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              display: { xs: 'none', sm: 'block' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 0.5 }}>
              <Typography variant="caption" color="primary" sx={{ mr: 1, fontWeight: 600 }}>
                {selectedCount} seçildi
              </Typography>
              
              {/* Yönetici rolündeki kullanıcılar için incelendi/incelenmedi butonları */}
              {currentUser?.role === 'Yonetici' && (
                <>
                  <Tooltip title="İncelendi olarak işaretle">
                    <IconButton
                      size="small"
                      disabled={isBulkOperationLoading}
                      onClick={() => onBulkStatusUpdate && onBulkStatusUpdate('Reviewed')}
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
                      disabled={isBulkOperationLoading}
                      onClick={() => onBulkStatusUpdate && onBulkStatusUpdate('Not Reviewed')}
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
                  disabled={isBulkOperationLoading}
                  onClick={() => onBulkDelete && onBulkDelete()}
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
        ) : null}
      </Box>

      {/* Sağ tarafta pagination kontrolleri */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {showPageInfo && (
          <Typography variant="body2" color="text.secondary" sx={{ 
            mr: 2,
            display: { xs: 'none', sm: 'block' }
          }}>
            Sayfa {safePage + 1} / {totalPages}
          </Typography>
        )}
        
        <IconButton
          onClick={() => handlePageChange(0)}
          disabled={isFirstPage}
          size="small"
          sx={{
            color: isFirstPage ? 'text.disabled' : 'text.primary',
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
          }}
        >
          <FirstPageIcon fontSize="small" />
        </IconButton>
        
        <IconButton
          onClick={() => handlePageChange(page - 1)}
          disabled={isFirstPage}
          size="small"
          sx={{
            color: isFirstPage ? 'text.disabled' : 'text.primary',
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
          }}
        >
          <ChevronLeftIcon fontSize="small" />
        </IconButton>

        {/* Önceki sayfa numarası */}
        {safePage > 0 && (
          <Typography 
            variant="body2" 
            sx={{ 
              px: 1.5, 
              py: 0.5, 
              color: 'text.secondary', 
              minWidth: 32,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': { color: 'text.primary' }
            }}
            onClick={() => handlePageChange(safePage - 1)}
          >
            {safePage}
          </Typography>
        )}
        
        {/* Mevcut sayfa numarası */}
        <Typography 
          variant="body2" 
          sx={{ 
            px: 1.5, 
            py: 0.5, 
            backgroundColor: 'primary.main', 
            color: 'white', 
            borderRadius: 1,
            minWidth: 32,
            textAlign: 'center'
          }}
        >
          {safePage + 1}
        </Typography>

        {/* Sonraki sayfa numarası */}
        {safePage < totalPages - 1 && (
          <Typography 
            variant="body2" 
            sx={{ 
              px: 1.5, 
              py: 0.5, 
              color: 'text.secondary', 
              minWidth: 32,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': { color: 'text.primary' }
            }}
            onClick={() => handlePageChange(safePage + 1)}
          >
            {safePage + 2}
          </Typography>
        )}
        
        <IconButton
          onClick={() => handlePageChange(safePage + 1)}
          disabled={isLastPage}
          size="small"
          sx={{
            color: isLastPage ? 'text.disabled' : 'text.primary',
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
          }}
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>
        
        <IconButton
          onClick={() => handlePageChange(totalPages - 1)}
          disabled={isLastPage}
          size="small"
          sx={{
            color: isLastPage ? 'text.disabled' : 'text.primary',
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
          }}
        >
          <LastPageIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default Pagination;
