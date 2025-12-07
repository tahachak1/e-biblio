import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FilterBar } from '../components/orders/FilterBar';
import { DataTable } from '../components/orders/DataTable';
import api from '../services/api';
import { toast } from 'sonner';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'canceled' | string;

export type OrderItem = {
  book?: {
    title?: string;
    author?: string;
    image?: string;
  };
  quantity?: number;
  type?: string;
  price?: number;
};

export type Order = {
  _id: string;
  orderNumber?: string;
  items?: OrderItem[];
  totalAmount?: number;
  status: OrderStatus;
  createdAt?: string;
  paymentMethod?: string;
  shippingAddress?: {
    name?: string;
  };
};

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'amount-asc' | 'amount-desc'>('recent');

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await api.get('/orders');
        const list = Array.isArray(response.data) ? response.data : [];
        setOrders(list);
      } catch (error) {
        console.error(error);
        toast.error("Impossible de charger les commandes");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const filtered = orders.filter((order) => {
      const target = `${order.orderNumber || ''} ${order.shippingAddress?.name || ''} ${(order.items || [])
        .map((i) => i.book?.title || '')
        .join(' ')}`.toLowerCase();
      const matchesSearch = !searchTerm || target.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'amount-asc') return (a.totalAmount || 0) - (b.totalAmount || 0);
      if (sortBy === 'amount-desc') return (b.totalAmount || 0) - (a.totalAmount || 0);
      return (new Date(b.createdAt || '').getTime() || 0) - (new Date(a.createdAt || '').getTime() || 0);
    });
  }, [orders, searchTerm, statusFilter, sortBy]);

  const stats = useMemo(() => {
    const total = orders.length;
    const completed = orders.filter((o) => o.status === 'completed' || o.status === 'delivered').length;
    const pending = orders.filter((o) => o.status === 'pending' || o.status === 'processing' || o.status === 'shipped').length;
    return { total, completed, pending };
  }, [orders]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500">Overview of all customer orders</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-3xl font-semibold text-slate-900 mt-2">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Completed</p>
              <p className="text-3xl font-semibold text-emerald-600 mt-2">{stats.completed}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Pending</p>
              <p className="text-3xl font-semibold text-amber-600 mt-2">{stats.pending}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6 space-y-6">
            <FilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-slate-900">Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable orders={filteredOrders} loading={loading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
