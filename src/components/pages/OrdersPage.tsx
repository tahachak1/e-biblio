import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Progress } from "../ui/progress";
import { 
  Package,
  Truck,
  CheckCircle,
  Clock,
  X,
  Eye,
  Calendar,
  MapPin,
  AlertCircle,
  ArrowRight,
  FileText
} from "lucide-react";
import { useApp } from "../AppContext";
import { toast } from "sonner@2.0.3";

const formatCurrency = (value: number = 0) =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(value);

interface OrderItem {
  id: string;
  title: string;
  author: string;
  type: 'achat' | 'location';
  price: number;
  quantity: number;
  coverImage: string;
}

interface TrackingStep {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'current' | 'pending';
}

interface OrderDetails {
  id: string;
  date: string;
  montant: number;
  statut: 'livrée' | 'en attente' | 'expédiée' | 'préparation' | 'annulée' | 'location en cours' | 'retournée';
  items: OrderItem[];
  adresseLivraison: {
    nom: string;
    adresse: string;
    ville: string;
    codePostal: string;
  };
  numeroSuivi?: string;
  transporteur?: string;
  dateLivraisonPrevue?: string;
  canCancel: boolean;
  tracking: TrackingStep[];
}

export function OrdersPage() {
  const { setCurrentPage } = useApp();
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);

  // Données simulées des commandes
  const [orders, setOrders] = useState<OrderDetails[]>([
    {
      id: "ORD-2025-001",
      date: "2025-01-18",
      montant: 89.97,
      statut: "expédiée",
      canCancel: false,
      numeroSuivi: "FR1234567890",
      transporteur: "Colissimo",
      dateLivraisonPrevue: "2025-01-22",
      adresseLivraison: {
        nom: "Marie Dupont",
        adresse: "123 Rue de la République",
        ville: "Lyon",
        codePostal: "69000"
      },
      items: [
        {
          id: "1",
          title: "Mathématiques Appliquées",
          author: "Jean Dupuis",
          type: "achat",
          price: 34.99,
          quantity: 1,
          coverImage: "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d"
        },
        {
          id: "2",
          title: "Physique Quantique",
          author: "Marie Curie",
          type: "location",
          price: 15.99,
          quantity: 1,
          coverImage: "https://images.unsplash.com/photo-1614548428893-5fa2cb74a442"
        }
      ],
      tracking: [
        {
          id: "1",
          title: "Commande confirmée",
          description: "Votre commande a été confirmée et est en cours de traitement",
          timestamp: "2025-01-18T10:30:00",
          status: "completed"
        },
        {
          id: "2",
          title: "Préparation en cours",
          description: "Vos articles sont en cours de préparation dans notre entrepôt",
          timestamp: "2025-01-18T14:00:00",
          status: "completed"
        },
        {
          id: "3",
          title: "Expédiée",
          description: "Votre commande a été expédiée via Colissimo",
          timestamp: "2025-01-19T09:15:00",
          status: "completed"
        },
        {
          id: "4",
          title: "En transit",
          description: "Votre colis est en cours de livraison",
          timestamp: "2025-01-20T08:00:00",
          status: "current"
        },
        {
          id: "5",
          title: "Livraison prévue",
          description: "Livraison prévue aujourd'hui avant 18h",
          timestamp: "2025-01-22T18:00:00",
          status: "pending"
        }
      ]
    },
    {
      id: "ORD-2025-002",
      date: "2025-01-15",
      montant: 45.98,
      statut: "livrée",
      canCancel: false,
      numeroSuivi: "FR0987654321",
      transporteur: "Chronopost",
      adresseLivraison: {
        nom: "Marie Dupont",
        adresse: "123 Rue de la République",
        ville: "Lyon",
        codePostal: "69000"
      },
      items: [
        {
          id: "3",
          title: "Histoire de France",
          author: "Pierre Martin",
          type: "achat",
          price: 29.99,
          quantity: 1,
          coverImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570"
        }
      ],
      tracking: [
        {
          id: "1",
          title: "Commande confirmée",
          description: "Votre commande a été confirmée et est en cours de traitement",
          timestamp: "2025-01-15T10:30:00",
          status: "completed"
        },
        {
          id: "2",
          title: "Préparation terminée",
          description: "Vos articles ont été préparés et emballés",
          timestamp: "2025-01-15T16:00:00",
          status: "completed"
        },
        {
          id: "3",
          title: "Expédiée",
          description: "Votre commande a été expédiée via Chronopost",
          timestamp: "2025-01-16T09:00:00",
          status: "completed"
        },
        {
          id: "4",
          title: "Livrée",
          description: "Votre commande a été livrée avec succès",
          timestamp: "2025-01-17T14:30:00",
          status: "completed"
        }
      ]
    },
    {
      id: "ORD-2025-003",
      date: "2025-01-20",
      montant: 67.50,
      statut: "préparation",
      canCancel: true,
      adresseLivraison: {
        nom: "Marie Dupont",
        adresse: "123 Rue de la République",
        ville: "Lyon",
        codePostal: "69000"
      },
      items: [
        {
          id: "4",
          title: "Chimie Organique",
          author: "Antoine Lavoisier",
          type: "achat",
          price: 42.50,
          quantity: 1,
          coverImage: "https://images.unsplash.com/photo-1532094349884-543bc11b234d"
        },
        {
          id: "5",
          title: "Biologie Cellulaire",
          author: "Charles Darwin",
          type: "location",
          price: 25.00,
          quantity: 1,
          coverImage: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063"
        }
      ],
      tracking: [
        {
          id: "1",
          title: "Commande confirmée",
          description: "Votre commande a été confirmée et est en cours de traitement",
          timestamp: "2025-01-20T11:00:00",
          status: "completed"
        },
        {
          id: "2",
          title: "Préparation en cours",
          description: "Vos articles sont en cours de préparation dans notre entrepôt",
          timestamp: "2025-01-20T15:00:00",
          status: "current"
        },
        {
          id: "3",
          title: "Prêt pour expédition",
          description: "Votre commande sera bientôt expédiée",
          timestamp: "",
          status: "pending"
        }
      ]
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'livrée': return 'bg-green-100 text-green-600';
      case 'expédiée': return 'bg-blue-100 text-blue-600';
      case 'préparation': return 'bg-orange-100 text-orange-600';
      case 'en attente': return 'bg-yellow-100 text-yellow-600';
      case 'annulée': return 'bg-red-100 text-red-600';
      case 'location en cours': return 'bg-purple-100 text-purple-600';
      case 'retournée': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'livrée': return <CheckCircle className="h-4 w-4" />;
      case 'expédiée': return <Truck className="h-4 w-4" />;
      case 'préparation': return <Package className="h-4 w-4" />;
      case 'en attente': return <Clock className="h-4 w-4" />;
      case 'annulée': return <X className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, statut: 'annulée' as const, canCancel: false }
        : order
    ));
    toast.success("Commande annulée avec succès");
  };

  const handleViewOrder = (order: OrderDetails) => {
    setSelectedOrder(order);
  };

  const getTrackingProgress = (steps: TrackingStep[]) => {
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    return (completedSteps / steps.length) * 100;
  };

  const activeOrders = orders.filter(order => !['livrée', 'annulée', 'retournée'].includes(order.statut));
  const completedOrders = orders.filter(order => ['livrée', 'retournée'].includes(order.statut));
  const cancelledOrders = orders.filter(order => order.statut === 'annulée');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">Mes Commandes</h1>
          <p className="text-gray-600">Suivez vos commandes et gérez vos livraisons</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Commandes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">En cours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{activeOrders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Livrées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedOrders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Annulées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{cancelledOrders.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active">En cours ({activeOrders.length})</TabsTrigger>
            <TabsTrigger value="completed">Terminées ({completedOrders.length})</TabsTrigger>
            <TabsTrigger value="cancelled">Annulées ({cancelledOrders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <div className="space-y-6">
              {activeOrders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Commande {order.id}</CardTitle>
                        <p className="text-sm text-gray-600">
                          Passée le {new Date(order.date).toLocaleDateString('fr-FR')} • {formatCurrency(order.montant)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(order.statut)}>
                          {getStatusIcon(order.statut)}
                          <span className="ml-1 capitalize">{order.statut}</span>
                        </Badge>
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewOrder(order)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Détails
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Détails de la commande {order.id}</DialogTitle>
                                <DialogDescription>
                                  Commande passée le {new Date(order.date).toLocaleDateString('fr-FR')}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedOrder && (
                                <div className="space-y-6">
                                  {/* Tracking */}
                                  <div>
                                    <h3 className="font-medium mb-4 flex items-center">
                                      <Truck className="h-5 w-5 mr-2" />
                                      Suivi de livraison
                                    </h3>
                                    <div className="mb-4">
                                      <Progress value={getTrackingProgress(selectedOrder.tracking)} className="h-2" />
                                    </div>
                                    <div className="space-y-4">
                                      {selectedOrder.tracking.map((step, index) => (
                                        <div key={step.id} className="flex items-start space-x-3">
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            step.status === 'completed' 
                                              ? 'bg-green-100 text-green-600' 
                                              : step.status === 'current'
                                                ? 'bg-blue-100 text-blue-600'
                                                : 'bg-gray-100 text-gray-400'
                                          }`}>
                                            {step.status === 'completed' ? (
                                              <CheckCircle className="h-4 w-4" />
                                            ) : step.status === 'current' ? (
                                              <Clock className="h-4 w-4" />
                                            ) : (
                                              <div className="w-2 h-2 bg-gray-400 rounded-full" />
                                            )}
                                          </div>
                                          <div className="flex-1">
                                            <h4 className="font-medium">{step.title}</h4>
                                            <p className="text-sm text-gray-600">{step.description}</p>
                                            {step.timestamp && (
                                              <p className="text-xs text-gray-400 mt-1">
                                                {new Date(step.timestamp).toLocaleString('fr-FR')}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    {selectedOrder.numeroSuivi && (
                                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <p className="text-sm font-medium">Numéro de suivi</p>
                                            <p className="text-sm text-gray-600">{selectedOrder.numeroSuivi}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">Transporteur</p>
                                            <p className="text-sm text-gray-600">{selectedOrder.transporteur}</p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Articles */}
                                  <div>
                                    <h3 className="font-medium mb-4 flex items-center">
                                      <Package className="h-5 w-5 mr-2" />
                                      Articles commandés
                                    </h3>
                                    <div className="space-y-3">
                                      {selectedOrder.items.map((item) => (
                                        <div key={item.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                                          <img
                                            src={item.coverImage}
                                            alt={item.title}
                                            className="w-12 h-16 object-cover rounded"
                                          />
                                          <div className="flex-1">
                                            <h4 className="font-medium">{item.title}</h4>
                                            <p className="text-sm text-gray-600">par {item.author}</p>
                                            <div className="flex items-center space-x-2 mt-1">
                                              <Badge variant="outline" className="text-xs">
                                                {item.type === 'achat' ? 'Achat' : 'Location'}
                                              </Badge>
                                              <span className="text-sm">Qté: {item.quantity}</span>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <p className="font-medium">{formatCurrency(item.price)}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Adresse de livraison */}
                                  <div>
                                    <h3 className="font-medium mb-4 flex items-center">
                                      <MapPin className="h-5 w-5 mr-2" />
                                      Adresse de livraison
                                    </h3>
                                    <div className="p-3 border rounded-lg">
                                      <p className="font-medium">{selectedOrder.adresseLivraison.nom}</p>
                                      <p>{selectedOrder.adresseLivraison.adresse}</p>
                                      <p>{selectedOrder.adresseLivraison.codePostal} {selectedOrder.adresseLivraison.ville}</p>
                                      <p className="text-sm text-gray-500 mt-2">
                                        Livraison standard assurée par notre transporteur partenaire.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          {order.canCancel && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelOrder(order.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Annuler
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Quick tracking */}
                      {order.tracking && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Progression</span>
                            <span className="text-sm text-gray-600">
                              {Math.round(getTrackingProgress(order.tracking))}%
                            </span>
                          </div>
                          <Progress value={getTrackingProgress(order.tracking)} className="h-2" />
                          <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                            <span>Confirmée</span>
                            <span>En préparation</span>
                            <span>Expédiée</span>
                            <span>Livrée</span>
                          </div>
                        </div>
                      )}

                      {/* Items preview */}
                      <div>
                        <div className="flex items-center space-x-4">
                          {order.items.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex items-center space-x-2">
                              <img
                                src={item.coverImage}
                                alt={item.title}
                                className="w-8 h-10 object-cover rounded"
                              />
                              <div>
                                <p className="text-sm font-medium truncate max-w-32">{item.title}</p>
                                <p className="text-xs text-gray-600">{item.type === 'achat' ? 'Achat' : 'Location'}</p>
                              </div>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <span className="text-sm text-gray-600">
                              +{order.items.length - 3} autre(s)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Delivery info */}
                      {order.dateLivraisonPrevue && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>Livraison prévue le {new Date(order.dateLivraisonPrevue).toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {activeOrders.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Aucune commande en cours</p>
                    <Button
                      className="mt-4"
                      onClick={() => setCurrentPage('home')}
                    >
                      Parcourir le catalogue
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="space-y-6">
              {completedOrders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Commande {order.id}</CardTitle>
                        <p className="text-sm text-gray-600">
                          Livrée le {new Date(order.date).toLocaleDateString('fr-FR')} • {formatCurrency(order.montant)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(order.statut)}>
                          {getStatusIcon(order.statut)}
                          <span className="ml-1 capitalize">{order.statut}</span>
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOrder(order)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4">
                      {order.items.slice(0, 4).map((item) => (
                        <div key={item.id} className="flex items-center space-x-2">
                          <img
                            src={item.coverImage}
                            alt={item.title}
                            className="w-8 h-10 object-cover rounded"
                          />
                          <div>
                            <p className="text-sm font-medium truncate max-w-32">{item.title}</p>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <span className="text-sm text-gray-600">
                          +{order.items.length - 4} autre(s)
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {completedOrders.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <CheckCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Aucune commande terminée</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="cancelled">
            <div className="space-y-6">
              {cancelledOrders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Commande {order.id}</CardTitle>
                        <p className="text-sm text-gray-600">
                          Annulée le {new Date(order.date).toLocaleDateString('fr-FR')} • {formatCurrency(order.montant)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(order.statut)}>
                        {getStatusIcon(order.statut)}
                        <span className="ml-1 capitalize">{order.statut}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {order.items.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex items-center space-x-2">
                            <img
                              src={item.coverImage}
                              alt={item.title}
                              className="w-8 h-10 object-cover rounded opacity-50"
                            />
                            <div>
                              <p className="text-sm font-medium truncate max-w-32 text-gray-500">{item.title}</p>
                            </div>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <span className="text-sm text-gray-500">
                            +{order.items.length - 3} autre(s)
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        Remboursement traité
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {cancelledOrders.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <X className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Aucune commande annulée</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
