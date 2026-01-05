import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, Paper, Chip, CircularProgress, Divider } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ReportTable from '../components/ReportTable';
import DailyWarningsSection from '../components/DailyWarningsSection'; // Eski bileşen
import { getAllReports } from '../services/api';
import { 
  getSentimentStats, 
  getDashboardStats, 
  getRecentActivities, 
  getDailyStatus 
} from '../services/dashboardService';

const COLORS = { 'Positive': '#4caf50', 'Negative': '#f44336', 'Neutral': '#ff9800', 'Belirsiz': '#9e9e9e' };

export default function ManagerDashboard() {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ sentimentCounts: [], wordCloud: [] });
  const [oldDashboardStats, setOldDashboardStats] = useState(null); // Eski özet verileri
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: '', calisan: '' });

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        // Hem eski hem yeni verileri aynı anda çekiyoruz
        const [reportsRes, sentimentRes, oldStatsRes] = await Promise.all([
          getAllReports(filters),
          getSentimentStats(),
          getDashboardStats() // Eski dashboard verisi
        ]);

        setReports(reportsRes.reports || reportsRes || []);
        setStats(sentimentRes || { sentimentCounts: [], wordCloud: [] });
        setOldDashboardStats(oldStatsRes);
      } catch (err) {
        console.error("Dashboard veri yükleme hatası:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, [filters]);

  const pieData = (stats.sentimentCounts || [])
    .map(item => ({ name: item.sentimentLabel, value: parseInt(item.count || 0) }))
    .filter(item => item.value > 0);

  if (loading && reports.length === 0) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold', color: '#1a237e' }}>
        Yönetici Paneli
      </Typography>

      {/* 1. BÖLÜM: ESKİ ÖZET KARTLARI (Opsiyonel: Eğer verin varsa gösterir) */}
      {oldDashboardStats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}>
              <Typography variant="h6">{oldDashboardStats.totalReports || 0}</Typography>
              <Typography variant="body2">Toplam Rapor</Typography>
            </Paper>
          </Grid>
          {/* Buraya diğer eski kartlarını ekleyebilirsin */}
        </Grid>
      )}

      {/* 2. BÖLÜM: YENİ AI ANALİZ GRAFİKLERİ */}
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'medium' }}>AI Analiz Özeti</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" align="center" sx={{ mb: 2 }}>Duygu Dağılımı</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={50} label>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS['Belirsiz']} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: 400, overflow: 'auto' }}>
            <Typography variant="h6" align="center" sx={{ mb: 2 }}>Öne Çıkan Etiketler</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, justifyContent: 'center' }}>
              {stats.wordCloud?.map((tag, i) => (
                <Chip key={i} label={`${tag.text} (${tag.value})`} color="primary" variant="outlined" sx={{ fontWeight: 'bold' }} />
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* 3. BÖLÜM: ESKİ GÜNLÜK UYARILAR SEKSİYONU */}
      <Box sx={{ mb: 4 }}>
        <DailyWarningsSection /> 
      </Box>

      {/* 4. BÖLÜM: RAPOR TABLOSU */}
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Rapor Listesi</Typography>
      <ReportTable reports={reports} filters={filters} setFilters={setFilters} />
    </Container>
  );
}