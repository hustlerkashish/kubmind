import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kubemind_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach active project tab connection credentials if present
    try {
      const activeId = localStorage.getItem('kubemind_active_project_id');
      const savedProjects = localStorage.getItem('kubemind_projects');
      if (activeId && savedProjects) {
        const projects = JSON.parse(savedProjects);
        const activeProj = Array.isArray(projects) ? projects.find((p: any) => p.id === activeId) : null;
        if (activeProj) {
          if (activeProj.githubToken) config.headers['X-Target-Github-Token'] = activeProj.githubToken;
          if (activeProj.githubRepos) config.headers['X-Target-Repos'] = activeProj.githubRepos;
          if (activeProj.k8sUrl) config.headers['X-Target-K8s-Url'] = activeProj.k8sUrl;
          if (activeProj.k8sToken) config.headers['X-Target-K8s-Token'] = activeProj.k8sToken;
          if (activeProj.prometheusUrl) config.headers['X-Target-Prometheus-Url'] = activeProj.prometheusUrl;
          if (activeProj.grafanaUrl) config.headers['X-Target-Grafana-Url'] = activeProj.grafanaUrl;
          if (activeProj.grafanaApiKey) config.headers['X-Target-Grafana-Key'] = activeProj.grafanaApiKey;
        }
      }
    } catch {
      // Ignore interceptor JSON error
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 403 Forbidden — JWT missing, expired, or invalid → redirect to login
    if (error.response && error.response.status === 403) {
      const isAuthEndpoint =
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh');
      if (!isAuthEndpoint) {
        localStorage.removeItem('kubemind_access_token');
        localStorage.removeItem('kubemind_refresh_token');
        localStorage.removeItem('kubemind_user');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('kubemind_refresh_token');

      if (!refreshToken) {
        localStorage.removeItem('kubemind_access_token');
        localStorage.removeItem('kubemind_user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        if (data.success && data.data?.accessToken) {
          const newAccessToken = data.data.accessToken;
          localStorage.setItem('kubemind_access_token', newAccessToken);
          apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
          processQueue(null, newAccessToken);
          originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('kubemind_access_token');
        localStorage.removeItem('kubemind_refresh_token');
        localStorage.removeItem('kubemind_user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
