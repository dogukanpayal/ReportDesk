import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usePerformanceMonitor, useAPIPerformanceMonitor } from '../hooks/usePerformanceMonitor';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  People as PeopleIcon,
  Description as DescriptionIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';

// --- GRAFİKLER İÇİN YENİ IMPORTLAR ---
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend as RechartsLegend } from 'recharts';

// getSentimentStats eklendi
import { getDashboardStats, getRecentActivities, getDailyStatus, getSentimentStats } from '../services/dashboardService.js';
import DailyWarningsSection from '../components/DailyWarningsSection.js';
import Pagination from '../components/Pagination.js';

// GRAFİK RENKLERİ
const SENTIMENT_COLORS = { 'Positive': '#4caf50', 'Negative': '#f44336', 'Neutral': '#ff9800', 'Belirsiz': '#9e9e9e' };

const DashboardPage = () => {
  // Performance monitoring
  usePerformanceMonitor('DashboardPage');
  
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State for accordion expansion
  const [recentReportsExpanded, setRecentReportsExpanded] = useState(false);
  const [unreviewedReportsExpanded, setUnreviewedReportsExpanded] = useState(false);
  
  // State for daily status pagination
  const [dailyStatusPage, setDailyStatusPage] = useState(0);
  const [dailyStatusPageSize, setDailyStatusPageSize] = useState(() => {
    const saved = localStorage.getItem('dailyStatusPageSize');
    return saved ? parseInt(saved, 10) : 8;
  });

  const handleDailyStatusPageSizeChange = (newPageSize) => {
    setDailyStatusPageSize(newPageSize);
    setDailyStatusPage(0);
    localStorage.setItem('dailyStatusPageSize', newPageSize.toString());
  };

  // React Query hooks for data fetching
  const { 
    data: stats, 
    isLoading: statsLoading, 
    error: statsError 
  } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
    enabled: !!user && user.role === 'Yonetici',
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const { 
    data: recentActivities, 
    isLoading: activitiesLoading, 
    error: activitiesError 
  } = useQuery({
    queryKey: ['recentActivities'],
    queryFn: getRecentActivities,
    enabled: !!user && user.role === 'Yonetici',
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const { 
    data: dailyStatus, 
    isLoading: dailyStatusLoading, 
    error: dailyStatusError 
  } = useQuery({
    queryKey: ['dailyStatus'],
    queryFn: getDailyStatus,
    enabled: !!user && user.role === 'Yonetici',
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // --- YENİ: SENTİMENT ANALİZİ İÇİN QUERY ---
  const { 
    data: sentimentStats, 
    isLoading: sentimentLoading, 
    error: sentimentError 
  } = useQuery({
    queryKey: ['sentimentStats'],
    queryFn: getSentimentStats,
    enabled: !!user && user.role === 'Yonetici',
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Performance monitoring for API calls
  useAPIPerformanceMonitor(['dashboardStats'], statsLoading, statsError);
  useAPIPerformanceMonitor(['recentActivities'], activitiesLoading, activitiesError);
  useAPIPerformanceMonitor(['dailyStatus'], dailyStatusLoading, dailyStatusError);
  useAPIPerformanceMonitor(['sentimentStats'], sentimentLoading, sentimentError);

  useEffect(() => {
    if (user && user.role === 'Yonetici') {
      queryClient.invalidateQueries(['dashboardStats']);
      queryClient.invalidateQueries(['recentActivities']);
      queryClient.invalidateQueries(['dailyStatus']);
      queryClient.invalidateQueries(['sentimentStats']); // Sentiment'i de yenile
    }
  }, [user, queryClient]);

  // Grafik verisi hazırlama
  const pieData = useMemo(() => {
    if (!sentimentStats?.sentimentCounts) return [];
    return sentimentStats.sentimentCounts
      .map(item => ({
        name: item.sentimentLabel,
        value: parseInt(item.count || 0)
      }))
      .filter(item => item.value > 0);
  }, [sentimentStats]);

  if (!authLoading && !user) {
    navigate('/login');
    return null;
  }

  if (!authLoading && user && user.role === 'Calisan') {
    navigate('/reports');
    return null;
  }

  if (!authLoading && user && user.role !== 'Yonetici') {
    navigate('/');
    return null;
  }

  const isLoading = authLoading || statsLoading || activitiesLoading || dailyStatusLoading || sentimentLoading;
  const hasError = statsError || activitiesError || dailyStatusError || sentimentError;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (hasError) {
    return (
      <Box sx={{ backgroundColor: '#F5F5F5', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="xl">
          <Alert severity="error" sx={{ mb: 3 }}>
            {statsError?.message || activitiesError?.message || dailyStatusError?.message || sentimentError?.message || 'Dashboard verileri yüklenirken hata oluştu'}
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Dashboard Başlık Kartı */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2, bgcolor: 'white' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#1C1F2A', mb: 0.5, fontSize: { xs: '24px', md: '32px' } }}>
          Yönetici Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '14px', md: '16px' } }}>
          Dashboard istatistiklerini ve bildirimleri görüntüleyin
        </Typography>
      </Paper>

      {/* İstatistik Kartları */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={6} md={3}><Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white' }}><CardContent sx={{ p: { xs: 1.5, sm: 2 } }}><Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><Box><Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', sm: '2rem' } }}>{stats?.totalUsers || 0}</Typography><Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Toplam Çalışan</Typography></Box><PeopleIcon sx={{ fontSize: { xs: 24, sm: 32, md: 40 }, opacity: 0.8 }} /></Box></CardContent></Card></Grid>
        <Grid item xs={6} sm={6} md={3}><Card sx={{ height: '100%', background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)', color: 'white' }}><CardContent sx={{ p: { xs: 1.5, sm: 2 } }}><Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><Box><Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', sm: '2rem' } }}>{stats?.totalReports || 0}</Typography><Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Toplam Rapor</Typography></Box><DescriptionIcon sx={{ fontSize: { xs: 24, sm: 32, md: 40 }, opacity: 0.8 }} /></Box></CardContent></Card></Grid>
        <Grid item xs={6} sm={6} md={3}><Card sx={{ height: '100%', background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)', color: 'white' }}><CardContent sx={{ p: { xs: 1.5, sm: 2 } }}><Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><Box><Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', sm: '2rem' } }}>{stats?.thisMonthReports || 0}</Typography><Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Bu Ay</Typography></Box><TrendingUpIcon sx={{ fontSize: { xs: 24, sm: 32, md: 40 }, opacity: 0.8 }} /></Box></CardContent></Card></Grid>
        <Grid item xs={6} sm={6} md={3}><Card sx={{ height: '100%', background: 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)', color: 'white' }}><CardContent sx={{ p: { xs: 1.5, sm: 2 } }}><Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><Box><Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', sm: '2rem' } }}>{stats?.pendingReports || 0}</Typography><Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Bekleyen</Typography></Box><ScheduleIcon sx={{ fontSize: { xs: 24, sm: 32, md: 40 }, opacity: 0.8 }} /></Box></CardContent></Card></Grid>
      </Grid>

      {/* --- YENİ EKLENEN GRAFİK VE ETİKET ANALİZ BÖLÜMÜ --- */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: 400, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Rapor Duygu Dağılımı</Typography>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.name] || SENTIMENT_COLORS['Belirsiz']} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <RechartsLegend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
                <Typography color="text.secondary">Veri bekleniyor...</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: 400, borderRadius: 2, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Öne Çıkan Etiketler</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, justifyContent: 'center' }}>
              {sentimentStats?.wordCloud?.length > 0 ? (
                sentimentStats.wordCloud.map((tag, i) => (
                  <Chip key={i} label={tag.text} sx={{ 
                    fontSize: Math.min(22, 12 + tag.value * 2), 
                    fontWeight: 'bold', backgroundColor: '#e3f2fd', color: '#0d47a1', p: 1, height: 'auto' 
                  }} />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 10 }}>Henüz analiz edilmiş veri bulunmuyor.</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Son Yüklenen Raporlar ve Çalışan Rapor Dağılımı */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Son Yüklenen Raporlar */}
        <Grid item xs={12} md={6}>
          <Accordion expanded={recentReportsExpanded} onChange={() => setRecentReportsExpanded(!recentReportsExpanded)} sx={{ borderRadius: 1, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'success.main', color: 'white', minHeight: '56px', height: '56px', borderRadius: 1, '&.Mui-expanded': { borderRadius: '8px 8px 0 0' }, '&:hover': { bgcolor: '#2e7d32' } }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Son Yüklenen Raporlar</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <List>
                {recentActivities?.recentReports?.map((report, index) => (
                  <React.Fragment key={report.id}>
                    <ListItem>
                      <ListItemAvatar><Avatar sx={{ bgcolor: 'success.main' }}><DescriptionIcon /></Avatar></ListItemAvatar>
                      <ListItemText primary={`${report.User?.first_name} ${report.User?.last_name}`} secondary={new Date(report.created_at).toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })} />
                      <Chip label={report.status === 'Not Reviewed' ? 'İncelenmedi' : 'İncelendi'} color={report.status === 'Not Reviewed' ? 'warning' : 'success'} size="small" />
                    </ListItem>
                    {index < recentActivities.recentReports.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* İncelenmemiş Rapor Sayısı */}
        <Grid item xs={12} md={6}>
          <Accordion expanded={unreviewedReportsExpanded} onChange={() => setUnreviewedReportsExpanded(!unreviewedReportsExpanded)} sx={{ borderRadius: 1, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#fb8801', color: 'white', minHeight: '56px', height: '56px', borderRadius: 1, '&.Mui-expanded': { borderRadius: '8px 8px 0 0' }, '&:hover': { bgcolor: '#e67a00' } }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>İncelenmemiş Rapor Sayısı</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <List>
                {stats?.userReportStats?.map((userStat, index) => (
                  <React.Fragment key={userStat.id}>
                    <ListItem>
                      <ListItemAvatar><Avatar sx={{ bgcolor: 'primary.main' }}><PersonIcon /></Avatar></ListItemAvatar>
                      <ListItemText primary={`${userStat.first_name} ${userStat.last_name}`} secondary={`${userStat.reportCount} rapor`} />
                    </ListItem>
                    {index < stats.userReportStats.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      {/* Günlük Rapor Durumu */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography variant="h6" gutterBottom>Günlük Rapor Durumu (09:00 - 18:00)</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' }}/><Typography variant="body2">Rapor Yükledi</Typography></Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'warning.main' }}/><Typography variant="body2">Rapor Yüklemedi</Typography></Box>
                </Box>
              </Box>
              {dailyStatus && (
                <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                    Toplam: {dailyStatus.totalEmployees} çalışan | Bugün rapor yükleyen: {dailyStatus.reportedToday} | Rapor yüklemeyen: {dailyStatus.notReportedToday}
                  </Typography>
                </Box>
              )}
            </Box>
            {dailyStatus ? (
              <>
                <Grid container spacing={2}>
                  {dailyStatus.dailyStatus?.sort((a, b) => {
                      if (a.hasReported && !b.hasReported) return 1;
                      if (!a.hasReported && b.hasReported) return -1;
                      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
                    })?.slice(dailyStatusPage * dailyStatusPageSize, (dailyStatusPage + 1) * dailyStatusPageSize).map((employee) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={employee.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
                        <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: employee.hasReported ? 'success.main' : 'warning.main' }}/>
                        <Box><Typography variant="body2" fontWeight="medium">{employee.firstName} {employee.lastName}</Typography><Typography variant="caption" color="text.secondary">{employee.hasReported ? 'Rapor yüklendi' : 'Rapor yüklenmedi'}</Typography></Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                {dailyStatus.dailyStatus && (
                  <Box sx={{ mt: 3 }}>
                    <Pagination page={dailyStatusPage} totalCount={dailyStatus.dailyStatus.length} rowsPerPage={dailyStatusPageSize} onPageChange={setDailyStatusPage} onRowsPerPageChange={handleDailyStatusPageSizeChange} rowsPerPageOptions={[4, 8, 12, 16]} showRowsPerPage={true} showPageInfo={true} sx={{ backgroundColor: 'transparent', boxShadow: 'none', p: 0 }} />
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress size={24} /></Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <DailyWarningsSection user={user} />
        </Grid>
      </Grid>
    </Container>
  );
}

export default DashboardPage;