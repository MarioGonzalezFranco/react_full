import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('ap_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
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
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────
export const authApi = {
  login:  (data)    => api.post('/auth/login', data),
  me:     ()        => api.get('/auth/me'),
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
