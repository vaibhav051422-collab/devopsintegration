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

// Helper to get the fast-access URL via Nginx /storage
export const getStorageUrl = (filePath) => {
  // filePath comes back as '/uploads/filename.jpg'
  // We prepend '/storage' so Nginx routes it to MinIO
  return `/storage${filePath}`;
};