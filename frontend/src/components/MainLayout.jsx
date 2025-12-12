import React, { useState, useEffect } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import NavigationDrawer from './NavigationDrawer';

export default function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const [previousPath, setPreviousPath] = useState(location.pathname);
  
  // Drawer açık/kapalı durumunu localStorage'dan al veya varsayılan olarak false kullan
  const [drawerOpen, setDrawerOpen] = useState(() => {
    try {
      // Mobilde varsayılan olarak kapalı, desktop'ta localStorage'dan al
      if (window.innerWidth < theme.breakpoints.values.md) {
        return false;
      }
      const savedDrawerState = localStorage.getItem('drawerOpen');
      return savedDrawerState !== null ? JSON.parse(savedDrawerState) : false;
    } catch (error) {
      console.error('localStorage drawer state okunurken hata:', error);
      return false;
    }
  });
  
  // Determine the selected menu item based on the current path
  const getSelectedMenu = (pathname) => {
    if (pathname.startsWith('/settings')) return 'Settings';
    if (pathname.startsWith('/reports')) return 'Raporlar';
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    return 'Dashboard'; // Default
  };
  
  const [selectedMenu, setSelectedMenu] = useState(getSelectedMenu(location.pathname));

  // Drawer toggle function
  const toggleDrawer = () => {
    const newDrawerState = !drawerOpen;
    setDrawerOpen(newDrawerState);
    
    // Sadece desktop'ta localStorage'a kaydet
    if (!isMobile) {
      try {
        localStorage.setItem('drawerOpen', JSON.stringify(newDrawerState));
      } catch (error) {
        console.error('localStorage drawer state kaydedilirken hata:', error);
      }
    }
  };

  // Mobilde drawer'ı kapat
  const closeDrawer = () => {
    if (isMobile) {
      setDrawerOpen(false);
    }
  };


  // Logout timestamp kontrolü (diğer sekmelerde logout yapıldığında)
  useEffect(() => {
    const checkLogoutStatus = () => {
      const logoutTimestamp = sessionStorage.getItem('logoutTimestamp');
      if (logoutTimestamp) {
        const currentTime = Date.now();
        const logoutTime = parseInt(logoutTimestamp);
        // 10 saniye içinde logout yapıldıysa current tab'ı da logout yap
        if (currentTime - logoutTime < 10000) {
          console.log('=== MainLayout Logout Detection ===');
          console.log('Logout detected in another tab, clearing current tab');
          localStorage.removeItem('token');
          localStorage.removeItem('currentPage');
          sessionStorage.removeItem('currentPage');
          // Sayfayı yenile veya login'e yönlendir - React Router kullan
          navigate('/login', { replace: true });
        }
      }
    };

    // Her 3 saniyede bir logout status kontrolü
    const interval = setInterval(checkLogoutStatus, 3000);

    return () => clearInterval(interval);
  }, []);

  // Sadece gerçek sayfa değişikliklerinde localStorage'a kaydet (refresh'te değil)
  useEffect(() => {
    // Eğer path değiştiyse (manuel navigation)
    if (previousPath !== location.pathname) {
      console.log('=== MainLayout Debug ===');
      console.log('Manual navigation detected');
      console.log('From:', previousPath, 'To:', location.pathname);
      console.log('Saving to localStorage and sessionStorage');
      
      localStorage.setItem('currentPage', location.pathname);
      sessionStorage.setItem('currentPage', location.pathname);
      setPreviousPath(location.pathname);
    } else {
      // Sayfa yenilendiğinde mevcut path'i koru
      console.log('=== MainLayout Page Refresh ===');
      console.log('Page refreshed, preserving current path:', location.pathname);
      
      if (location.pathname && location.pathname !== '/login' && location.pathname !== '/') {
        localStorage.setItem('currentPage', location.pathname);
        sessionStorage.setItem('currentPage', location.pathname);
      }
    }
    
    setSelectedMenu(getSelectedMenu(location.pathname));
  }, [location.pathname, previousPath]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      {/* Navigation Drawer */}
      <NavigationDrawer 
        open={drawerOpen} 
        onClose={closeDrawer} 
      />
      
      {/* Main Content Area */}
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column',
        width: '100%',
        // Desktop'ta drawer açıksa margin ekle
        ml: !isMobile && drawerOpen ? '280px' : 0,
        transition: 'margin-left 0.3s ease'
      }}>
        {/* Header */}
        <Header title="ReportDesk" onMenuClick={toggleDrawer} />
        
        {/* Page Content */}
        <Box sx={{ 
          flex: 1, 
          p: isMobile ? 2 : 3,
          backgroundColor: '#f5f5f5',
          minHeight: 'calc(100vh - 64px)' // Header yüksekliğini çıkar
        }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
} 