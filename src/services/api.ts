import axios from 'axios';
import { toast } from 'sonner';

// Base Axios instance
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3001/api',
  withCredentials: true,
});

// Intercepteur pour ajouter le token JWT à chaque requête
http.interceptors.request.use(
  (config) => {
    config.headers = config.headers || {};
    config.headers.Accept = 'application/json';

    if (typeof config.data !== 'undefined' && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs de réponse
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (!error.response || status >= 500) {
      console.error('Service indisponible ou microservice en erreur', error);
      toast.error('Service indisponible : un microservice ne répond pas. Réessayez plus tard.');
    }
    return Promise.reject(error);
  }
);

// Exposer des helpers API cohérents
const api: any = http;

api.auth = {
  login: async (payload: any) => (await http.post('/auth/login', payload)).data,
  register: async (payload: any) => (await http.post('/auth/register', payload)).data,
  logout: async () => (await http.post('/auth/logout')).data,
  getProfile: async () => (await http.get('/users/me')).data,
};

api.books = {
  getBooks: async (params?: any) => (await http.get('/books', { params })).data,
  getBook: async (id: string) => (await http.get(`/books/${id}`)).data,
};

api.cart = {
  getCart: async () => (await http.get('/cart')).data,
  addToCart: async (payload: any) => (await http.post('/cart', payload)).data,
  updateCartItem: async (bookId: string, quantity: number) => (await http.patch(`/cart/${bookId}`, { quantity })).data,
  removeFromCart: async (bookId: string) => (await http.delete(`/cart/${bookId}`)).data,
  clearCart: async () => (await http.delete('/cart')).data,
};

api.orders = {
  getOrders: async () => (await http.get('/orders')).data,
  createOrder: async (payload: any) => (await http.post('/orders', payload)).data,
  getAdminSummary: async () => (await http.get('/orders/admin-summary')).data,
};

api.chatbot = {
  ask: async (payload: { messages: any[]; model?: string; temperature?: number }) =>
    (await http.post('/chatbot', payload)).data,
};

api.admin = {
  getStats: async () => (await http.get('/admin/stats')).data,
  getUsers: async () => (await http.get('/admin/users')).data,
  createUser: async (payload: any) => (await http.post('/admin/users', payload)).data,
  updateUser: async (id: string, payload: any) => (await http.patch(`/admin/users/${id}`, payload)).data,
  deleteUser: async (id: string) => (await http.delete(`/admin/users/${id}`)).data,
  getOrders: async () => (await http.get('/admin/orders')).data,
  updateOrderStatus: async (id: string, status: string) => (await http.patch(`/admin/orders/${id}/status`, { status })).data,
  getCategories: async () => (await http.get('/categories')).data,
  createCategory: async (payload: any) => (await http.post('/categories', payload)).data,
  updateCategory: async (id: string, payload: any) => (await http.patch(`/categories/${id}`, payload)).data,
  deleteCategory: async (id: string) => (await http.delete(`/categories/${id}`)).data,
  createBook: async (payload: any) => (await http.post('/books', payload)).data,
  updateBook: async (id: string, payload: any) => (await http.put(`/books/${id}`, payload)).data,
  deleteBook: async (id: string) => (await http.delete(`/books/${id}`)).data,
};

export default api;
