import { fetchBinanceKlines, parseClientCSV, createDatasetObject } from './clientDataEngine';

const getBaseApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:8005/api';
  }
  return 'https://crypto-analyzer-backend.onrender.com/api';
};

const API_URL = getBaseApiUrl();

const BYPASS_HEADERS = {
  'serveo-skip-browser-warning': 'true',
  'ngrok-skip-browser-warning': 'true',
  'bypass-tunnel-reminder': 'true'
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = 3000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
};

// Almacén en memoria de datasets generados por el motor cliente
const clientMemoryDatasets = [];

export const api = {
  // Datasets
  getDatasets: async () => {
    try {
      const res = await fetchWithTimeout(`${API_URL}/datasets/`, {
        headers: BYPASS_HEADERS
      }, 2500);
      if (res.ok) {
        const backendData = await res.json();
        return [...clientMemoryDatasets, ...(Array.isArray(backendData) ? backendData : [])];
      }
    } catch (err) {
      console.warn('[API Engine] Backend no disponible, usando datasets locales:', err.message);
    }
    return [...clientMemoryDatasets];
  },
  
  uploadCSV: async (file, assetSymbol, timeframe = '1d') => {
    try {
      const text = await file.text();
      const candles = parseClientCSV(text);
      const dataset = createDatasetObject(assetSymbol || 'CSV_CUSTOM', timeframe, candles);
      clientMemoryDatasets.unshift(dataset);
      return dataset;
    } catch (clientErr) {
      console.warn('[API Engine] Procesamiento CSV client-side:', clientErr.message);
      throw clientErr;
    }
  },

  fetchCCXT: async (exchangeId, symbol, timeframe = '1d', limit = 100) => {
    try {
      // Intento primario con Binance API directa en cliente (alta velocidad, cero fallos)
      const candles = await fetchBinanceKlines(symbol, timeframe, limit);
      const dataset = createDatasetObject(symbol, timeframe, candles);
      clientMemoryDatasets.unshift(dataset);
      return dataset;
    } catch (err) {
      console.warn('[API Engine] Error en fetchCCXT client-side:', err);
      throw err;
    }
  },

  loadExample: async (symbol) => {
    try {
      const pair = `${symbol}/USDT`;
      const candles = await fetchBinanceKlines(pair, '1d', 120);
      const dataset = createDatasetObject(pair, '1d', candles);
      clientMemoryDatasets.unshift(dataset);
      return dataset;
    } catch (err) {
      console.warn('[API Engine] Error cargando ejemplo:', err);
      throw err;
    }
  },

  // Analysis
  getPatterns: async (datasetId) => {
    const memoryDs = clientMemoryDatasets.find(d => String(d.id) === String(datasetId));
    if (memoryDs && memoryDs.patterns) {
      return {
        patrones: memoryDs.patterns.map(p => ({
          tipo_patron: p.patron,
          tipo_patron_display: p.patron,
          timestamp: p.fecha,
          close: p.close
        }))
      };
    }

    try {
      const res = await fetchWithTimeout(`${API_URL}/datasets/${datasetId}/patterns/`, {
        headers: BYPASS_HEADERS
      }, 3000);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[API Engine] Error en getPatterns backend:', e.message);
    }
    return { patrones: [] };
  },

  getIndicators: async (datasetId) => {
    const memoryDs = clientMemoryDatasets.find(d => String(d.id) === String(datasetId));
    if (memoryDs && memoryDs.candles) {
      return { serie: memoryDs.candles };
    }

    try {
      const res = await fetchWithTimeout(`${API_URL}/datasets/${datasetId}/indicators/`, {
        headers: BYPASS_HEADERS
      }, 3000);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[API Engine] Error en getIndicators backend:', e.message);
    }
    return { serie: [] };
  },

  getNewsContext: async (datasetId) => {
    try {
      const res = await fetchWithTimeout(`${API_URL}/datasets/${datasetId}/news-context/`, {
        headers: BYPASS_HEADERS
      }, 2500);
      if (res.ok) return await res.json();
    } catch {
      // Fallback silencioso a feeds estructurados
    }
    return { coincidencias: [] };
  },

  updateCCXT: async (datasetId) => {
    const memoryDs = clientMemoryDatasets.find(d => String(d.id) === String(datasetId));
    if (memoryDs) {
      const candles = await fetchBinanceKlines(memoryDs.asset_symbol, memoryDs.timeframe, 120);
      const updated = createDatasetObject(memoryDs.asset_symbol, memoryDs.timeframe, candles);
      memoryDs.candles = updated.candles;
      memoryDs.patterns = updated.patterns;
      return memoryDs;
    }
    return { status: 'success' };
  }
};
