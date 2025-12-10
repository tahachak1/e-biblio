import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { StatusBadge } from './StatusBadge';
import type { Order } from '../../pages/OrdersPage';

type Props = {
  orders: Order[];
  loading?: boolean;
};

const formatCurrency = (value: number = 0) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

const formatDate = (value?: string) => {
  if (!value) return '-';
  const dateObj = new Date(value);
  if (Number.isNaN(dateObj.getTime())) return '-';
  return dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const DataTable: React.FC<Props> = ({ orders, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="w-full py-12 text-center text-slate-500">
        Chargement des commandes...
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="w-full py-12 text-center text-slate-500">
        Aucune commande trouvée.
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-slate-200 rounded-xl bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 text-slate-700 text-xs uppercase tracking-wide">
          <tr className="border-b border-slate-200">
            <th className="px-5 py-3 text-left font-medium">Order ID</th>
            <th className="px-5 py-3 text-left font-medium">Customer</th>
            <th className="px-5 py-3 text-left font-medium">Items</th>
            <th className="px-5 py-3 text-left font-medium">Amount</th>
            <th className="px-5 py-3 text-left font-medium">Status</th>
            <th className="px-5 py-3 text-left font-medium">Date</th>
            <th className="px-5 py-3 text-left font-medium">Payment</th>
            <th className="px-5 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {orders.map((order) => (
            <tr key={order._id} className="hover:bg-slate-50 transition-colors">
              <td className="px-5 py-4 font-semibold text-slate-900">
                #{order.orderNumber || order._id.slice(-6).toUpperCase()}
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-900">{order.shippingAddress?.name || 'Client'}</span>
                </div>
              </td>
              <td className="px-5 py-4 text-slate-700">
                {(order.items || []).length} item{(order.items || []).length > 1 ? 's' : ''}
              </td>
              <td className="px-5 py-4 font-semibold text-slate-900">
                {formatCurrency(order.totalAmount || 0)}
              </td>
              <td className="px-5 py-4">
                <StatusBadge status={order.status} />
              </td>
              <td className="px-5 py-4 text-slate-700">{formatDate(order.createdAt)}</td>
              <td className="px-5 py-4 text-slate-700">{order.paymentMethod || 'N/A'}</td>
              <td className="px-5 py-4 text-right">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-200"
                  onClick={() => navigate(`/orders/${order._id}`)}
                >
                  View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
