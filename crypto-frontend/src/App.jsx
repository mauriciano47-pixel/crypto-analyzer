import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import DataIngestion from './components/DataIngestion';
import TradingChart from './components/TradingChart';
import NewsColumn from './components/NewsColumn';
import { Activity, PlusCircle } from 'lucide-react';

const calcularBacktestingPatrones = (patternsList, chartSerie) => {
  if (!patternsList || patternsList.length === 0 || !chartSerie || chartSerie.length === 0) {
    return patternsList.map(p => ({ ...p, tasaAcierto: null }));
  }

  const sortedSerie = [...chartSerie].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  const estadisticas = {};

  const patronesEvaluados = patternsList.map(p => {
    const isBullish = p.patron && (
      p.patron.toLowerCase().includes('bullish') || 
      p.patron.toLowerCase().includes('morning') || 
      p.patron.toLowerCase().includes('hammer')
    );

    const priceEntry = parseFloat(p.close);
    const datePatronStr = p.fecha;

    const timePatron = new Date(datePatronStr).getTime();
    const indexVela = sortedSerie.findIndex(v => new Date(v.fecha).getTime() === timePatron);

    let esExitoso = false;
    let tieneSuficientesDatos = false;

    if (indexVela !== -1 && indexVela < sortedSerie.length - 1) {
      tieneSuficientesDatos = true;
      const velasFuturas = sortedSerie.slice(indexVela + 1, Math.min(indexVela + 6, sortedSerie.length));
      
      if (isBullish) {
        esExitoso = velasFuturas.some(v => parseFloat(v.close) > priceEntry);
      } else {
        esExitoso = velasFuturas.some(v => parseFloat(v.close) < priceEntry);
      }
    }

    if (!estadisticas[p.patron]) {
      estadisticas[p.patron] = { aciertos: 0, total: 0 };
    }

    if (tieneSuficientesDatos) {
      estadisticas[p.patron].total += 1;
      if (esExitoso) {
        estadisticas[p.patron].aciertos += 1;
      }
    }

    return {
      ...p,
      esExitoso,
      evaluado: tieneSuficientesDatos
    };
  });

  return patronesEvaluados.map(p => {
    const stats = estadisticas[p.patron];
    let tasaAcierto = null;
    if (stats && stats.total > 0) {
      tasaAcierto = (stats.aciertos / stats.total) * 100;
    }
    return {
      ...p,
      tasaAcierto
    };
  });
};

function App() {
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAutoUpdateActive, setIsAutoUpdateActive] = useState(true);
  const [error, setError] = useState(null);
  const [focusedTime, setFocusedTime] = useState(null);

  // Analysis Data
  const [chartData, setChartData] = useState(null);
  const [patterns, setPatterns] = useState([]);
  const [news, setNews] = useState([]);

  const selectedDataset = datasets.find(d => Number(d.id) === Number(selectedDatasetId));
  const isRealTime = selectedDataset && selectedDataset.nombre_archivo && selectedDataset.nombre_archivo.toLowerCase().startsWith('ccxt_');

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      const data = await api.getDatasets();
      setDatasets(data);
      // Cargar por defecto el primer análisis en tiempo real (CCXT) si existe
      const liveDataset = data.find(ds => ds.nombre_archivo && ds.nombre_archivo.toLowerCase().startsWith('ccxt_'));
      if (liveDataset) {
        loadAnalysis(liveDataset.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDatasetCreated = (dataset) => {
    setDatasets(prev => [dataset, ...prev]);
    loadAnalysis(dataset.id);
  };

  const loadAnalysis = async (datasetId) => {
    setIsLoading(true);
    setError(null);
    setSelectedDatasetId(datasetId);
    setFocusedTime(null);
    
    try {
      const [indicatorsRes, patternsRes, newsRes] = await Promise.all([
        api.getIndicators(datasetId),
        api.getPatterns(datasetId),
        api.getNewsContext(datasetId).catch(() => ({ coincidencias: [] })) // Fallback si no hay noticias
      ]);

      const mappedPatterns = (patternsRes.patrones || []).map(p => ({
        patron: p.tipo_patron_display || p.tipo_patron || 'Dato no disponible',
        fecha: p.timestamp || '',
        close: p.close || 0
      }));
      
      const flattenedNews = [];
      const seenUrls = new Set();
      (newsRes.coincidencias || []).forEach(coincidencia => {
        (coincidencia.noticias || []).forEach(noticia => {
          if (noticia.url && seenUrls.has(noticia.url)) return;
          if (noticia.url) seenUrls.add(noticia.url);

          const sentMap = {
            positive: 'Positivo 🟢',
            negative: 'Negativo 🔴',
            neutral: 'Neutral 🟡',
            unknown: 'Desconocido ⚪'
          };
          const sentimientoTraducido = sentMap[noticia.sentimiento] || noticia.sentimiento || 'Desconocido ⚪';
          
          flattenedNews.push({
            patron: coincidencia.patron || 'Patrón Técnico',
            fecha: noticia.fecha_publicacion || coincidencia.fecha || '',
            titulo: noticia.titular || 'Sin título',
            resumen: `Fuente: ${noticia.fuente || 'Desconocida'} | Sentimiento: ${sentimientoTraducido}`,
            url: noticia.url || ''
          });
        });
      });

      const seriesData = indicatorsRes.serie || [];
      const patternsWithBacktest = calcularBacktestingPatrones(mappedPatterns, seriesData);
      setChartData(seriesData);
      setPatterns(patternsWithBacktest);
      setNews(flattenedNews);
    } catch (err) {
      setError(err.message || 'Error cargando análisis');
    } finally {
      setIsLoading(false);
    }
  };

  const reloadAnalysisData = async (datasetId) => {
    setIsUpdating(true);
    try {
      // 1. Indicarle al backend que actualice vía CCXT
      await api.updateCCXT(datasetId);
      
      // 2. Traer los nuevos datos de forma silenciosa
      const [indicatorsRes, patternsRes, newsRes] = await Promise.all([
        api.getIndicators(datasetId),
        api.getPatterns(datasetId),
        api.getNewsContext(datasetId).catch(() => ({ coincidencias: [] }))
      ]);

      const mappedPatterns = (patternsRes.patrones || []).map(p => ({
        patron: p.tipo_patron_display || p.tipo_patron || 'Dato no disponible',
        fecha: p.timestamp || '',
        close: p.close || 0
      }));
      
      const flattenedNews = [];
      const seenUrls = new Set();
      (newsRes.coincidencias || []).forEach(coincidencia => {
        (coincidencia.noticias || []).forEach(noticia => {
          if (noticia.url && seenUrls.has(noticia.url)) return;
          if (noticia.url) seenUrls.add(noticia.url);

          const sentMap = {
            positive: 'Positivo 🟢',
            negative: 'Negativo 🔴',
            neutral: 'Neutral 🟡',
            unknown: 'Desconocido ⚪'
          };
          const sentimientoTraducido = sentMap[noticia.sentimiento] || noticia.sentimiento || 'Desconocido ⚪';
          
          flattenedNews.push({
            patron: coincidencia.patron || 'Patrón Técnico',
            fecha: noticia.fecha_publicacion || coincidencia.fecha || '',
            titulo: noticia.titular || 'Sin título',
            resumen: `Fuente: ${noticia.fuente || 'Desconocida'} | Sentimiento: ${sentimientoTraducido}`,
            url: noticia.url || ''
          });
        });
      });

      const seriesData = indicatorsRes.serie || [];
      const patternsWithBacktest = calcularBacktestingPatrones(mappedPatterns, seriesData);
      setChartData(seriesData);
      setPatterns(patternsWithBacktest);
      setNews(flattenedNews);
    } catch (err) {
      console.error("Error actualizando en tiempo real:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (!selectedDatasetId || !isRealTime || !isAutoUpdateActive) return;

    // Actualizar cada 15 segundos en tiempo real
    const interval = setInterval(() => {
      reloadAnalysisData(selectedDatasetId);
    }, 15000);

    return () => clearInterval(interval);
  }, [selectedDatasetId, isRealTime, isAutoUpdateActive]);

  return (
    <div className="app-container">
      <main style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <header className="glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity className="text-bullish" size={24} />
            <div>
              <h1 style={{ fontSize: '1.3rem', fontWeight: '700', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                crypto analizer
              </h1>
              <p className="text-muted" style={{ fontSize: '0.75rem', margin: 0 }}>Análisis algorítmico y detección de patrones de velas</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isRealTime && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span 
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isUpdating ? '#3B82F6' : '#10B981',
                    display: 'inline-block',
                    boxShadow: isUpdating ? '0 0 8px #3B82F6' : '0 0 8px #10B981',
                    animation: isAutoUpdateActive ? 'pulse 1.5s infinite' : 'none'
                  }}
                />
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: isUpdating ? '#3B82F6' : '#10B981', letterSpacing: '0.05em' }}>
                  {isUpdating ? 'ACTUALIZANDO...' : 'EN VIVO'}
                </span>
                <button 
                  onClick={() => setIsAutoUpdateActive(prev => !prev)}
                  title={isAutoUpdateActive ? "Pausar actualización automática" : "Reanudar actualización automática"}
                  style={{
                    background: isAutoUpdateActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    border: 'none',
                    color: isAutoUpdateActive ? '#EF4444' : '#10B981',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    marginLeft: '4px',
                    transition: 'all 0.2s'
                  }}
                >
                  {isAutoUpdateActive ? 'PAUSAR' : 'AUTO'}
                </button>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="text-muted" style={{ fontSize: '0.85rem', fontWeight: '500' }}>Análisis Recientes:</span>
              <select 
                value={selectedDatasetId || ''} 
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setSelectedDatasetId(null);
                    setFocusedTime(null);
                  } else {
                    loadAnalysis(Number(val));
                  }
                }}
                className="input-field"
                style={{ width: '220px', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
              >
                <option value="">-- Seleccionar --</option>
                {datasets.map(ds => {
                  const isDsRealTime = ds.nombre_archivo && ds.nombre_archivo.toLowerCase().startsWith('ccxt_');
                  return (
                    <option key={ds.id} value={ds.id}>
                      {ds.asset_symbol} ({ds.timeframe}) {isDsRealTime ? '🟢 En Vivo' : ''} - {new Date(ds.fecha_carga).toLocaleDateString()}
                    </option>
                  );
                })}
              </select>
            </div>
            
            <button className="btn" onClick={() => { setSelectedDatasetId(null); setFocusedTime(null); }} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
              <PlusCircle size={16} /> Nuevo Análisis
            </button>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {error && <div className="card text-bearish" style={{ borderColor: 'var(--neon-red)' }}>{error}</div>}

          {!selectedDatasetId ? (
            <DataIngestion onDatasetCreated={handleDatasetCreated} />
          ) : isLoading ? (
            <div className="card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <h2>Analizando datos...</h2>
            </div>
          ) : (
            <>
              <TradingChart data={chartData} patterns={patterns} focusedTime={focusedTime} selectedDataset={selectedDataset} />
            <div className="card" style={{ flex: 1 }}>
              <h3>Patrones Detectados</h3>
              <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {patterns.length === 0 ? (
                  <p className="text-muted">No se detectaron patrones significativos.</p>
                ) : (
                  patterns.map((p, i) => {
                    const isBullish = p.patron && (
                      p.patron.toLowerCase().includes('bullish') || 
                      p.patron.toLowerCase().includes('morning') || 
                      p.patron.toLowerCase().includes('hammer')
                    );
                    const isFocused = focusedTime === p.fecha;
                    return (
                      <div 
                        key={i} 
                        onClick={() => {
                          setFocusedTime(p.fecha);
                          document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="pattern-card"
                        style={{ 
                          padding: '1rem', 
                          background: isFocused ? 'var(--bg-elevated)' : 'var(--bg-base)', 
                          borderRadius: '8px', 
                          borderLeft: `4px solid ${isBullish ? 'var(--neon-green)' : 'var(--neon-red)'}`,
                          borderTop: isFocused ? `1px solid ${isBullish ? 'var(--neon-green)' : 'var(--neon-red)'}` : '1px solid transparent',
                          borderRight: isFocused ? `1px solid ${isBullish ? 'var(--neon-green)' : 'var(--neon-red)'}` : '1px solid transparent',
                          borderBottom: isFocused ? `1px solid ${isBullish ? 'var(--neon-green)' : 'var(--neon-red)'}` : '1px solid transparent',
                          cursor: 'pointer'
                        }}
                      >
                        <strong>{p.patron}</strong>
                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                          Fecha: {p.fecha ? p.fecha.split('T')[0] : 'N/D'}
                        </div>
                        <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                          Cierre: ${parseFloat(p.close).toFixed(2)}
                        </div>
                        {typeof p.tasaAcierto === 'number' && !isNaN(p.tasaAcierto) && (
                          <div 
                            style={{ 
                              fontSize: '0.75rem', 
                              marginTop: '0.5rem', 
                              backgroundColor: p.tasaAcierto >= 50 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)', 
                              color: p.tasaAcierto >= 50 ? '#10B981' : '#EF4444', 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              display: 'inline-block',
                              fontWeight: 'bold' 
                            }}
                          >
                            Acierto Histórico: {p.tasaAcierto.toFixed(1)}% 🎯
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
        </div>
      </main>

      <NewsColumn news={news} />
    </div>
  );
}

export default App;
