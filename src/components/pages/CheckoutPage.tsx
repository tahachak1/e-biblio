import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ArrowLeft, Check, CreditCard, Truck, ShoppingBag, Wallet } from "lucide-react";
import { useApp } from "../AppContext";
import { Badge } from "../ui/badge";
import { toast } from "sonner@2.0.3";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import api from "../../services/api";

export function CheckoutPage() {
  const { cart, setCurrentPage, addOrder, clearCart, user } = useApp();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Shipping form
  const [shippingData, setShippingData] = useState({
    nom: "",
    prenom: "",
    adresse: "",
    ville: "",
    codePostal: ""
  });

  // Pré-remplir nom/prénom avec l'utilisateur connecté
  useEffect(() => {
    if (!user) return;
    setShippingData((prev) => ({
      ...prev,
      nom: prev.nom || user.lastName || "",
      prenom: prev.prenom || user.firstName || "",
    }));
  }, [user]);

  // Payment method
  const [clientSecret, setClientSecret] = useState<string>("");
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string>("");
  const [paying, setPaying] = useState(false);
  const paymentActionRef = useRef<() => Promise<boolean>>(async () => false);
  const registerPaymentAction = useCallback((fn: () => Promise<boolean>) => {
    paymentActionRef.current = fn;
  }, []);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleBackToCart = () => {
    setCurrentPage('cart');
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      // Validate shipping form
      if (!shippingData.nom || !shippingData.prenom || !shippingData.adresse || !shippingData.ville || !shippingData.codePostal) {
        toast.error("Veuillez remplir tous les champs obligatoires");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      await handlePaymentStep();
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleConfirmOrder = () => {
    // Create order
    const order = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      montant: total,
      statut: 'en attente' as const,
      items: cart
    };

    addOrder(order);
    clearCart();
    setCurrentPage('confirmation');
    toast.success("Commande confirmée avec succès !");
  };

  const steps = [
    { id: 1, name: "Livraison", icon: Truck },
    { id: 2, name: "Paiement", icon: CreditCard },
    { id: 3, name: "Confirmation", icon: Check }
  ];

  const stripePromise = useMemo(() => {
    const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!pk) {
      console.warn("[Stripe] VITE_STRIPE_PUBLISHABLE_KEY manquant");
      return null;
    }
    return loadStripe(pk);
  }, []);

  useEffect(() => {
    if (currentStep !== 2) return;
    if (!stripePromise) {
      toast.error("Clé Stripe manquante côté frontend");
      return;
    }
    if (clientSecret || stripeLoading) return;
    createPaymentIntent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, stripePromise]);

  const createPaymentIntent = async () => {
    if (total <= 0) {
      toast.error("Montant invalide");
      return;
    }
    setStripeError("");
    setStripeLoading(true);
    try {
      const { paymentIntentId, clientSecret: secret } = await api.post('/payments/intent', {
        amount: total,
        currency: 'usd',
        description: `Commande e-Biblio - ${user?.email || 'client'}`,
      }).then(res => res.data);
      if (secret) {
        setClientSecret(secret);
      }
      console.info("[Stripe] PaymentIntent créé", paymentIntentId);
    } catch (err: any) {
      console.error(err);
      const message = err.response?.data?.detail || "Impossible d'initialiser le paiement";
      setStripeError(message);
      toast.error(message);
    } finally {
      setStripeLoading(false);
    }
  };

  const handlePaymentStep = async () => {
    if (!stripePromise) {
      toast.error("Stripe non configuré");
      return;
    }
    if (!clientSecret) {
      toast.error("Initialisation du paiement en cours, réessayez.");
      return;
    }
    if (!paymentActionRef.current) {
      toast.error("Module de paiement non prêt, patientez une seconde.");
      return;
    }
    if (paying) return;
    const ok = await paymentActionRef.current();
    if (ok) {
      setCurrentStep(3);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="outline" 
            onClick={handleBackToCart}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au panier
          </Button>
          
          <h1 className="text-2xl text-gray-900">Finaliser la commande</h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isActive 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`ml-2 text-sm ${
                    isActive ? 'text-blue-600 font-medium' : 'text-gray-600'
                  }`}>
                    {step.name}
                  </span>
                  
                  {step.id < steps.length && (
                    <div className={`ml-4 w-16 h-0.5 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Informations de livraison
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nom">Nom *</Label>
                      <Input
                        id="nom"
                        value={shippingData.nom}
                        onChange={(e) => setShippingData({...shippingData, nom: e.target.value})}
                        placeholder="Votre nom"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prenom">Prénom *</Label>
                      <Input
                        id="prenom"
                        value={shippingData.prenom}
                        onChange={(e) => setShippingData({...shippingData, prenom: e.target.value})}
                        placeholder="Votre prénom"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="adresse">Adresse *</Label>
                    <Input
                      id="adresse"
                      value={shippingData.adresse}
                      onChange={(e) => setShippingData({...shippingData, adresse: e.target.value})}
                      placeholder="Numéro et nom de rue"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ville">Ville *</Label>
                      <Input
                        id="ville"
                        value={shippingData.ville}
                        onChange={(e) => setShippingData({...shippingData, ville: e.target.value})}
                        placeholder="Ville"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="codePostal">Code postal *</Label>
                      <Input
                        id="codePostal"
                        value={shippingData.codePostal}
                        onChange={(e) => setShippingData({...shippingData, codePostal: e.target.value})}
                        placeholder="Code postal"
                        required
                      />
                    </div>
                  </div>

                  

                  <Button className="w-full" onClick={handleNextStep}>
                    Continuer vers le paiement
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Payment */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Paiement (carte, Apple Pay / Google Pay via Stripe)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!stripePromise && (
                    <p className="text-sm text-red-600">
                      Clé Stripe manquante (VITE_STRIPE_PUBLISHABLE_KEY).
                    </p>
                  )}

                  {stripeError && (
                    <p className="text-sm text-red-600">{stripeError}</p>
                  )}

                  {stripePromise && clientSecret && (
                    <Elements
                      stripe={stripePromise}
                      options={{ clientSecret, appearance: { theme: 'stripe' }, locale: 'fr' }}
                    >
                      <StripePaymentSection
                        onReady={registerPaymentAction}
                        paying={paying}
                        setPaying={setPaying}
                      />
                    </Elements>
                  )}

                  {stripeLoading && (
                    <p className="text-sm text-gray-500">Initialisation du paiement...</p>
                  )}

                  <div className="flex gap-4">
                    <Button variant="outline" onClick={handlePreviousStep} className="flex-1">
                      Retour
                    </Button>
                    <Button onClick={handleNextStep} className="flex-1" disabled={paying || stripeLoading}>
                      {paying ? "Paiement en cours..." : "Continuer"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    Confirmation de commande
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Shipping Summary */}
                  <div>
                    <h3 className="font-semibold mb-2">Adresse de livraison</h3>
                    <div className="bg-gray-50 p-4 rounded-lg text-sm">
                      <p>{shippingData.prenom} {shippingData.nom}</p>
                      <p>{shippingData.adresse}</p>
                      <p>{shippingData.codePostal} {shippingData.ville}</p>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div>
                    <h3 className="font-semibold mb-2">Méthode de paiement</h3>
                    <div className="bg-gray-50 p-4 rounded-lg text-sm">
                      <p>Stripe (carte bancaire + wallets compatibles)</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button variant="outline" onClick={handlePreviousStep} className="flex-1">
                      Retour
                    </Button>
                    <Button onClick={handleConfirmOrder} className="flex-1 bg-green-600 hover:bg-green-700">
                      Confirmer la commande
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Votre commande
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={`${item.id}-${item.type}`} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <p className="font-medium">{item.title}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={item.type === 'achat' ? 'default' : 'secondary'} className="text-xs">
                            {item.type === 'achat' ? 'Achat' : 'Location'}
                          </Badge>
                          <span className="text-gray-600">× {item.quantity}</span>
                        </div>
                      </div>
                      <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sous-total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Livraison</span>
                    <span className="text-green-600">Gratuite</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">TVA</span>
                    <span>Incluse</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

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
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });
      setPaying(false);
      if (error) {
        toast.error(error.message || "Paiement refusé");
        return false;
      }
      if (paymentIntent?.status === 'requires_action') {
        toast.error("Action supplémentaire requise pour ce paiement.");
        return false;
      }
      toast.success("Paiement confirmé");
      return true;
    });
  }, [stripe, elements, onReady, setPaying]);

  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
      <PaymentElement options={{ layout: 'tabs' }} />
      <p className="text-xs text-gray-500">
        Stripe gère les cartes et les wallets (Apple Pay / Google Pay) quand disponibles.
      </p>
    </div>
  );
}
