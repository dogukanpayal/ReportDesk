import React, { useState, useEffect } from 'react';
import {
  Box, TextField, MenuItem, FormControl, InputLabel, Select,
  InputAdornment, IconButton, Button, useTheme, useMediaQuery, Paper, Typography
} from '@mui/material';

import { getUsers } from '../services/userService';

export default function ReportsFilter({
  dateFilter,
  statusFilter,
  uploaderFilter,
  onDateFilterChange,
  onStatusFilterChange,
  onUploaderFilterChange,
  currentUser
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Çalışan listesi state'i
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  
  // Buton durumu state'i
  const [showAllReports, setShowAllReports] = useState(false);

  // Bugünün tarihini al
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Çalışan listesini getir
  useEffect(() => {
    if (currentUser?.role === 'Yonetici') {
      const fetchEmployees = async () => {
        try {
          setEmployeesLoading(true);
          const response = await getUsers(0, 1000, '', 'Calisan'); // Sadece çalışan rolündeki kullanıcıları getir
          setEmployees(response.users || []);
        } catch (error) {
          console.error('Çalışan listesi getirilemedi:', error);
        } finally {
          setEmployeesLoading(false);
        }
      };
      
      fetchEmployees();
    }
  }, [currentUser?.role]);

  // Başlangıçta bugünün tarihini set et
  useEffect(() => {
    if (dateFilter === '') {
      onDateFilterChange(getTodayDate());
    }
  }, []);

  const handleToggleReports = () => {
    if (showAllReports) {
      // Bugünün raporlarını göster
      onDateFilterChange(getTodayDate());
      onStatusFilterChange('');
      onUploaderFilterChange('');
      setShowAllReports(false);
    } else {
      // Bütün raporları göster
      onDateFilterChange(''); // Tarih filtresini tamamen kaldır
      onStatusFilterChange('');
      onUploaderFilterChange('');
      setShowAllReports(true);
    }
  };

  const statusOptions = [
    { value: '', label: 'Tüm Durumlar' },
    { value: 'Not Reviewed', label: 'İncelenmedi' },
    { value: 'Reviewed', label: 'İncelendi' }
  ];

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
      gap: 2,
      alignItems: { xs: 'stretch', md: 'center' },
      justifyContent: 'space-between',
      width: '100%'
    }}>
      {/* Sol tarafta filtreler grubu */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        alignItems: { xs: 'stretch', md: 'center' },
        flexWrap: 'wrap'
      }}>
        {/* Tarih Filtresi */}
        <TextField
          label="Tarih Gün Filtresi"
          type="date"
          value={dateFilter}
          onChange={(e) => onDateFilterChange(e.target.value)}
          size="small"
          sx={{ 
            minWidth: { xs: '100%', md: '150px' },
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
          InputLabelProps={{
            shrink: true
          }}
        />

        {/* Durum Filtresi */}
        <FormControl 
          size="small" 
          sx={{ 
            minWidth: { xs: '100%', md: '150px' }
          }}
        >
          <InputLabel>Durum</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            label="Durum"
            sx={{ 
              backgroundColor: 'white',
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#DEE2E6'
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#ADB5BD'
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#1976d2'
              }
            }}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Yönetici için Çalışan Filtresi */}
        {currentUser?.role === 'Yonetici' && (
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: { xs: '100%', md: '150px' }
            }}
          >
            <InputLabel>Çalışan</InputLabel>
            <Select
              value={uploaderFilter}
              onChange={(e) => onUploaderFilterChange(e.target.value)}
              label="Çalışan"
              sx={{ 
                backgroundColor: 'white',
                borderRadius: 2,
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
              disabled={employeesLoading}
            >
              <MenuItem value="">Tüm Çalışanlar</MenuItem>
              {employees.map((employee) => (
                <MenuItem key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Sağ tarafta toggle buton */}
      <Button
        variant="outlined"
        onClick={handleToggleReports}
        size="small"
        sx={{ 
          minWidth: { xs: '100%', md: 'auto' },
          px: 2,
          py: 1,
          color: '#666',
          borderColor: '#ddd',
          borderRadius: 2,
          fontSize: '14px',
          fontWeight: 500,
          '&:hover': {
            borderColor: '#999',
            backgroundColor: '#f5f5f5'
          }
        }}
      >
        {showAllReports ? 'Bugünün Raporlarını Göster' : 'Bütün Raporları Göster'}
      </Button>
    </Box>
  );
}
