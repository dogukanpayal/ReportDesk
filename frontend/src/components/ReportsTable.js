import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, IconButton, Typography, Chip, Box,
  Card, TableSortLabel, useTheme, useMediaQuery,
  FormControl, Select, MenuItem, Checkbox, Tooltip, Fade
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EditReportModal from './EditReportModal';
import ReportDetailModal from './ReportDetailModal';


export default function ReportsTable({
  reports,
  totalCount,
  page,
  rowsPerPage,
  sortField,
  sortDirection,
  dateFilter,
  statusFilter,
  uploaderFilter,
  onPageChange,
  onRowsPerPageChange,
  onSortChange,
  onDateFilterChange,
  onStatusFilterChange,
  onUploaderFilterChange,
  onReportUpdated,
  currentUser,
  onBulkStatusUpdate,
  onBulkDelete,
  selectedReports,
  onSelectedReportsChange
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Modal states
  const [selectedReport, setSelectedReport] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Bulk operations states
  const [isBulkOperationLoading, setIsBulkOperationLoading] = useState(false);

const statusColors = {
  'Not Reviewed': 'warning',
  'Reviewed': 'success'
};

// Bulk operations handlers
const handleSelectAll = (event) => {
  if (event.target.checked) {
    const newSelected = new Set(reports.map(report => report.id));
    onSelectedReportsChange(newSelected);
  } else {
    onSelectedReportsChange(new Set());
  }
};

const handleSelectReport = (reportId) => {
  const newSelected = new Set(selectedReports);
  if (newSelected.has(reportId)) {
    newSelected.delete(reportId);
  } else {
    newSelected.add(reportId);
  }
  onSelectedReportsChange(newSelected);
};

const handleBulkStatusUpdate = async (status) => {
  if (selectedReports.size === 0) return;
  
  setIsBulkOperationLoading(true);
  try {
    await onBulkStatusUpdate(status);
  } catch (error) {
    console.error('Bulk status update failed:', error);
  } finally {
    setIsBulkOperationLoading(false);
  }
};

const handleBulkDelete = async () => {
  if (selectedReports.size === 0) return;
  
  setIsBulkOperationLoading(true);
  try {
    await onBulkDelete();
  } catch (error) {
    console.error('Bulk delete failed:', error);
  } finally {
    setIsBulkOperationLoading(false);
  }
};

  const statusLabels = {
    'Not Reviewed': 'İncelenmedi',
    'Reviewed': 'İncelendi'
  };

// Helper function to safely format dates
const formatDateSafely = (dateValue) => {
  if (!dateValue) return 'Tarih Yok';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return 'Geçersiz Tarih';
    }
    return date.toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Istanbul'
    });
  } catch (error) {
    return 'Tarih Hatası';
  }
};

  // Sort handler
  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    onSortChange(field, newDirection);
  };

  // Action handlers
  const handleViewReport = (report) => {
    setSelectedReport(report);
    setDetailModalOpen(true);
  };

  const handleEditReport = (report) => {
    // 24 saat kontrolü
    if (report.created_at) {
      const createdAt = new Date(report.created_at);
      const now = new Date();
      const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
      
      if (hoursSinceCreation > 24) {
        alert('Bu rapor 24 saat süresi dolduğu için düzenlenemez.');
        return;
      }
    }
    
    setSelectedReport(report);
    setEditModalOpen(true);
  };

  const handleDeleteReport = async (report) => {
    if (window.confirm('Bu raporu silmek istediğinizden emin misiniz?')) {
      onReportUpdated(report.id, null, true);
    }
  };

  const handleStatusChange = async (report, newStatus) => {
    onReportUpdated(report.id, newStatus);
  };

  // Bugün rapor yüklenmedi mesajı kontrolü
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isTodayFilter = dateFilter === getTodayDate();

  if (reports.length === 0) {
    return (
      <>
        {/* Boş Liste Mesajı */}
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            {isTodayFilter ? 'Bugün rapor yüklenmedi' : 'Rapor bulunamadı'}
          </Typography>
        </Paper>
      </>
    );
  }

  return (
    <>
      {/* Desktop Tablo */}
      {!isMobile ? (
        <>



          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedReports.size > 0 && selectedReports.size < reports.length}
                      checked={reports.length > 0 && selectedReports.size === reports.length}
                      onChange={handleSelectAll}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'uploader_first_name'}
                      direction={sortField === 'uploader_first_name' ? sortDirection : 'asc'}
                      onClick={() => handleSort('uploader_first_name')}
                    >
                      Çalışan
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'created_at'}
                      direction={sortField === 'created_at' ? sortDirection : 'asc'}
                      onClick={() => handleSort('created_at')}
                    >
                      Tarih/Saat
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'status'}
                      direction={sortField === 'status' ? sortDirection : 'asc'}
                      onClick={() => handleSort('status')}
                    >
                      Durum
                    </TableSortLabel>
                  </TableCell>
                                             <TableCell>Email</TableCell>
                  <TableCell align="center">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedReports.has(report.id)}
                        onChange={() => handleSelectReport(report.id)}
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      {report.uploader_first_name} {report.uploader_last_name}
                    </TableCell>
                    <TableCell>
                      {formatDateSafely(report.created_at)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={statusLabels[report.status] || report.status}
                        color={statusColors[report.status] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2">
                          {report.User?.email || 'Email yok'}
                        </Typography>
                        {report.updated_at && (
                          <Chip
                            label={`Düzenlendi: ${formatDateSafely(report.updated_at)}`}
                            color="info"
                            size="small"
                            variant="outlined"
                            sx={{ 
                              fontSize: '0.7rem', 
                              height: '20px',
                              '& .MuiChip-label': {
                                px: 1
                              }
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        {/* Görüntüle */}
                        <IconButton
                          size="small"
                          onClick={() => handleViewReport(report)}
                          title="Detayları Görüntüle"
                          sx={{ color: '#4caf50' }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>

                        {/* Düzenle */}
                        {(() => {
                          // Yetki kontrolü - sadece rapor sahibi düzenleyebilir
                          const canEdit = currentUser?.id === report.userId;
                          
                          // 24 saat kontrolü
                          const isEditable = (() => {
                            if (report.created_at) {
                              const createdAt = new Date(report.created_at);
                              const now = new Date();
                              const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
                              return hoursSinceCreation <= 24;
                            }
                            return true; // Eğer tarih yoksa düzenlenebilir kabul et
                          })();
                          
                          const isButtonEnabled = canEdit && isEditable;
                          
                          return (
                            <IconButton
                              size="small"
                              onClick={() => canEdit ? handleEditReport(report) : null}
                              title={
                                !canEdit 
                                  ? "Sadece kendi raporlarınızı düzenleyebilirsiniz" 
                                  : isEditable 
                                    ? "Düzenle" 
                                    : "24 saat süresi doldu, düzenlenemez"
                              }
                              disabled={!isButtonEnabled}
                              sx={{ 
                                color: isButtonEnabled ? '#1976d2' : '#ccc',
                                '&:hover': {
                                  backgroundColor: isButtonEnabled ? 'rgba(25, 118, 210, 0.1)' : 'transparent'
                                }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          );
                        })()}

                        {/* Durum Değiştir */}
                        {currentUser?.role === 'Yonetici' && (
                          <IconButton
                            size="small"
                            onClick={() => handleStatusChange(
                              report, 
                              report.status === 'Reviewed' ? 'Not Reviewed' : 'Reviewed'
                            )}
                            title={report.status === 'Reviewed' ? 'İncelenmedi Olarak İşaretle' : 'İncelendi Olarak İşaretle'}
            sx={{ 
                              color: report.status === 'Reviewed' ? '#f44336' : '#4caf50'
                            }}
                          >
                            {report.status === 'Reviewed' ? 
                              <CancelIcon fontSize="small" /> : 
                              <CheckCircleIcon fontSize="small" />
                            }
                          </IconButton>
                        )}

                        {/* Sil */}
                        {(currentUser?.role === 'Yonetici' || currentUser?.id === report.userId) && (
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteReport(report)}
                            title="Sil"
                            sx={{ color: '#f44336' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
        </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>


        </Paper>
        </>
      ) : (
        /* Mobile Card Layout */
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          {reports.map((report) => (
              <Card key={report.id} sx={{
              p: 2, 
                borderRadius: 2,
              backgroundColor: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              {/* Checkbox */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Checkbox
                  checked={selectedReports.has(report.id)}
                  onChange={() => handleSelectReport(report.id)}
                  color="primary"
                  size="small"
                />
                <Typography variant="caption" color="text.secondary">
                  Seç
                </Typography>
              </Box>
              
              {/* Rapor Bilgileri */}
              <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{
                      fontWeight: 600,
                      color: '#1C1F2A',
                  fontSize: '16px',
                  mb: 1
                    }}>
                  {report.uploader_first_name} {report.uploader_last_name}
                    </Typography>

                    <Typography variant="body2" sx={{
                      color: '#666',
                      fontSize: '14px',
                  mb: 1
                    }}>
                  {formatDateSafely(report.created_at)}
                    </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip 
                    label={statusLabels[report.status] || report.status}
                    color={statusColors[report.status] || 'default'}
                    size="small"
                  />
                  </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="body2" sx={{ 
                    color: '#666',
                    fontSize: '14px',
                    fontStyle: 'italic'
                  }}>
                    {report.User?.email || 'Email yok'}
                  </Typography>
                  {report.updated_at && (
                    <Chip
                      label={`Düzenlendi: ${formatDateSafely(report.updated_at)}`}
                      color="info"
                      size="small"
                      variant="outlined"
                      sx={{ 
                        fontSize: '0.7rem', 
                        height: '20px',
                        '& .MuiChip-label': {
                          px: 1
                        }
                      }}
                    />
                  )}
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
                {/* Görüntüle */}
                      <IconButton
                  size="small" 
                        onClick={() => handleViewReport(report)}
                  title="Detayları Görüntüle"
                  sx={{ color: '#4caf50' }}
                >
                  <VisibilityIcon fontSize="small" />
                      </IconButton>

                {/* Düzenle */}
                {(() => {
                  // Yetki kontrolü - sadece rapor sahibi düzenleyebilir
                  const canEdit = currentUser?.id === report.userId;
                  
                  // 24 saat kontrolü
                  const isEditable = (() => {
                    if (report.created_at) {
                      const createdAt = new Date(report.created_at);
                      const now = new Date();
                      const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
                      return hoursSinceCreation <= 24;
                    }
                    return true; // Eğer tarih yoksa düzenlenebilir kabul et
                  })();
                  
                  const isButtonEnabled = canEdit && isEditable;
                  
                  return (
                    <IconButton
                      size="small" 
                      onClick={() => canEdit ? handleEditReport(report) : null}
                      title={
                        !canEdit 
                          ? "Sadece kendi raporlarınızı düzenleyebilirsiniz" 
                          : isEditable 
                            ? "Düzenle" 
                            : "24 saat süresi doldu, düzenlenemez"
                      }
                      disabled={!isButtonEnabled}
                      sx={{ 
                        color: isButtonEnabled ? '#1976d2' : '#ccc',
                        '&:hover': {
                          backgroundColor: isButtonEnabled ? 'rgba(25, 118, 210, 0.1)' : 'transparent'
                        }
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  );
                })()}

                {/* Durum Değiştir */}
                {currentUser?.role === 'Yonetici' && (
                            <IconButton
                    size="small" 
                    onClick={() => handleStatusChange(
                      report, 
                      report.status === 'Reviewed' ? 'Not Reviewed' : 'Reviewed'
                    )}
                    title={report.status === 'Reviewed' ? 'İncelenmedi Olarak İşaretle' : 'İncelendi Olarak İşaretle'}
                              sx={{
                      color: report.status === 'Reviewed' ? '#f44336' : '#4caf50'
                    }}
                  >
                    {report.status === 'Reviewed' ? 
                      <CancelIcon fontSize="small" /> : 
                      <CheckCircleIcon fontSize="small" />
                    }
                            </IconButton>
                        )}

                {/* Sil */}
                {(currentUser?.role === 'Yonetici' || currentUser?.id === report.userId) && (
                      <IconButton
                    size="small" 
                    onClick={() => handleDeleteReport(report)}
                    title="Sil"
                    sx={{ color: '#f44336' }}
                  >
                    <DeleteIcon fontSize="small" />
                      </IconButton>
                )}
                </Box>
              </Card>
          ))}

            </Box>
      )}

      {/* Modals */}
      <EditReportModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        report={selectedReport}
        onReportUpdated={(reportId, newStatus, isDelete, isEdit) => {
          setEditModalOpen(false);
          onReportUpdated(reportId, newStatus, isDelete, isEdit);
        }}
      />

      <ReportDetailModal
        open={detailModalOpen}
        onClose={() => {
          console.log('ReportDetailModal onClose çağrıldı');
          setDetailModalOpen(false);
        }}
        report={selectedReport}
      />
    </>
  );
}
