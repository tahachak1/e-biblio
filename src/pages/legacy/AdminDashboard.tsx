import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Users,
  BookOpen,
  ShoppingCart,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  BookMarked,
  Package,
  ArrowUpRight,
  AlertCircle,
  Bell,
  ChevronRight,
} from 'lucide-react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  Button as MuiButton,
  Divider,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import api from '../services/api';
import { toast } from 'sonner';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type BookType = 'papier' | 'numerique';

interface Book {
  _id: string;
  title: string;
  author: string;
  price: number;
  rentPrice?: number;
  image: string;
  category?: string;
  description?: string;
  isbn?: string;
  publisher?: string;
  publicationYear?: number;
  pages?: number;
  type?: BookType;
  categorieId?: string;
  categoryName?: string;
  pdfUrl?: string;
}

interface Category {
  _id: string;
  nom: string;
  dateCreation?: string;
  createdAt?: string;
}

interface User {
  _id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  statut: string;
  createdAt: string;
}

type RevenueTrendPoint = {
  label: string;
  total: number;
  sales: number;
  rentals: number;
  orders: number;
};

type CategorySlice = {
  name: string;
  value: number;
};

type RecentOrderItem = {
  id: string;
  number?: string;
  total: number;
  customer: string;
  status: string;
  createdAt: string;
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  date: string;
  isRead: boolean;
  user?: string | null;
};

type TopProduct = {
  title: string;
  author?: string;
  sales: number;
  revenue: number;
};

type DashboardStats = {
  totals: {
    books: number;
    users: number;
    verifiedUsers: number;
    unverifiedUsers: number;
    orders: number;
    revenue: number;
  };
  orderStatuses: Record<string, { count: number; revenue: number }>;
  revenueTrend: RevenueTrendPoint[];
  categoryDistribution: CategorySlice[];
  topProducts: TopProduct[];
  recentOrders: RecentOrderItem[];
  notifications: NotificationItem[];
};

const formatCurrency = (value: number = 0) =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(value);

const categoryColors = ['#2563EB', '#6366F1', '#F97316', '#10B981', '#0EA5E9', '#9333EA'];

const statusStyles: Record<string, string> = {
  en_attente: 'bg-amber-50 text-amber-700',
  confirmee: 'bg-blue-50 text-blue-700',
  expediee: 'bg-cyan-50 text-cyan-700',
  livree: 'bg-emerald-50 text-emerald-700',
  annulee: 'bg-rose-50 text-rose-700',
};

const statusLabels: Record<string, string> = {
  en_attente: 'En attente',
  confirmee: 'Confirmée',
  expediee: 'Expédiée',
  livree: 'Livrée',
  annulee: 'Annulée',
};

const buildDelta = (current = 0, previous = 0) => {
  if (!previous) {
    return { label: 'vs période précédente', tone: 'text-slate-400' };
  }
  const delta = ((current - previous) / previous) * 100;
  const sign = delta >= 0 ? '+' : '';
  return {
    label: `${sign}${delta.toFixed(0)}% vs période précédente`,
    tone: delta >= 0 ? 'text-emerald-600' : 'text-rose-600',
  };
};

type QuickAction = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  accentBg: string;
  accentText: string;
};

const quickActions: QuickAction[] = [
  {
    id: 'catalog',
    label: 'Gérer le Catalogue',
    description: 'Ajouter, modifier ou retirer un livre',
    icon: BookMarked,
    accentBg: 'bg-blue-50',
    accentText: 'text-blue-600',
  },
  {
    id: 'users',
    label: 'Gérer les Utilisateurs',
    description: 'Suivre les accès et rôles',
    icon: Users,
    accentBg: 'bg-emerald-50',
    accentText: 'text-emerald-600',
  },
  {
    id: 'orders',
    label: 'Gérer les Commandes',
    description: 'Superviser livraisons et retours',
    icon: Package,
    accentBg: 'bg-orange-50',
    accentText: 'text-orange-600',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Alertes et messages récents',
    icon: Bell,
    accentBg: 'bg-indigo-50',
    accentText: 'text-indigo-600',
  },
];

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'books' | 'users' | 'categories'>('overview');
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ nom: '' });
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    price: '',
    rentPrice: '',
    image: '',
    category: '',
    categorieId: '',
    description: '',
    isbn: '',
    publisher: '',
    publicationYear: '',
    pages: '',
    type: 'papier' as BookType,
    pdfUrl: '',
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const [userForm, setUserForm] = useState({
    prenom: '',
    nom: '',
    email: '',
    role: 'user',
    statut: 'actif',
  });

  useEffect(() => {
    fetchStats();
    if (activeTab === 'books') {
      fetchBooks();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'categories') {
      fetchCategories();
    }
  }, [activeTab]);

  const extractArray = <T,>(payload: any, primaryKey: string): T[] => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.[primaryKey])) return payload[primaryKey];
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await api.get<DashboardStats>('/admin/stats');
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Impossible de charger les statistiques administrateur');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await api.get('/books');
      setBooks(extractArray<Book>(response.data, 'books'));
    } catch (error) {
      toast.error('Erreur lors du chargement des livres');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(extractArray<Category>(response.data, 'categories'));
    } catch (error) {
      toast.error('Erreur lors du chargement des catégories');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(extractArray<User>(response.data, 'users'));
    } catch (error) {
      toast.error('Erreur lors du chargement des utilisateurs');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleBookFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBookForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'type' && value === 'papier' ? { pdfUrl: '' } : {}),
    }));
    if (name === 'type' && value === 'papier') {
      setPdfFile(null);
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPdfFile(file || null);
  };

  const handleSubmitBook = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!bookForm.categorieId) {
        toast.error('Veuillez sélectionner une catégorie');
        setLoading(false);
        return;
      }
      if (bookForm.type === 'numerique' && !pdfFile && !bookForm.pdfUrl.trim()) {
        toast.error('Veuillez déposer un fichier PDF pour un livre numérique');
        setLoading(false);
        return;
      }

      let pdfBase64: string | undefined;
      let pdfFileName: string | undefined;
      if (bookForm.type === 'numerique' && pdfFile) {
        const toBase64 = (file: File) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        pdfBase64 = await toBase64(pdfFile);
        pdfFileName = pdfFile.name;
      }

      const bookData = {
        ...bookForm,
        price: parseFloat(bookForm.price),
        rentPrice: bookForm.rentPrice ? parseFloat(bookForm.rentPrice) : undefined,
        publicationYear: bookForm.publicationYear ? parseInt(bookForm.publicationYear) : undefined,
        pages: bookForm.pages ? parseInt(bookForm.pages) : undefined,
        categorieId: bookForm.categorieId,
        pdfUrl: bookForm.type === 'numerique' ? bookForm.pdfUrl : undefined,
        pdfBase64,
        pdfFileName,
      };

      if (editingBook) {
        await api.put(`/books/${editingBook._id}`, bookData);
        toast.success('Livre modifié avec succès');
      } else {
        await api.post('/books', bookData);
        toast.success('Livre ajouté avec succès');
      }

      setIsDialogOpen(false);
      resetBookForm();
      fetchBooks();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm({ nom: '' });
  };

  const handleCategorySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!categoryForm.nom.trim()) {
      toast.error('Le nom de la catégorie est requis');
      return;
    }
    setCategoryLoading(true);
    try {
      if (editingCategory) {
        await api.patch(`/categories/${editingCategory._id}`, { nom: categoryForm.nom.trim() });
        toast.success('Catégorie mise à jour');
      } else {
        await api.post('/categories', { nom: categoryForm.nom.trim() });
        toast.success('Catégorie créée');
      }
      resetCategoryForm();
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement de la catégorie');
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({ nom: category.nom });
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Supprimer cette catégorie ?')) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Catégorie supprimée');
      setBookForm((prev) => (prev.categorieId === id ? { ...prev, categorieId: '' } : prev));
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression de la catégorie');
    }
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setBookForm({
      title: book.title,
      author: book.author,
      price: book.price.toString(),
      rentPrice: book.rentPrice?.toString() || '',
      image: book.image,
      category: book.category || '',
      categorieId: book.categorieId || '',
      description: book.description || '',
      isbn: book.isbn || '',
      publisher: book.publisher || '',
      publicationYear: book.publicationYear?.toString() || '',
      pages: book.pages?.toString() || '',
      type: book.type ?? 'papier',
      pdfUrl: book.pdfUrl || '',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce livre ?')) return;

    try {
      await api.delete(`/books/${id}`);
      toast.success('Livre supprimé avec succès');
      fetchBooks();
      fetchStats();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('Utilisateur supprimé avec succès');
      fetchUsers();
      fetchStats();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setUserForm({
      ...userForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmitUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        firstName: userForm.prenom,
        lastName: userForm.nom,
        email: userForm.email,
        role: userForm.role,
        status: userForm.statut,
      };

      if (editingUser) {
        await api.patch(`/admin/users/${editingUser._id}`, payload);
        toast.success('Utilisateur modifié avec succès');
      } else {
        await api.post('/admin/users', payload);
        toast.success('Utilisateur ajouté avec succès');
      }

      setIsUserDialogOpen(false);
      resetUserForm();
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      prenom: user.prenom,
      nom: user.nom,
      email: user.email,
      role: user.role,
      statut: user.statut,
    });
    setIsUserDialogOpen(true);
  };

  const resetUserForm = () => {
    setEditingUser(null);
    setUserForm({
      prenom: '',
      nom: '',
      email: '',
      role: 'user',
      statut: 'actif',
    });
  };

  const handleQuickAction = (actionId: string) => {
    if (actionId === 'catalog') {
      setActiveTab('books');
      return;
    }
    if (actionId === 'users') {
      setActiveTab('users');
      return;
    }
    if (actionId === 'orders') {
      navigate('/admin/orders');
      return;
    }
    if (actionId === 'notifications') {
      toast.info('Centre de notifications bientôt disponible');
      return;
    }
    setActiveTab('overview');
  };

  const resetBookForm = () => {
    setEditingBook(null);
    setBookForm({
      title: '',
      author: '',
      price: '',
      rentPrice: '',
      image: '',
      category: '',
      categorieId: '',
      description: '',
      isbn: '',
      publisher: '',
      publicationYear: '',
      pages: '',
      type: 'papier',
      pdfUrl: '',
    });
    setPdfFile(null);
  };

  const formatNumber = (value: number = 0) => value.toLocaleString('fr-FR');
  const formatMoney = (value: number = 0) => formatCurrency(value);
  const formatDate = (value?: string) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const totals = dashboardStats?.totals;
  const pendingOrders = dashboardStats?.orderStatuses?.en_attente?.count ?? 0;

  const revenueTrendData = dashboardStats?.revenueTrend ?? [];
  const categorySlices = dashboardStats?.categoryDistribution ?? [];
  const recentOrdersData = dashboardStats?.recentOrders ?? [];
  const topProducts = dashboardStats?.topProducts ?? [];

  const lastRevenuePoint = revenueTrendData[revenueTrendData.length - 1];
  const previousRevenuePoint = revenueTrendData[revenueTrendData.length - 2];

  const revenueDelta = buildDelta(lastRevenuePoint?.total ?? totals?.revenue ?? 0, previousRevenuePoint?.total ?? totals?.revenue ?? 0);
  const rentalsDelta = buildDelta(lastRevenuePoint?.rentals ?? 0, previousRevenuePoint?.rentals ?? 0);
  const ordersDelta = buildDelta(lastRevenuePoint?.orders ?? totals?.orders ?? 0, previousRevenuePoint?.orders ?? totals?.orders ?? 0);

  const metricCards = [
    {
      id: 'sales',
      label: 'Total Ventes',
      value: formatNumber(Math.round(totals?.revenue ?? 0)),
      helper: revenueDelta.label,
      tone: revenueDelta.tone,
      icon: TrendingUp,
      badge: '€',
    },
    {
      id: 'rentals',
      label: 'Locations Actives',
      value: formatNumber(Math.round(lastRevenuePoint?.rentals ?? dashboardStats?.orderStatuses?.livree?.count ?? 0)),
      helper: rentalsDelta.label,
      tone: 'text-blue-600',
      icon: BookOpen,
      badge: '+',
    },
    {
      id: 'delays',
      label: 'Retards',
      value: formatNumber(pendingOrders),
      helper: 'À traiter en priorité',
      tone: 'text-rose-600',
      icon: AlertCircle,
      badge: '·',
    },
    {
      id: 'orders',
      label: "Commandes Aujourd'hui",
      value: formatNumber(Math.round(lastRevenuePoint?.orders ?? totals?.orders ?? 0)),
      helper: ordersDelta.label,
      tone: 'text-emerald-600',
      icon: ShoppingCart,
      badge: '✓',
    },
  ];

const topProductsDisplay = topProducts.slice(0, 3);

const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 text-xs text-slate-100 shadow-lg backdrop-blur">
      <p className="font-semibold text-slate-50 mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="font-semibold">
            {typeof entry.value === 'number' ? formatNumber(Number(entry.value)) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

  return (
    <div className="relative min-h-screen bg-slate-900 text-slate-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,#22d3ee20,transparent_35%),radial-gradient(circle_at_bottom_right,#a855f740,transparent_40%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          {(['overview', 'books', 'categories', 'users'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition shadow-sm ${
                activeTab === tab
                  ? 'bg-white text-slate-900 border border-white/20 shadow-lg'
                  : 'bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 hover:text-white'
              }`}
            >
              {tab === 'overview' && "Vue d'ensemble"}
              {tab === 'books' && 'Livres'}
              {tab === 'categories' && 'Catégories'}
              {tab === 'users' && 'Utilisateurs'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 p-6 shadow-2xl">
              <div className="absolute inset-0 opacity-20 bg-[linear-gradient(120deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(60deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:28px_28px]" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">e-Biblio · Admin</p>
                  <h1 className="text-3xl font-semibold mt-1">Tableau de bord Bibliothèque</h1>
                  <p className="text-sm text-slate-300 mt-2">
                    Vue inspirée du template Nickelfox, avec vos métriques catalogue/commandes.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="rounded-full border-white/20 text-white hover:bg-white/10"
                    onClick={fetchStats}
                  >
                    Actualiser
                  </Button>
                  <Button className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-900 font-semibold shadow-lg shadow-cyan-500/30">
                    Exporter
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metricCards.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between">
                      <span className="rounded-lg bg-white/10 p-2 text-white">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-xs font-semibold text-slate-300">{metric.badge}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-200">{metric.label}</p>
                    <p className="text-3xl font-semibold text-white">{metric.value}</p>
                    <p className={`text-xs font-semibold ${metric.tone}`}>{metric.helper}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
              <div className="xl:col-span-8 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Ventes & Locations</h3>
                    <p className="text-sm text-slate-300">Revenus et locations sur la période</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-300">{revenueDelta.label}</span>
                </div>
                <div className="mt-4 h-72">
                  {revenueTrendData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueTrendData} barCategoryGap={18}>
                        <defs>
                          <linearGradient id="barSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.95} />
                            <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.6} />
                          </linearGradient>
                          <linearGradient id="barRentals" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#c084fc" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.6} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                        <XAxis dataKey="label" stroke="#CBD5E1" />
                        <YAxis stroke="#CBD5E1" tickFormatter={(value) => formatNumber(Number(value))} />
                        <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
                        <Bar dataKey="sales" name="Ventes" fill="url(#barSales)" radius={[10, 10, 0, 0]} />
                        <Bar dataKey="rentals" name="Locations" fill="url(#barRentals)" radius={[10, 10, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-white/15 text-sm text-slate-300">
                      {statsLoading ? 'Chargement des tendances...' : 'Pas encore de données suffisantes.'}
                    </div>
                  )}
                </div>
              </div>

              <div className="xl:col-span-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Catégories</h3>
                    <p className="text-sm text-slate-300">Répartition du catalogue</p>
                  </div>
                </div>
                <div className="mt-4 h-64">
                  {categorySlices.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categorySlices}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={95}
                          paddingAngle={3}
                          stroke="#0f172a"
                          strokeWidth={3}
                        >
                          {categorySlices.map((entry, index) => (
                            <Cell
                              key={`${entry.name || 'cat'}-${index}`}
                              fill={categoryColors[index % categoryColors.length]}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-white/15 text-sm text-slate-300">
                      {statsLoading ? 'Chargement des catégories...' : 'Ajoutez des livres pour voir la répartition.'}
                    </div>
                  )}
                </div>
                <div className="mt-4 space-y-3">
                  {categorySlices.length ? (
                    categorySlices.map((category, index) => (
                      <div key={`${category.name || 'cat'}-${index}`} className="flex items-center justify-between text-sm text-slate-200">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
                          />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <span className="font-semibold text-white">{formatNumber(category.value)} livres</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-300">Aucune donnée catégorielle disponible.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
              <div className="xl:col-span-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Actions rapides</h3>
                  <ArrowUpRight className="h-4 w-4 text-slate-300" />
                </div>
                <div className="mt-4 space-y-2">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => handleQuickAction(action.id)}
                        className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-left transition hover:bg-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.accentBg} ${action.accentText}`}>
                            <Icon className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-white">{action.label}</p>
                            <p className="text-xs text-slate-300">{action.description}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="xl:col-span-8 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Commandes récentes</h3>
                    <p className="text-sm text-slate-300">Livres achetés/loués récemment</p>
                  </div>
                  <Button variant="outline" className="h-9 rounded-full border-white/20 text-white hover:bg-white/10">
                    Voir tout
                  </Button>
                </div>
                <div className="mt-4 space-y-2">
                  {recentOrdersData.length ? (
                    recentOrdersData.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">#{order.number || order.id}</p>
                          <p className="text-xs text-slate-300">{order.customer}</p>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-right">
                            <p className="font-semibold text-white">{formatMoney(order.total)}</p>
                            <p className="text-xs text-slate-400">{formatDate(order.createdAt)}</p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              statusStyles[order.status] || 'bg-white/10 text-slate-200'
                            }`}
                          >
                            {statusLabels[order.status] || order.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="py-6 text-center text-sm text-slate-300">
                      {statsLoading ? 'Chargement des commandes...' : 'Aucune commande récente.'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
              <h3 className="text-lg font-semibold text-white">Top livres vendus</h3>
              <p className="text-sm text-slate-300">Basé sur les commandes récentes</p>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                {topProductsDisplay.length ? (
                  topProductsDisplay.map((book, index) => (
                    <div
                      key={`${book.title}-${index}`}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-sm font-semibold text-slate-800 shadow-sm">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white">{book.title}</p>
                          <p className="text-xs text-slate-300">{formatNumber(book.sales)} ventes</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-300">Aucune vente enregistrée pour le moment.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Books Tab */}
        {activeTab === 'books' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl" style={{ color: '#374151' }}>
                Gestion des livres
              </h2>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={resetBookForm}
                    className="flex items-center gap-2"
                    style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
                  >
                    <Plus className="w-5 h-5" />
                    Ajouter un livre
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingBook ? 'Modifier le livre' : 'Ajouter un livre'}</DialogTitle>
                    <DialogDescription>
                      Renseignez toutes les informations requises avant de sauvegarder ce livre.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmitBook} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="type">Type de livre *</Label>
                        <select
                          id="type"
                          name="type"
                          value={bookForm.type}
                          onChange={handleBookFormChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="papier">Papier</option>
                          <option value="numerique">Numérique</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="title">Titre/Nom *</Label>
                        <Input id="title" name="title" value={bookForm.title} onChange={handleBookFormChange} required />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="author">Auteur *</Label>
                      <Input id="author" name="author" value={bookForm.author} onChange={handleBookFormChange} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Prix d'achat (CAD) *</Label>
                        <Input
                          id="price"
                          name="price"
                          type="number"
                          step="0.01"
                          value={bookForm.price}
                          onChange={handleBookFormChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="rentPrice">Prix de location (CAD)</Label>
                        <Input
                          id="rentPrice"
                          name="rentPrice"
                          type="number"
                          step="0.01"
                          value={bookForm.rentPrice}
                          onChange={handleBookFormChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="categorieId">Catégorie *</Label>
                        <select
                          id="categorieId"
                          name="categorieId"
                          value={bookForm.categorieId}
                          onChange={handleBookFormChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Sélectionnez une catégorie</option>
                          {categories.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                              {cat.nom}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="isbn">ISBN</Label>
                        <Input id="isbn" name="isbn" value={bookForm.isbn} onChange={handleBookFormChange} />
                      </div>
                      <div>
                        <Label htmlFor="publisher">Éditeur</Label>
                        <Input
                          id="publisher"
                          name="publisher"
                          value={bookForm.publisher}
                          onChange={handleBookFormChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="publicationYear">Année de publication</Label>
                        <Input
                          id="publicationYear"
                          name="publicationYear"
                          type="number"
                          value={bookForm.publicationYear}
                          onChange={handleBookFormChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="pages">Nombre de pages</Label>
                        <Input id="pages" name="pages" type="number" value={bookForm.pages} onChange={handleBookFormChange} />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="image">URL de l'image *</Label>
                      <Input id="image" name="image" value={bookForm.image} onChange={handleBookFormChange} required />
                    </div>
                    {bookForm.type === 'numerique' && (
                      <div className="space-y-2">
                        <Label htmlFor="pdfFile">Fichier PDF *</Label>
                        <Input
                          id="pdfFile"
                          name="pdfFile"
                          type="file"
                          accept="application/pdf"
                          onChange={handlePdfChange}
                          required={bookForm.type === 'numerique' && !bookForm.pdfUrl}
                        />
                        {(pdfFile || bookForm.pdfUrl) && (
                          <p className="text-xs text-gray-600">
                            {pdfFile ? `Fichier sélectionné : ${pdfFile.name}` : `PDF existant : ${bookForm.pdfUrl}`}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Déposez le fichier PDF (il sera stocké sur le serveur).
                        </p>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={bookForm.description}
                        onChange={handleBookFormChange}
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(false);
                          resetBookForm();
                        }}
                      >
                        Annuler
                      </Button>
                      <Button type="submit" disabled={loading} style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}>
                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left" style={{ color: '#374151' }}>
                        Image
                      </th>
                      <th className="px-6 py-3 text-left" style={{ color: '#374151' }}>
                        Titre
                      </th>
                      <th className="px-6 py-3 text-left" style={{ color: '#374151' }}>
                        Auteur
                      </th>
                      <th className="px-6 py-3 text-left" style={{ color: '#374151' }}>
                        Prix
                      </th>
                      <th className="px-6 py-3 text-left" style={{ color: '#374151' }}>
                        Catégorie
                      </th>
                      <th className="px-6 py-3 text-right" style={{ color: '#374151' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((book) => (
                      <tr key={book._id} className="border-t">
                        <td className="px-6 py-4">
                          <div className="w-12 h-16 rounded overflow-hidden bg-gray-100">
                            <img src={book.image} alt={book.title} className="w-full h-full object-cover" />
                          </div>
                        </td>
                        <td className="px-6 py-4" style={{ color: '#374151' }}>
                          {book.title}
                        </td>
                        <td className="px-6 py-4" style={{ color: '#374151' }}>
                          {book.author}
                        </td>
                        <td className="px-6 py-4" style={{ color: '#2563EB' }}>
                          {book.price.toFixed(2)} CAD
                        </td>
                        <td className="px-6 py-4" style={{ color: '#374151' }}>
                          {book.category || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditBook(book)}>
                              <Edit className="w-4 h-4" style={{ color: '#2563EB' }} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteBook(book._id)}>
                              <Trash2 className="w-4 h-4" style={{ color: '#374151' }} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl" style={{ color: '#374151' }}>
                Gestion des utilisateurs
              </h2>
              <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={resetUserForm}
                    className="flex items-center gap-2"
                    style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
                  >
                    <Plus className="w-5 h-5" />
                    Ajouter un utilisateur
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingUser ? 'Modifier utilisateur' : 'Ajouter un utilisateur'}</DialogTitle>
                    <DialogDescription>
                      Complétez les champs obligatoires pour gérer les accès des membres.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmitUser} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="prenom">Prénom *</Label>
                        <Input id="prenom" name="prenom" value={userForm.prenom} onChange={handleUserFormChange} required />
                      </div>
                      <div>
                        <Label htmlFor="nom">Nom *</Label>
                        <Input id="nom" name="nom" value={userForm.nom} onChange={handleUserFormChange} required />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={userForm.email}
                        onChange={handleUserFormChange}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="role">Rôle</Label>
                        <select
                          id="role"
                          name="role"
                          value={userForm.role}
                          onChange={handleUserFormChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="user">Utilisateur</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="statut">Statut</Label>
                        <select
                          id="statut"
                          name="statut"
                          value={userForm.statut}
                          onChange={handleUserFormChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="actif">Actif</option>
                          <option value="inactif">Inactif</option>
                          <option value="suspendu">Suspendu</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsUserDialogOpen(false);
                          resetUserForm();
                        }}
                      >
                        Annuler
                      </Button>
                      <Button type="submit" disabled={loading} style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}>
                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left" style={{ color: '#374151' }}>
                        Nom complet
                      </th>
                      <th className="px-6 py-3 text-left" style={{ color: '#374151' }}>
                        Email
                      </th>
                      <th className="px-6 py-3 text-left" style={{ color: '#374151' }}>
                        Rôle
                      </th>
                      <th className="px-6 py-3 text-left" style={{ color: '#374151' }}>
                        Date d'inscription
                      </th>
                      <th className="px-6 py-3 text-right" style={{ color: '#374151' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-t">
                        <td className="px-6 py-4" style={{ color: '#374151' }}>
                          {`${user.prenom || ''} ${user.nom || ''}`.trim() || user.email}
                        </td>
                        <td className="px-6 py-4" style={{ color: '#374151' }}>
                          {user.email}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="px-2 py-1 rounded text-sm text-white"
                            style={{
                              backgroundColor: user.role === 'admin' ? '#10B981' : '#06B6D4',
                            }}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4" style={{ color: '#374151' }}>
                          {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                              <Edit className="w-4 h-4" style={{ color: '#2563EB' }} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user._id)}
                              disabled={user.role === 'admin'}
                            >
                              <Trash2 className="w-4 h-4" style={{ color: '#374151' }} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-white rounded-lg shadow-md p-6 border border-slate-100">
                <h3 className="text-xl mb-2" style={{ color: '#1F2937' }}>
                  {editingCategory ? 'Modifier la catégorie' : 'Ajouter une catégorie'}
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Donnez un nom clair et unique à chaque catégorie pour organiser le catalogue.
                </p>
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nom">Nom de la catégorie *</Label>
                    <Input
                      id="nom"
                      name="nom"
                      value={categoryForm.nom}
                      onChange={(e) => setCategoryForm({ nom: e.target.value })}
                      placeholder="Ex: Littérature, Sciences..."
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" disabled={categoryLoading} className="bg-blue-600 hover:bg-blue-700">
                      {categoryLoading ? 'Enregistrement...' : editingCategory ? 'Mettre à jour' : 'Créer'}
                    </Button>
                    {editingCategory && (
                      <Button type="button" variant="outline" onClick={resetCategoryForm}>
                        Annuler
                      </Button>
                    )}
                  </div>
                </form>
              </div>

              <div className="grid gap-4">
                <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4">
                  <p className="text-sm font-semibold text-blue-800">Catégorie créée</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Chaque nouvelle catégorie devient disponible immédiatement dans le formulaire de livres.
                  </p>
                </div>
                <div className="rounded-lg border border-rose-100 bg-rose-50/60 p-4">
                  <p className="text-sm font-semibold text-rose-800">Catégorie supprimée</p>
                  <p className="text-sm text-rose-700 mt-1">
                    Seules les catégories sans livres peuvent être supprimées. Pensez à réaffecter les ouvrages.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-slate-100">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Liste des catégories</h3>
                  <p className="text-sm text-slate-500">{categories.length} catégorie(s) enregistrée(s)</p>
                </div>
                <Button variant="outline" onClick={fetchCategories} className="border-blue-200 text-blue-600">
                  Rafraîchir
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-slate-600 text-sm">Nom</th>
                      <th className="px-6 py-3 text-left text-slate-600 text-sm">Créée le</th>
                      <th className="px-6 py-3 text-right text-slate-600 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category._id} className="border-t">
                        <td className="px-6 py-4 text-slate-900">{category.nom}</td>
                        <td className="px-6 py-4 text-slate-500">
                          {category.dateCreation
                            ? new Date(category.dateCreation).toLocaleDateString('fr-CA')
                            : new Date(category.createdAt || '').toLocaleDateString('fr-CA')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditCategory(category)}>
                              <Edit className="h-4 w-4 mr-1" /> Modifier
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-rose-600 border-rose-200"
                              onClick={() => handleDeleteCategory(category._id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {categories.length === 0 && (
                      <tr>
                        <td className="px-6 py-6 text-center text-slate-500" colSpan={3}>
                          Aucune catégorie pour le moment.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
