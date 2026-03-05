import axios from 'axios';

const api = axios.create({
  baseURL: 'https://react-full-backend.onrender.com/api',
  timeout: 10000,
});

// 🔧 ADD: log para confirmar que el client correcto se está usando
console.log("🔧 client.js cargado. baseURL =", api.defaults.baseURL);

// Attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('ap_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // 🔧 ADD: log para ver a qué URL real se está enviando la request
  const finalUrl = `${config.baseURL || ''}${config.url || ''}`;
  console.log("🔧 API REQUEST →", finalUrl, config);

  return config;
});

// Handle 401 globally → logout
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ap_token');
      window.location.href = '/';
    }

    // 🔧 ADD: log para ver la respuesta real del backend
    console.error("🔧 API ERROR →", err?.response || err);

    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────
export const authApi = {
  login:  (data)    => api.post('/auth/login', data),
  me:     ()        => api.get('/auth/me'),

  // 🔧 ADD: prueba directa absoluta al backend (para confirmar si el problema es el baseURL)
  loginDirect: (data) =>
    axios.post('https://react-full-backend.onrender.com/api/auth/login', data),
};

// ── Parts ─────────────────────────────────────────────
export const partsApi = {
  list:     (params) => api.get('/parts', { params }),
  get:      (id)     => api.get(`/parts/${id}`),
  create:   (data)   => api.post('/parts', data),
  update:   (id,data)=> api.put(`/parts/${id}`, data),
  remove:   (id)     => api.delete(`/parts/${id}`),
  movement: (id,data)=> api.post(`/parts/${id}/movement`, data),
};

// ── Users ─────────────────────────────────────────────
export const usersApi = {
  list:   ()         => api.get('/users'),
  create: (data)     => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  remove: (id)       => api.delete(`/users/${id}`),
};

// ── Stats ─────────────────────────────────────────────
export const statsApi = {
  dashboard:  ()       => api.get('/stats/dashboard'),
  movements:  (params) => api.get('/stats/movements', { params }),
  categories: ()       => api.get('/stats/categories'),
  activity:   ()       => api.get('/stats/activity'),
};