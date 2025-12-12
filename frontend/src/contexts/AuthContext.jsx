import React, { createContext, useContext, useEffect, useState } from "react";
import { setAuthToken } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Broadcast Channel API için (modern tarayıcılar)
  useEffect(() => {
    let broadcastChannel = null;
    
    try {
      // Broadcast Channel API desteği varsa kullan
      if ('BroadcastChannel' in window) {
        broadcastChannel = new BroadcastChannel('auth-channel');
        
        broadcastChannel.onmessage = (event) => {
          if (event.data.type === 'LOGOUT') {
            console.log('=== Broadcast Channel Logout ===');
            console.log('Logout message received from another tab');
            setUser(null);
            setLoading(false);
            localStorage.removeItem('token');
            localStorage.removeItem('currentPage');
            sessionStorage.removeItem('currentPage');
            // Token'ı API service'den temizle
            setAuthToken(null);
            // Login sayfasına yönlendir - React Router kullan
            // window.location.href = '/login'; // Bu satırı kaldırıyoruz
          }
        };
        
        console.log('Broadcast Channel API initialized');
      }
    } catch (error) {
      console.log('Broadcast Channel API not supported, using fallback methods');
    }

    return () => {
      if (broadcastChannel) {
        broadcastChannel.close();
      }
    };
  }, []);

  // Periyodik token validasyonu
  useEffect(() => {
    const validateTokenPeriodically = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp && payload.exp < currentTime) {
          console.log('=== Periodic Token Validation Failed ===');
          console.log('Token expired during periodic check, logging out');
          logout();
        } else {
          console.log('=== Periodic Token Validation Success ===');
          console.log('Token is still valid');
        }
      } catch (error) {
        console.error('Periodic token validation error:', error);
        logout();
      }
    };

    // Her 5 dakikada bir token validasyonu yap
    const interval = setInterval(validateTokenPeriodically, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // JWT token'dan user bilgilerini çıkar
  const parseJWTToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('JWT parse error:', error);
      return null;
    }
  };

  // LocalStorage değişikliklerini dinle (diğer sekmelerde logout yapıldığında)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token' && e.newValue === null) {
        console.log('=== Multi-Tab Logout Detection ===');
        console.log('Token removed in another tab, logging out current tab');
        
          // User'a bilgi ver
          if (window.confirm('Oturumunuz başka bir sekmede sonlandırıldı. Giriş sayfasına yönlendirileceksiniz.')) {
            setUser(null);
            setLoading(false);
            // Diğer sekmelerde de logout timestamp'i güncelle
            sessionStorage.setItem('logoutTimestamp', Date.now().toString());
            // window.location.href = '/login'; // Bu satırı kaldırıyoruz
          }
      }
    };

    // Logout timestamp kontrolü - daha güvenli hale getirildi
    const checkLogoutTimestamp = () => {
      const logoutTimestamp = sessionStorage.getItem('logoutTimestamp');
      if (logoutTimestamp) {
        const currentTime = Date.now();
        const logoutTime = parseInt(logoutTimestamp);
        
        // Debug: Logout timestamp kontrolü
        console.log('=== Logout Timestamp Check Debug ===');
        console.log('Current time:', currentTime);
        console.log('Logout time:', logoutTime);
        console.log('Time difference (ms):', currentTime - logoutTime);
        console.log('Time difference (seconds):', (currentTime - logoutTime) / 1000);
        console.log('=== End Logout Timestamp Check Debug ===');
        
        // 5 saniye içinde logout yapıldıysa current tab'ı da logout yap
        if (currentTime - logoutTime < 5000) {
          console.log('=== Logout Timestamp Check ===');
          console.log('Recent logout detected, logging out current tab');
          
          // User'a bilgi ver
          alert('Oturumunuz başka bir sekmede sonlandırıldı. Giriş sayfasına yönlendirileceksiniz.');
          setUser(null);
          setLoading(false);
          localStorage.removeItem('token');
          localStorage.removeItem('currentPage');
          // window.location.href = '/login'; // Bu satırı kaldırıyoruz
        }
      }
    };

    // Event listener'ları ekle
    window.addEventListener('storage', handleStorageChange);
    
    // Her 2 saniyede bir logout timestamp kontrolü yap
    const interval = setInterval(checkLogoutTimestamp, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Local storage'dan token'ı kontrol et
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const userData = parseJWTToken(token);
      if (userData && userData.id) {
        console.log('=== AuthContext Debug ===');
        console.log('Token found in localStorage');
        console.log('Parsed user data:', userData);
        console.log('User role:', userData.role);
        
        // Sayfa yenilendiğinde mevcut sayfa bilgisini koru
        const currentPath = window.location.pathname;
        const savedPage = localStorage.getItem('currentPage');
        
        console.log('Current path:', currentPath);
        console.log('Saved page:', savedPage);
        
        // Eğer sayfa yenilendiyse ve mevcut path geçerliyse, onu koru
        if (currentPath && currentPath !== '/login' && currentPath !== '/') {
          localStorage.setItem('currentPage', currentPath);
          sessionStorage.setItem('currentPage', currentPath);
          sessionStorage.setItem('pageRefreshed', 'true');
          console.log('Page refreshed, preserving current path:', currentPath);
        } else if (savedPage && savedPage !== '/login' && savedPage !== '/') {
          // Kaydedilmiş sayfa varsa onu kullan
          console.log('Using saved page:', savedPage);
        }
        
        console.log('=== End AuthContext Debug ===');
        
        // User'ı hemen set et (gecikme olmadan)
        setUser(userData);
        // Token'ı API service'e aktar
        setAuthToken(token);
        setIsInitialized(true);
        setLoading(false);
      } else {
        console.log('Invalid token, removing from localStorage');
        localStorage.removeItem('token');
        sessionStorage.removeItem('currentPage');
        setIsInitialized(true);
        setLoading(false);
      }
    } else {
      // Token yoksa da loading'i false yap
      setIsInitialized(true);
      setLoading(false);
    }
  }, []);

  // Login fonksiyonu
  const login = async (email, password) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      console.log('=== Login Response Debug ===');
      console.log('Full response:', data);
      console.log('User data:', data.user);
      console.log('User firstName:', data.user?.firstName);
      console.log('User lastName:', data.user?.lastName);
      console.log('User role:', data.user?.role);
      console.log('=== End Login Debug ===');
      
      localStorage.setItem('token', data.token);
      sessionStorage.removeItem('pageRefreshed'); // Sayfa yenileme flag'ini temizle
      sessionStorage.removeItem('logoutTimestamp'); // Logout timestamp'i temizle
      // Token'ı API service'e aktar
      setAuthToken(data.token);
      setUser(data.user);
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Otomatik login sonrası sayfa yönlendirmesi için
  const getRedirectPage = () => {
    const savedPage = localStorage.getItem('currentPage');
    const sessionPage = sessionStorage.getItem('currentPage');
    const currentPath = window.location.pathname;
    
    console.log('=== getRedirectPage Debug ===');
    console.log('localStorage currentPage:', savedPage);
    console.log('sessionStorage currentPage:', sessionPage);
    console.log('Current path:', currentPath);
    
    // Eğer sayfa yenilendiyse ve mevcut path geçerliyse, onu kullan
    if (currentPath && currentPath !== '/login' && currentPath !== '/') {
      console.log('Page refreshed, using current path:', currentPath);
      // localStorage ve sessionStorage'ı senkronize et
      localStorage.setItem('currentPage', currentPath);
      sessionStorage.setItem('currentPage', currentPath);
      return currentPath;
    }
    
    // sessionStorage'dan sayfa bilgisini kontrol et
    if (sessionPage && sessionPage !== '/login' && sessionPage !== '/') {
      console.log('Using sessionStorage page:', sessionPage);
      localStorage.setItem('currentPage', sessionPage);
      return sessionPage;
    }
    
    // localStorage'dan sayfa bilgisini kontrol et
    if (savedPage && savedPage !== '/login' && savedPage !== '/') {
      console.log('Redirecting to saved page:', savedPage);
      return savedPage;
    }
    
    console.log('Redirecting to default dashboard');
    return '/dashboard'; // Default
  };

  // Logout fonksiyonu
  const logout = () => {
    console.log('=== Logout Function Called ===');
    console.log('Removing token from localStorage');
    console.log('Removing currentPage from localStorage');
    console.log('Removing currentPage from sessionStorage');
    console.log('Setting logout timestamp for other tabs');
    console.log('Broadcasting logout message to other tabs');
    console.log('Setting user to null');
    
    // Logout timestamp'i set et (diğer sekmeler için)
    sessionStorage.setItem('logoutTimestamp', Date.now().toString());
    
    // Broadcast Channel ile diğer sekmelere logout mesajı gönder
    try {
      if ('BroadcastChannel' in window) {
        const broadcastChannel = new BroadcastChannel('auth-channel');
        broadcastChannel.postMessage({ type: 'LOGOUT' });
        broadcastChannel.close();
      }
    } catch (error) {
      console.log('Broadcast Channel message failed:', error);
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('currentPage');
    sessionStorage.removeItem('currentPage');
    sessionStorage.removeItem('pageRefreshed');
    // Token'ı API service'den temizle
    setAuthToken(null);
    setUser(null);
    
    console.log('=== Logout Complete ===');
  };

  // Token'ı yenile
  const refreshToken = () => {
    const token = localStorage.getItem('token');
    if (token) {
      const userData = parseJWTToken(token);
      if (userData && userData.id) {
        setUser(userData);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser,
      login, 
      logout, 
      refreshToken,
      loading,
      isInitialized,
      getRedirectPage
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 