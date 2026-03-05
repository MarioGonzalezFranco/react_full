import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ap_token');
    if (!token) { setLoading(false); return; }

    // ✅ FIX: era authAPI (no existe). Debe ser authApi (como lo importas arriba)
    authApi.me()
      .then((res) => {
        // ✅ FIX: soporta axios (res.data) y también si algún día devolviera data directo
        const data = res?.data ?? res;

        if (data?.user) setUser(data.user);
        else throw new Error("Respuesta /me inválida");
      })
      .catch(() => {
        localStorage.removeItem("ap_token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username, password) => {
    // ✅ FIX: era authAPI (no existe). Debe ser authApi
    const res = await authApi.login({ username, password });
    const data = res?.data ?? res;

    // ✅ Evita el crash y te muestra un error claro
    if (!data) {
      throw new Error("La API devolvió respuesta vacía (null). Revisa Network → Response.");
    }
    if (!data.token) {
      throw new Error(data.message || "Login sin token. Revisa usuario/contraseña.");
    }

    localStorage.setItem("ap_token", data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ap_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);