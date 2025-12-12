import React, { useState, useEffect } from 'react';
import { Container, Typography, Box } from '@mui/material';
import ReportForm from '../components/ReportForm';
import ReportList from '../components/ReportList';
import { getMyReports, uploadReport } from '../services/api';

export default function EmployeeDashboard() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    getMyReports().then(setReports);
  }, []);

  const handleReportSubmit = async (report) => {
    const res = await uploadReport(report);
    if (res.success) {
      setReports((prev) => [res.report, ...prev]);
    }
  };

  return (
    <Container>
      <Typography variant="h4" sx={{ mt: 4, mb: 2 }}>
        My Reports
      </Typography>
      <Box sx={{ mb: 4 }}>
        <ReportForm onSubmit={handleReportSubmit} />
      </Box>
      <ReportList reports={reports} />
    </Container>
  );
} 