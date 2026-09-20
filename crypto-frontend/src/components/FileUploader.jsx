import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, AlertCircle } from 'lucide-react';
import { parseClientCSV, createDatasetObject } from '../services/clientDataEngine';

export default function FileUploader({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    
    setUploading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const candles = parseClientCSV(text);
        const dataset = createDatasetObject('CSV_UPLOAD', '1d', candles);
        setUploading(false);
        if (onUploadSuccess) {
          onUploadSuccess(dataset);
        }
      } catch (err) {
        setUploading(false);
        setError(err.message || 'Error al procesar el archivo CSV.');
      }
    };
    reader.onerror = () => {
      setUploading(false);
      setError('Error al leer el archivo en el dispositivo.');
    };
    reader.readAsText(file);
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false
  });

  return (
    <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem', margin: '2rem auto', maxWidth: '600px', cursor: 'pointer', border: isDragActive ? '2px dashed var(--accent-bullish)' : '2px dashed var(--border-color)', borderRadius: '12px' }} {...getRootProps()}>
      <input {...getInputProps()} />
      {uploading ? (
        <div style={{ animation: 'pulse 2s infinite' }}>
          <UploadCloud size={56} style={{ color: 'var(--neon-green)', margin: '0 auto 1rem' }} />
          <h3>Procesando y analizando datos en cliente...</h3>
          <p className="text-muted">Calculando RSI, Medias Móviles y patrones técnicos...</p>
        </div>
      ) : (
        <div>
          <UploadCloud size={56} style={{ color: isDragActive ? 'var(--neon-green)' : 'var(--text-muted)', margin: '0 auto 1rem' }} />
          {isDragActive ? (
            <h3>¡Suelta el archivo aquí!</h3>
          ) : (
            <>
              <h3 style={{ marginBottom: '0.5rem' }}>Arrastra tu archivo CSV del mercado</h3>
              <p className="text-muted">Columnas soportadas: date, open, high, low, close, volume</p>
            </>
          )}
        </div>
      )}
      {error && (
        <div style={{ color: 'var(--neon-red)', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
