import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  useTheme,
  useMediaQuery,
  Collapse
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import NoteIcon from '@mui/icons-material/Note';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export default function ReportDetailModal({ report, onClose, open = true }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showDetailed, setShowDetailed] = useState(false);
  
  if (!report) return null;

  // Kısa ve uzun özet mantığı
  // Backend'den gelen veri formatına göre (snake_case veya camelCase) kontrol ediyoruz
  const shortSummary = report.ai_summary_short || report.aiSummaryShort || (report.ai_summary ? report.ai_summary.substring(0, 150) + "..." : "Özet hazırlanıyor...");
  const detailedSummary = report.ai_summary || report.aiSummary;

  const handleDownload = async () => {
    try {
      const filePath = report.filePath || report.file_path;
      if (!filePath) {
        alert('Dosya yolu bulunamadı.');
        return;
      }
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/reports/download/${encodeURIComponent(filePath)}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      let fileName = report.originalFileName;
      if (!fileName) {
        const parts = filePath.split('-');
        fileName = parts.length >= 3 ? parts[parts.length - 1] : filePath;
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('İndirme hatası:', error);
      alert('Dosya indirilemedi.');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth={isMobile ? 'xs' : 'sm'}
      PaperProps={{
        sx: { borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }
      }}
    >
      <DialogTitle sx={{ backgroundColor: '#F8F9FA', borderBottom: '1px solid #E9ECEF', p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1C1F2A' }}>
          Rapor Detayları
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 2, backgroundColor: '#FFFFFF' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          
          {/* Çalışan & Tarih */}
          <Box sx={{ display: 'flex', gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>
             <Box sx={{ flex: 1, p: 1.5, bgcolor: '#F8F9FA', borderRadius: 2, border: '1px solid #E9ECEF' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                   <PersonIcon sx={{ color: '#3C8D40', fontSize: 20 }} />
                   <Typography variant="subtitle2" fontWeight={600}>Çalışan</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" pl={3.5}>
                   {report.uploader_first_name ? `${report.uploader_first_name} ${report.uploader_last_name}` : 'Kullanıcı'}
                </Typography>
             </Box>
             <Box sx={{ flex: 1, p: 1.5, bgcolor: '#F8F9FA', borderRadius: 2, border: '1px solid #E9ECEF' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                   <ScheduleIcon sx={{ color: '#3C8D40', fontSize: 20 }} />
                   <Typography variant="subtitle2" fontWeight={600}>Tarih</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" pl={3.5}>
                   {report.created_at ? new Date(report.created_at).toLocaleDateString('tr-TR') : '-'}
                </Typography>
             </Box>
          </Box>

          {/* Durum */}
          <Box sx={{ p: 1.5, bgcolor: '#F8F9FA', borderRadius: 2, border: '1px solid #E9ECEF' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
               {report.status === 'Reviewed' ? <CheckCircleIcon sx={{ color: '#4CAF50', fontSize: 20 }} /> : <CancelIcon sx={{ color: '#FF9800', fontSize: 20 }} />}
               <Typography variant="subtitle2" fontWeight={600}>Durum</Typography>
            </Box>
            <Box pl={3.5} mt={0.5}>
              <Chip 
                label={report.status === 'Reviewed' ? 'İncelendi' : 'İncelenmedi'}
                color={report.status === 'Reviewed' ? 'success' : 'warning'}
                size="small"
              />
            </Box>
          </Box>

          {/* --- YAPAY ZEKA ÖZETİ BÖLÜMÜ --- */}
          {(report.ai_summary || report.ai_summary_short) && (
              <Box sx={{
                  p: 2,
                  backgroundColor: '#F0F7FF',
                  borderRadius: 2,
                  border: '1px solid #BAE3FF',
                  position: 'relative',
                  overflow: 'hidden'
              }}>
                  {/* Dekoratif Arkaplan İkonu */}
                  <AutoAwesomeIcon sx={{ 
                      position: 'absolute', 
                      top: -10, 
                      right: -10, 
                      fontSize: 60, 
                      color: 'rgba(21, 101, 192, 0.1)' 
                  }} />

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <AutoAwesomeIcon sx={{ color: '#1976D2', fontSize: 20 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1565C0' }}>
                          Yapay Zeka Analizi
                      </Typography>
                  </Box>
                  
                  {/* Özet İçeriği - pre-wrap ile satır başları korunur */}
                  <Typography 
                      variant="body2" 
                      sx={{ 
                          color: '#0D47A1', 
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap', // <--- KRİTİK NOKTA: Metin formatını korur
                          fontFamily: 'Roboto, sans-serif'
                      }}
                  >
                      {showDetailed ? detailedSummary : shortSummary}
                  </Typography>

                  {/* Devamını Oku Butonu */}
                  <Button 
                      onClick={() => setShowDetailed(!showDetailed)}
                      endIcon={showDetailed ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      sx={{ 
                          mt: 1.5, 
                          textTransform: 'none', 
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          p: 0,
                          '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                      }}
                  >
                      {showDetailed ? "Özeti Küçült" : "Detaylı Analizi Oku"}
                  </Button>
              </Box>
          )}

          {/* Notlar */}
          <Box sx={{ p: 1.5, bgcolor: '#F8F9FA', borderRadius: 2, border: '1px solid #E9ECEF' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <NoteIcon sx={{ color: '#3C8D40', fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={600}>Notlar</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" pl={3.5} fontStyle={report.notes ? 'normal' : 'italic'}>
              {report.notes || 'Not bulunmuyor.'}
            </Typography>
          </Box>

          {/* Dosya Adı */}
          <Box sx={{ p: 1.5, bgcolor: '#F8F9FA', borderRadius: 2, border: '1px solid #E9ECEF' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
               <DescriptionIcon sx={{ color: '#3C8D40', fontSize: 20 }} />
               <Typography variant="subtitle2" fontWeight={600}>Dosya</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" pl={3.5}>
               {report.originalFileName || (report.filePath ? report.filePath.split('-').pop() : 'Dosya yok')}
            </Typography>
          </Box>

        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#F8F9FA', borderTop: '1px solid #E9ECEF' }}>
        <Button onClick={handleDownload} variant="contained" startIcon={<FileDownloadIcon />} sx={{ bgcolor: '#3C8D40' }}>
          İndir
        </Button>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Kapat
        </Button>
      </DialogActions>
    </Dialog>
  );
}