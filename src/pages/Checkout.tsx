import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, User as UserIcon, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';

const formatCurrency = (value: number = 0) =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(value);

export const Checkout: React.FC = () => {
  const { cart, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderSummary, setOrderSummary] = useState<any | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string>('');
  const [paying, setPaying] = useState(false);
  const paymentActionRef = useRef<() => Promise<boolean>>(async () => false);
  const registerPaymentAction = useCallback((fn: () => Promise<boolean>) => {
    paymentActionRef.current = fn;
  }, []);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    address: '',
    city: '',
    postalCode: '',
    country: 'France',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCVV: '',
  });

  const shippingCost = totalPrice >= 25 ? 0 : 4.99;
  const total = totalPrice + shippingCost;

  const stripePromise = useMemo(() => {
    const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!pk) {
      console.warn('[Stripe] VITE_STRIPE_PUBLISHABLE_KEY manquante');
      return null;
    }
    return loadStripe(pk);
  }, []);

  const initPaymentIntent = async () => {
    if (!stripePromise) return;
    if (total <= 0) return;
    setStripeError('');
    setStripeLoading(true);
    try {
      const { clientSecret: secret } = await api.post('/payments/intent', {
        amount: total,
        currency: 'usd',
        description: `Commande e-Biblio - ${user?.email || 'client'}`,
      }).then((res) => res.data);
      setClientSecret(secret);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Impossible d’initialiser Stripe';
      setStripeError(msg);
      toast.error(msg);
    } finally {
      setStripeLoading(false);
    }
  };

  useEffect(() => {
    initPaymentIntent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientSecret) {
      toast.error("Paiement non initialisé");
      return;
    }

    if (paymentActionRef.current) {
      setLoading(true);
      const ok = await paymentActionRef.current();
      setLoading(false);
      if (!ok) return;
    }

    setLoading(true);

    try {
      const orderData = {
        items: cart.map((item) => ({
          bookId: item.id.split('-')[0],
          quantity: item.quantity || 1,
          type: item.type,
        })),
        shippingAddress: {
          name: formData.name,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
        },
        totalAmount: totalPrice + (totalPrice >= 25 ? 0 : 4.99),
      };

      const { data: createdOrder } = await api.post('/orders', orderData);

      clearCart();
      setOrderSummary(createdOrder);
      setSuccess(true);
      toast.success('Commande passée avec succès !');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la commande');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
    }
  }, [cart.length, navigate]);

  if (cart.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl mx-4 rounded-3xl shadow-2xl p-8 md:p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 pointer-events-none" />
            <div className="relative space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-200/70">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-semibold text-slate-900">Paiement reçu, merci !</h2>
              <p className="text-slate-600">Votre commande est confirmée.</p>
              {orderSummary && (
                <div className="mt-4 space-y-3 text-left bg-white/80 border border-slate-100 rounded-2xl p-4">
                  <p className="text-sm text-slate-500">Commande #{orderSummary.orderNumber || orderSummary.numero}</p>
                  <p className="text-lg font-semibold text-slate-900">
                    Total : {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(orderSummary.totalAmount || total)}
                  </p>
                  <div className="space-y-2">
                    {(orderSummary.items || []).map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm text-slate-700">
                        <span>{item.book?.title || 'Livre'} · {item.quantity || 1}x</span>
                        <span>{new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(item.price || 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate('/orders')} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                  Voir mes commandes
                </Button>
                <Button variant="outline" onClick={() => { setSuccess(false); navigate('/'); }}>
                  Retour à l'accueil
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl mb-8" style={{ color: '#2563EB' }}>
          Finaliser la commande
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulaire */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informations personnelles */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-6">
                  <UserIcon className="w-6 h-6" style={{ color: '#2563EB' }} />
                  <h2 className="text-2xl" style={{ color: '#374151' }}>
                    Informations personnelles
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nom complet</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                </div>
              </div>

              {/* Adresse de livraison */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-6">
                  <MapPin className="w-6 h-6" style={{ color: '#10B981' }} />
                  <h2 className="text-2xl" style={{ color: '#374151' }}>
                    Adresse de livraison
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Adresse</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">Ville</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Code postal</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="country">Pays</Label>
                    <Input
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Paiement */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-6">
                  <CreditCard className="w-6 h-6" style={{ color: '#06B6D4' }} />
                  <h2 className="text-2xl" style={{ color: '#374151' }}>
                    Informations de paiement
                  </h2>
                </div>

                <div className="space-y-4">
                  {!stripePromise && (
                    <p className="text-sm text-red-600">Clé Stripe manquante (VITE_STRIPE_PUBLISHABLE_KEY)</p>
                  )}
                  {stripeError && <p className="text-sm text-red-600">{stripeError}</p>}
                  {stripePromise && clientSecret && (
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' }, locale: 'fr' }}>
                      <StripePaymentSection
                        onReady={registerPaymentAction}
                        paying={paying}
                        setPaying={setPaying}
                      />
                    </Elements>
                  )}
                  {stripeLoading && (
                    <p className="text-sm text-slate-600">Initialisation du paiement...</p>
                  )}

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm" style={{ color: '#374151' }}>
                      🔒 Paiement sécurisé - Vos informations sont protégées
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Récapitulatif */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h2 className="text-2xl mb-6" style={{ color: '#374151' }}>
                  Récapitulatif
                </h2>

                <div className="space-y-3 mb-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span style={{ color: '#374151' }}>
                        {item.title} x{item.quantity}
                      </span>
                      <span style={{ color: '#374151' }}>
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3 space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span style={{ color: '#374151' }}>Sous-total</span>
                    <span style={{ color: '#374151' }}>{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#374151' }}>Livraison</span>
                    <span style={{ color: shippingCost === 0 ? '#10B981' : '#374151' }}>
                      {shippingCost === 0 ? 'Gratuite' : formatCurrency(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-xl" style={{ color: '#374151' }}>Total</span>
                    <span className="text-2xl" style={{ color: '#2563EB' }}>
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
                >
                  <CheckCircle className="w-5 h-5" />
                  {loading ? 'Traitement...' : 'Confirmer la commande'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

type StripePaymentProps = {
  onReady: (fn: () => Promise<boolean>) => void;
  paying: boolean;
  setPaying: (v: boolean) => void;
};

function StripePaymentSection({ onReady, paying, setPaying }: StripePaymentProps) {
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    if (!stripe || !elements) return;
    onReady(async () => {
      if (!stripe || !elements) {
        toast.error("Paiement non prêt");
        return false;
      }
      setPaying(true);
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: 'if_required',
      });
      setPaying(false);
      if (error) {
        toast.error(error.message || "Paiement refusé");
        return false;
      }
      if (paymentIntent?.status === 'requires_action') {
        toast.error("Action supplémentaire requise pour ce paiement");
        return false;
      }
      toast.success("Paiement confirmé");
      return true;
    });
  }, [stripe, elements, onReady, setPaying]);

  return (
    <div className="space-y-3 p-4 bg-slate-50 rounded-lg border">
      <PaymentElement options={{ layout: 'tabs' }} />
      <p className="text-xs text-slate-500">
        Stripe gère cartes et wallets (Apple Pay / Google Pay) si disponibles.
      </p>
    </div>
  );
}
