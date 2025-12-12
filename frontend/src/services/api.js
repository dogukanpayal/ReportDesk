import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// These will be set by AuthContext
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

export async function login({ email, password }) {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
}

export async function uploadReport({ file, notes }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('notes', notes);
  const res = await api.post('/reports', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

export const getAllReports = async (params) => {
  try {
    const { data } = await api.get('/reports', { params });
    return data;
  } catch (error) {
    console.error('Error fetching all reports:', error.response?.data?.message || error.message);
    throw error;
  }
};

export const getMyReports = async (params) => {
  try {
    const { data } = await api.get('/reports/my', { params });
    return data;
  } catch (error) {
    console.error('Error fetching my reports:', error.response?.data?.message || error.message);
    throw error;
  }
};

export async function updateReport(id, notes) {
  const res = await api.put(`/reports/${id}`, { notes });
  return res.data;
}

export async function deleteReport(id) {
  await api.delete(`/reports/${id}`);
}

export const getReporters = async () => {
  try {
    const { data } = await api.get('/users/reporters');
    return data;
  } catch (error) {
    console.error('Error fetching reporters:', error);
    throw error;
  }
};

export const updateReportStatus = async (id, status) => {
  try {
    const { data } = await api.put(`/reports/${id}/status`, { status });
    return data;
  } catch (error) {
    console.error('Error updating report status:', error.response?.data?.message || error.message);
    throw error;
  }
};

export async function getMe() {
  const res = await api.get('/users/me');
  return res.data;
}

export async function updateMe(userData) {
  const res = await api.put('/users/me', userData);
  return res.data;
}

export async function deleteMe() {
  await api.delete('/users/me');
}

export default api; 