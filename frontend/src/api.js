// ─── API client — todas las llamadas al backend ──────────

const BASE = process.env.REACT_APP_API_URL || "/api";

function getToken() {
  return localStorage.getItem("ap_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Error del servidor");
  return data;
}

// ── Auth ────────────────────────────────────────────────
export const authAPI = {
  login:  (credentials) => request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  me:     ()             => request("/auth/me"),
};

// ── Parts ───────────────────────────────────────────────
export const partsAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== undefined))
    ).toString();
    return request(`/parts${qs ? "?" + qs : ""}`);
  },
  stats:       ()         => request("/parts/stats"),
  get:         (id)       => request(`/parts/${id}`),
  create:      (data)     => request("/parts",    { method: "POST",   body: JSON.stringify(data) }),
  update:      (id, data) => request(`/parts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateStock: (id, stock) => request(`/parts/${id}/stock`, { method: "PATCH", body: JSON.stringify({ stock }) }),
  remove:      (id)       => request(`/parts/${id}`, { method: "DELETE" }),
};

// ── Categories ──────────────────────────────────────────
export const categoriesAPI = {
  list: () => request("/categories"),
};
