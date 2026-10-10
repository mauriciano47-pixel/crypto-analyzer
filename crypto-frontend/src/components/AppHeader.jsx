import { 
  CandlestickChart, 
  TrendingUp, 
  PlusCircle, 
  Bot, 
  User, 
  LogOut, 
  Sun, 
  Moon 
} from 'lucide-react';

export default function AppHeader({
  liveSymbol,
  selectedDatasetId,
  setSelectedDatasetId,
  startLiveStream,
  liveTimeframe,
  datasets,
  onSelectDataset,
  dailyTrader,
  setSideTab,
  currentUser,
  handleLogout,
  theme,
  toggleTheme
}) {
  return (
    <header className="glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.5rem', borderBottom: '1px solid var(--border-color)', zIndex: 10, flexWrap: 'wrap', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <CandlestickChart className="text-bullish" size={26} />
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            crypto analizer
          </h1>
          <p className="text-muted" style={{ fontSize: '0.75rem', margin: 0 }}>Streaming en Tiempo Real &amp; Detección Algorítmica</p>
        </div>
      </div>
      
      {/* Barra de Monedas Rápidas en Tiempo Real */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(15, 23, 42, 0.7)', padding: '4px 8px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94A3B8', marginRight: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <TrendingUp size={14} className="text-bullish" /> EN VIVO:
        </span>
        {['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'BNB'].map(coin => {
          const pair = `${coin}/USDT`;
          const isSelected = liveSymbol === pair && selectedDatasetId === 'LIVE_STREAM';
          return (
            <button
              key={coin}
              type="button"
              onClick={() => {
                setSelectedDatasetId('LIVE_STREAM');
                startLiveStream(pair, liveTimeframe);
              }}
              style={{
                padding: '3px 8px',
                fontSize: '0.75rem',
                fontWeight: '700',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: isSelected ? 'var(--neon-green)' : 'rgba(255, 255, 255, 0.05)',
                color: isSelected ? '#000000' : '#F8FAFC',
                transition: 'all 0.2s'
              }}
            >
              {coin}
            </button>
          );
        })}
      </div>

      {/* Menú de Datasets, Nuevo Análisis y Perfil de Usuario */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <select 
          value={selectedDatasetId || 'LIVE_STREAM'} 
          onChange={(e) => onSelectDataset(e.target.value)}
          className="input-field"
          style={{ width: '190px', padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
        >
          <option value="LIVE_STREAM">⚡ Tiempo Real (WebSocket)</option>
          {datasets.map(ds => (
            <option key={ds.id} value={ds.id}>
              {ds.asset_symbol} ({ds.timeframe}) - {new Date(ds.fecha_carga).toLocaleDateString()}
            </option>
          ))}
        </select>
        
        <button 
          type="button"
          className="btn" 
          onClick={() => setSelectedDatasetId(null)} 
          style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
        >
          <PlusCircle size={15} /> Subir CSV / CCXT
        </button>

        {/* Badge del Trader del Día */}
        {dailyTrader && (
          <button
            type="button"
            onClick={() => setSideTab('traders')}
            title="Ver Trader del Día y Retroalimentación Algorítmica"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.35rem 0.65rem',
              borderRadius: '8px',
              background: 'var(--bg-elevated)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              fontSize: '0.78rem',
              fontWeight: '700',
              transition: 'all 0.2s',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.1)'
            }}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 8px #10B981'
            }} />
            <Bot size={14} className="text-bullish" />
            <span>{dailyTrader.profile.name.split(' ')[0]}</span>
            {dailyTrader.activePosition && (
              <span style={{
                color: dailyTrader.activePosition.floatingPnL >= 0 ? '#10B981' : '#EF4444',
                fontWeight: '800'
              }}>
                {dailyTrader.activePosition.floatingPnL >= 0 ? '+' : ''}{dailyTrader.activePosition.floatingPnLPercent}%
              </span>
            )}
          </button>
        )}

        {/* Distintivo de Usuario Autenticado y Botón de Salir */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 0.65rem',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <User size={14} className="text-bullish" />
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#F1F5F9', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentUser.username}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            title="Cerrar Sesión"
            aria-label="Cerrar Sesión"
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
              marginLeft: '2px'
            }}
          >
            <LogOut size={14} />
          </button>
        </div>

        {/* Selector de Modo Claro / Modo Oscuro */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro'}
          aria-label={theme === 'light' ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.65rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-elevated)',
            color: theme === 'light' ? '#D97706' : '#FBBF24',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontSize: '0.8rem',
            fontWeight: '600'
          }}
        >
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
          <span style={{ fontSize: '0.75rem' }}>{theme === 'light' ? 'Oscuro' : 'Claro'}</span>
        </button>
      </div>
    </header>
  );
}
