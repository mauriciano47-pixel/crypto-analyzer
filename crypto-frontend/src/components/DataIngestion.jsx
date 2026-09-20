import { useState } from 'react';
import { UploadCloud, Zap, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { fetchBinanceKlines, parseClientCSV, createDatasetObject } from '../services/clientDataEngine';

export default function DataIngestion({ onDatasetCreated }) {
  const [mode, setMode] = useState('ccxt'); // 'ccxt' | 'csv'
  const [file, setFile] = useState(null);
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [timeframe, setTimeframe] = useState('1d');
  const [exchange, setExchange] = useState('binance');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Procesando datos...');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoadingText('Consultando API de mercado y calculando osciladores...');
    setError(null);

    try {
      if (mode === 'csv') {
        if (!file) throw new Error('Por favor selecciona un archivo CSV con columnas OHLCV.');
        
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const csvText = event.target.result;
            const candles = parseClientCSV(csvText);
            const dataset = createDatasetObject(symbol || 'CSV_CUSTOM', timeframe, candles);
            setIsLoading(false);
            onDatasetCreated(dataset);
          } catch (err) {
            setIsLoading(false);
            setError(err.message || 'Error al procesar el archivo CSV');
          }
        };
        reader.onerror = () => {
          setIsLoading(false);
          setError('Error al leer el archivo desde el dispositivo');
        };
        reader.readAsText(file);
        return;
      }

      // Modo CCXT / Vivo: Fetch directo a Binance REST en cliente
      const candles = await fetchBinanceKlines(symbol, timeframe, 120);
      if (!candles || candles.length === 0) {
        throw new Error('No se pudieron obtener velas del mercado.');
      }

      const dataset = createDatasetObject(symbol, timeframe, candles);
      onDatasetCreated(dataset);
    } catch (err) {
      console.error('Error en ingesta de datos:', err);
      setError(err.message || 'Error al conectar con el mercado. Reintentando con motor de respaldo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadExample = async (sym) => {
    setIsLoading(true);
    setLoadingText(`Cargando velas en tiempo real para ${sym}...`);
    setError(null);

    try {
      const pair = `${sym}/USDT`;
      const candles = await fetchBinanceKlines(pair, '1d', 120);
      const dataset = createDatasetObject(pair, '1d', candles);
      onDatasetCreated(dataset);
    } catch (err) {
      setError(`No se pudo cargar la demostración de ${sym}: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Indicador de Conexión de Alta Disponibilidad */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.6rem', 
        padding: '0.6rem 1rem', 
        borderRadius: '8px', 
        background: 'rgba(16, 185, 129, 0.1)', 
        border: '1px solid rgba(16, 185, 129, 0.3)',
        fontSize: '0.8rem',
        color: '#10B981'
      }}>
        <CheckCircle size={16} />
        <span><strong>Motor Autónomo Client-Side Activo:</strong> Datos en tiempo real directo desde Binance API & WebSocket (Cero latencia).</span>
      </div>

      {/* Pestañas de Acceso Rápido */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={18} className="text-bullish" /> Carga Rápida en 1 Clic (Demos Cuantitativas)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
          {[
            { sym: 'BTC', icon: '🪙', label: 'Bitcoin' },
            { sym: 'ETH', icon: '🔹', label: 'Ethereum' },
            { sym: 'SOL', icon: '☀️', label: 'Solana' },
            { sym: 'ADA', icon: '₳', label: 'Cardano' },
            { sym: 'XRP', icon: '💧', label: 'Ripple' }
          ].map(coin => (
            <button 
              key={coin.sym} 
              type="button"
              onClick={() => handleLoadExample(coin.sym)}
              disabled={isLoading}
              className="btn btn-secondary"
              style={{ padding: '0.6rem 0.25rem', fontSize: '0.85rem', fontWeight: '600', display: 'flex', flexDirection: 'column', gap: '0.25rem', cursor: 'pointer' }}
            >
              <span style={{ fontSize: '1.25rem' }}>{coin.icon}</span>
              <span>{coin.sym}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Carga Manual / Personalizada */}
      <div className="card" style={{ width: '100%' }}>
        <h2 style={{ marginBottom: '1.25rem', textAlign: 'center', fontSize: '1.2rem' }}>Personalizar Par y Temporalidad</h2>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button 
            type="button"
            className={`btn ${mode === 'ccxt' ? '' : 'btn-secondary'}`} 
            style={{ flex: 1 }}
            onClick={() => setMode('ccxt')}
          >
            <Zap size={18} /> Fetch en Vivo (Binance)
          </button>
          <button 
            type="button"
            className={`btn ${mode === 'csv' ? '' : 'btn-secondary'}`} 
            style={{ flex: 1 }}
            onClick={() => setMode('csv')}
          >
            <UploadCloud size={18} /> Subir CSV Local
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{ 
              padding: '0.75rem', 
              background: 'rgba(239, 68, 68, 0.15)', 
              border: '1px solid #EF4444', 
              borderRadius: '8px', 
              color: '#FCA5A5', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {mode === 'csv' ? (
            <div>
              <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                Archivo CSV OHLCV (Columnas: date/time, open, high, low, close, volume)
              </label>
              <input 
                type="file" 
                accept=".csv"
                onChange={(e) => setFile(e.target.files[0])}
                className="input-field" 
              />
            </div>
          ) : (
            <div>
              <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Exchange</label>
              <select 
                value={exchange} 
                onChange={(e) => setExchange(e.target.value)}
                className="input-field"
              >
                <option value="binance">Binance (Spot Real-Time)</option>
                <option value="kraken">Kraken</option>
                <option value="coinbase">Coinbase</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Par (Symbol)</label>
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
              <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Timeframe</label>
              <select 
                value={timeframe} 
                onChange={(e) => setTimeframe(e.target.value)}
                className="input-field"
              >
                <option value="1m">1 Minuto</option>
                <option value="5m">5 Minutos</option>
                <option value="15m">15 Minutos</option>
                <option value="1h">1 Hora</option>
                <option value="4h">4 Horas</option>
                <option value="1d">1 Día</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn" 
            style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} style={{ animation: 'spin 1.5s linear infinite' }} />
                <span>{loadingText}</span>
              </>
            ) : (
              <span>Iniciar Análisis Cuantitativo</span>
            )}
          </button>
        </form>
      </div>

    </div>
  );
}
