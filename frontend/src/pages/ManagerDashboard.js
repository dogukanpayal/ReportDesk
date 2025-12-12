import React, { useState, useEffect } from 'react';
import { Container, Typography, Box } from '@mui/material';
import ReportTable from '../components/ReportTable';
import { getAllReports } from '../services/api';

export default function ManagerDashboard() {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({ date: '', calisan: '' });

  useEffect(() => {
    getAllReports(filters).then(setReports);
  }, [filters]);

  return (
    <Container>
      <Typography variant="h4" sx={{ mt: 4, mb: 2 }}>
        Tüm Çalışan Raporları
      </Typography>
      <Box sx={{ mb: 2 }}>
        <ReportTable
          reports={reports}
          filters={filters}
          setFilters={setFilters}
        />
      </Box>
    </Container>
  );
} 