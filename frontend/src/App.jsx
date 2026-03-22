import React, { useState, useEffect } from 'react';
import { metadataAPI, getStorageUrl } from './api';
import { Upload, ExternalLink, Trash2, HardDrive, FileText } from 'lucide-react';

function App() {
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '', file: null });
  const [loading, setLoading] = useState(false);

  const fetchFiles = async () => {
    try {
      const res = await metadataAPI.getAll();
      setFiles(res.data);
    } catch (err) { console.error("Fetch failed", err); }
  };

  useEffect(() => { fetchFiles(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      await metadataAPI.deleteById(id);
      fetchFiles();
    } catch (err) { alert('Delete failed.'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const uploadRes = await metadataAPI.uploadFile(formData.file);
      await metadataAPI.saveMetadata({
        title: formData.title,
        description: formData.description,
        filePath: uploadRes.data.filePath
      });
      setFormData({ title: '', description: '', file: null });
      fetchFiles();
    } catch (err) { alert("Upload failed."); }
    setLoading(false);
  };

  return (
    <div className="container">
      <header className="header">
        <h1> <span className="highlight">Storage Portal</span></h1>
        <p><HardDrive size={16} /> Distributed S3 + Reverseproxy Infrastructure</p>
      </header>
      
      <div className="main-grid">
       
        <div className="card shadow">
          <h3>Upload New Record</h3>
          <form onSubmit={handleSubmit} className="upload-form">
            <input 
              className="input-field"
              type="text" 
              placeholder="Title" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})} 
              required 
            />
            <textarea 
              className="input-field"
              placeholder="Description" 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})} 
            />
            <div className="file-input-wrapper">
               <input 
                  type="file" 
                  onChange={e => setFormData({...formData, file: e.target.files[0]})} 
                  required 
               />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Upload size={18} /> {loading ? "Processing..." : "Submit to Infrastructure"}
            </button>
          </form>
        </div>

        {/* List Section */}
        <div className="list-section">
          <h3>Stored Metadata (Live Log)</h3>
          <div className="records-grid">
            {files.map(f => (
              <div key={f._id} className="record-card shadow">
                <div className="record-header">
                   <FileText size={20} className="icon-purple" />
                   <strong>{f.title}</strong>
                </div>
                <p className="description">{f.description}</p>
                <div className="card-actions">
                  <a href={getStorageUrl(f.filePath)} className="link-view" target="_blank" rel="noreferrer">
                    View <ExternalLink size={14} />
                  </a>
                  <button onClick={() => handleDelete(f._id)} className="btn-delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;