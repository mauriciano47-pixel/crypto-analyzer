const API_URL = import.meta.env.VITE_API_URL || `https://f1e59661ddb4a69d-195-86-38-45.serveousercontent.com/api`;

const BYPASS_HEADERS = {
  'serveo-skip-browser-warning': 'true',
  'ngrok-skip-browser-warning': 'true',
  'bypass-tunnel-reminder': 'true'
};

export const api = {
  // Datasets
  getDatasets: async () => {
    const res = await fetch(`${API_URL}/datasets/`, {
      headers: BYPASS_HEADERS
    });
    return res.json();
  },
  
  uploadCSV: async (file, assetSymbol, timeframe = '1d') => {
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('asset_symbol', assetSymbol);
    formData.append('timeframe', timeframe);
    
    const res = await fetch(`${API_URL}/datasets/upload/`, {
      method: 'POST',
      headers: BYPASS_HEADERS,
      body: formData,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  fetchCCXT: async (exchangeId, symbol, timeframe = '1d', limit = 100) => {
    const res = await fetch(`${API_URL}/datasets/fetch-ccxt/`, {
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
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  loadExample: async (symbol) => {
    const res = await fetch(`${API_URL}/datasets/load-example/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...BYPASS_HEADERS
      },
      body: JSON.stringify({ symbol })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Analysis
  getPatterns: async (datasetId) => {
    const res = await fetch(`${API_URL}/datasets/${datasetId}/patterns/`, {
      headers: BYPASS_HEADERS
    });
    if (!res.ok) throw new Error('Error al obtener patrones');
    return res.json();
  },

  getIndicators: async (datasetId) => {
    const res = await fetch(`${API_URL}/datasets/${datasetId}/indicators/`, {
      headers: BYPASS_HEADERS
    });
    if (!res.ok) throw new Error('Error al obtener indicadores');
    return res.json();
  },

  getNewsContext: async (datasetId) => {
    const res = await fetch(`${API_URL}/datasets/${datasetId}/news-context/`, {
      headers: BYPASS_HEADERS
    });
    if (!res.ok) throw new Error('Error al obtener noticias');
    return res.json();
  },

  updateCCXT: async (datasetId) => {
    const res = await fetch(`${API_URL}/datasets/${datasetId}/update-ccxt/`, {
      method: 'POST',
      headers: BYPASS_HEADERS
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar datos en tiempo real');
    }
    return res.json();
  }
};
