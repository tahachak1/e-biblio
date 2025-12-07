import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { CheckCircle, Download, Package, ArrowRight } from "lucide-react";
import { useApp } from "../AppContext";

export function ConfirmationPage() {
  const { setCurrentPage, orders } = useApp();
  
  // Get the most recent order (the one just placed)
  const latestOrder = orders[0];

  const handleViewOrders = () => {
    setCurrentPage('orders');
  };

  const handleBackToCatalog = () => {
    setCurrentPage('home');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className="text-center">
          <CardContent className="pt-16 pb-12 px-8">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
            </div>

            {/* Success Message */}
            <h1 className="text-2xl text-gray-900 mb-4">
              Votre commande a été validée !
            </h1>
            
            <p className="text-gray-600 mb-8">
              Merci pour votre achat. Vous allez recevoir un email de confirmation avec tous les détails de votre commande.
            </p>

            {/* Order Details */}
            {latestOrder && (
              <div className="bg-gray-50 p-4 rounded-lg mb-8 text-left">
                <h3 className="font-semibold mb-3">Détails de la commande</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Numéro de commande :</span>
                    <span className="font-medium">#{latestOrder.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date :</span>
                    <span>{new Date(latestOrder.date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total :</span>
                    <span className="font-medium">${latestOrder.montant.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Articles :</span>
                    <span>{latestOrder.items.length} livre{latestOrder.items.length > 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Package className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium text-blue-900">Livraison</p>
                  <p className="text-xs text-blue-700">Vos livres seront expédiés sous 24-48h</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Download className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium text-green-900">Livres numériques</p>
                  <p className="text-xs text-green-700">Téléchargement disponible immédiatement</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handleViewOrders}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Voir mes commandes
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleBackToCatalog}
                className="w-full"
              >
                Retour au catalogue
              </Button>
            </div>

            {/* Support Info */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Besoin d'aide ? Contactez notre support à{" "}
                <a href="mailto:support@ebiblio.com" className="text-blue-600 hover:underline">
                  support@ebiblio.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}