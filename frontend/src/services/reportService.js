// Backend API kullanarak rapor servisleri
import api from './api';

export async function getAllReports(params = {}) {
  try {
    const { data } = await api.get('/reports', { params });
    return data;
  } catch (error) {
    console.error('Error fetching reports:', error.response?.data?.message || error.message);
    throw error;
  }
}

export async function uploadReport(file, notes, userId) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('notes', notes || '');
    formData.append('userId', userId);

    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/reports`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Dosya yükleme hatası');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error in uploadReport:', error);
    throw error;
  }
}

export async function updateReportStatus(reportId, status) {
  try {
    const { data } = await api.put(`/reports/${reportId}/status`, { status });
    return data;
  } catch (error) {
    console.error('Error in updateReportStatus:', error.response?.data?.message || error.message);
    throw error;
  }
}

export async function deleteReport(reportId) {
  try {
    await api.delete(`/reports/${reportId}`);
    return true;
  } catch (error) {
    console.error('Error in deleteReport:', error.response?.data?.message || error.message);
    throw error;
  }
}

export async function updateBulkReportStatus(reportIds, status) {
  try {
    const { data } = await api.put('/reports/bulk/status', { reportIds, status });
    return data;
  } catch (error) {
    console.error('Error in updateBulkReportStatus:', error.response?.data?.message || error.message);
    throw error;
  }
}

export async function deleteBulkReports(reportIds) {
  try {
    const { data } = await api.delete('/reports/bulk', { data: { reportIds } });
    return data;
  } catch (error) {
    console.error('Error in deleteBulkReports:', error.response?.data?.message || error.message);
    throw error;
  }
}

export async function getMyReports(params = {}) {
  try {
    const { data } = await api.get('/reports/my', { params });
    return data;
  } catch (error) {
    console.error('Error fetching my reports:', error.response?.data?.message || error.message);
    throw error;
  }
}

export async function getReporters() {
  try {
    const { data } = await api.get('/users/reporters');
    return data;
  } catch (error) {
    console.error('Error fetching reporters:', error.response?.data?.message || error.message);
    throw error;
  }
} 

export const semanticSearchReports = async (query) => {
  const response = await api.get('/reports/semantic-search', {
    params: { query }
  });
  return response.data;
};