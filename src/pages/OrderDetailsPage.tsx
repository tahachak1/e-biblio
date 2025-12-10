import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, MapPin, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { StatusBadge } from '../components/orders/StatusBadge';
import { DownloadInvoiceButton } from '../components/orders/DownloadInvoiceButton';
import api from '../services/api';
import { toast } from 'sonner';
import type { OrderStatus } from './OrdersPage';

type OrderItem = {
  _id?: string;
  book?: {
    title?: string;
    author?: string;
    image?: string;
  };
  title?: string;
  quantity?: number;
  type?: string;
  price?: number;
};

type OrderDetail = {
  _id: string;
  orderNumber?: string;
  numero?: string;
  items?: OrderItem[];
  totalAmount?: number;
  status: OrderStatus;
  createdAt?: string;
  paymentMethod?: string;
  shippingAddress?: {
    name?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    email?: string;
  };
};

const formatCurrency = (value: number = 0) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(value);

const formatDate = (value?: string) => {
  if (!value) return '-';
  const dateObj = new Date(value);
  if (Number.isNaN(dateObj.getTime())) return '-';
  return dateObj.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
};

const OrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await api.orders.getOrder(id);
        setOrder(data);
      } catch (error) {
        console.error(error);
        toast.error('Impossible de charger la commande');
        navigate('/orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-500">Chargement de la commande...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-slate-700 text-lg">Commande introuvable</p>
          <Button onClick={() => navigate('/orders')} className="bg-blue-600 hover:bg-blue-700">
            Retour aux commandes
          </Button>
        </div>
      </div>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/orders')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <p className="text-sm text-slate-500">Commande</p>
              <h1 className="text-2xl font-semibold text-slate-900">#{order.orderNumber || order.numero || order._id}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            <DownloadInvoiceButton orderId={order._id} />
          </div>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-slate-900">Résumé</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Articles</p>
                <p className="text-base font-semibold text-slate-900">{items.length} produit(s)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Montant</p>
                <p className="text-base font-semibold text-slate-900">{formatCurrency(order.totalAmount || subtotal)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Date</p>
                <p className="text-base font-semibold text-slate-900">{formatDate(order.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-slate-900">Articles</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-slate-700 uppercase text-xs tracking-wide">
                  <tr className="border-b border-slate-200">
                    <th className="px-5 py-3 text-left font-medium">Produit</th>
                    <th className="px-5 py-3 text-center font-medium">Quantité</th>
                    <th className="px-5 py-3 text-right font-medium">Prix</th>
                    <th className="px-5 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.length ? (
                    items.map((item, idx) => {
                      const title = item.book?.title || item.title || `Article ${idx + 1}`;
                      const qty = Number(item.quantity || 1);
                      const price = Number(item.price || 0);
                      return (
                        <tr key={item._id || `${title}-${idx}`} className="hover:bg-slate-50">
                          <td className="px-5 py-4">
                            <div className="font-medium text-slate-900">{title}</div>
                            <div className="text-xs text-slate-500">
                              {item.book?.author ? `par ${item.book.author}` : item.type || 'Produit'}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center text-slate-700">{qty}</td>
                          <td className="px-5 py-4 text-right text-slate-700">{formatCurrency(price)}</td>
                          <td className="px-5 py-4 text-right font-semibold text-slate-900">
                            {formatCurrency(price * qty)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="px-5 py-6 text-center text-slate-500" colSpan={4}>
                        Aucun article
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-slate-900">Totaux</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span>Sous-total</span>
                  <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span>Taxes</span>
                  <span className="font-medium text-slate-900">{formatCurrency(Math.max(0, (order.totalAmount || subtotal) - subtotal))}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span>Livraison</span>
                  <span className="font-medium text-slate-900">{formatCurrency(0)}</span>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{formatCurrency(order.totalAmount || subtotal)}</span>
                </div>
                <div className="pt-2 text-sm text-slate-600 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-slate-500" />
                  Paiement: {order.paymentMethod || '—'}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-slate-900">Adresse de facturation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">{order.shippingAddress?.name || 'Client'}</p>
                {order.shippingAddress?.address && <p>{order.shippingAddress.address}</p>}
                {(order.shippingAddress?.city || order.shippingAddress?.postalCode) && (
                  <p>
                    {order.shippingAddress.city || ''} {order.shippingAddress.postalCode || ''}
                  </p>
                )}
                {order.shippingAddress?.country && <p>{order.shippingAddress.country}</p>}
                {order.shippingAddress?.email && <p className="text-slate-500">{order.shippingAddress.email}</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
