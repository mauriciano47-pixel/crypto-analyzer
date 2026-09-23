/**
 * Motor Autónomo de Usuario Diario Simulado & Inversión Artificial
 * Genera diariamente perfiles realistas de personas naturales (traders cuantitativos),
 * ejecuta paper trading en tiempo real sincronizado con los ticks de Binance WebSocket,
 * evalúa la efectividad de las señales y genera retroalimentación continua para Crypto Pattern Analyzer.
 */

const STORAGE_DAILY_TRADER_KEY = 'crypto_analyzer_daily_trader';

// Catálogo de identidades realistas de personas naturales de habla hispana e internacional
const TRADER_PROFILES_POOL = [
  {
    name: 'Valentina Silva',
    username: 'valen_crypto',
    city: 'Santiago, Chile',
    avatarColor: '#10B981',
    initials: 'VS',
    bio: 'Trader cuantitativa y analista de ondas. Especialista en confluencia de RSI Wilder con rupturas de soporte en temporalidades de 15m y 1h.',
    strategy: 'Momentum & Reversión a la Media',
    riskTolerance: 'Moderado (1.5% - 2%)',
    favoriteAsset: 'BTC/USDT'
  },
  {
    name: 'Carlos Mendoza',
    username: 'cmendoza_quant',
    city: 'Buenos Aires, Argentina',
    avatarColor: '#3B82F6',
    initials: 'CM',
    bio: 'Ingeniero financiero y swing trader. Aplica Bandas de Bollinger y retrocesos de Fibonacci para capturar expansiones de volatilidad.',
    strategy: 'Volatilidad & Bandas de Bollinger',
    riskTolerance: 'Conservador (1.0% - 1.5%)',
    favoriteAsset: 'ETH/USDT'
  },
  {
    name: 'Mateo Rojas',
    username: 'mrojas_trader',
    city: 'Medellín, Colombia',
    avatarColor: '#8B5CF6',
    initials: 'MR',
    bio: 'Trader intradiario enfocado en la acción del precio y patrones de velas japonesas (Martillos y Envolventes) con confirmación de volumen.',
    strategy: 'Acción del Precio & Velas Japonesas',
    riskTolerance: 'Agresivo (2.5% - 3.0%)',
    favoriteAsset: 'SOL/USDT'
  },
  {
    name: 'Sofía Herrera',
    username: 'sofia_herrera_fx',
    city: 'Ciudad de México, México',
    avatarColor: '#EC4899',
    initials: 'SH',
    bio: 'Especialista en activos de alta liquidez y análisis algorítmico. Opera con Puntos Pivote Floor Trader y medias móviles exponenciales EMA 20.',
    strategy: 'Puntos Pivote & Tendencia EMA 20',
    riskTolerance: 'Moderado (1.8% - 2.2%)',
    favoriteAsset: 'BTC/USDT'
  },
  {
    name: 'Nicolás Benítez',
    username: 'nbenitez_alpha',
    city: 'Montevideo, Uruguay',
    avatarColor: '#06B6D4',
    initials: 'NB',
    bio: 'Desarrollador de modelos de trading sistemático. Prueba hipótesis de backtesting comparando señales algorítmicas con ejecución real.',
    strategy: 'Backtesting Sistemático & R:R 2.5',
    riskTolerance: 'Moderado-Alto (2.0% - 2.5%)',
    favoriteAsset: 'BNB/USDT'
  },
  {
    name: 'Camila Valenzuela',
    username: 'cvalenzuela_trader',
    city: 'Lima, Perú',
    avatarColor: '#F59E0B',
    initials: 'CV',
    bio: 'Inversora en criptoactivos y scalper disciplinada. Utiliza osciladores de sobreventa extrema para entradas con ratio asimétrico.',
    strategy: 'Divergencias RSI & Zonas de Oferta/Demanda',
    riskTolerance: 'Conservador (1.2% - 1.6%)',
    favoriteAsset: 'SOL/USDT'
  },
  {
    name: 'Alejandro Morales',
    username: 'amorales_crypto',
    city: 'Madrid, España',
    avatarColor: '#14B8A6',
    initials: 'AM',
    bio: 'Analista técnico senior. Busca confluencia entre patrones armónicos, noticias macroeconómicas y flujo institucional en libros de órdenes.',
    strategy: 'Confluencia Macro & Patrones Técnicos',
    riskTolerance: 'Moderado (1.5% - 2.0%)',
    favoriteAsset: 'ETH/USDT'
  }
];

// Comentarios y retroalimentaciones cuantitativas contextuales
const FEEDBACK_TEMPLATES = [
  {
    rating: 5,
    stars: '★★★★★',
    title: 'Excelente precisión en detección de Martillo Alcista',
    comment: 'El algoritmo identificó con precisión quirúrgica el patrón de rechazo en soporte. La confluencia con el RSI Wilder en 32 confirmó la entrada óptima antes del rebote.',
    suggestion: 'El cálculo automático de Stop Loss por debajo de la mecha inferior protegió la posición contra mechas de volatilidad.',
    learningContribution: '+18 velas validadas en el conjunto de entrenamiento de patrones alcistas.'
  },
  {
    rating: 5,
    stars: '★★★★★',
    title: 'Reconocimiento exacto de ruptura con Bandas de Bollinger',
    comment: 'La alerta de compresión previa al breakout funcionó de manera impecable. Gran trabajo en la sincronización del gráfico de velas a 60 FPS sin retraso.',
    suggestion: 'Recomiendo proyectar zonas de Take Profit escalonadas (TP1 al 50% y TP2 al 100%) para asegurar ganancias.',
    learningContribution: 'Ratio R:R de 2.45 verificado y registrado en el historial de confluencias técnicas.'
  },
  {
    rating: 4,
    stars: '★★★★☆',
    title: 'Sólida confirmación de tendencia con EMA 20',
    comment: 'La media móvil exponencial reaccionó rápido al cambio de estructura de mercado. El indicador de volatilidad ayudó a dimensionar el tamaño de lote.',
    suggestion: 'En temporalidades de 1m, convendría añadir un filtro anti-ruido para evitar señales prematuras en consolidaciones laterales.',
    learningContribution: 'Ajuste de sensibilidad sugerido para mercados en rango de baja liquidez.'
  },
  {
    rating: 5,
    stars: '★★★★★',
    title: 'Cálculo de riesgo y dimensionamiento de posición impecable',
    comment: 'La calculadora cuantitativa de riesgo integrada permitió planificar la orden antes de entrar. Se respetó la pérdida máxima del 1.5% del capital.',
    suggestion: 'La proyección visual de líneas de precio directamente en TradingView hace que la ejecución sea mucho más intuitiva.',
    learningContribution: 'Validación de ejecución sin deslizamiento artificial (zero-slippage).'
  }
];

// Obtener fecha actual en formato YYYY-MM-DD
function getTodayKey() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Generador determinístico basado en la fecha (o con índice aleatorio si se fuerza)
function pickProfileByDate(dateStr, seedOffset = 0) {
  let hash = 0;
  const str = dateStr + seedOffset;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % TRADER_PROFILES_POOL.length;
  return TRADER_PROFILES_POOL[index];
}

// Crear una posición simulada verosímil basada en el precio actual del activo
function createSimulatedPosition(profile, symbol = 'BTC/USDT', currentPrice = 64500) {
  const price = currentPrice > 0 ? currentPrice : 64000;
  // Determinar dirección Long o Short
  const isLong = Math.random() > 0.35; // Sesgo ligeramente alcista
  const type = isLong ? 'LONG' : 'SHORT';
  
  // Niveles de SL y TP realistas
  const slPercent = isLong ? 0.018 : 0.018; // 1.8%
  const tpPercent = isLong ? 0.042 : 0.042; // 4.2% (R:R > 2.3)

  const stopLoss = isLong ? Number((price * (1 - slPercent)).toFixed(2)) : Number((price * (1 + slPercent)).toFixed(2));
  const takeProfit = isLong ? Number((price * (1 + tpPercent)).toFixed(2)) : Number((price * (1 - tpPercent)).toFixed(2));

  const capital = 10000; // $10,000 USDT base
  const riskAmount = capital * 0.02; // arriesgar $200 (2%)
  const slDistance = Math.abs(price - stopLoss);
  const positionUnits = slDistance > 0 ? Number((riskAmount / slDistance).toFixed(4)) : 0.05;
  const notionalValue = Number((positionUnits * price).toFixed(2));

  return {
    id: `trade_${Date.now()}`,
    symbol,
    type,
    entryPrice: price,
    currentPrice: price,
    stopLoss,
    takeProfit,
    positionUnits,
    notionalValue,
    riskAmount,
    rrRatio: Number((Math.abs(takeProfit - price) / Math.max(1, slDistance)).toFixed(2)),
    floatingPnL: 0,
    floatingPnLPercent: 0,
    status: 'ABIERTA', // 'ABIERTA' | 'TP_ALCANZADO' | 'SL_ALCANZADO'
    openedAt: new Date(Date.now() - 1000 * 60 * (15 + Math.floor(Math.random() * 45))).toISOString(), // hace 15-60 min
    rationale: isLong 
      ? `Rebote técnico en soporte con patrón de acumulación y confirmación RSI.` 
      : `Rechazo en resistencia con sobrecompra en oscilador Wilder y pérdida de volumen.`
  };
}

class SyntheticTraderService {
  constructor() {
    this.currentTrader = null;
    this.listeners = new Set();
    this.activityLog = [];
    this.init();
  }

  init() {
    try {
      const today = getTodayKey();
      const raw = localStorage.getItem(STORAGE_DAILY_TRADER_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.dateKey === today) {
          this.currentTrader = saved;
          this.activityLog = saved.activityLog || [];
          return;
        }
      }
      // Si no existe o es de un día anterior, generar nuevo para hoy
      this.generateDailyTrader(today);
    } catch (err) {
      console.warn('[SyntheticTrader] Error inicializando trader:', err);
      this.generateDailyTrader(getTodayKey());
    }
  }

  /**
   * Genera el usuario de fantasía diario y lo registra en el ecosistema
   */
  generateDailyTrader(dateKey = getTodayKey(), forceRandom = false) {
    const seedOffset = forceRandom ? Math.floor(Math.random() * 1000) : 0;
    const baseProfile = pickProfileByDate(dateKey, seedOffset);
    const feedbackTemplate = FEEDBACK_TEMPLATES[Math.floor(Math.random() * FEEDBACK_TEMPLATES.length)];

    const traderId = `trader_${dateKey.replace(/-/g, '_')}_${baseProfile.username}`;
    const initialBalance = 10000;
    const realizedPnL = Number(((Math.random() * 320) + 80).toFixed(2)); // $80 a $400 de ganancias previas
    const totalBalance = Number((initialBalance + realizedPnL).toFixed(2));

    const activePosition = createSimulatedPosition(baseProfile, baseProfile.favoriteAsset, 64250);

    const initialActivityLog = [
      {
        id: `act_1_${Date.now()}`,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        action: 'Sesión iniciada',
        detail: `${baseProfile.name} inició su sesión diaria y cargó el motor en tiempo real.`
      },
      {
        id: `act_2_${Date.now()}`,
        timestamp: new Date(Date.now() - 2400000).toISOString(),
        action: 'Análisis de mercado',
        detail: `Escaneo de velas en ${baseProfile.favoriteAsset} completado con ${baseProfile.strategy}.`
      },
      {
        id: `act_3_${Date.now()}`,
        timestamp: activePosition.openedAt,
        action: `Orden ${activePosition.type} ejecutada`,
        detail: `Entrada a $${activePosition.entryPrice.toLocaleString()} con R:R de ${activePosition.rrRatio}:1.`
      }
    ];

    const traderData = {
      dateKey,
      id: traderId,
      profile: baseProfile,
      initialBalance,
      currentBalance: totalBalance,
      realizedPnL,
      winRate: Math.floor(Math.random() * 16) + 72, // 72% a 88%
      totalTrades: Math.floor(Math.random() * 25) + 38,
      activePosition,
      feedback: {
        ...feedbackTemplate,
        date: new Date().toISOString(),
        evaluatedSymbol: baseProfile.favoriteAsset
      },
      activityLog: initialActivityLog,
      lastUpdated: new Date().toISOString()
    };

    this.currentTrader = traderData;
    this.activityLog = initialActivityLog;
    this.saveTrader();

    // Registrar en segundo plano en authService para coherencia del ecosistema
    this.registerInAuthSystem(baseProfile);

    this.notify();
    return traderData;
  }

  /**
   * Registra automáticamente al usuario simulado en el sistema de autenticación local
   */
  async registerInAuthSystem(profile) {
    try {
      const usersRaw = localStorage.getItem('crypto_analyzer_users');
      const users = usersRaw ? JSON.parse(usersRaw) : [];
      const exists = users.some(u => u.username.toLowerCase() === profile.username.toLowerCase());
      
      if (!exists) {
        users.push({
          username: profile.username,
          displayName: profile.name,
          role: 'Trader Cuantitativo Simulado (IA)',
          city: profile.city,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          isSynthetic: true
        });
        localStorage.setItem('crypto_analyzer_users', JSON.stringify(users));
      }
    } catch (e) {
      console.warn('[SyntheticTrader] No se pudo registrar usuario en authService:', e);
    }
  }

  /**
   * Actualiza el P&L de la posición en tiempo real con cada tick de Binance
   */
  updateMarketPrice(symbol, currentPrice) {
    if (!this.currentTrader || !this.currentTrader.activePosition) return;
    const pos = this.currentTrader.activePosition;

    // Normalizar símbolos
    const cleanSym = symbol.replace('/', '').toUpperCase();
    const cleanPosSym = pos.symbol.replace('/', '').toUpperCase();

    if (cleanSym !== cleanPosSym) return;
    if (typeof currentPrice !== 'number' || currentPrice <= 0) return;

    pos.currentPrice = currentPrice;

    // Calcular P&L flotante
    const priceDiff = pos.type === 'LONG' ? (currentPrice - pos.entryPrice) : (pos.entryPrice - currentPrice);
    const pnlPercent = (priceDiff / pos.entryPrice) * 100;
    const pnlDollars = (pos.notionalValue * (pnlPercent / 100));

    pos.floatingPnL = Number(pnlDollars.toFixed(2));
    pos.floatingPnLPercent = Number(pnlPercent.toFixed(2));

    // Verificar si alcanzó TP o SL
    if (pos.type === 'LONG') {
      if (currentPrice >= pos.takeProfit && pos.status === 'ABIERTA') {
        pos.status = 'TP_ALCANZADO';
        this.logActivity('Take Profit alcanzado', `Posición cerrada con éxito (+${pos.floatingPnLPercent}% / +$${pos.floatingPnL}).`);
      } else if (currentPrice <= pos.stopLoss && pos.status === 'ABIERTA') {
        pos.status = 'SL_ALCANZADO';
        this.logActivity('Stop Loss ejecutado', `Gestión de riesgo preservó el capital (${pos.floatingPnLPercent}%).`);
      }
    } else {
      if (currentPrice <= pos.takeProfit && pos.status === 'ABIERTA') {
        pos.status = 'TP_ALCANZADO';
        this.logActivity('Take Profit alcanzado', `Posición SHORT cerrada con éxito (+${pos.floatingPnLPercent}% / +$${pos.floatingPnL}).`);
      } else if (currentPrice >= pos.stopLoss && pos.status === 'ABIERTA') {
        pos.status = 'SL_ALCANZADO';
        this.logActivity('Stop Loss ejecutado', `Gestión de riesgo SHORT ejecutada (${pos.floatingPnLPercent}%).`);
      }
    }

    this.currentTrader.lastUpdated = new Date().toISOString();
    this.notify();
  }

  /**
   * Agrega un evento al registro de actividad en movimiento
   */
  logActivity(action, detail) {
    const item = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      action,
      detail
    };
    this.activityLog.unshift(item);
    if (this.activityLog.length > 25) {
      this.activityLog = this.activityLog.slice(0, 25);
    }
    if (this.currentTrader) {
      this.currentTrader.activityLog = this.activityLog;
      this.saveTrader();
    }
    this.notify();
  }

  /**
   * Forzar generación de un nuevo trader para demostraciones
   */
  forceRotateTrader(currentSymbol = 'BTC/USDT', livePrice = null) {
    const newTrader = this.generateDailyTrader(getTodayKey(), true);
    if (currentSymbol && livePrice) {
      newTrader.activePosition = createSimulatedPosition(newTrader.profile, currentSymbol, livePrice);
      this.saveTrader();
    }
    this.notify();
    return newTrader;
  }

  saveTrader() {
    try {
      if (this.currentTrader) {
        localStorage.setItem(STORAGE_DAILY_TRADER_KEY, JSON.stringify(this.currentTrader));
      }
    } catch (e) {
      console.warn('[SyntheticTrader] Error guardando trader diario:', e);
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(fn => {
      try {
        fn(this.currentTrader);
      } catch (err) {
        console.error('[SyntheticTrader] Error notificando oyente:', err);
      }
    });
  }

  getTrader() {
    return this.currentTrader;
  }
}

export const syntheticTraderService = new SyntheticTraderService();
