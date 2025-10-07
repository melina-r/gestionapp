const API_URL = "http://127.0.0.1:8000";

export const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const authenticatedFetch = async (url, options = {}) => {
  try {
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers
      }
    });

    // If unauthorized or forbidden, clear localStorage and redirect to login
    if (response.status === 401 || response.status === 403) {
      console.warn('⚠️ Sesión inválida o expirada. Redirigiendo al login...');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/';
      return response;
    }

    // Si la petición fue exitosa, limpiar contador de intentos fallidos
    if (response.ok) {
      localStorage.removeItem('failed_fetch_attempts');
    }

    return response;
  } catch (error) {
    // Si hay error de red (backend caído, etc), verificar si hay token
    // Si hay token pero no hay conexión, puede ser que el backend esté caído
    console.error('❌ Error de conexión:', error);

    // Si el error es de red y hay un token, podría ser backend caído
    if (error.message === 'Failed to fetch' && localStorage.getItem('access_token')) {
      console.warn('⚠️ No se puede conectar al backend. El token puede estar obsoleto.');
      // Opcional: limpiar después de varios intentos fallidos
      const failedAttempts = parseInt(localStorage.getItem('failed_fetch_attempts') || '0');
      if (failedAttempts >= 2) {
        console.warn('⚠️ Múltiples intentos fallidos. Limpiando sesión...');
        localStorage.clear();
        window.location.href = '/';
      } else {
        localStorage.setItem('failed_fetch_attempts', (failedAttempts + 1).toString());
      }
    }

    throw error;
  }
};

export const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  window.location.href = '/';
};
