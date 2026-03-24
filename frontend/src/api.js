import axios from 'axios';

const api = axios.create({
  baseURL: '/api', 
});

export const metadataAPI = {
 
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Save the details (Title, Desc, Path) to MongoDB
  saveMetadata: (data) => api.post('/metadata', data),

  getAll: () => api.get('/metadata'),

  deleteById: (id) => api.delete(`/metadata/${id}`),
};

// Helper to build a secure file-view URL via backend proxy endpoint
export const getStorageUrl = (filePath) => {
  // filePath comes back as '/uploads/<filename>'
  // Use backend streaming endpoint so MinIO credentials stay server-side.
  const normalizedPath = String(filePath || '').trim();
  const objectName = normalizedPath.replace(/^\/?uploads\//, '');
  return `/api/get-file?name=${encodeURIComponent(objectName)}`;
};