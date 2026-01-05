const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });
  if (response.status === 401) throw new Error('Oturum süresi doldu.');
  return response.status !== 204 ? response.json() : {};
};

export const getSentimentStats = () => fetchWithAuth('/reports/stats/summary');
export const getDashboardStats = () => fetchWithAuth('/users/dashboard/stats');
export const getRecentActivities = () => fetchWithAuth('/users/dashboard/recent');
export const getDailyStatus = () => fetchWithAuth('/users/dashboard/daily-status');
export const getDailyWarnings = (page = 1, pageSize = 10) => fetchWithAuth(`/users/dashboard/daily-warnings?page=${page}&pageSize=${pageSize}`);
export const markDailyWarningAsRead = (id) => fetchWithAuth(`/users/dashboard/warnings/${id}/read`, { method: 'PUT' });
export const saveDailyWarning = (id, notes = null) => fetchWithAuth(`/users/dashboard/warnings/${id}/save`, { method: 'POST', body: JSON.stringify({ notes }) });
export const unsaveDailyWarning = (id) => fetchWithAuth(`/users/dashboard/warnings/${id}/unsave`, { method: 'POST' });
export const getSavedWarnings = (page = 1, pageSize = 10) => fetchWithAuth(`/users/dashboard/warnings/saved?page=${page}&pageSize=${pageSize}`);
export const deleteDailyWarning = (id) => fetchWithAuth(`/users/dashboard/warnings/${id}`, { method: 'DELETE' });