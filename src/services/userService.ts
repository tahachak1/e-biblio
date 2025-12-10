import api from './api';

export interface Address {
  rue?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
}

export interface UserStats {
  totalCommandes?: number;
  totalDepense?: number;
  livresAchetes?: number;
  livresLoues?: number;
  totalDepenseFormatted?: string;
}

export interface UserProfile {
  _id: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  avatar?: string;
  role?: string;
  status?: string;
  stats?: UserStats;
  address?: Address;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
}

export interface PaymentMethod {
  _id: string;
  type: 'carte' | 'paypal';
  brand?: string;
  last4?: string;
  isDefault?: boolean;
  status?: string;
  expiresAt?: string;
  cardholderName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  bookId: string;
  title: string;
  author: string;
  type: string;
  quantity: number;
  price: number;
  total: number;
  bookType?: string;
  image?: string;
  rentalDurationDays?: number;
  rentalStartAt?: string;
  rentalEndAt?: string;
  pdfUrl?: string;
  book?: {
    title?: string;
    author?: string;
    image?: string;
    pdfUrl?: string;
    type?: string;
  };
}

export interface OrderSummary {
  _id: string;
  number?: string;
  status?: string;
  total?: number;
  totalAmount?: number;
  subtotal?: number;
  shipping?: number;
  taxes?: number;
  placedAt?: string;
  createdAt?: string;
  items: OrderItem[];
}

const extractUser = (payload: any): UserProfile | null => {
  if (!payload) return null;
  const data = payload.user ?? payload;
  if (!data?._id) return data;
  return {
    ...data,
    id: data._id,
  };
};

export const userService = {
  async getProfile(): Promise<UserProfile | null> {
    const { data } = await api.get('/users/me');
    return extractUser(data);
  },

  async updateProfile(payload: Record<string, unknown>): Promise<UserProfile | null> {
    const { data } = await api.patch('/users/me', payload);
    return extractUser(data);
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await api.patch('/users/me/password', { oldPassword, newPassword });
  },

  async deleteAccount(): Promise<void> {
    await api.delete('/users/me');
  },

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const { data } = await api.get('/payment-methods');
    return data;
  },

  async addPaymentMethod(payload: Record<string, unknown>): Promise<PaymentMethod> {
    const { data } = await api.post('/payment-methods', payload);
    return data;
  },

  async removePaymentMethod(id: string): Promise<void> {
    await api.delete(`/payment-methods/${id}`);
  },

  async setDefaultPaymentMethod(id: string): Promise<PaymentMethod> {
    const { data } = await api.patch(`/payment-methods/${id}/default`);
    return data;
  },

  async getOrders(): Promise<OrderSummary[]> {
    const { data } = await api.get('/orders');
    return data;
  },

  async getOrderSummary(): Promise<{
    totalOrders: number;
    totalAmount: number;
    booksBought: number;
    booksRented: number;
  }> {
    const { data } = await api.get('/orders/summary');
    return data;
  },

  async getAdminOrderSummary(): Promise<{
    totalOrders: number;
    totalAmount: number;
    booksBought: number;
    booksRented: number;
    ordersToday?: number;
    amountToday?: number;
  }> {
    const { data } = await api.get('/orders/admin-summary');
    return data;
  },
};
