import React, { useState, useEffect } from 'react';
import { metadataAPI, getStorageUrl } from './api';
import { Upload, ExternalLink, Trash2 } from 'lucide-react';

function App() {
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '', file: null });

  const fetchFiles = async () => {
    const res = await metadataAPI.getAll();
    setFiles(res.data);
  };

  useEffect(() => { fetchFiles(); }, []);

  const handleDelete = async (id) => {
    try {
      await metadataAPI.deleteById(id);
      fetchFiles();
    } catch (err) {
      console.error(err);
      alert('Delete failed.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      //Upload File to MinIO
      const uploadRes = await metadataAPI.uploadFile(formData.file);
      const filePath = uploadRes.data.filePath;

      // Save Metadata to MongoDB
      await metadataAPI.saveMetadata({
        title: formData.title,
        description: formData.description,
        filePath: filePath
      });

      alert("Success!");
      fetchFiles(); 
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>IIT Patna Hackathon: Storage Portal</h1>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '40px', border: '1px solid #ccc', padding: '20px' }}>
        <h3>Upload New Record</h3>
        <input type="text" placeholder="Title" onChange={e => setFormData({...formData, title: e.target.value})} required /><br/><br/>
        <textarea placeholder="Description" onChange={e => setFormData({...formData, description: e.target.value})} /><br/><br/>
        <input type="file" onChange={e => setFormData({...formData, file: e.target.files[0]})} required /><br/><br/>
        <button type="submit"><Upload size={16} /> Submit to Infrastructure</button>
      </form>

      <h3>Stored Metadata (from MongoDB)</h3>
      <div style={{ display: 'grid', gap: '10px' }}>
        {files.map(f => (
          <div key={f._id} style={{ border: '1px solid #ddd', padding: '10px' }}>
            <strong>{f.title}</strong>
            <p>{f.description}</p>
            
            <a href={getStorageUrl(f.filePath)} target="_blank" rel="noreferrer">
               View File via Nginx <ExternalLink size={14} />
            </a>
            <br /><br />
            <button
              type="button"
              onClick={() => handleDelete(f._id)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;