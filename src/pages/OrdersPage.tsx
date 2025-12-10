import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../ui/badge';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Progress } from '../../ui/progress';
import { Eye, X, Truck, CalendarDays } from 'lucide-react';
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
  shippingTracking?: {
    number?: string;
    carrier?: string;
    status?: string;
    eta?: string;
    history?: { status?: string; message?: string; updatedAt?: string }[];
  };
};

const stageMap = ['processing', 'shipped', 'delivered'];
const stageLabel: Record<string, string> = {
  processing: 'En préparation',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  completed: 'Livrée',
  pending: 'Confirmée',
  cancelled: 'Annulée',
  canceled: 'Annulée',
};

const statusTone: Record<string, string> = {
  pending: 'bg-blue-100 text-blue-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
  canceled: 'bg-red-100 text-red-600',
};

const formatCurrency = (value: number = 0) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

const formatDate = (value?: string) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR');
};

function computeProgress(status: string) {
  const idx = stageMap.indexOf(status);
  if (idx === -1) {
    if (status === 'pending') return 20;
    if (status === 'delivered' || status === 'completed') return 100;
    if (status === 'shipped') return 66;
    return 33;
  }
  return Math.round(((idx + 1) / stageMap.length) * 100);
}

function stageColor(current: string, target: string) {
  if (current === target) return 'text-blue-700 font-semibold';
  const currentIdx = stageMap.indexOf(current);
  const targetIdx = stageMap.indexOf(target);
  if (currentIdx > targetIdx) return 'text-blue-600';
  return 'text-slate-400';
}

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'completed' | 'cancelled'>('active');

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await api.get('/orders');
        setOrders(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error(error);
        toast.error("Impossible de charger les commandes");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const stats = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter((o) => ['delivered', 'completed'].includes(o.status)).length;
    const cancelled = orders.filter((o) => ['cancelled', 'canceled'].includes(o.status)).length;
    const active = total - delivered - cancelled;
    return { total, delivered, cancelled, active };
  }, [orders]);

  const filtered = useMemo(() => {
    if (tab === 'completed') return orders.filter((o) => ['delivered', 'completed'].includes(o.status));
    if (tab === 'cancelled') return orders.filter((o) => ['cancelled', 'canceled'].includes(o.status));
    return orders.filter((o) => !['delivered', 'completed', 'cancelled', 'canceled'].includes(o.status) || o.status === 'shipped' || o.status === 'processing');
  }, [orders, tab]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex justify-center">
      <div className="w-full max-w-[1040px] px-4 md:px-6 lg:px-10 py-10">
        <div className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(34,50,84,0.08)] border border-black/5 p-6 md:p-8 space-y-6">
          <div>
            <h1 className="text-[30px] leading-9 tracking-[0.4px] font-normal text-[#101828]">
              Mes Commandes
            </h1>
            <p className="text-base text-[#4A5565] -mt-1">Suivez vos commandes et gérez vos livraisons</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            <Card className="shadow-lg border border-black/10 rounded-[14px] bg-white w-full">
              <CardContent className="p-6">
                <p className="text-sm text-[#0A0A0A] font-medium">Total Commandes</p>
                <p className="text-3xl font-bold text-[#0A0A0A] mt-3">{stats.total}</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg border border-black/10 rounded-[14px] bg-white w-full">
              <CardContent className="p-6">
                <p className="text-sm text-[#0A0A0A] font-medium">En cours</p>
                <p className="text-3xl font-bold text-[#155DFC] mt-3">{stats.active}</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg border border-black/10 rounded-[14px] bg-white w-full">
              <CardContent className="p-6">
                <p className="text-sm text-[#0A0A0A] font-medium">Livrées</p>
                <p className="text-3xl font-bold text-[#00A63E] mt-3">{stats.delivered}</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg border border-black/10 rounded-[14px] bg-white w-full">
              <CardContent className="p-6">
                <p className="text-sm text-[#0A0A0A] font-medium">Annulées</p>
                <p className="text-3xl font-bold text-[#E7000B] mt-3">{stats.cancelled}</p>
              </CardContent>
            </Card>
          </div>

          <div className="inline-flex items-center rounded-[14px] bg-[#ECECF0] p-1 gap-1 text-sm font-medium">
            {[
              { key: 'active', label: `En cours (${stats.active})` },
              { key: 'completed', label: `Terminées (${stats.delivered})` },
              { key: 'cancelled', label: `Annulées (${stats.cancelled})` },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as any)}
                className={`px-4 py-2 rounded-[14px] transition ${
                  tab === t.key
                    ? 'bg-white text-[#0A0A0A] shadow-sm'
                    : 'text-[#0A0A0A] hover:bg-white/70'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="w-full text-center py-12 text-slate-500">Chargement des commandes…</div>
          ) : filtered.length === 0 ? (
            <div className="w-full text-center py-12 text-slate-500">Aucune commande.</div>
          ) : (
            <div className="space-y-6 w-full max-w-[1040px] mx-auto px-2">
              {filtered.map((order) => {
                const progress = computeProgress(order.status);
                return (
                  <Card
                    key={order._id}
                    className="border border-black/10 shadow-lg rounded-[14px] bg-white w-full"
                  >
                    <CardContent className="px-6 py-6 space-y-6 w-full">
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <p className="text-[18px] leading-[28px] tracking-[-0.44px] text-[#0A0A0A]">
                            Commande {order.orderNumber || order._id}
                          </p>
                          <p className="text-sm text-[#4A5565]">
                            Passée le {formatDate(order.createdAt)} • {formatCurrency(order.totalAmount || 0)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`capitalize rounded-lg px-3 py-1 ${statusTone[order.status] || 'bg-slate-100 text-slate-700'}`}>
                            {stageLabel[order.status] || order.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg border border-black/10 text-[#0A0A0A] px-3"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Détails
                          </Button>
                          {['processing', 'pending'].includes(order.status) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg border border-[#E7000B33] text-[#E7000B] px-3 hover:bg-red-50"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Annuler
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 w-full">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-[#0A0A0A]">Progression</p>
                          <span className="text-sm text-[#4A5565]">{progress}%</span>
                        </div>
                        <Progress
                          value={progress}
                          className="h-4 rounded-full bg-blue-100 border border-blue-200 shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)]"
                          indicatorClassName="bg-[#2563EB] shadow-[inset_0_0_0_1px_rgba(37,99,235,0.45)]"
                        />
                        <div className="flex justify-between text-xs text-[#4A5565]">
                          <span className="text-[#4A5565]">Confirmée</span>
                          <span className={stageColor(order.status, 'processing')}>En préparation</span>
                          <span className={stageColor(order.status, 'shipped')}>Expédiée</span>
                          <span className={stageColor(order.status, 'delivered')}>Livrée</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 w-full">
                        <div className="flex items-center gap-4 overflow-x-auto w-full">
                          {(order.items || []).slice(0, 3).map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 min-w-[168px] border border-slate-200 rounded-lg p-3"
                            >
                              <img
                                src={item.book?.image || 'https://dummyimage.com/64x80/edeff5/9aa2b2&text=Book'}
                                alt={item.book?.title || 'Livre'}
                                className="w-10 h-12 object-cover rounded-md"
                              />
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-[#0A0A0A] line-clamp-1">
                                  {item.book?.title || 'Article'}
                                </p>
                                <p className="text-xs text-[#4A5565]">
                                  {item.type === 'rent' || item.type === 'location' ? 'Location' : 'Achat'}
                                </p>
                                <p className="text-xs text-[#4A5565]">Qté : {item.quantity || 1}</p>
                              </div>
                            </div>
                          ))}
                          {(order.items || []).length > 3 && (
                            <div className="text-sm text-slate-500">+ {(order.items || []).length - 3} autres</div>
                          )}
                          {(order.items || []).length === 0 && (
                            <div className="text-sm text-slate-500">Aucun article</div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <Truck className="h-4 w-4 text-slate-500" />
                          <div>
                            <div className="font-medium text-slate-900">
                              Livraison {order.shippingTracking?.status === 'delivered' ? 'terminée' : 'prévue'}
                              {order.shippingTracking?.eta ? ` : ${formatDate(order.shippingTracking.eta)}` : ''}
                            </div>
                            {order.shippingTracking?.number && (
                              <div className="text-xs text-slate-500">
                                Suivi : {order.shippingTracking.number} • {order.shippingTracking?.carrier || 'eBiblio Logistics'}
                              </div>
                            )}
                          </div>
                        </div>

                        {order.shippingTracking?.eta && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <CalendarDays className="h-4 w-4 text-slate-500" />
                            Livraison prévue le {formatDate(order.shippingTracking.eta)}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
