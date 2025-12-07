import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useCart } from '../contexts/CartContext';

const formatCurrency = (value: number = 0) =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(value);

export const Cart: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-24 h-24 mx-auto mb-4 opacity-50" style={{ color: '#374151' }} />
          <h2 className="text-2xl mb-4" style={{ color: '#374151' }}>
            Votre panier est vide
          </h2>
          <Link to="/catalogue">
            <Button style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}>
              Découvrir nos livres
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl mb-8" style={{ color: '#2563EB' }}>
          Mon Panier ({totalItems} article{totalItems > 1 ? 's' : ''})
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Liste des articles */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="w-24 h-32 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Détails */}
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <div>
                        <h3 className="mb-1" style={{ color: '#374151' }}>
                          {item.title}
                        </h3>
                        <p className="text-sm opacity-75" style={{ color: '#374151' }}>
                          {item.author}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="hover:opacity-80"
                      >
                        <Trash2 className="w-5 h-5" style={{ color: '#374151' }} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center border"
                          style={{ borderColor: '#2563EB', color: '#2563EB' }}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span style={{ color: '#374151' }}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-sm opacity-75" style={{ color: '#374151' }}>
                          {item.type === 'rent' ? 'Location' : 'Achat'}
                        </p>
                        <p className="text-xl" style={{ color: item.type === 'rent' ? '#10B981' : '#2563EB' }}>
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Récapitulatif */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-2xl mb-6" style={{ color: '#374151' }}>
                Récapitulatif
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span style={{ color: '#374151' }}>Sous-total</span>
                  <span style={{ color: '#374151' }}>{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#374151' }}>Livraison</span>
                  <span style={{ color: totalPrice >= 25 ? '#10B981' : '#374151' }}>
                    {totalPrice >= 25 ? 'Gratuite' : formatCurrency(4.99)}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-xl" style={{ color: '#374151' }}>Total</span>
                  <span className="text-2xl" style={{ color: '#2563EB' }}>
                    {formatCurrency(totalPrice + (totalPrice >= 25 ? 0 : 4.99))}
                  </span>
                </div>
              </div>

              {totalPrice < 25 && (
                <div className="mb-6 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm" style={{ color: '#374151' }}>
                    Plus que {formatCurrency(25 - totalPrice)} pour la livraison gratuite !
                  </p>
                </div>
              )}

              <Button
                onClick={() => navigate('/checkout')}
                className="w-full flex items-center justify-center gap-2 mb-3"
                style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
              >
                Procéder au paiement
                <ArrowRight className="w-5 h-5" />
              </Button>

              <Link to="/catalogue">
                <Button
                  variant="outline"
                  className="w-full"
                  style={{ borderColor: '#2563EB', color: '#2563EB' }}
                >
                  Continuer mes achats
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
