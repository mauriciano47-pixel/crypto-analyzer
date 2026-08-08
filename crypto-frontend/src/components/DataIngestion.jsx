import { useState } from 'react';
import { api } from '../services/api';
import { UploadCloud, Zap, AlertTriangle } from 'lucide-react';

export default function DataIngestion({ onDatasetCreated }) {
  const [mode, setMode] = useState('csv'); // 'csv' | 'ccxt'
  
  const [file, setFile] = useState(null);
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [timeframe, setTimeframe] = useState('1d');
  const [exchange, setExchange] = useState('binance');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let dataset;
      if (mode === 'csv') {
        if (!file) throw new Error('Debes seleccionar un archivo CSV');
        dataset = await api.uploadCSV(file, symbol, timeframe);
      } else {
        dataset = await api.fetchCCXT(exchange, symbol, timeframe, 100);
      }
      onDatasetCreated(dataset);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadExample = async (sym) => {
    setIsLoading(true);
    setError(null);
    try {
      const dataset = await api.loadExample(sym);
      onDatasetCreated(dataset);
    } catch (err) {
      setError(err.message || `Error al cargar ejemplo de ${sym}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Pestañas de Acceso Rápido */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>⚡</span> Carga Rápida (Pestaña de Demos)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
          {['BTC', 'ETH', 'SOL', 'ADA', 'XRP'].map(sym => (
            <button 
              key={sym} 
              onClick={() => handleLoadExample(sym)}
              disabled={isLoading}
              className="btn btn-secondary"
              style={{ padding: '0.6rem 0.25rem', fontSize: '0.85rem', fontWeight: '600', display: 'flex', flexDirection: 'column', gap: '0.25rem', cursor: 'pointer' }}
            >
              <span style={{ fontSize: '1.2rem' }}>{sym === 'BTC' ? '🪙' : sym === 'ETH' ? '🔹' : sym === 'SOL' ? '☀️' : sym === 'ADA' ? '₳' : '💧'}</span>
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* Carga Manual */}
      <div className="card" style={{ width: '100%' }}>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Ingresar Datos Manual</h2>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button 
            type="button"
            className={`btn ${mode === 'csv' ? '' : 'btn-secondary'}`} 
            style={{ flex: 1 }}
            onClick={() => setMode('csv')}
          >
            <UploadCloud size={18} /> Subir CSV local
          </button>
          <button 
            type="button"
            className={`btn ${mode === 'ccxt' ? '' : 'btn-secondary'}`} 
            style={{ flex: 1 }}
            onClick={() => setMode('ccxt')}
          >
            <Zap size={18} /> Fetch CCXT (Vivo)
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{ padding: '0.75rem', background: 'var(--neon-red-glow)', border: '1px solid var(--neon-red)', borderRadius: '8px', color: '#ffcdcd', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {mode === 'csv' ? (
            <div>
              <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Archivo CSV (OHLCV)</label>
              <input 
                type="file" 
                accept=".csv"
                onChange={(e) => setFile(e.target.files[0])}
                className="input-field" 
              />
            </div>
          ) : (
            <div>
              <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Exchange</label>
              <select 
                value={exchange} 
                onChange={(e) => setExchange(e.target.value)}
                className="input-field"
              >
                <option value="binance">Binance</option>
                <option value="kraken">Kraken</option>
                <option value="coinbase">Coinbase</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Par (Symbol)</label>
              <input 
                type="text" 
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="BTC/USDT"
                className="input-field" 
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Timeframe</label>
              <select 
                value={timeframe} 
                onChange={(e) => setTimeframe(e.target.value)}
                className="input-field"
              >
                <option value="1m">1 Minuto</option>
                <option value="5m">5 Minutos</option>
                <option value="1h">1 Hora</option>
                <option value="4h">4 Horas</option>
                <option value="1d">1 Día</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn" style={{ marginTop: '1rem' }} disabled={isLoading}>
            {isLoading ? 'Procesando...' : 'Iniciar Análisis'}
          </button>
        </form>
      </div>
    </div>
  );
}
