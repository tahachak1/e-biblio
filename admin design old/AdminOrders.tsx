import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { ArrowLeft, Search, Check, X, Truck, Eye, Download } from "lucide-react";
import { useApp } from "../../AppContext";
import { toast } from "sonner@2.0.3";

interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: Array<{
    title: string;
    author: string;
    type: 'achat' | 'location';
    price: number;
    quantity: number;
  }>;
  montant: number;
  statut: 'en attente' | 'validée' | 'expédiée' | 'livrée' | 'annulée' | 'location en cours';
  dateCommande: string;
  dateLivraison?: string;
  adresseLivraison: {
    nom: string;
    prenom: string;
    adresse: string;
    ville: string;
    codePostal: string;
  };
  methodePaiement: string;
}

export function AdminOrders() {
  const { setCurrentPage } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Données simulées des commandes
  const [orders, setOrders] = useState<Order[]>([
    {
      id: "ORD-1234",
      userId: "1",
      userName: "Marie Dupont",
      userEmail: "marie.dupont@email.com",
      items: [
        {
          title: "Mathématiques 1 — Cours et exercices",
          author: "Khaled Mansour",
          type: "achat",
          price: 24.99,
          quantity: 1
        },
        {
          title: "Anglais - Fiches de grammaire",
          author: "Marie Dupont",
          type: "achat",
          price: 6.99,
          quantity: 2
        }
      ],
      montant: 38.97,
      statut: "en attente",
      dateCommande: "2025-01-20T10:30:00Z",
      adresseLivraison: {
        nom: "Dupont",
        prenom: "Marie",
        adresse: "123 Rue de la Paix",
        ville: "Paris",
        codePostal: "75001"
      },
      methodePaiement: "Carte bancaire"
    },
    {
      id: "ORD-1235",
      userId: "2",
      userName: "Jean Martin",
      userEmail: "jean.martin@email.com",
      items: [
        {
          title: "Programmation PHP & Symfony",
          author: "T. Elouga",
          type: "location",
          price: 6.99,
          quantity: 1
        }
      ],
      montant: 6.99,
      statut: "location en cours",
      dateCommande: "2025-01-19T14:15:00Z",
      dateLivraison: "2025-01-21",
      adresseLivraison: {
        nom: "Martin",
        prenom: "Jean",
        adresse: "456 Avenue des Champs",
        ville: "Lyon",
        codePostal: "69001"
      },
      methodePaiement: "PayPal"
    },
    {
      id: "ORD-1236",
      userId: "4",
      userName: "Sophie Leroy",
      userEmail: "sophie.leroy@email.com",
      items: [
        {
          title: "Physique - Formules essentielles",
          author: "J. Cartier",
          type: "achat",
          price: 9.99,
          quantity: 3
        }
      ],
      montant: 29.97,
      statut: "livrée",
      dateCommande: "2025-01-18T09:45:00Z",
      dateLivraison: "2025-01-20",
      adresseLivraison: {
        nom: "Leroy",
        prenom: "Sophie",
        adresse: "789 Boulevard Saint-Michel",
        ville: "Marseille",
        codePostal: "13001"
      },
      methodePaiement: "Stripe"
    },
    {
      id: "ORD-1237",
      userId: "5",
      userName: "Pierre Durand",
      userEmail: "pierre.durand@email.com",
      items: [
        {
          title: "Collection Fiches Examens",
          author: "Divers",
          type: "achat",
          price: 12.99,
          quantity: 1
        }
      ],
      montant: 12.99,
      statut: "validée",
      dateCommande: "2025-01-17T16:20:00Z",
      adresseLivraison: {
        nom: "Durand",
        prenom: "Pierre",
        adresse: "321 Rue de Rivoli",
        ville: "Toulouse",
        codePostal: "31000"
      },
      methodePaiement: "Carte bancaire"
    }
  ]);

  const handleBackToDashboard = () => {
    setCurrentPage('admin-dashboard');
  };

  const handleValidateOrder = (orderId: string) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, statut: 'validée' as const }
        : order
    ));
    toast.success("Commande validée avec succès");
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, statut: 'annulée' as const }
        : order
    ));
    toast.success("Commande annulée");
  };

  const handleMarkAsShipped = (orderId: string) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, statut: 'expédiée' as const, dateLivraison: new Date().toISOString().split('T')[0] }
        : order
    ));
    toast.success("Commande marquée comme expédiée");
  };

  const handleMarkAsDelivered = (orderId: string) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, statut: 'livrée' as const }
        : order
    ));
    toast.success("Commande marquée comme livrée");
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en attente': return 'text-orange-600 bg-orange-100';
      case 'validée': return 'text-blue-600 bg-blue-100';
      case 'expédiée': return 'text-purple-600 bg-purple-100';
      case 'livrée': return 'text-green-600 bg-green-100';
      case 'annulée': return 'text-red-600 bg-red-100';
      case 'location en cours': return 'text-cyan-600 bg-cyan-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || order.statut === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getTotalOrders = () => orders.length;
  const getPendingOrders = () => orders.filter(o => o.statut === 'en attente').length;
  const getShippedOrders = () => orders.filter(o => o.statut === 'expédiée').length;
  const getTotalRevenue = () => orders.filter(o => o.statut !== 'annulée').reduce((sum, o) => sum + o.montant, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBackToDashboard}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tableau de bord
            </Button>
            <div>
              <h1 className="text-3xl text-gray-900">Gestion des Commandes</h1>
              <p className="text-gray-600">Suivez et gérez toutes les commandes</p>
            </div>
          </div>

          <Button className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Commandes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalOrders()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">En Attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {getPendingOrders()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Expédiées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {getShippedOrders()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Chiffre d'Affaires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${getTotalRevenue().toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher par numéro, nom ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="en attente">En attente</SelectItem>
                  <SelectItem value="validée">Validée</SelectItem>
                  <SelectItem value="expédiée">Expédiée</SelectItem>
                  <SelectItem value="livrée">Livrée</SelectItem>
                  <SelectItem value="annulée">Annulée</SelectItem>
                  <SelectItem value="location en cours">Location en cours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Commandes ({filteredOrders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.userName}</div>
                        <div className="text-sm text-gray-500">{order.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {order.items.length} article{order.items.length > 1 ? 's' : ''}
                        <div className="text-xs text-gray-500">
                          {order.items.slice(0, 2).map(item => item.title).join(', ')}
                          {order.items.length > 2 && '...'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">${order.montant.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.statut)}>
                        {order.statut}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(order.dateCommande).toLocaleDateString('fr-FR')}
                        <div className="text-xs text-gray-500">
                          {new Date(order.dateCommande).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{order.methodePaiement}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog open={selectedOrder?.id === order.id} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewOrder(order)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Détails de la commande {order.id}</DialogTitle>
                              <DialogDescription>
                                Informations complètes sur la commande
                              </DialogDescription>
                            </DialogHeader>
                            {selectedOrder && (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Customer Info */}
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">Informations client</h4>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                      <p><strong>Nom :</strong> {selectedOrder.userName}</p>
                                      <p><strong>Email :</strong> {selectedOrder.userEmail}</p>
                                      <p><strong>Méthode de paiement :</strong> {selectedOrder.methodePaiement}</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-semibold mb-2">Adresse de livraison</h4>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                      <p>{selectedOrder.adresseLivraison.prenom} {selectedOrder.adresseLivraison.nom}</p>
                                      <p>{selectedOrder.adresseLivraison.adresse}</p>
                                      <p>{selectedOrder.adresseLivraison.codePostal} {selectedOrder.adresseLivraison.ville}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Order Items */}
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">Articles commandés</h4>
                                    <div className="space-y-2">
                                      {selectedOrder.items.map((item, index) => (
                                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                          <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                              <p className="font-medium">{item.title}</p>
                                              <p className="text-sm text-gray-600">{item.author}</p>
                                              <div className="flex items-center gap-2 mt-1">
                                                <Badge variant={item.type === 'achat' ? 'default' : 'secondary'}>
                                                  {item.type}
                                                </Badge>
                                                <span className="text-sm">Qté: {item.quantity}</span>
                                              </div>
                                            </div>
                                            <div className="text-right">
                                              <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                                              <p className="text-sm text-gray-600">${item.price.toFixed(2)} × {item.quantity}</p>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                      <div className="bg-blue-50 p-3 rounded-lg">
                                        <div className="flex justify-between items-center">
                                          <span className="font-semibold">Total</span>
                                          <span className="font-semibold text-lg">${selectedOrder.montant.toFixed(2)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {order.statut === 'en attente' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleValidateOrder(order.id)}
                              className="text-green-600"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelOrder(order.id)}
                              className="text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {order.statut === 'validée' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsShipped(order.id)}
                            className="text-purple-600"
                          >
                            <Truck className="h-4 w-4" />
                          </Button>
                        )}

                        {order.statut === 'expédiée' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsDelivered(order.id)}
                            className="text-green-600"
                          >
                            Livré
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Aucune commande trouvée avec ces critères</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}