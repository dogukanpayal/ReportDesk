// userService.js - Kullanıcı yönetimi için API çağrıları

// API temel URL'si
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

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
  const response = await fetch(url, {
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

// Tüm kullanıcıları getir (sayfalama ve filtreleme ile)
export const getUsers = async (page = 0, limit = 10, search = '', role = '') => {
  // Parametreleri doğrudan string olarak oluşturalım
  let queryString = `?page=${page}&limit=${limit}`;
  
  // Arama parametresi varsa ekle
  if (search) {
    queryString += `&search=${encodeURIComponent(search)}`;
  }
  
  // Rol filtresi varsa ekle
  if (role) {
    queryString += `&role=${encodeURIComponent(role)}`;
  }
  
  return fetchWithAuth(`${API_BASE_URL}/users${queryString}`);
};

// Kullanıcı detaylarını getir
export const getUserById = async (userId) => {
  return fetchWithAuth(`${API_BASE_URL}/users/${userId}`);
};

// Yeni kullanıcı oluştur
export const createUser = async (userData) => {
  return fetchWithAuth(`${API_BASE_URL}/users`, {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

// Kullanıcı bilgilerini güncelle
export const updateUser = async (userId, userData) => {
  return fetchWithAuth(`${API_BASE_URL}/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
};

// Kullanıcı sil
export const deleteUser = async (userId) => {
  return fetchWithAuth(`${API_BASE_URL}/users/${userId}`, {
    method: 'DELETE',
  });
};

// Mevcut kullanıcının bilgilerini getir
export const getCurrentUser = async () => {
  return fetchWithAuth(`${API_BASE_URL}/users/me`);
};

// Mevcut kullanıcının bilgilerini güncelle
export const updateCurrentUser = async (userData) => {
  return fetchWithAuth(`${API_BASE_URL}/users/me`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
};

// Mevcut kullanıcının şifresini değiştir
export const changePassword = async (passwordData) => {
  return fetchWithAuth(`${API_BASE_URL}/users/password`, {
    method: 'PUT',
    body: JSON.stringify(passwordData),
  });
};

// Rapor yükleyen kullanıcıları getir (filtre için)
export const getReporters = async () => {
  return fetchWithAuth(`${API_BASE_URL}/users/reporters`);
};

export default {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getCurrentUser,
  updateCurrentUser,
  changePassword,
  getReporters
};
