import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const token = localStorage.getItem('ap_token');
  if (!token) { setLoading(false); return; }

 authApi.me()
  .then((res) => {
    const data = res?.data ?? res; // soporta ambas formas (axios response o data directo)
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
  const res = await authApi.login({ username, password }); // OJO: authApi (como lo exportas)
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