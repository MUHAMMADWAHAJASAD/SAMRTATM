import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (username, password) => api.post('/auth/login', { username, password }),
};

export const atmService = {
  getAtms: () => api.get('/atm/list'),
  getAtmStatus: (id) => api.get(`/atm/status/${id}`),
  getPrediction: (id) => api.get(`/atm/predict/${id}`),
  getRefillPlan: () => api.get('/atm/refill-plan'),
};

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getAlerts: () => api.get('/alerts'),
  getLogs: () => api.get('/logs'),
  simulateTraffic: () => api.post('/atm/simulate-transactions'),
};

export const refillService = {
  dispatch: () => api.post('/atm/refill/dispatch'),
  getStatus: () => api.get('/atm/refill/status'),
  complete: () => api.post('/atm/refill/complete'),
};

export const analysisService = {
  getAnalysis: (id) => api.get(`/analysis/${id}`),
  getPatterns: () => api.get('/analysis/patterns/all'),
  getClusters: () => api.get('/analysis/clusters/all'),
  getAnomalies: () => api.get('/analysis/anomalies/all'),
};

export const eventsService = {
  getUpcoming: () => api.get('/events/upcoming'),
  getManagementPlan: () => api.get('/events/management-plan'),
  scheduleEvent: (eventId) => api.post(`/events/schedule/${eventId}`),
};

export default api;
