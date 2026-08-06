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

const fetchWithTimeout = async (url, options = {}, timeoutMs = 8000) => {
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

export const api = {
  // Datasets
  getDatasets: async () => {
    try {
      const res = await fetchWithTimeout(`${API_URL}/datasets/`, {
        headers: BYPASS_HEADERS
      }, 5000);
      if (!res.ok) throw new Error('Error al obtener datasets');
      return await res.json();
    } catch (err) {
      console.warn('Backend offline o en cold-start:', err.message);
      return [];
    }
  },
  
  uploadCSV: async (file, assetSymbol, timeframe = '1d') => {
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('asset_symbol', assetSymbol);
    formData.append('timeframe', timeframe);
    
    const res = await fetchWithTimeout(`${API_URL}/datasets/upload/`, {
      method: 'POST',
      headers: BYPASS_HEADERS,
      body: formData,
    }, 10000);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  fetchCCXT: async (exchangeId, symbol, timeframe = '1d', limit = 100) => {
    const res = await fetchWithTimeout(`${API_URL}/datasets/fetch-ccxt/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...BYPASS_HEADERS
      },
      body: JSON.stringify({
        exchange_id: exchangeId,
        symbol: symbol,
        timeframe: timeframe,
        limit: limit
      })
    }, 10000);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  loadExample: async (symbol) => {
    const res = await fetchWithTimeout(`${API_URL}/datasets/load-example/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...BYPASS_HEADERS
      },
      body: JSON.stringify({ symbol })
    }, 8000);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Analysis
  getPatterns: async (datasetId) => {
    const res = await fetchWithTimeout(`${API_URL}/datasets/${datasetId}/patterns/`, {
      headers: BYPASS_HEADERS
    }, 8000);
    if (!res.ok) throw new Error('Error al obtener patrones');
    return res.json();
  },

  getIndicators: async (datasetId) => {
    const res = await fetchWithTimeout(`${API_URL}/datasets/${datasetId}/indicators/`, {
      headers: BYPASS_HEADERS
    }, 8000);
    if (!res.ok) throw new Error('Error al obtener indicadores');
    return res.json();
  },

  getNewsContext: async (datasetId) => {
    const res = await fetchWithTimeout(`${API_URL}/datasets/${datasetId}/news-context/`, {
      headers: BYPASS_HEADERS
    }, 8000);
    if (!res.ok) throw new Error('Error al obtener noticias');
    return res.json();
  },

  updateCCXT: async (datasetId) => {
    const res = await fetchWithTimeout(`${API_URL}/datasets/${datasetId}/update-ccxt/`, {
      method: 'POST',
      headers: BYPASS_HEADERS
    }, 8000);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar datos en tiempo real');
    }
    return res.json();
  }
};
