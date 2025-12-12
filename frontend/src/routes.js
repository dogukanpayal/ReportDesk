import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ReportPage from './pages/ReportPage';
import SettingsPage from './pages/SettingsPage';
import UsersPage from './pages/UsersPage';
import MainLayout from './components/MainLayout';
import { useAuth } from './contexts/AuthContext';

function ProtectedRoutes() {
  const { user, getRedirectPage, loading, isInitialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Her route değişikliğinde token kontrolü yap
  useEffect(() => {
    const validateToken = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('=== Token Validation Failed ===');
        console.log('No token found, redirecting to login');
        navigate('/login', { replace: true });
        return false;
      }

      // Token'ın geçerliliğini kontrol et (JWT expiration)
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp && payload.exp < currentTime) {
          console.log('=== Token Expired ===');
          console.log('Token has expired, redirecting to login');
          localStorage.removeItem('token');
          localStorage.removeItem('currentPage');
          sessionStorage.removeItem('currentPage');
          navigate('/login', { replace: true });
          return false;
        }
        
        console.log('=== Token Validation Success ===');
        return true;
      } catch (error) {
        console.error('Token validation error:', error);
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
        return false;
      }
    };

    // Component mount'ta ve location değişikliklerinde token kontrolü
    if (user) {
      const isValid = validateToken();
      if (!isValid) return;
    }
  }, [user, navigate, location.pathname]);

  // Sayfa yenilendiğinde mevcut route'u koru
  useEffect(() => {
    if (user) {
      const currentPath = location.pathname;
      console.log('=== Route Change Detection ===');
      console.log('Current path:', currentPath);
      console.log('User authenticated, preserving current route');
      
      // Sayfa yenilendiğinde mevcut path'i koru
      if (currentPath && currentPath !== '/login' && currentPath !== '/') {
        localStorage.setItem('currentPage', currentPath);
        sessionStorage.setItem('currentPage', currentPath);
      }
    }
  }, [user, location.pathname]);

  // Component mount olduğunda hemen localStorage'dan sayfa bilgisini kontrol et
  useEffect(() => {
    if (user) {
      console.log('=== ProtectedRoutes Debug ===');
      console.log('User logged in, checking redirect...');
      console.log('Current location:', location.pathname);
      
      try {
        // Sayfa yenilendiğinde mevcut path'i koru
        const currentPath = location.pathname;
        const savedPage = localStorage.getItem('currentPage');
        const sessionPage = sessionStorage.getItem('currentPage');
        
        console.log('Current path:', currentPath);
        console.log('Saved page:', savedPage);
        console.log('Session page:', sessionPage);
        
        // Eğer sayfa yenilendiyse ve mevcut path geçerliyse, onu koru
        if (currentPath && currentPath !== '/login' && currentPath !== '/') {
          localStorage.setItem('currentPage', currentPath);
          sessionStorage.setItem('currentPage', currentPath);
          console.log('Page refreshed, preserving current path:', currentPath);
          return; // Yönlendirme yapma, mevcut sayfada kal
        }
        
        // Sadece yeni login durumunda yönlendirme yap (sayfa yenilemede değil)
        if (!sessionStorage.getItem('pageRefreshed')) {
          // sessionStorage'dan sayfa bilgisini kontrol et
          if (sessionPage && sessionPage !== '/dashboard' && sessionPage !== currentPath) {
            console.log('Using sessionStorage page:', sessionPage);
            navigate(sessionPage);
            return;
          }
          
          // localStorage'dan sayfa bilgisini kontrol et
          if (savedPage && savedPage !== '/dashboard' && savedPage !== currentPath) {
            console.log('Navigating to saved page:', savedPage);
            navigate(savedPage);
          } else {
            console.log('No redirect needed, staying on current page');
          }
        } else {
          console.log('Page was refreshed, no redirect needed');
        }
      } catch (error) {
        console.error('Error in page redirect logic:', error);
        // Hata durumunda mevcut sayfada kal
        console.log('Fallback: staying on current page due to error');
      }
    }
  }, [user, navigate, location.pathname]);

  // Loading durumunda hiçbir şey yapma
  if (loading || !isInitialized) {
    return null; // veya loading spinner
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Çalışan rolündeki kullanıcıları dashboard'dan yönlendir
  if (user && user.role === 'Calisan' && location.pathname === '/dashboard') {
    return <Navigate to="/reports" replace />;
  }
  
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}

// Dashboard için rol kontrolü komponenti
function DashboardRoute() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Çalışan rolündeki kullanıcıları dashboard'dan yönlendir
  if (user && user.role === 'Calisan') {
    navigate('/reports');
    return null;
  }

  return <DashboardPage />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoutes />}>
        <Route path="/dashboard" element={<DashboardRoute />} />
        <Route path="/reports" element={<ReportPage />} /> {/* Raporlar sayfası */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/users" element={<UsersPage />} /> {/* Kullanıcı yönetimi sayfası */}
        <Route path="/" element={<Navigate to="/reports" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/reports" replace />} />
    </Routes>
  );
} 