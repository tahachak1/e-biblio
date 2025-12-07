import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  BookOpen,
  Users,
  ShoppingCart,
  AlertTriangle,
  Euro,
  Package,
} from "lucide-react";
import { useApp } from "../../AppContext";

export function AdminDashboard() {
  const { adminStats, setCurrentPage, loadAdminStats } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    loadAdminStats();
  }, []);

  const statsAny = adminStats as any;

  const salesData =
    (statsAny?.revenueTrend || statsAny?.salesData)?.map((point: any, index: number) => ({
      month: point.label || point.month || point.date || `P${index + 1}`,
      ventes: point.ventes ?? point.sales ?? point.total ?? 0,
      locations: point.locations ?? point.rentals ?? 0,
    })) || [
      { month: "Jan", ventes: 1200, locations: 800 },
      { month: "Fév", ventes: 1500, locations: 950 },
      { month: "Mar", ventes: 1800, locations: 1200 },
      { month: "Avr", ventes: 1400, locations: 1100 },
      { month: "Mai", ventes: 2200, locations: 1400 },
      { month: "Juin", ventes: 2500, locations: 1600 },
    ];

  const miniVentes = salesData.map((d) => d.ventes || 0);
  const miniLocations = salesData.map((d) => d.locations || 0);

  const categoryPalette = ["#2563EB", "#0EA5E9", "#10B981", "#F59E0B", "#9333EA", "#F97316", "#14B8A6", "#EF4444"];
  const categoryData =
    (statsAny?.categoryDistribution || statsAny?.categories)?.map((cat: any, idx: number) => ({
      name: cat.name || cat.category || cat.label || "Autre",
      value: cat.value ?? cat.count ?? 0,
      color: cat.color || categoryPalette[idx % categoryPalette.length],
    })) || [
      { name: "Manuels", value: 45, color: "#2563EB" },
      { name: "Fiches", value: 30, color: "#0EA5E9" },
      { name: "Cahiers", value: 15, color: "#10B981" },
      { name: "Packs", value: 10, color: "#F59E0B" },
    ];

  const recentOrders =
    (statsAny?.recentOrders || []).map((order: any, index: number) => ({
      id: order.id || order.number || `CMD-${index + 1}`,
      user: order.customer || order.user,
      montant: order.total ?? order.totalAmount ?? 0,
      statut: order.status || order.statut || "en attente",
      date: order.createdAt ? new Date(order.createdAt).toISOString().slice(0, 10) : order.date,
    })) || [
      { id: "1234", user: "Marie Dupont", montant: 45.99, statut: "en attente", date: "2025-01-20" },
      { id: "1235", user: "Jean Martin", montant: 29.99, statut: "livrée", date: "2025-01-20" },
      { id: "1236", user: "Sophie Leroy", montant: 67.5, statut: "en attente", date: "2025-01-19" },
      { id: "1237", user: "Pierre Durand", montant: 15.99, statut: "location en cours", date: "2025-01-19" },
    ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "livrée":
        return "text-green-600 bg-green-100";
      case "en attente":
        return "text-orange-600 bg-orange-100";
      case "location en cours":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FB]">
      <div className="max-w-[1216px] mx-auto px-4 sm:px-6 lg:px-6 py-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-[28px] font-semibold tracking-[0.2px] text-slate-900">Tableau de bord Admin</h1>
          <p className="text-sm text-slate-600">Vue d’ensemble de votre plateforme e‑Biblio</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl border border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <span className="h-7 w-7 rounded-full bg-blue-50 flex items-center justify-center">
                  <Euro className="h-4 w-4 text-blue-600" />
                </span>
                Total Ventes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-semibold text-slate-900">
                {(adminStats.totalVentes ?? adminStats.totalRevenue ?? 0).toLocaleString("fr-FR")} €
              </div>
              <p className="text-xs text-slate-600">
                <span className="text-green-600 font-semibold">+12.5%</span> vs mois dernier
              </p>
              <div className="h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={miniVentes.map((v, i) => ({ i, v }))}>
                    <Line type="monotone" dataKey="v" stroke="#2563EB" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <span className="h-7 w-7 rounded-full bg-cyan-50 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-cyan-600" />
                </span>
                Locations Actives
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-semibold text-slate-900">{adminStats.locationsActives ?? 0}</div>
              <p className="text-xs text-slate-600">
                <span className="text-blue-600 font-semibold">+8</span> nouvelles cette semaine
              </p>
              <div className="h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={miniLocations.map((v, i) => ({ i, v }))}>
                    <Line type="monotone" dataKey="v" stroke="#0EA5E9" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <span className="h-7 w-7 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </span>
                Retards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-semibold text-red-600">{adminStats.retards ?? 0}</div>
              <p className="text-xs text-slate-600">À traiter en priorité</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <span className="h-7 w-7 rounded-full bg-amber-50 flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-amber-600" />
                </span>
                Commandes Aujourd’hui
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-semibold text-slate-900">{adminStats.ordersToday ?? 0}</div>
              <p className="text-xs text-slate-600">Commandes reçues aujourd'hui</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="rounded-2xl border border-slate-200 shadow-sm">
            <CardHeader className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base text-slate-800">Évolution des Ventes et Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="ventes" fill="#2563EB" radius={[4, 4, 0, 0]} name="Ventes" />
                  <Bar dataKey="locations" fill="#0EA5E9" radius={[4, 4, 0, 0]} name="Locations" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200 shadow-sm">
            <CardHeader className="flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base text-slate-800">Répartition par Catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={6}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {categoryData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}: {item.value}%
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="rounded-2xl border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-800">Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start border border-slate-200 text-slate-800 hover:bg-slate-50"
                variant="ghost"
                onClick={() => navigate("/admin/catalog")}
              >
                <BookOpen className="h-4 w-4 mr-2 text-blue-600" />
                Gérer le Catalogue
              </Button>
              <Button
                className="w-full justify-start border border-slate-200 text-slate-800 hover:bg-slate-50"
                variant="ghost"
                onClick={() => navigate("/admin/users")}
              >
                <Users className="h-4 w-4 mr-2 text-emerald-600" />
                Gérer les Utilisateurs
              </Button>
              <Button
                className="w-full justify-start border border-slate-200 text-slate-800 hover:bg-slate-50"
                variant="ghost"
                onClick={() => navigate("/admin/orders")}
              >
                <ShoppingCart className="h-4 w-4 mr-2 text-amber-600" />
                Gérer les Commandes
              </Button>
              <Button
                className="w-full justify-start border border-slate-200 text-slate-800 hover:bg-slate-50"
                variant="ghost"
                onClick={() => navigate("/admin/notifications")}
              >
                <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                Notifications
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 rounded-2xl border border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base text-slate-800">Commandes Récentes</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-200"
                onClick={() => navigate("/admin/orders")}
              >
                Voir tout
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-white"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">#{order.id}</p>
                      <p className="text-sm text-gray-600">{order.user}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">
                          {order.montant.toFixed(2)} €
                        </p>
                        <p className="text-xs text-gray-600">{order.date}</p>
                      </div>
                      <Badge className={getStatusColor(order.statut)}>{order.statut}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl border border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-slate-800">Top Livres Vendus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {adminStats.topLivres.map((livre, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-[#F4F5F7] rounded-lg border border-slate-200"
                >
                  <div className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{livre}</p>
                    <p className="text-sm text-gray-600">{45 - index * 5} ventes</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
