/**
 * Servicio de Autenticación y Gestión de Usuarios para Crypto Pattern Analyzer
 * Implementación autónoma client-side con hashing seguro SHA-256 (Web Crypto API)
 * y persistencia en localStorage.
 */

const STORAGE_USERS_KEY = 'crypto_analyzer_users';
const STORAGE_CURRENT_USER_KEY = 'crypto_analyzer_current_user';
const SALT = 'crypto_pattern_salt_v1';

/**
 * Encripta una contraseña con SHA-256 usando la Web Crypto API nativa del navegador
 */
async function hashPassword(password) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + SALT);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.warn('[AuthService] Fallback hashing simple:', err);
    // Fallback de emergencia si Web Crypto estuviera deshabilitado en entorno inseguro
    let hash = 0;
    const str = password + SALT;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return String(Math.abs(hash));
  }
}

function getStoredUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users) {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('[AuthService] Error guardando usuarios:', err);
  }
}

export const authService = {
  /**
   * Obtiene el usuario autenticado actualmente
   */
  getCurrentUser: () => {
    try {
      const raw = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Registra un nuevo usuario con usuario y clave
   */
  register: async (username, password) => {
    const cleanUsername = (username || '').trim();
    if (!cleanUsername || cleanUsername.length < 3) {
      throw new Error('El nombre de usuario debe tener al menos 3 caracteres.');
    }
    if (cleanUsername.length > 20) {
      throw new Error('El nombre de usuario no puede exceder 20 caracteres.');
    }
    if (!password || password.length < 4) {
      throw new Error('La clave debe tener al menos 4 caracteres.');
    }

    const users = getStoredUsers();
    const exists = users.some(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
    if (exists) {
      throw new Error('Este nombre de usuario ya está registrado. Por favor inicia sesión.');
    }

    const passwordHash = await hashPassword(password);
    const newUser = {
      username: cleanUsername,
      passwordHash,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    users.push(newUser);
    saveStoredUsers(users);

    const sessionUser = {
      username: cleanUsername,
      loggedInAt: newUser.lastLogin,
      token: `usr_${Date.now()}`
    };

    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },

  /**
   * Inicia sesión con usuario y clave existentes
   */
  login: async (username, password) => {
    const cleanUsername = (username || '').trim();
    if (!cleanUsername) {
      throw new Error('Ingresa tu nombre de usuario.');
    }
    if (!password) {
      throw new Error('Ingresa tu clave de acceso.');
    }

    const users = getStoredUsers();
    const user = users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
    if (!user) {
      throw new Error('Usuario no encontrado. Por favor regístrate primero.');
    }

    const passwordHash = await hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      throw new Error('Clave incorrecta. Por favor verifica tus credenciales.');
    }

    user.lastLogin = new Date().toISOString();
    saveStoredUsers(users);

    const sessionUser = {
      username: user.username,
      loggedInAt: user.lastLogin,
      token: `usr_${Date.now()}`
    };

    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },

  /**
   * Inicio de sesión rápido como Invitado / Demo
   */
  loginAsGuest: () => {
    const guestUser = {
      username: 'Invitado',
      isGuest: true,
      loggedInAt: new Date().toISOString(),
      token: `guest_${Date.now()}`
    };
    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(guestUser));
    return guestUser;
  },

  /**
   * Cierra la sesión activa
   */
  logout: () => {
    try {
      localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
    } catch (err) {
      console.error('[AuthService] Error cerrando sesión:', err);
    }
  }
};
