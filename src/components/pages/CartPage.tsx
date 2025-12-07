import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { ArrowLeft, Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { useApp } from "../AppContext";
import { Badge } from "../ui/badge";
import { useMemo, useState, useEffect } from "react";

export function CartPage() {
  const { cart, cartLoading, updateQuantity, removeFromCart, setCurrentPage } = useApp();
  const [rentalDurations, setRentalDurations] = useState<Record<string, number>>({});

  useEffect(() => {
    // Initialiser les durées pour les livres numériques/location
    const next: Record<string, number> = {};
    cart.forEach((item) => {
      if (isDigital(item)) {
        next[item.bookId] = rentalDurations[item.bookId] || 7;
      }
    });
    setRentalDurations((prev) => ({ ...next, ...prev }));
  }, [cart]);

  const durationMultipliers: Record<number, number> = {
    7: 1,
    14: 1.8,
    30: 3,
  };

  const isDigital = (item: any) => {
    const t = (item.type || '').toString().toLowerCase();
    return item.bookType === 'numerique' || t.includes('loc') || t === 'rent' || !!item.rentPrice;
  };

  const unitPrice = (item: any) => {
    if (isDigital(item)) {
      const base = item.rentPrice || item.price || 0;
      const dur = rentalDurations[item.bookId] || 7;
      const mult = durationMultipliers[dur] || 1;
      return base * mult;
    }
    return item.price || 0;
  };

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + unitPrice(item) * item.quantity, 0),
    [cart, rentalDurations]
  );

  const handleBackToCatalog = () => {
    setCurrentPage('home');
  };

  const handleCheckout = () => {
    setCurrentPage('checkout');
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du panier...</p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Button 
              variant="outline" 
              onClick={handleBackToCatalog}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour au catalogue
            </Button>
          </div>

          <Card className="text-center py-16">
            <CardContent>
              <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl text-gray-900 mb-2">Votre panier est vide</h2>
              <p className="text-gray-600 mb-6">
                Découvrez notre catalogue et ajoutez des livres à votre panier
              </p>
              <Button 
                onClick={handleBackToCatalog}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Parcourir le catalogue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="outline" 
            onClick={handleBackToCatalog}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Continuer mes achats
          </Button>
          
          <div className="text-right">
            <h1 className="text-2xl text-gray-900">Mon Panier</h1>
            <p className="text-gray-600">{cart.length} article{cart.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <Card key={item.bookId}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="w-24 h-32 flex-shrink-0">
                      <ImageWithFallback
                        src={item.coverImage || 'https://via.placeholder.com/150x200'}
                        alt={item.title || 'Livre'}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{item.title || 'Livre'}</h3>
                          <p className="text-sm text-gray-600">{item.author || 'Auteur inconnu'}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.bookId)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-3 mt-4">
                        {isDigital(item) && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">Durée de location :</span>
                            {[7, 14, 30].map((d) => (
                              <Button
                                key={d}
                                variant={rentalDurations[item.bookId] === d ? "default" : "outline"}
                                size="sm"
                                className={rentalDurations[item.bookId] === d ? "bg-blue-600 hover:bg-blue-700" : ""}
                                onClick={() => setRentalDurations((prev) => ({ ...prev, [item.bookId]: d }))}
                              >
                                {d}j
                              </Button>
                            ))}
                            <Badge variant="outline" className="text-xs">
                              {(unitPrice(item)).toFixed(2)} $ / durée
                            </Badge>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.bookId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="h-8 w-8"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.bookId, item.quantity + 1)}
                              className="h-8 w-8"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              ${(unitPrice(item) * item.quantity).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {isDigital(item) ? 'Tarif selon durée' : `$${unitPrice(item).toFixed(2)} / unité`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Sous-total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-gray-600">
                  <span>Livraison</span>
                  <span className="text-green-600">Gratuite</span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleCheckout}
                >
                  Passer la commande
                </Button>

                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs text-green-800">
                    ✓ Livraison gratuite<br/>
                    ✓ Paiement sécurisé<br/>
                    ✓ Garantie 30 jours
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
