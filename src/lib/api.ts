import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ایجاد instance axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor برای افزودن token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor برای مدیریت خطاها
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // حذف token و redirect به صفحه login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.hash = '#/login';
    }
    return Promise.reject(error);
  }
);

export { api };
export default api;

// ==========================================
// Auth APIs
// ==========================================
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  register: (data: any) => 
    api.post('/auth/register', data),
  
  getMe: () => 
    api.get('/auth/me'),
};

// ==========================================
// Products APIs
// ==========================================
export const productsAPI = {
  getAll: (params?: any) => 
    api.get('/products', { params }),
  
  getOne: (id: string) => 
    api.get(`/products/${id}`),
  
  create: (data: any) => 
    api.post('/products', data),
  
  update: (id: string, data: any) => 
    api.put(`/products/${id}`, data),
  
  delete: (id: string) => 
    api.delete(`/products/${id}`),
  
  getLowStock: () => 
    api.get('/products/low-stock'),
};

// ==========================================
// Customers APIs
// ==========================================
export const customersAPI = {
  getAll: (params?: any) => 
    api.get('/customers', { params }),
  
  getOne: (id: string) => 
    api.get(`/customers/${id}`),
  
  create: (data: any) => 
    api.post('/customers', data),
  
  update: (id: string, data: any) => 
    api.put(`/customers/${id}`, data),
  
  delete: (id: string) => 
    api.delete(`/customers/${id}`),
};

// ==========================================
// Sales APIs
// ==========================================
export const salesAPI = {
  getAll: (params?: any) => 
    api.get('/sales', { params }),
  
  getOne: (id: string) => 
    api.get(`/sales/${id}`),
  
  create: (data: any) => 
    api.post('/sales', data),
  
  updateStatus: (id: string, data: any) => 
    api.patch(`/sales/${id}/status`, data),
  
  getStats: () => 
    api.get('/sales/stats'),
};

// ==========================================
// Dashboard APIs
// ==========================================
export const dashboardAPI = {
  getStats: () => 
    api.get('/dashboard/stats'),
};
