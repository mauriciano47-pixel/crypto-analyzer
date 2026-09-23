import { useState, useEffect } from 'react';
import { CandlestickChart, TrendingUp, User, Lock, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, Sun, Moon } from 'lucide-react';
import { authService } from '../services/authService';

export default function AuthScreen({ onAuthSuccess, theme = 'dark', onToggleTheme = null }) {
  const [isRegistering, setIsRegistering] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      const svgIconData = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='2' y='2' width='60' height='60' rx='16' fill='%23050811' stroke='%2310B981' stroke-width='2.5'/%3E%3Cline x1='8' y1='23' x2='56' y2='23' stroke='%231E293B' stroke-width='1.2' stroke-dasharray='3 3'/%3E%3Cline x1='8' y1='41' x2='56' y2='41' stroke='%231E293B' stroke-width='1.2' stroke-dasharray='3 3'/%3E%3Cline x1='17' y1='24' x2='17' y2='50' stroke='%233B82F6' stroke-width='3' stroke-linecap='round'/%3E%3Crect x='12.5' y='30' width='9' height='13' rx='2.5' fill='%233B82F6' stroke='%2360A5FA' stroke-width='1'/%3E%3Cline x1='32' y1='16' x2='32' y2='46' stroke='%2306B6D4' stroke-width='3' stroke-linecap='round'/%3E%3Crect x='27.5' y='22' width='9' height='16' rx='2.5' fill='%2306B6D4' stroke='%2367E8F9' stroke-width='1'/%3E%3Cline x1='47' y1='9' x2='47' y2='42' stroke='%2310B981' stroke-width='3.2' stroke-linecap='round'/%3E%3Crect x='42' y='14' width='10' height='20' rx='2.5' fill='%2310B981' stroke='%2334D399' stroke-width='1.2'/%3E%3Cpath d='M 43 9 L 51 9 L 51 17' fill='none' stroke='%2334D399' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='51' cy='9' r='3.5' fill='%2334D399'/%3E%3Ccircle cx='51' cy='9' r='1.8' fill='%23FFFFFF'/%3E%3C/svg%3E";

      let link = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'shortcut icon';
        document.head.appendChild(link);
      }
      link.type = 'image/svg+xml';
      link.href = svgIconData;
    } catch (e) {
      console.warn('Error inyectando favicon dinámico en AuthScreen:', e);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let user;
      if (isRegistering) {
        user = await authService.register(username, password);
      } else {
        user = await authService.login(username, password);
      }
      onAuthSuccess(user);
    } catch (err) {
      setError(err.message || 'Error al procesar la solicitud.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestAccess = () => {
    setError(null);
    const guest = authService.loginAsGuest();
    onAuthSuccess(guest);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: theme === 'light'
        ? 'radial-gradient(circle at 50% 20%, rgba(59, 130, 246, 0.08) 0%, rgba(241, 245, 249, 1) 70%)'
        : 'radial-gradient(circle at 50% 20%, rgba(16, 185, 129, 0.08) 0%, rgba(11, 14, 20, 1) 70%)',
      padding: '1.5rem',
      boxSizing: 'border-box'
    }}>
      <div 
        className="card glass" 
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '2.25rem 2rem',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          position: 'relative'
        }}
      >
        {/* Botón de Alternancia de Tema en Esquina Superior */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            title={theme === 'light' ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro'}
            aria-label="Alternar tema claro u oscuro"
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '6px',
              color: theme === 'light' ? '#D97706' : '#FBBF24',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        )}

        {/* Encabezado con Logotipo */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '56px',
            height: '56px',
            margin: '0 auto 1rem auto',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(59, 130, 246, 0.2))',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)'
          }}>
            <CandlestickChart size={32} className="text-bullish" />
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.02em', margin: '0 0 0.4rem 0', color: 'var(--heading-color)' }}>
            Crypto Pattern Analyzer
          </h1>
          <p className="text-muted" style={{ fontSize: '0.825rem', margin: 0 }}>
            Terminal Algorítmico Cuantitativo & Streaming Binance
          </p>
        </div>

        {/* Selector de Pestañas: Registro / Iniciar Sesión */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-elevated)',
          borderRadius: '10px',
          padding: '4px',
          border: '1px solid var(--border-color)'
        }}>
          <button
            type="button"
            onClick={() => {
              setIsRegistering(true);
              setError(null);
            }}
            style={{
              flex: 1,
              padding: '0.6rem 0.5rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.85rem',
              transition: 'all 0.2s',
              backgroundColor: isRegistering ? 'var(--neon-green)' : 'transparent',
              color: isRegistering ? '#000000' : 'var(--text-secondary)'
            }}
          >
            Registrarse
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegistering(false);
              setError(null);
            }}
            style={{
              flex: 1,
              padding: '0.6rem 0.5rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.85rem',
              transition: 'all 0.2s',
              backgroundColor: !isRegistering ? 'var(--neon-green)' : 'transparent',
              color: !isRegistering ? '#000000' : 'var(--text-secondary)'
            }}
          >
            Iniciar Sesión
          </button>
        </div>

        {/* Mensaje de Alerta / Error */}
        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #EF4444',
            color: '#FCA5A5',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario de Registro / Login */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div>
            <label 
              htmlFor="auth-username" 
              className="text-muted" 
              style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.825rem', fontWeight: '600' }}
            >
              Usuario
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', color: '#64748B' }} />
              <input
                id="auth-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej: mauricio_trader"
                required
                autoComplete="username"
                className="input-field"
                style={{ width: '100%', paddingLeft: '38px', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          <div>
            <label 
              htmlFor="auth-password" 
              className="text-muted" 
              style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.825rem', fontWeight: '600' }}
            >
              Clave de Acceso
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', color: '#64748B' }} />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu clave"
                required
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                className="input-field"
                style={{ width: '100%', paddingLeft: '38px', paddingRight: '40px', fontSize: '0.9rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Botón Principal */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn"
            style={{
              padding: '0.75rem',
              fontSize: '0.95rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <span>{isRegistering ? 'Crear Cuenta y Entrar' : 'Entrar al Terminal'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Separador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.25rem 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>o acceso rápido</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
        </div>

        {/* Botón de Invitado */}
        <button
          type="button"
          onClick={handleGuestAccess}
          className="btn btn-secondary"
          style={{
            padding: '0.65rem',
            fontSize: '0.85rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            cursor: 'pointer'
          }}
        >
          <TrendingUp size={16} className="text-bullish" />
          <span>Explorar como Invitado (Sin Registro)</span>
        </button>

        {/* Distintivo de Privacidad y Seguridad */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          fontSize: '0.725rem',
          color: '#64748B',
          marginTop: '0.5rem'
        }}>
          <ShieldCheck size={14} style={{ color: '#10B981' }} />
          <span>Autenticación local cifrada SHA-256 • Cero fugas de datos</span>
        </div>
      </div>
    </div>
  );
}
