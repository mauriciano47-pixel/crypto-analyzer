import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, AlertCircle } from 'lucide-react';

export default function FileUploader({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('asset_symbol', 'BTC'); 
    formData.append('timeframe', '1d');
    formData.append('archivo', file);

    fetch('http://127.0.0.1:8000/api/datasets/upload/', {
      method: 'POST',
      body: formData,
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al procesar el archivo en el servidor');
        return res.json();
      })
      .then(data => {
        setUploading(false);
        onUploadSuccess(data.id);
      })
      .catch(err => {
        setUploading(false);
        setError(err.message);
      });
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false
  });

  return (
    <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem', margin: '4rem auto', maxWidth: '600px', cursor: 'pointer', border: isDragActive ? '2px dashed var(--accent-bullish)' : '2px dashed var(--glass-border)' }} {...getRootProps()}>
      <input {...getInputProps()} />
      {uploading ? (
        <div style={{ animation: 'pulse 2s infinite' }}>
          <UploadCloud size={64} style={{ color: 'var(--accent-bullish)', margin: '0 auto 1rem' }} />
          <h3>Subiendo y analizando datos...</h3>
          <p style={{ color: 'var(--text-muted)' }}>El motor cuántico está trabajando...</p>
        </div>
      ) : (
        <div>
          <UploadCloud size={64} style={{ color: isDragActive ? 'var(--accent-bullish)' : 'var(--text-muted)', margin: '0 auto 1rem' }} />
          {isDragActive ? (
            <h3>¡Suelta el archivo aquí!</h3>
          ) : (
            <>
              <h3>Arrastra tu archivo CSV del mercado</h3>
              <p style={{ color: 'var(--text-muted)' }}>O haz clic para seleccionar el archivo de tu PC</p>
            </>
          )}
        </div>
      )}
      {error && (
        <div style={{ color: 'var(--accent-bearish)', marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
