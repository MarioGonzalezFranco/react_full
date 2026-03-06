// ─── API client — todas las llamadas al backend ──────────

// ✅ En Render (Static Site) NO uses "/api" por defecto.
// ✅ Si no defines REACT_APP_API_URL, usará el backend directamente.
const BASE =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") ||
  "https://react-full-backend.onrender.com/api";

function getToken() {
  return localStorage.getItem("ap_token");
}

// ✅ request() robusto: no revienta si la respuesta viene vacía o no es JSON
async function request(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  // Lee como texto primero para evitar: Unexpected end of JSON input
  const text = await res.text();

  // Intenta parsear JSON si hay contenido y parece JSON
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // Si no es JSON, lo dejamos como texto para debugging
      data = { message: text };
    }
  }

  if (!res.ok) {
    throw new Error(data?.message || `Error ${res.status}`);
  }

  return data;
}

// ── Auth ────────────────────────────────────────────────
export const authAPI = {
  login: (credentials) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
  me: () => request("/auth/me"),
};

// ── Parts ───────────────────────────────────────────────
export const partsAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== "" && v !== undefined)
      )
    ).toString();
    return request(`/parts${qs ? "?" + qs : ""}`);
  },
  stats: () => request("/parts/stats"),
  get: (id) => request(`/parts/${id}`),
  create: (data) =>
    request("/parts", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    request(`/parts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateStock: (id, stock) =>
    request(`/parts/${id}/stock`, {
      method: "PATCH",
      body: JSON.stringify({ stock }),
    }),
  remove: (id) => request(`/parts/${id}`, { method: "DELETE" }),
};

// ── Categories ──────────────────────────────────────────
export const categoriesAPI = {
  list: () => request("/categories"),
};