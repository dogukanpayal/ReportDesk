import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Link,
  Chip,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import NoteIcon from '@mui/icons-material/Note';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export default function ReportDetailModal({ report, onClose, open = true }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  console.log('ReportDetailModal props:', { report, onClose, open });
  
  if (!report) return null;



  const handleDownload = async () => {
    try {
      // filePath kontrolü - hem filePath hem file_path'i kontrol et
      const filePath = report.filePath || report.file_path;
      
      if (!filePath) {
        alert('Dosya yolu bulunamadı. Lütfen raporu tekrar yükleyin.');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/reports/download/${encodeURIComponent(filePath)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Dosya adını al - rapor detaylarında görünen dosya adını kullan
      let fileName;
      
      // Önce originalFileName'i kontrol et
      if (report.originalFileName) {
        fileName = report.originalFileName;
      } else {
        // Fallback: filePath'den dosya adını çıkar
        const fullFileName = filePath.split('/').pop();
        // Timestamp formatı: 1755697676475-842431634-isgg.pdf
        // Sadece son kısmı al: isgg.pdf
        const parts = fullFileName.split('-');
        if (parts.length >= 3) {
          // Son parçayı al (isgg.pdf)
          fileName = parts[parts.length - 1];
        } else {
          fileName = fullFileName; // Eğer format farklıysa orijinali göster
        }
      }
      
      link.setAttribute('download', fileName);
      
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('İndirme hatası:', error);
      alert('Dosya indirilemedi. Lütfen tekrar deneyin.');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth={isMobile ? 'xs' : 'sm'}
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          overflow: 'hidden'
        }
      }}
    >
      {/* Modal Header */}
      <DialogTitle sx={{ 
        backgroundColor: '#F8F9FA',
        borderBottom: '1px solid #E9ECEF',
        p: { xs: 2, md: 3 }
      }}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: { xs: 'center', md: 'flex-start' }
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700, 
              color: '#1C1F2A',
              fontSize: { xs: '18px', md: '20px' }
            }}
          >
            Rapor Detayları
          </Typography>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ fontSize: { xs: '12px', md: '14px' } }}
          >
            Rapor bilgilerini görüntüleyin
          </Typography>
        </Box>
      </DialogTitle>

      {/* Modal Content */}
      <DialogContent sx={{ 
        p: { xs: 2, md: 3 },
        backgroundColor: '#FFFFFF'
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
          {/* Çalışan Bilgisi */}
          <Box sx={{
            p: { xs: 1.5, md: 2 },
            backgroundColor: '#F8F9FA',
            borderRadius: 2,
            border: '1px solid #E9ECEF'
          }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mb: 1
            }}>
              <PersonIcon sx={{ color: '#3C8D40', fontSize: { xs: '18px', md: '20px' } }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1C1F2A' }}>
                Çalışan
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#666', pl: 3.5 }}>
              {report.uploader_first_name && report.uploader_last_name 
                ? `${report.uploader_first_name} ${report.uploader_last_name}`
                : report.user_email || 'Bilinmeyen Kullanıcı'}
            </Typography>
          </Box>

          {/* Tarih */}
          <Box sx={{
            p: { xs: 1.5, md: 2 },
            backgroundColor: '#F8F9FA',
            borderRadius: 2,
            border: '1px solid #E9ECEF'
          }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mb: 1
            }}>
              <ScheduleIcon sx={{ color: '#3C8D40', fontSize: { xs: '18px', md: '20px' } }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1C1F2A' }}>
                Tarih
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#666', pl: 3.5 }}>
              {report.created_at ? new Date(report.created_at).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }) : 'Tarih bulunamadı'}
            </Typography>
          </Box>

          {/* Durum */}
          <Box sx={{
            p: { xs: 1.5, md: 2 },
            backgroundColor: '#F8F9FA',
            borderRadius: 2,
            border: '1px solid #E9ECEF'
          }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mb: 1
            }}>
              {report.status === 'Reviewed' ? (
                <CheckCircleIcon sx={{ color: '#4CAF50', fontSize: { xs: '18px', md: '20px' } }} />
              ) : (
                <CancelIcon sx={{ color: '#FF9800', fontSize: { xs: '18px', md: '20px' } }} />
              )}
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1C1F2A' }}>
                Durum
              </Typography>
            </Box>
            <Box sx={{ pl: 3.5 }}>
              <Chip 
                label={report.status === 'Reviewed' ? 'İncelendi' : 'İncelenmedi'}
                color={report.status === 'Reviewed' ? 'success' : 'warning'}
                size="small"
                sx={{ 
                  fontWeight: 500,
                  fontSize: { xs: '11px', md: '12px' }
                }}
              />
            </Box>
          </Box>

          {/* Notlar */}
          <Box sx={{
            p: { xs: 1.5, md: 2 },
            backgroundColor: '#F8F9FA',
            borderRadius: 2,
            border: '1px solid #E9ECEF'
          }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mb: 1
            }}>
              <NoteIcon sx={{ color: '#3C8D40', fontSize: { xs: '18px', md: '20px' } }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1C1F2A' }}>
                Notlar
              </Typography>
            </Box>
            <Typography 
              variant="body2" 
              style={{ whiteSpace: 'pre-wrap' }} 
              sx={{ 
                color: '#666', 
                pl: 3.5,
                fontStyle: report.notes ? 'normal' : 'italic'
              }}
            >
              {report.notes || 'Not bulunmuyor.'}
            </Typography>
          </Box>

          {/* --- YAPAY ZEKA ÖZETİ (YENİ) --- */}
          {report.ai_summary && (
              <Box sx={{
                  p: { xs: 1.5, md: 2 },
                  backgroundColor: '#E3F2FD', // Açık mavi (Yapay Zeka rengi)
                  borderRadius: 2,
                  border: '1px solid #BBDEFB',
                  mt: 2
              }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      {/* Şık bir başlık */}
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1565C0' }}>
                          ✨ Yapay Zeka Özeti
                      </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#0D47A1', pl: 0 }}>
                      {report.ai_summary}
                  </Typography>
              </Box>
          )}
          {/* -------------------------------- */}

          {/* Dosya Bilgisi */}
          <Box sx={{
            p: { xs: 1.5, md: 2 },
            backgroundColor: '#F8F9FA',
            borderRadius: 2,
            border: '1px solid #E9ECEF'
          }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mb: 1
            }}>
              <DescriptionIcon sx={{ color: '#3C8D40', fontSize: { xs: '18px', md: '20px' } }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1C1F2A' }}>
                Dosya
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#666', pl: 3.5 }}>
              {(() => {
                // Önce originalFileName'i kontrol et
                if (report.originalFileName) {
                  return report.originalFileName;
                }
                
                // Fallback: filePath'den dosya adını çıkar
                const filePath = report.filePath || report.file_path;
                if (!filePath) return 'Dosya bulunamadı';
                
                const fullFileName = filePath.split('/').pop();
                // Timestamp formatı: 1755697676475-842431634-isgg.pdf
                // Sadece son kısmı al: isgg.pdf
                const parts = fullFileName.split('-');
                if (parts.length >= 3) {
                  // Son parçayı al (isgg.pdf)
                  return parts[parts.length - 1];
                }
                return fullFileName; // Eğer format farklıysa orijinali göster
              })()}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ 
        p: { xs: 2, md: 3 }, 
        borderTop: '1px solid #E9ECEF',
        backgroundColor: '#F8F9FA',
        gap: 2
      }}>
        <Button
          onClick={handleDownload}
          variant="contained"
          startIcon={<FileDownloadIcon />}
          sx={{
            backgroundColor: '#3C8D40',
            '&:hover': { backgroundColor: '#2E7D32' },
            borderRadius: 2,
            px: { xs: 2, md: 3 },
            py: { xs: 1, md: 1.5 },
            fontWeight: 600,
            textTransform: 'none',
            fontSize: { xs: '14px', md: '16px' }
          }}
        >
          Dosyayı İndir
        </Button>
        <Button 
          onClick={() => {
            console.log('Kapat butonu tıklandı');
            console.log('onClose fonksiyonu:', onClose);
            if (typeof onClose === 'function') {
              onClose();
            } else {
              console.error('onClose fonksiyonu tanımlı değil!');
            }
          }}
          variant="outlined"
          sx={{ 
            color: '#666',
            borderColor: '#E9ECEF',
            '&:hover': { 
              backgroundColor: '#F5F5F5',
              borderColor: '#666'
            },
            borderRadius: 2,
            px: { xs: 2, md: 3 },
            py: { xs: 1, md: 1.5 },
            fontWeight: 500,
            textTransform: 'none',
            fontSize: { xs: '14px', md: '16px' }
          }}
        >
          Kapat
        </Button>
      </DialogActions>
    </Dialog>
  );
} 