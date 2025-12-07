import { useEffect, useMemo, useState } from "react";
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
import api from "../../../services/api";

interface OrderItem {
  title: string;
  author?: string;
  type?: string;
  price?: number;
  quantity?: number;
}

interface Order {
  id: string;
  number?: string;
  userName?: string;
  userEmail?: string;
  items: OrderItem[];
  montant: number;
  statut: string;
  dateCommande?: string;
  methodePaiement?: string;
  adresseLivraison?: {
    nom?: string;
    prenom?: string;
    adresse?: string;
    ville?: string;
    codePostal?: string;
  };
}

const statusLabels: Record<string, string> = {
  pending: "en attente",
  validated: "validée",
  shipped: "expédiée",
  delivered: "livrée",
  cancelled: "annulée",
};

export function AdminOrders() {
  const { setCurrentPage } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const mapOrder = (o: any): Order => ({
    id: o._id || o.id,
    number: o.orderNumber || o.number,
    userName: o.shippingAddress?.name,
    userEmail: o.customerEmail,
    items: (o.items || []).map((it: any) => ({
      title: it.book?.title || it.title,
      author: it.book?.author,
      type: it.type,
      price: it.price,
      quantity: it.quantity,
    })),
    montant: o.totalAmount || o.total || 0,
    statut: statusLabels[o.status] || o.status || "en attente",
    dateCommande: o.createdAt,
    methodePaiement: o.paymentMethod,
    adresseLivraison: {
      nom: o.shippingAddress?.name?.split(" ").slice(-1).join(" "),
      prenom: o.shippingAddress?.name?.split(" ")[0],
      adresse: o.shippingAddress?.address,
      ville: o.shippingAddress?.city,
      codePostal: o.shippingAddress?.postalCode,
    },
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { orders: data } = await api.admin.getOrders();
      setOrders((data || []).map(mapOrder));
    } catch (error: any) {
      console.error(error);
      toast.error("Impossible de charger les commandes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleBackToDashboard = () => {
    setCurrentPage('admin-dashboard');
  };

  const updateStatus = async (orderId: string, status: string, successMessage: string) => {
    try {
      await api.admin.updateOrderStatus(orderId, status);
      await fetchOrders();
      toast.success(successMessage);
    } catch (error: any) {
      console.error(error);
      toast.error("Impossible de mettre à jour la commande");
    }
  };

  const handleValidateOrder = (orderId: string) => updateStatus(orderId, 'validated', "Commande validée");
  const handleCancelOrder = (orderId: string) => updateStatus(orderId, 'cancelled', "Commande annulée");
  const handleMarkAsShipped = (orderId: string) => updateStatus(orderId, 'shipped', "Commande expédiée");
  const handleMarkAsDelivered = (orderId: string) => updateStatus(orderId, 'delivered', "Commande livrée");

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
  };

  const filteredOrders = useMemo(() => orders.filter(order => {
    const matchesSearch = (order.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.userName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.userEmail || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || order.statut === selectedStatus;
    return matchesSearch && matchesStatus;
  }), [orders, searchTerm, selectedStatus]);

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

  const getTotalOrders = () => orders.length;
  const getPendingOrders = () => orders.filter(o => o.statut === 'en attente').length;
  const getShippedOrders = () => orders.filter(o => o.statut === 'expédiée').length;
  const getTotalRevenue = () => orders.filter(o => o.statut !== 'annulée').reduce((sum, o) => sum + (o.montant || 0), 0);

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
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Commandes ({filteredOrders.length}) {loading && <span className="text-xs text-gray-500">(chargement...)</span>}</CardTitle>
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
                    <TableCell className="font-medium">{order.number || order.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.userName || "—"}</div>
                        <div className="text-sm text-gray-500">{order.userEmail || "—"}</div>
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
                    <TableCell className="font-medium">${(order.montant || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.statut)}>
                        {order.statut}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {order.dateCommande ? new Date(order.dateCommande).toLocaleDateString('fr-FR') : "—"}
                        <div className="text-xs text-gray-500">
                          {order.dateCommande ? new Date(order.dateCommande).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : ""}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{order.methodePaiement || "—"}</TableCell>
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
                              <DialogTitle>Détails de la commande {order.number || order.id}</DialogTitle>
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
                                      <p><strong>Nom :</strong> {selectedOrder.userName || "—"}</p>
                                      <p><strong>Email :</strong> {selectedOrder.userEmail || "—"}</p>
                                      <p><strong>Méthode de paiement :</strong> {selectedOrder.methodePaiement || "—"}</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-semibold mb-2">Adresse de livraison</h4>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                      <p>{selectedOrder.adresseLivraison?.prenom || ""} {selectedOrder.adresseLivraison?.nom || ""}</p>
                                      <p>{selectedOrder.adresseLivraison?.adresse || "—"}</p>
                                      <p>{selectedOrder.adresseLivraison?.codePostal || ""} {selectedOrder.adresseLivraison?.ville || ""}</p>
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
                                              {item.author && <p className="text-sm text-gray-600">{item.author}</p>}
                                              <div className="flex items-center gap-2 mt-1">
                                                <Badge variant={item.type === 'achat' ? 'default' : 'secondary'}>
                                                  {item.type || '—'}
                                                </Badge>
                                                <span className="text-sm">Qté: {item.quantity || 1}</span>
                                              </div>
                                            </div>
                                            <div className="text-right">
                                              <p className="font-medium">${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                                              <p className="text-sm text-gray-600">${(item.price || 0).toFixed(2)} × {item.quantity || 1}</p>
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
                <p className="text-gray-500">{loading ? "Chargement..." : "Aucune commande trouvée avec ces critères"}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
