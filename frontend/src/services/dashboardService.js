// dashboardService.js - Dashboard verileri için API çağrıları

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// API çağrıları için yardımcı fonksiyon
const fetchWithAuth = async (url, options = {}) => {
  // Token'ı localStorage'dan al
  const token = localStorage.getItem('token');
  
  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Token varsa ekle
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Fetch isteği gönder
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  // 401 (Unauthorized) hatası varsa kullanıcıyı logout yap
  if (response.status === 401) {
    localStorage.removeItem('token');
    // window.location.href = '/login'; // Bu satırı kaldırıyoruz
    throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
  }

  // 403 (Forbidden) hatası varsa yetki hatası fırlat
  if (response.status === 403) {
    throw new Error('Bu işlem için yetkiniz bulunmamaktadır.');
  }

  // 404 (Not Found) hatası varsa kaynak bulunamadı hatası fırlat
  if (response.status === 404) {
    throw new Error('İstenen kaynak bulunamadı.');
  }

  // 400 ve 500 arası hata kodları için hata fırlat
  if (response.status >= 400) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Bir hata oluştu');
  }

  // Başarılı yanıtları JSON olarak dön
  if (response.status !== 204) { // 204 No Content
    return response.json();
  }

  // 204 No Content için boş obje dön
  return {};
};

// Dashboard istatistiklerini getir
export const getDashboardStats = async () => {
  try {
    return await fetchWithAuth('/users/dashboard/stats');
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

// Son aktiviteleri getir
export const getRecentActivities = async () => {
  try {
    return await fetchWithAuth('/users/dashboard/recent');
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    throw error;
  }
};

// Günlük durumu getir
export const getDailyStatus = async () => {
  try {
    return await fetchWithAuth('/users/dashboard/daily-status');
  } catch (error) {
    console.error('Error fetching daily status:', error);
    throw error;
  }
};

// ===== YENİ BİLDİRİM SİSTEMİ =====

// Günlük uyarıları oluştur
export const generateDailyWarnings = async () => {
  try {
    const response = await fetchWithAuth('/users/dashboard/generate-warnings', {
      method: 'POST'
    });
    return response;
  } catch (error) {
    console.error('Error generating daily warnings:', error);
    throw error;
  }
};

// Günlük uyarıları getir
export const getDailyWarnings = async (page = 1, pageSize = 10) => {
  try {
    const response = await fetchWithAuth(`/users/dashboard/daily-warnings?page=${page}&pageSize=${pageSize}`);
    return response;
  } catch (error) {
    console.error('Error fetching daily warnings:', error);
    throw error;
  }
};

// Uyarıyı okundu olarak işaretle
export const markDailyWarningAsRead = async (warningId) => {
  try {
    const response = await fetchWithAuth(`/users/dashboard/warnings/${warningId}/read`, {
      method: 'PUT'
    });
    return response;
  } catch (error) {
    console.error('Error marking warning as read:', error);
    throw error;
  }
};

// Uyarıyı kaydet
export const saveDailyWarning = async (warningId, notes = null) => {
  try {
    const response = await fetchWithAuth(`/users/dashboard/warnings/${warningId}/save`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    });
    return response;
  } catch (error) {
    console.error('Error saving warning:', error);
    throw error;
  }
};

// Uyarıyı kayıttan çıkar
export const unsaveDailyWarning = async (warningId) => {
  try {
    const response = await fetchWithAuth(`/users/dashboard/warnings/${warningId}/unsave`, {
      method: 'POST'
    });
    return response;
  } catch (error) {
    console.error('Error unsaving warning:', error);
    throw error;
  }
};

// Kaydedilmiş uyarıları getir
export const getSavedWarnings = async (page = 1, pageSize = 10) => {
  try {
    const response = await fetchWithAuth(`/users/dashboard/warnings/saved?page=${page}&pageSize=${pageSize}`);
    return response;
  } catch (error) {
    console.error('Error fetching saved warnings:', error);
    throw error;
  }
};

// Uyarıyı sil
export const deleteDailyWarning = async (warningId) => {
  try {
    const response = await fetchWithAuth(`/users/dashboard/warnings/${warningId}`, {
      method: 'DELETE'
    });
    return response;
  } catch (error) {
    console.error('Error deleting warning:', error);
    throw error;
  }
};


