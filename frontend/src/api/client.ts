import axios from "axios";

const api = axios.create({ baseURL: "/" }); 

api.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// Important: don't redirect on /api/auth/login failures
api.interceptors.response.use(
  (r) => r,
  (e) => {
    const status = e?.response?.status;
    const url = e?.config?.url || "";
    if (status === 401 && !url.includes("/api/auth/login")) {
      localStorage.removeItem("token");
      // use assign to avoid history pileup
      window.location.assign("/login");
    }
    return Promise.reject(e);
  }
);

export default api;
