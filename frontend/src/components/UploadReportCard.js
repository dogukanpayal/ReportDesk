import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, Typography, Button, TextField, Box, Input, Paper } from '@mui/material';
import { uploadReport } from '../services/reportService';
import { useAuth } from '../contexts/AuthContext';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

export default function UploadReportCard({ onUploadSuccess }) {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef(null);
  
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

  // Karakter sayısı hesaplama
  const remainingChars = 255 - notes.length;
  const isNotesValid = notes.length <= 255;

  // Dosya validasyonu
  const validateFile = (selectedFile) => {
    try {
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
    } catch (error) {
      console.error('Dosya doğrulama hatası:', error);
      return 'Dosya doğrulanırken bir hata oluştu. Lütfen tekrar deneyin.';
    }
  };

  // Dosya seçimi
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validationError = validateFile(selectedFile);
      if (validationError) {
        setError(validationError);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setError('');
        setFile(selectedFile);
      }
    }
  };
  
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
          setFile(null);
        } else {
          setError('');
          setFile(selectedFile);
        }
      }
    } catch (error) {
      console.error('Dosya bırakma hatası:', error);
      setError('Dosya yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Dosya kontrolü
    if (!file) {
      setError('Lütfen bir dosya seçin');
      setLoading(false);
      return;
    }
    
    // Notlar validasyonu
    if (notes.length > 255) {
      setError('Notlar 255 karakterden uzun olamaz');
      setLoading(false);
      return;
    }
    
    try {
      await uploadReport(file, notes, user.id);
      setFile(null);
      setNotes('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setError(err.message || 'Dosya yüklenirken bir hata oluştu');
    }
    setLoading(false);
  };

  return (
    <Card sx={{ 
      mb: 4,
      backgroundColor: '#FFFFFF',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      borderRadius: 3
    }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ 
          fontWeight: 600,
          color: '#1C1F2A',
          mb: 3
        }}>
          Rapor Yükle
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Dosya Yükleme Alanı */}
          <Paper
            sx={{
              p: 3,
              border: `2px dashed ${isDragActive ? '#3C8D40' : '#E0E0E0'}`,
              borderRadius: 2,
              backgroundColor: isDragActive ? '#F8FFF8' : '#FAFAFA',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#3C8D40',
                backgroundColor: '#F8FFF8'
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={!isMobile ? handleDragEnter : undefined}
            onDragOver={!isMobile ? handleDragOver : undefined}
            onDragLeave={!isMobile ? handleDragLeave : undefined}
            onDrop={!isMobile ? handleDrop : undefined}
          >
            <CloudUploadIcon sx={{ fontSize: 48, color: '#3C8D40', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#1C1F2A', mb: 1 }}>
              {isDragActive ? 'Dosyayı Buraya Bırakın' : 'Dosya Seçin'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mb: 1, fontSize: '13px' }}>
              {isMobile ? 'Dosya seçmek için tıklayın' : 'Dosyayı sürükleyip bırakabilir veya tıklayarak seçebilirsiniz'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mb: 1, fontSize: '12px' }}>
              Desteklenen formatlar: PDF, DOC, DOCX, XLS, XLSX, TXT
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mb: 2, fontSize: '12px' }}>
              Maksimum boyut: 10 MB
            </Typography>
            <input
              type="file"
              name="reportFile"
              id="reportFile"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
              style={{ display: 'none' }}
            />
            {file && (
              <Typography variant="body2" sx={{ color: '#3C8D40', mt: 1, fontWeight: 500 }}>
                Seçilen: {file.name}
              </Typography>
            )}
          </Paper>

          {/* Notlar Alanı */}
          <TextField
            label="Notlar"
            multiline
            minRows={3}
            maxRows={6}
            value={notes}
            onChange={e => setNotes(e.target.value)}
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
                backgroundColor: '#FFFFFF',
                '&:hover': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3C8D40'
                  }
                },
                '&.Mui-focused': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3C8D40'
                  }
                },
                '&.Mui-error': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#d32f2f'
                  }
                }
              }
            }}
          />

          {/* Hata Mesajı */}
          {error && (
            <Typography color="error" sx={{ 
              backgroundColor: '#FFEBEE',
              p: 2,
              borderRadius: 1,
              border: '1px solid #FFCDD2'
            }}>
              {error}
            </Typography>
          )}

          {/* Yükle Butonu */}
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            sx={{
              backgroundColor: '#3C8D40',
              py: 1.5,
              px: 4,
              fontSize: '16px',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: '#2E7D32'
              },
              '&:disabled': {
                backgroundColor: '#BDBDBD'
              }
            }}
          >
            {loading ? 'Yükleniyor...' : 'YÜKLE'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
} 