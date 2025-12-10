import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Loader2,
  User as UserIcon,
  Mail,
  MapPin,
  Edit2,
  CreditCard,
  Plus,
  Trash2,
  Calendar,
  ShoppingBag,
  TrendingUp,
  BookOpen,
  Clock,
  Shield,
  Package,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Address,
  OrderSummary,
  PaymentMethod,
  UserProfile,
  userService,
} from '../../services/userService';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import api from '../../services/api';

const defaultAddress: Address = {
  rue: '',
  ville: '',
  codePostal: '',
  pays: 'France',
};

const cardBrands = ['Visa', 'Mastercard', 'Amex', 'Discover'];
const months = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, '0'),
);
const years = Array.from({ length: 10 }, (_, index) =>
  String(new Date().getFullYear() + index).slice(-2),
);

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(value);

const formatDate = (value?: string) => {
  if (!value) return 'Non renseigné';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Non renseigné';
  return date.toLocaleDateString('fr-FR');
};

type PaymentFormState = {
  type: 'carte' | 'paypal';
  brand: string;
  cardholderName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  email: string;
  isDefault: boolean;
};

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const initialPaymentForm: PaymentFormState = {
  type: 'carte',
  brand: 'Visa',
  cardholderName: '',
  cardNumber: '',
  expiryMonth: '',
  expiryYear: '',
  cvv: '',
  email: '',
  isDefault: false,
};

const initialPasswordForm: PasswordFormState = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

type DigitalLibraryItem = {
  id: string;
  bookId?: string;
  title: string;
  author: string;
  image?: string;
  pdfUrl?: string;
  startAt: string;
  endAt?: string;
  daysLeft: number;
  expired: boolean;
  statusLabel: string;
  type: string;
  isRental: boolean;
  totalPages?: number;
};

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { logout, refreshProfile, user } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [addressForm, setAddressForm] = useState<Address>(defaultAddress);
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(initialPasswordForm);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(initialPaymentForm);

  const [editingProfile, setEditingProfile] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [orderSummary, setOrderSummary] = useState<{ totalOrders: number; totalAmount: number; booksBought: number; booksRented: number }>({
    totalOrders: 0,
    totalAmount: 0,
    booksBought: 0,
    booksRented: 0,
  });
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [digitalLibrary, setDigitalLibrary] = useState<DigitalLibraryItem[]>([]);
  const [pdfPreview, setPdfPreview] = useState<DigitalLibraryItem | null>(null);
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  useEffect(() => {
    if (!pdfPreview) return;
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (key === 'p' || key === 's' || key === 'c' || key === 'a')) {
        e.preventDefault();
        toast.warning('Copie / impression désactivées dans le viewer protégé.');
      }
    };
    const blockContext = (ev: Event) => ev.preventDefault();
    window.addEventListener('keydown', handler);
    window.addEventListener('contextmenu', blockContext);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('contextmenu', blockContext);
    };
  }, [pdfPreview]);

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    void hydrateDigitalLibrary(orders);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [profileData, paymentData, orderData, orderStats] = await Promise.all([
        userService.getProfile(),
        userService.getPaymentMethods(),
        userService.getOrders(),
        userService.getOrderSummary().catch(() => null),
      ]);

      if (profileData) {
        hydrateProfile(profileData);
      }
      setPaymentMethods(paymentData);
      setOrders(orderData);
      if (orderStats) {
        setOrderSummary({
          totalOrders: orderStats.totalOrders || 0,
          totalAmount: orderStats.totalAmount || 0,
          booksBought: orderStats.booksBought || 0,
          booksRented: orderStats.booksRented || 0,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error('Impossible de charger votre profil. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const hydrateProfile = (data: UserProfile) => {
    setProfile(data);
    const derivedFirstName =
      data.firstName || data.prenom || data.name?.split(' ')[0] || '';
    const derivedLastName =
      data.lastName || data.nom || data.name?.split(' ').slice(1).join(' ') || '';

    setProfileForm({
      firstName: derivedFirstName,
      lastName: derivedLastName,
      email: data.email || '',
    });
    setAddressForm({
      rue: data.address?.rue || '',
      ville: data.address?.ville || '',
      codePostal: data.address?.codePostal || '',
      pays: data.address?.pays || 'France',
    });
  };

  const stats = useMemo(() => {
    const totalOrders = profile?.stats?.totalCommandes ?? orderSummary.totalOrders ?? orders.length;
    const totalSpent =
      profile?.stats?.totalDepense ??
      (orderSummary.totalAmount || orders.reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0));
    const booksBought = profile?.stats?.livresAchetes ?? orderSummary.booksBought ?? 0;
    const rentals = profile?.stats?.livresLoues ?? orderSummary.booksRented ?? 0;

    return {
      totalOrders,
      totalSpent,
      booksBought,
      rentals,
    };
  }, [profile, orders, orderSummary]);

  const activeRentals = useMemo(() => {
    const rentals: {
      id: string;
      title: string;
      author: string;
      rentDate: string;
      dueDate: string;
      daysLeft: number;
    }[] = [];

    const DAY_MS = 24 * 60 * 60 * 1000;

    orders.forEach((order) => {
      order.items
        ?.filter((item) => (item.type || '').toLowerCase().includes('loc') || item.type === 'rent')
        .forEach((item) => {
          const rentDateValue = item.rentalStartAt || order.createdAt || order.placedAt || Date.now();
          const rentDate = new Date(rentDateValue);
          const duration = item.rentalDurationDays || 14;
          const dueDate = new Date(item.rentalEndAt || rentDate.getTime() + duration * DAY_MS);
          const diff = Math.ceil((dueDate.getTime() - Date.now()) / DAY_MS);

          rentals.push({
            id: `${order._id}-${item.bookId}`,
            title: item.title || item.book?.title || 'Livre',
            author: item.author || item.book?.author || 'Auteur',
            rentDate: rentDate.toISOString(),
            dueDate: dueDate.toISOString(),
            daysLeft: diff,
          });
        });
    });

    return rentals;
  }, [orders]);

  const latestOrderAddress = useMemo(() => {
    if (!orders.length) return null;
    const sorted = [...orders].sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });
    const addr = sorted.find((o) => o.shippingAddress)?.shippingAddress as any;
    if (!addr) return null;
    return {
      rue: addr.address || '',
      ville: addr.city || '',
      codePostal: addr.postalCode || '',
      pays: addr.country || '',
    } as Address;
  }, [orders]);

  const displayAddress = useMemo(() => {
    const hasUserAddress = Boolean(addressForm.rue || addressForm.ville || addressForm.codePostal);
    if (hasUserAddress) return addressForm;
    if (latestOrderAddress) return latestOrderAddress;
    return null;
  }, [addressForm, latestOrderAddress]);

  const handleProfileUpdate = async () => {
    try {
      setSavingProfile(true);
      const updated = await userService.updateProfile({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
      });

      if (updated) {
        hydrateProfile(updated);
        await refreshProfile();
      }

      setEditingProfile(false);
      toast.success('Profil mis à jour avec succès.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour du profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddressUpdate = async () => {
    try {
      setSavingAddress(true);
      const updated = await userService.updateProfile({
        address: addressForm,
      });

      if (updated) {
        hydrateProfile(updated);
        await refreshProfile();
      }

      setEditingAddress(false);
      toast.success('Adresse sauvegardée.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour de l’adresse.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error('Merci de compléter tous les champs.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }

    try {
      setChangingPassword(true);
      await userService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm(initialPasswordForm);
      toast.success('Mot de passe mis à jour.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Impossible de mettre à jour le mot de passe.');
    } finally {
      setChangingPassword(false);
    }
  };

  const resetPaymentForm = () => {
    setPaymentForm(initialPaymentForm);
    setPaymentDialogOpen(false);
  };

  const loadPaymentMethods = async () => {
    const data = await userService.getPaymentMethods();
    setPaymentMethods(data);
  };

  const handleAddPaymentMethod = async () => {
    try {
      setPaymentLoading(true);
      if (paymentForm.type === 'carte') {
        if (
          !paymentForm.cardholderName ||
          !paymentForm.cardNumber ||
          !paymentForm.expiryMonth ||
          !paymentForm.expiryYear ||
          !paymentForm.cvv
        ) {
          toast.error('Tous les champs de la carte sont requis.');
          return;
        }
      } else if (!paymentForm.email) {
        toast.error('Merci de renseigner votre email PayPal.');
        return;
      }

      const payload =
        paymentForm.type === 'carte'
          ? {
              type: 'carte',
              brand: paymentForm.brand,
              cardholderName: paymentForm.cardholderName,
              cardNumber: paymentForm.cardNumber.replace(/\s+/g, ''),
              expiryMonth: paymentForm.expiryMonth,
              expiryYear: `20${paymentForm.expiryYear}`,
              cvv: paymentForm.cvv,
              isDefault: paymentForm.isDefault,
            }
          : {
              type: 'paypal',
              email: paymentForm.email,
              isDefault: paymentForm.isDefault,
            };

      await userService.addPaymentMethod(payload);
      await loadPaymentMethods();
      toast.success('Moyen de paiement ajouté.');
      resetPaymentForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l’ajout du moyen de paiement.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSetDefaultPayment = async (id: string) => {
    try {
      await userService.setDefaultPaymentMethod(id);
      await loadPaymentMethods();
      toast.success('Méthode par défaut mise à jour.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Impossible de définir cette méthode.');
    }
  };

  const handleRemovePaymentMethod = async (id: string) => {
    try {
      await userService.removePaymentMethod(id);
      await loadPaymentMethods();
      toast.success('Méthode supprimée.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Suppression impossible.');
    }
  };

  const handleOpenPdf = async (item: DigitalLibraryItem) => {
    if (item.expired) {
      toast.error('Accès expiré pour cette location.');
      return;
    }
    if (!item.pdfUrl) {
      toast.error('PDF non disponible pour ce livre.');
      return;
    }
    const win = window.open(item.pdfUrl, '_blank', 'noopener,noreferrer');
    if (!win) {
      toast.error('Le navigateur a bloqué l’ouverture du PDF (pop-up). Autorisez les pop-ups pour ce site.');
    }
  };

  const hydrateDigitalLibrary = async (orderList: OrderSummary[]) => {
    const DAY_MS = 24 * 60 * 60 * 1000;
    const items: DigitalLibraryItem[] = [];
    const missingPdfBookIds = new Set<string>();

    orderList.forEach((order) => {
      (order.items || []).forEach((item) => {
        const rawType = (item.type || '').toLowerCase();
        const bookType = (item.bookType || item.book?.type || '').toLowerCase();
        const isRental = rawType.includes('loc') || rawType === 'rent';
        const isDigital = isRental || bookType === 'numerique';
        if (!isDigital) return;

        const startRaw = item.rentalStartAt || order.createdAt || order.placedAt || Date.now();
        const startAt = new Date(startRaw);
        const duration = isRental ? (item.rentalDurationDays || 14) : 3650;
        const endAtDate = isRental ? new Date(item.rentalEndAt || startAt.getTime() + duration * DAY_MS) : null;
        const daysLeft = isRental
          ? Math.ceil((endAtDate!.getTime() - Date.now()) / DAY_MS)
          : 9999;
        const expired = isRental ? daysLeft < 0 : false;
        const statusLabel = isRental
          ? expired
            ? 'Accès expiré'
            : `Accès autorisé · ${daysLeft} j restants`
          : 'Accès permanent';

        const pdfUrl =
          item.pdfUrl ||
          item.book?.pdfUrl ||
          undefined;
        if (!pdfUrl && item.bookId) {
          missingPdfBookIds.add(item.bookId);
        }

        items.push({
          id: `${order._id}-${item.bookId}`,
          bookId: item.bookId,
          title: item.title || item.book?.title || 'Livre numérique',
          author: item.author || item.book?.author || 'Auteur',
          image: item.image || item.book?.image,
          pdfUrl,
          startAt: startAt.toISOString(),
          endAt: endAtDate?.toISOString(),
          daysLeft,
          expired,
          statusLabel,
          type: rawType || bookType || 'rent',
          isRental,
        });
      });
    });

    setDigitalLibrary(items);

    if (missingPdfBookIds.size === 0) return;
    try {
      setPdfLoading(true);
      const ids = Array.from(missingPdfBookIds);
      const fetched = await Promise.all(
        ids.map(async (id) => {
          try {
            const book = await api.books.getBook(id);
            return { id, pdfUrl: book?.pdfUrl || (book?.pdfBase64 ? `data:application/pdf;base64,${book.pdfBase64}` : undefined) };
          } catch (err) {
            console.warn('Impossible de récupérer le PDF pour', id, err);
            return { id, pdfUrl: undefined as string | undefined };
          }
        })
      );

      setDigitalLibrary((prev) =>
        prev.map((item) => {
          const patch = fetched.find((f) => f.id === item.bookId);
          if (!patch || !patch.pdfUrl || item.pdfUrl) return item;
          return { ...item, pdfUrl: patch.pdfUrl };
        })
      );
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'SUPPRIMER') {
      toast.error('Veuillez taper SUPPRIMER pour confirmer.');
      return;
    }

    try {
      await userService.deleteAccount();
      toast.success('Compte supprimé.');
      logout();
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression du compte.');
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
        <p className="text-gray-500">Chargement de vos informations...</p>
      </div>
    );
  }

  const defaultPayment = paymentMethods.find((method) => method.isDefault);
  const displayFirstName =
    profile.firstName || profile.prenom || profile.name?.split(' ')[0] || '';
  const displayLastName =
    profile.lastName || profile.nom || profile.name?.split(' ').slice(1).join(' ') || '';

  return (
    <main className="min-h-screen bg-white py-10">
      <div className="max-w-[1216px] mx-auto px-4">
        <div className="bg-[#F9FAFB] border border-slate-100 rounded-[28px] shadow-sm px-6 md:px-8 py-8 space-y-8">
          <header className="flex flex-col gap-1 pb-2">
            <h1 className="text-3xl font-semibold text-slate-900">Mon Profil</h1>
            <p className="text-sm text-slate-600">
              Gérez vos informations personnelles et vos préférences
            </p>
          </header>

          <div className="grid gap-4 md:grid-cols-4">
            <Card className="rounded-2xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-gray-700 font-medium">
                  <span className="h-7 w-7 rounded-full bg-blue-50 flex items-center justify-center">
                    <ShoppingBag className="h-4 w-4 text-blue-600" />
                  </span>
                  Commandes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold text-blue-700">{stats.totalOrders}</p>
                <p className="text-xs text-gray-500">Total des commandes</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-gray-700 font-medium">
                  <span className="h-7 w-7 rounded-full bg-emerald-50 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </span>
                  Dépenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold text-emerald-600">
                  {formatCurrency(stats.totalSpent)}
                </p>
                <p className="text-xs text-gray-500">Total dépensé</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-gray-700 font-medium">
                  <span className="h-7 w-7 rounded-full bg-orange-50 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-orange-500" />
                  </span>
                  Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold text-orange-600">
                  {activeRentals.length || stats.rentals}
                </p>
                <p className="text-xs text-gray-500">En cours</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-gray-700 font-medium">
                  <span className="h-7 w-7 rounded-full bg-purple-50 flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-purple-600" />
                  </span>
                  Genre favori
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base font-semibold text-purple-600">
                  {profile.favoriteGenre || 'Sciences'}
                </p>
                <p className="text-xs text-gray-500">Le plus commandé</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="flex flex-wrap md:flex-nowrap w-full items-center gap-2 bg-[#EAECF0] border border-slate-200 rounded-full p-1 shadow-inner transition-all duration-200">
              <TabsTrigger
                value="profile"
                className="flex-1 min-w-[120px] rounded-full px-4 py-2 text-sm font-medium text-slate-700 border border-transparent transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:border data-[state=active]:border-slate-200 data-[state=active]:shadow-md data-[state=active]:translate-y-[-1px]"
              >
                Profil
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="flex-1 min-w-[120px] rounded-full px-4 py-2 text-sm font-medium text-slate-700 border border-transparent transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:border data-[state=active]:border-slate-200 data-[state=active]:shadow-md data-[state=active]:translate-y-[-1px]"
              >
                Paiement
              </TabsTrigger>
              <TabsTrigger
                value="rentals"
                className="flex-1 min-w-[120px] rounded-full px-4 py-2 text-sm font-medium text-slate-700 border border-transparent transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:border data-[state=active]:border-slate-200 data-[state=active]:shadow-md data-[state=active]:translate-y-[-1px]"
              >
                Locations
              </TabsTrigger>
              <TabsTrigger
                value="library"
                className="flex-1 min-w-[120px] rounded-full px-4 py-2 text-sm font-medium text-slate-700 border border-transparent transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:border data-[state=active]:border-slate-200 data-[state=active]:shadow-md data-[state=active]:translate-y-[-1px]"
              >
                Mes livres
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="flex-1 min-w-[120px] rounded-full px-4 py-2 text-sm font-medium text-slate-700 border border-transparent transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:border data-[state=active]:border-slate-200 data-[state=active]:shadow-md data-[state=active]:translate-y-[-1px]"
              >
                Historique
              </TabsTrigger>
              <TabsTrigger
                value="account"
                className="flex-1 min-w-[120px] rounded-full px-4 py-2 text-sm font-medium text-slate-700 border border-transparent transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:border data-[state=active]:border-slate-200 data-[state=active]:shadow-md data-[state=active]:translate-y-[-1px]"
              >
                Compte
              </TabsTrigger>
            </TabsList>

                    <TabsContent value="profile" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-2xl border border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <UserIcon className="h-4 w-4 text-blue-600" />
                    Informations personnelles
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setEditingProfile((prev) => !prev)}>
                    <Edit2 className="h-4 w-4 mr-1" />
                    {editingProfile ? 'Fermer' : 'Modifier'}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label className="text-xs text-slate-500">Prénom</Label>
                      <Input
                        disabled={!editingProfile}
                        className={!editingProfile ? 'bg-slate-100' : ''}
                        value={profileForm.firstName}
                        onChange={(e) =>
                          setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Nom</Label>
                      <Input
                        disabled={!editingProfile}
                        className={!editingProfile ? 'bg-slate-100' : ''}
                        value={profileForm.lastName}
                        onChange={(e) =>
                          setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Email</Label>
                    <Input
                      type="email"
                      disabled={!editingProfile}
                      className={!editingProfile ? 'bg-slate-100' : ''}
                      value={profileForm.email}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label className="text-xs text-slate-500">Téléphone</Label>
                      <Input disabled className="bg-slate-100" placeholder="06 12 34 56 78" value={profile.phone || ''} />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Date de naissance</Label>
                      <Input disabled className="bg-slate-100" placeholder="Non renseignée" value={profile.birthDate || ''} />
                    </div>
                  </div>
                  {editingProfile && (
                    <div className="flex gap-2 flex-wrap">
                      <Button onClick={handleProfileUpdate} disabled={savingProfile}>
                        {savingProfile ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Sauvegarde...
                          </>
                        ) : (
                          'Sauvegarder'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingProfile(false)}
                        disabled={savingProfile}
                      >
                        Annuler
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    Adresse de livraison
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setEditingAddress((prev) => !prev)}>
                    <Edit2 className="h-4 w-4 mr-1" />
                    {editingAddress ? 'Fermer' : 'Modifier'}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!editingAddress && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700">
                      {displayAddress ? (
                        <>
                          <p>{displayAddress.rue || 'Rue non renseignée'}</p>
                          <p>{[displayAddress.codePostal, displayAddress.ville].filter(Boolean).join(' ') || 'Ville non renseignée'}</p>
                          <p>{displayAddress.pays || 'Pays non renseigné'}</p>
                        </>
                      ) : (
                        <p className="text-slate-500">Aucune adresse enregistrée</p>
                      )}
                    </div>
                  )}
                  <div>
                    <Label className="text-xs text-slate-500">Rue</Label>
                    <Input
                      disabled={!editingAddress}
                      className={!editingAddress ? 'bg-slate-100' : ''}
                      value={addressForm.rue}
                      onChange={(e) =>
                        setAddressForm((prev) => ({ ...prev, rue: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label className="text-xs text-slate-500">Code postal</Label>
                      <Input
                        disabled={!editingAddress}
                        className={!editingAddress ? 'bg-slate-100' : ''}
                        value={addressForm.codePostal}
                        onChange={(e) =>
                          setAddressForm((prev) => ({ ...prev, codePostal: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Ville</Label>
                      <Input
                        disabled={!editingAddress}
                        className={!editingAddress ? 'bg-slate-100' : ''}
                        value={addressForm.ville}
                        onChange={(e) =>
                          setAddressForm((prev) => ({ ...prev, ville: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Pays</Label>
                    <Input
                      disabled={!editingAddress}
                      className={!editingAddress ? 'bg-slate-100' : ''}
                      value={addressForm.pays}
                      onChange={(e) =>
                        setAddressForm((prev) => ({ ...prev, pays: e.target.value }))
                      }
                    />
                  </div>
                  {editingAddress && (
                    <div className="flex gap-2">
                      <Button onClick={handleAddressUpdate} disabled={savingAddress}>
                        {savingAddress ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Sauvegarde...
                          </>
                        ) : (
                          'Sauvegarder'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingAddress(false)}
                        disabled={savingAddress}
                      >
                        Annuler
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
<TabsContent value="payments" className="space-y-6">
            <Card className="rounded-2xl border border-slate-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    Moyens de paiement
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-2">
                    {defaultPayment
                      ? `Méthode par défaut : ${
                          defaultPayment.brand || defaultPayment.type
                        } •••• ${defaultPayment.last4}`
                      : 'Aucun moyen de paiement enregistré.'}
                  </p>
                </div>
                <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ajouter un moyen de paiement</DialogTitle>
                      <DialogDescription>
                        Enregistrez une nouvelle carte bancaire ou un compte PayPal sécurisé.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={paymentForm.type}
                          onValueChange={(value: 'carte' | 'paypal') =>
                            setPaymentForm((prev) => ({ ...prev, type: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="carte">Carte bancaire</SelectItem>
                            <SelectItem value="paypal">PayPal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {paymentForm.type === 'carte' ? (
                        <div className="space-y-3">
                          <div>
                            <Label>Marque</Label>
                            <Select
                              value={paymentForm.brand}
                              onValueChange={(value) =>
                                setPaymentForm((prev) => ({ ...prev, brand: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir" />
                              </SelectTrigger>
                              <SelectContent>
                                {cardBrands.map((brand) => (
                                  <SelectItem key={brand} value={brand}>
                                    {brand}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Nom sur la carte</Label>
                            <Input
                              value={paymentForm.cardholderName}
                              onChange={(e) =>
                                setPaymentForm((prev) => ({
                                  ...prev,
                                  cardholderName: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div>
                            <Label>Numéro</Label>
                            <Input
                              value={paymentForm.cardNumber}
                              onChange={(e) =>
                                setPaymentForm((prev) => ({
                                  ...prev,
                                  cardNumber: e.target.value,
                                }))
                              }
                              placeholder="1234 5678 9012 3456"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Expiration</Label>
                              <div className="flex gap-2">
                                <Select
                                  value={paymentForm.expiryMonth}
                                  onValueChange={(value) =>
                                    setPaymentForm((prev) => ({ ...prev, expiryMonth: value }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="MM" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {months.map((month) => (
                                      <SelectItem key={month} value={month}>
                                        {month}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={paymentForm.expiryYear}
                                  onValueChange={(value) =>
                                    setPaymentForm((prev) => ({ ...prev, expiryYear: value }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="AA" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {years.map((year) => (
                                      <SelectItem key={year} value={year}>
                                        {year}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <Label>CVV</Label>
                              <Input
                                value={paymentForm.cvv}
                                onChange={(e) =>
                                  setPaymentForm((prev) => ({ ...prev, cvv: e.target.value }))
                                }
                                placeholder="123"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Label>Email PayPal</Label>
                          <Input
                            type="email"
                            value={paymentForm.email}
                            onChange={(e) =>
                              setPaymentForm((prev) => ({ ...prev, email: e.target.value }))
                            }
                          />
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={resetPaymentForm}
                        disabled={paymentLoading}
                      >
                        Annuler
                      </Button>
                      <Button onClick={handleAddPaymentMethod} disabled={paymentLoading}>
                        {paymentLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Ajout...
                          </>
                        ) : (
                          'Ajouter'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentMethods.length === 0 && (
                  <p className="text-sm text-gray-500">
                    Aucun moyen de paiement enregistré pour l’instant.
                  </p>
                )}
                {paymentMethods.map((method) => (
                  <div
                    key={method._id}
                    className="flex flex-col gap-2 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {method.brand || method.type.toUpperCase()} •••• {method.last4}
                      </p>
                      <p className="text-sm text-gray-500">
                        Expire le {method.expiresAt || '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {method.isDefault ? (
                        <Badge className="bg-blue-100 text-blue-700">Par défaut</Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefaultPayment(method._id)}
                        >
                          Définir par défaut
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleRemovePaymentMethod(method._id)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rentals" className="space-y-6">
            <Card className="rounded-2xl border border-slate-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Locations en cours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeRentals.length === 0 ? (
                  <div className="text-center text-sm text-gray-500">
                    Vous n’avez aucune location active pour le moment.
                  </div>
                ) : (
                  activeRentals.map((rental) => (
                    <div
                      key={rental.id}
                      className="grid gap-2 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-center"
                    >
                      <div>
                        <p className="font-medium">{rental.title}</p>
                        <p className="text-sm text-gray-500">{rental.author}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        <span className="block">
                          Loué le {formatDate(rental.rentDate)}
                        </span>
                        <span className="block">
                          Retour le {formatDate(rental.dueDate)}
                        </span>
                      </div>
                      <div>
                        <Badge
                          className={
                            rental.daysLeft < 0
                              ? 'bg-red-100 text-red-700'
                              : rental.daysLeft <= 3
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-emerald-100 text-emerald-700'
                          }
                        >
                          {rental.daysLeft < 0
                            ? `En retard de ${Math.abs(rental.daysLeft)} j`
                            : `${rental.daysLeft} j restants`}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Prolonger
                        </Button>
                        <Button variant="outline" size="sm">
                          Retourner
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="library" className="space-y-6">
            <Card className="rounded-2xl border border-slate-100 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-emerald-500 px-6 py-4 text-white flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <BookOpen className="h-5 w-5" />
                    Mes livres numériques
                  </CardTitle>
                  <p className="text-sm text-sky-50/90">
                    Accès limité à la période de location. Lecture intégrée sans impression ni copie.
                  </p>
                </div>
                {pdfLoading && (
                  <span className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Préparation des fichiers...
                  </span>
                )}
              </div>
              <CardContent className="space-y-4 bg-gradient-to-br from-slate-50 via-white to-emerald-50">
                {digitalLibrary.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 py-10 border border-dashed border-slate-200 rounded-xl bg-white">
                    Vous n’avez pas encore de livres numériques disponibles.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {digitalLibrary.map((item) => {
                      const badgeClass = item.isRental
                        ? item.expired
                          ? 'bg-red-100 text-red-700'
                          : item.daysLeft <= 3
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-emerald-100 text-emerald-700'
                        : 'bg-emerald-100 text-emerald-700';
                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-slate-200 p-4 flex gap-4 bg-white shadow-md hover:shadow-lg transition-shadow duration-200"
                        >
                          <div className="w-16 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 ring-1 ring-slate-200">
                            {item.image ? (
                              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                                PDF
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div>
                              <p className="font-semibold text-slate-900">{item.title}</p>
                              <p className="text-sm text-slate-500">{item.author}</p>
                            </div>
                            <div className="flex flex-wrap gap-2 items-center">
                              <Badge className={badgeClass}>{item.statusLabel}</Badge>
                              <Badge variant="outline" className="text-xs text-slate-600 border-blue-200 text-blue-700">
                                {item.isRental ? 'Location' : 'Achat numérique'}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500">
                              {item.isRental && item.endAt
                                ? `Accès jusqu’au ${formatDate(item.endAt)}`
                                : 'Accès permanent'}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleOpenPdf(item)}
                                disabled={(item.isRental && item.expired) || !item.pdfUrl}
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                              >
                                Lire
                              </Button>
                              <Badge variant="outline" className="text-xs text-slate-600">
                                Impression/Copie verrouillées
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="rounded-2xl border border-slate-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                  Dernières commandes
                </CardTitle>
                <Button variant="ghost" onClick={() => navigate('/orders')}>
                  Voir toutes les commandes
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center text-sm text-slate-500 py-16 gap-3 border border-dashed border-slate-200 rounded-xl">
                    <Package className="h-8 w-8 text-slate-400" />
                    <p>Votre historique détaillé est disponible dans la section&nbsp;
                      <button
                        className="text-blue-600 underline"
                        onClick={() => navigate('/orders')}
                      >
                        Mes commandes
                      </button>
                    </p>
                  </div>
                ) : (
                  orders.slice(0, 5).map((order) => (
                    <div
                      key={order._id}
                      className="grid gap-4 rounded-lg border p-4 md:grid-cols-4 md:items-center"
                    >
                      <div>
                        <p className="font-medium">
                          Commande {order.number || order._id.slice(-6)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Passée le {formatDate(order.createdAt || order.placedAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Articles</p>
                        <p className="text-sm">
                          {order.items?.map((item) => item.title).join(', ')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="font-semibold">
                          {formatCurrency(order.totalAmount || order.total)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <Badge className="capitalize">
                          {order.status?.replace('_', ' ') || 'en attente'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/orders?id=${order._id}`)}
                        >
                          Détails
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-2xl border border-slate-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Sécurité du compte
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Mot de passe actuel</Label>
                    <Input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Nouveau mot de passe</Label>
                      <Input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Confirmer</Label>
                      <Input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <Button onClick={handlePasswordChange} disabled={changingPassword}>
                    {changingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Mise à jour...
                      </>
                    ) : (
                      'Mettre à jour'
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-red-200 rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <Trash2 className="h-5 w-5" />
                    Supprimer mon compte
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-red-600">
                    Cette action est irréversible. Toutes vos données seront supprimées et vous
                    perdrez l’accès à votre historique.
                  </p>
                  <div>
                    <Label>Confirmation</Label>
                    <Input
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      placeholder='Tapez "SUPPRIMER"'
                    />
                  </div>
                  <Button variant="destructive" onClick={handleDeleteAccount}>
                    Supprimer définitivement mon compte
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    {/* Viewer modal retiré : ouverture dans un nouvel onglet */}
  </main>
  );
};
