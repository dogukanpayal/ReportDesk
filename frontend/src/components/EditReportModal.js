import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  IconButton
} from '@mui/material';
import { Close as CloseIcon, AccessTime as AccessTimeIcon } from '@mui/icons-material';
// Supabase import kaldırıldı - artık backend üzerinden API çağrıları yapılıyor

// UTC stringleri doğru parse etmek için yardımcı fonksiyon
function parseUTCDate(dateString) {
  if (dateString && !dateString.endsWith('Z')) {
    return new Date(dateString.replace(' ', 'T') + 'Z');
  }
  return new Date(dateString);
}

const EditReportModal = ({ open, onClose, report, onReportUpdated }) => {
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [canEdit, setCanEdit] = useState(true);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef(null);

  // Karakter sayısı hesaplama
  const remainingChars = 255 - notes.length;
  const isNotesValid = notes.length <= 255;

  // Dosya validasyonu
  const validateFile = (selectedFile) => {
      // Dosya boyutu kontrolü (10 MB)
  const maxSize = 10 * 1024 * 1024; // 10 MB in bytes
  if (selectedFile.size > maxSize) {
    return 'Dosya boyutu çok büyük. Maksimum 10 MB olmalıdır.';
  }

    // Dosya türü kontrolü
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'];
    
    // MIME type kontrolü
    if (!allowedTypes.includes(selectedFile.type)) {
      // Dosya uzantısı kontrolü (fallback)
      const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
      if (!allowedExtensions.includes(fileExtension)) {
        return 'Desteklenmeyen dosya türü. Sadece PDF, DOC, DOCX, XLS, XLSX ve TXT dosyaları kabul edilir.';
      }
    }

    // Dosya adı uzunluğu kontrolü (255 karakter)
    if (selectedFile.name.length > 255) {
      return 'Dosya adı çok uzun. Maksimum 255 karakter olmalıdır.';
    }

    // Dosya adı karakter kontrolü (sadece alfanumerik, tire ve alt çizgi)
    const validFilenameRegex = /^[a-zA-Z0-9\-\_\.]+$/;
    if (!validFilenameRegex.test(selectedFile.name)) {
      return 'Dosya adında sadece harf, rakam, tire (-) ve alt çizgi (_) kullanılabilir.';
    }

    return null; // Hata yok
  };

  // Mobil cihaz tespiti
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      setIsMobile(mobileRegex.test(userAgent.toLowerCase()));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Rapor verilerini yükle
  useEffect(() => {
    if (report) {
      setNotes(report.notes || '');
      setFile(null);
      setError('');
      
      // Debug: Rapor verilerini log'la
      console.log('=== EditReportModal Report Data Debug ===');
      console.log('Report object:', report);
      console.log('Report notes:', report.notes);
      console.log('Report filePath:', report.filePath);
      console.log('=== End Report Data Debug ===');
      
      // Zaman hesaplama - UTC düzeltmesi ile
      if (report.created_at) {
        const createdAt = parseUTCDate(report.created_at);
        const now = new Date();
        const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
        const remainingHours = Math.max(0, 24 - hoursSinceCreation);
        
        // Debug: Zaman hesaplama log'ları
        console.log('=== EditReportModal Time Debug ===');
        console.log('Original created_at:', report.created_at);
        console.log('Parsed createdAt (UTC):', createdAt);
        console.log('Current time (now):', now);
        console.log('Hours since creation:', hoursSinceCreation);
        console.log('Remaining hours:', remainingHours);
        console.log('=== End Time Debug ===');
        
        if (remainingHours <= 0) {
          setCanEdit(false);
          setTimeRemaining({ canEdit: false, remainingHours: 0, remainingMinutes: 0 });
        } else {
          setCanEdit(true);
          setTimeRemaining({
            canEdit: true,
            remainingHours: Math.floor(remainingHours),
            remainingMinutes: Math.floor((remainingHours % 1) * 60)
          });
        }
      }
    }
  }, [report]);

  // Geri sayım timer'ı - UTC düzeltmesi ile
  useEffect(() => {
    if (!open || !canEdit || !timeRemaining) return;

    const timer = setInterval(() => {
      if (report?.created_at) {
        const createdAt = parseUTCDate(report.created_at);
        const now = new Date();
        const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
        const remainingHours = Math.max(0, 24 - hoursSinceCreation);
        
        if (remainingHours <= 0) {
          setCanEdit(false);
          setTimeRemaining({ canEdit: false, remainingHours: 0, remainingMinutes: 0 });
          clearInterval(timer);
        } else {
          setTimeRemaining({
            canEdit: true,
            remainingHours: Math.floor(remainingHours),
            remainingMinutes: Math.floor((remainingHours % 1) * 60)
          });
        }
      }
    }, 60000); // Her dakika güncelle

    return () => clearInterval(timer);
  }, [open, canEdit, report?.created_at, timeRemaining]);

  // Sürükle-bırak event handler'ları
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Tarayıcı uyumluluğu kontrolü
    if (e.dataTransfer && e.dataTransfer.items) {
      setIsDragActive(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Tarayıcı uyumluluğu kontrolü
    if (e.dataTransfer && e.dataTransfer.items && !isDragActive) {
      setIsDragActive(true);
    }
  }, [isDragActive]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (!canEdit) {
      setError('Bu rapor artık düzenlenemez');
      return;
    }
    
    try {
      // Tarayıcı uyumluluğu kontrolü
      if (!e.dataTransfer || !e.dataTransfer.files) {
        setError('Tarayıcınız sürükle-bırak dosya yüklemeyi desteklemiyor. Lütfen dosya seçme butonunu kullanın.');
        return;
      }
      
      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles && droppedFiles.length > 0) {
        if (droppedFiles.length > 1) {
          setError('Lütfen sadece bir dosya yükleyin.');
          return;
        }
        
        const selectedFile = droppedFiles[0]; // Sadece ilk dosyayı al
        const validationError = validateFile(selectedFile);
        
        if (validationError) {
          setError(validationError);
          return;
        } else {
          setError('');
          setFile(selectedFile);
        }
      }
    } catch (error) {
      console.error('Dosya bırakma hatası:', error);
      setError('Dosya yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }, [canEdit]);

  const handleFileChange = (event) => {
    if (!canEdit) {
      setError('Bu rapor artık düzenlenemez');
      return;
    }
    
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const validationError = validateFile(selectedFile);
      if (validationError) {
        setError(validationError);
        return;
      }
      
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!canEdit) {
      setError('Bu rapor artık düzenlenemez');
      return;
    }

    // Notlar validasyonu
    if (notes.length > 255) {
      setError('Notlar 255 karakterden uzun olamaz');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('notes', notes);
      
      if (file) {
        formData.append('file', file);
      }

      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/reports/${report.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const updatedReport = await response.json();
        // Rapor güncellendiğinde cache'i invalidate et
        onReportUpdated(report.id, null, false, true);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Rapor güncellenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error updating report:', error);
      setError('Rapor güncellenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (hours, minutes) => {
    if (hours > 0) {
      return `${hours} saat ${minutes} dakika`;
    }
    return `${minutes} dakika`;
  };

  if (!report) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: '#F8F9FA',
        borderBottom: '1px solid #E0E0E0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="body1" sx={{ fontWeight: 600, color: '#1C1F2A', fontSize: '1.25rem' }}>
          Rapor Düzenle
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Zaman Uyarısı */}
          {timeRemaining && (
            <Alert 
              severity={canEdit ? "info" : "warning"}
              icon={<AccessTimeIcon />}
              sx={{ 
                backgroundColor: canEdit ? '#E3F2FD' : '#FFF3E0',
                border: `1px solid ${canEdit ? '#2196F3' : '#FF9800'}`
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {canEdit 
                  ? `Düzenleme süresi: ${formatTime(timeRemaining.remainingHours, timeRemaining.remainingMinutes)}`
                  : '24 saat süresi doldu, bu rapor artık düzenlenemez'
                }
              </Typography>
            </Alert>
          )}

          {/* Hata Mesajı */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {/* Notlar */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1C1F2A', mb: 1 }}>
              Notlar
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Rapor notlarınızı buraya yazın..."
              disabled={!canEdit}
              inputProps={{
                maxLength: 255 // HTML input maxLength
              }}
              helperText={`${notes.length}/255 karakter (${remainingChars} karakter kaldı)`}
              error={!isNotesValid}
              FormHelperTextProps={{
                sx: {
                  color: isNotesValid ? '#666' : '#d32f2f',
                  fontSize: '12px'
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#E0E0E0' },
                  '&:hover fieldset': { borderColor: '#2196F3' },
                  '&.Mui-focused fieldset': { borderColor: '#2196F3' },
                  '&.Mui-error fieldset': { borderColor: '#d32f2f' }
                }
              }}
            />
          </Box>

                      {/* Dosya Yükleme */}
          <Box>
            {/* Mevcut Dosya Bilgisi */}
            {report?.filePath && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                  Mevcut Dosya: <strong>{(() => {
                    const fullFileName = report.filePath.split('/').pop();
                    // Timestamp formatı: 1755697676475-842431634-isgg.pdf
                    // Sadece son kısmı al: isgg.pdf
                    const parts = fullFileName.split('-');
                    if (parts.length >= 3) {
                      // Son parçayı al (isgg.pdf)
                      return parts[parts.length - 1];
                    }
                    return fullFileName; // Eğer format farklıysa orijinali göster
                  })()}</strong>
                </Typography>
              </Box>
            )}
            
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1C1F2A', mb: 1 }}>
              Dosya Değiştir (Opsiyonel)
            </Typography>
            
            {/* Sürükle-Bırak Alanı */}
            <Box
              sx={{
                p: 3,
                border: `2px dashed ${isDragActive ? '#2196F3' : '#E0E0E0'}`,
                borderRadius: 2,
                backgroundColor: isDragActive ? '#E3F2FD' : '#FAFAFA',
                textAlign: 'center',
                cursor: canEdit ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                mb: 2,
                '&:hover': canEdit ? {
                  borderColor: '#2196F3',
                  backgroundColor: '#E3F2FD'
                } : {}
              }}
              onClick={() => canEdit && fileInputRef.current?.click()}
              onDragEnter={canEdit && !isMobile ? handleDragEnter : undefined}
              onDragOver={canEdit && !isMobile ? handleDragOver : undefined}
              onDragLeave={canEdit && !isMobile ? handleDragLeave : undefined}
              onDrop={canEdit && !isMobile ? handleDrop : undefined}
            >
              <input
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                style={{ display: 'none' }}
                ref={fileInputRef}
                id="file-upload"
                name="file-upload"
                type="file"
                onChange={handleFileChange}
                disabled={!canEdit}
              />
              <Typography variant="body1" sx={{ color: '#1C1F2A', mb: 1, fontWeight: 500 }}>
                {isDragActive ? 'Dosyayı Buraya Bırakın' : (file ? file.name : 'Dosya Seçin')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', mb: 1, fontSize: '13px' }}>
                {isMobile ? 'Dosya seçmek için tıklayın' : 'Dosyayı sürükleyip bırakabilir veya tıklayarak seçebilirsiniz'}
              </Typography>
              {!canEdit && (
                <Typography variant="body2" sx={{ color: '#d32f2f', mt: 1, fontWeight: 500 }}>
                  Bu rapor artık düzenlenemez
                </Typography>
              )}
            </Box>
            {file && (
              <Chip 
                label={file.name} 
                onDelete={() => setFile(null)}
                sx={{ ml: 2 }}
                color="primary"
                variant="outlined"
              />
            )}
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#666' }}>
              Maksimum dosya boyutu: 10 MB. Desteklenen formatlar: PDF, DOC, DOCX, XLS, XLSX, TXT
            </Typography>
          </Box>


        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #E0E0E0' }}>
        <Button 
          onClick={onClose}
          sx={{ 
            color: '#666',
            '&:hover': { backgroundColor: '#F5F5F5' }
          }}
        >
          İptal
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!canEdit || loading}
          sx={{
            backgroundColor: '#2196F3',
            '&:hover': { backgroundColor: '#1976D2' },
            '&:disabled': { backgroundColor: '#E0E0E0' }
          }}
        >
          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            'Güncelle'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditReportModal; 