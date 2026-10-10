/**
 * Algoritmo de backtesting walk-forward para patrones técnicos de velas japonesas.
 * Evalúa las siguientes 5 velas posteriores a la detección para calcular la tasa de acierto histórico.
 */
export const calcularBacktestingPatrones = (patternsList, chartSerie) => {
  if (!patternsList || patternsList.length === 0 || !chartSerie || chartSerie.length === 0) {
    return (patternsList || []).map(p => ({ ...p, tasaAcierto: null }));
  }

  const sortedSerie = [...chartSerie].sort((a, b) => {
    const timeA = typeof a.time === 'number' ? a.time : new Date(a.fecha).getTime();
    const timeB = typeof b.time === 'number' ? b.time : new Date(b.fecha).getTime();
    return timeA - timeB;
  });

  const estadisticas = {};

  const patronesEvaluados = patternsList.map(p => {
    const isBullish = p.patron && (
      p.patron.toLowerCase().includes('bullish') || 
      p.patron.toLowerCase().includes('morning') || 
      p.patron.toLowerCase().includes('hammer')
    );

    const priceEntry = parseFloat(p.close);
    const timePatron = typeof p.time === 'number' ? p.time : Math.floor(new Date(p.fecha).getTime() / 1000);
    const indexVela = sortedSerie.findIndex(v => {
      const vTime = typeof v.time === 'number' ? v.time : Math.floor(new Date(v.fecha).getTime() / 1000);
      return vTime === timePatron;
    });

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
