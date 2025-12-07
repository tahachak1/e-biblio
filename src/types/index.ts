// Types pour l'application e-Biblio basés sur le backend BookSphere

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  mustChangePassword?: boolean;
}

export interface Book {
  _id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  coverImage: string;
  category: string;
  stock: number;
  type?: 'papier' | 'numerique';
}

export interface CartItem {
  bookId: string;
  quantity: number;
  price: number;
  // Informations du livre (ajoutées côté client)
  title?: string;
  author?: string;
  coverImage?: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export interface Order {
  _id: string;
  items: {
    bookId: string;
    quantity: number;
    price: number;
    title?: string;
    coverImage?: string;
  }[];
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalBooks: number;
  totalOrders: number;
  totalRevenue: number;
  ordersToday?: number;
}

export interface Notification {
  _id: string;
  message: string;
  read: boolean;
  createdAt: string;
  type?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface BooksResponse {
  books: Book[];
  total: number;
  page: number;
  totalPages?: number;
}

export interface ApiError {
  success: false;
  message: string;
}
