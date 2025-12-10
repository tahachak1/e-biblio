import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import type { User, Book, CartItem as APICartItem, Order } from '../types';
import { toast } from 'sonner@2.0.3';

// Interface pour les items du panier côté UI
interface CartItem extends APICartItem {
  title?: string;
  author?: string;
  coverImage?: string;
  bookType?: string;
  rentPrice?: number;
}

interface AppContextType {
  // Navigation
  currentPage: string;
  setCurrentPage: (page: string) => void;
  navigateWithData: (page: string, data?: any) => void;
  
  // User management
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { firstName: string; lastName: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  
  // Cart management
  cart: CartItem[];
  cartLoading: boolean;
  addToCart: (book: Book) => Promise<void>;
  removeFromCart: (bookId: string) => Promise<void>;
  updateQuantity: (bookId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  
  // Selected book for details
  selectedBook: Book | null;
  setSelectedBook: (book: Book | null) => void;
  
  // Orders
  orders: Order[];
  loadOrders: () => Promise<void>;
  createOrder: (paymentMethod: string) => Promise<Order>;
  
  // Books
  books: Book[];
  booksLoading: boolean;
  loadBooks: (params?: { category?: string; search?: string; page?: number }) => Promise<void>;
  
  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Admin stats
  adminStats: {
    totalUsers: number;
    totalBooks: number;
    totalOrders: number;
    totalRevenue: number;
    ordersToday?: number;
    totalVentes?: number;
    locationsActives?: number;
    retards?: number;
    topLivres?: string[];
    revenueTrend?: any[];
    categoryDistribution?: any[];
    recentOrders?: any[];
    salesData?: any[];
  };
  loadAdminStats: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    totalBooks: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalVentes: 0,
    ordersToday: 0,
    locationsActives: 0,
    retards: 0,
    topLivres: [] as string[],
    revenueTrend: [] as any[],
    categoryDistribution: [] as any[],
    recentOrders: [] as any[],
    salesData: [] as any[],
  });

  // Charger le profil utilisateur au démarrage si token existe
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUserProfile();
    }
  }, []);

  // Charger le panier quand l'utilisateur se connecte
  useEffect(() => {
    if (user) {
      refreshCart();
    } else {
      setCart([]);
    }
  }, [user]);

  // Charger le profil utilisateur
  const loadUserProfile = async () => {
    try {
      const authApi = (api as any).auth;
      if (!authApi?.getProfile) {
        return;
      }

      const profile = await authApi.getProfile();
      const userData = profile?.user ?? profile ?? null;
      setUser(userData || null);
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      localStorage.removeItem('token');
    }
  };

  // Connexion
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const authApi = (api as any).auth;
      if (!authApi?.login) {
        throw new Error('Endpoint de connexion indisponible');
      }

      const { token, user: userData } = (await authApi.login({ email, password })) || {};
      if (!token || !userData) {
        throw new Error('Réponse de connexion invalide');
      }
      localStorage.setItem('token', token);
      setUser(userData);
      toast.success(`Bienvenue ${userData.firstName} !`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur de connexion');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Inscription
  const register = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => {
    try {
      setIsLoading(true);
      const authApi = (api as any).auth;
      if (!authApi?.register) {
        throw new Error('Endpoint d’inscription indisponible');
      }

      const { token, user: userData } = (await authApi.register(data)) || {};
      if (!token || !userData) {
        throw new Error('Réponse d’inscription invalide');
      }
      localStorage.setItem('token', token);
      setUser(userData);
      toast.success('Inscription réussie !');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'inscription');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Déconnexion
  const logout = async () => {
    try {
      const authApi = (api as any).auth;
      if (authApi?.logout) {
        await authApi.logout();
      }
      setUser(null);
      setCart([]);
      setOrders([]);
      setCurrentPage('home');
      toast.success('Déconnexion réussie');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  // Charger le panier depuis l'API
  const refreshCart = async () => {
    if (!user) return;
    
    try {
      setCartLoading(true);
      const cartApi = (api as any).cart;
      if (!cartApi?.getCart) {
        setCart([]);
        return;
      }

      const cartData = (await cartApi.getCart().catch((err: any) => {
        if (err?.response?.status === 404) {
          return { items: [], total: 0 };
        }
        throw err;
      })) || { items: [], total: 0 };
      
      // Enrichir les items du panier avec les infos des livres
      const enrichedItems = await Promise.all(
        (cartData.items || []).map(async (item: any) => {
          try {
            const bookApi = (api as any).books;
            if (!bookApi?.getBook) return item;
            const book = await bookApi.getBook(item.bookId);
            const itemType = (item.type || (book?.type === 'numerique' ? 'location' : 'achat') || '').toString().toLowerCase();
            const rent = item.rentPrice
              ?? (itemType.includes('loc') ? item.price : undefined)
              ?? book?.rentPrice;
            return {
              ...item,
              title: book?.title,
              author: book?.author,
              coverImage: book?.coverImage,
              bookType: book?.type,
              rentPrice: rent,
              price: item.price ?? rent ?? book?.price ?? 0,
              type: item.type || (book?.type === 'numerique' ? 'location' : 'achat'),
            };
          } catch (error) {
            return item;
          }
        })
      );
      
      setCart(enrichedItems);
    } catch (error: any) {
      console.error('Erreur chargement panier:', error);
      // Panier optionnel: ne pas bloquer l'UI si l'API n'existe pas
      toast.error(error?.response?.status === 404 ? 'Panier indisponible' : 'Impossible de charger le panier');
    } finally {
      setCartLoading(false);
    }
  };

  // Ajouter au panier
  const addToCart = async (book: Book) => {
    if (!user) {
      toast.error('Veuillez vous connecter pour ajouter au panier');
      setCurrentPage('login');
      return;
    }

    try {
      const cartApi = (api as any).cart;
      if (!cartApi?.addToCart) {
        toast.error('Panier indisponible');
        return;
      }

      await cartApi.addToCart({
        bookId: book._id,
        quantity: 1,
        price: book.price,
        rentPrice: (book as any).rentPrice,
        type: (book as any).type === 'numerique' ? 'rent' : 'achat',
        bookType: (book as any).type,
      });
      
      toast.success('Livre ajouté au panier !');
      await refreshCart();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'ajout au panier');
    }
  };

  // Supprimer du panier
  const removeFromCart = async (bookId: string) => {
    try {
      const cartApi = (api as any).cart;
      if (!cartApi?.removeFromCart) {
        toast.error('Panier indisponible');
        return;
      }
      await cartApi.removeFromCart(bookId).catch((err: any) => {
        if (err?.response?.status === 404) return;
        throw err;
      });
      toast.success('Livre retiré du panier');
      await refreshCart();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  // Mettre à jour la quantité
  const updateQuantity = async (bookId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(bookId);
      return;
    }

    try {
      const cartApi = (api as any).cart;
      if (!cartApi?.updateCartItem) return;
      await cartApi.updateCartItem(bookId, quantity);
      await refreshCart();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  };

  // Vider le panier
  const clearCart = async () => {
    try {
      const cartApi = (api as any).cart;
      if (!cartApi?.clearCart) {
        setCart([]);
        return;
      }
      await cartApi.clearCart();
      setCart([]);
      toast.success('Panier vidé');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du vidage du panier');
    }
  };

  // Charger les commandes
  const loadOrders = async () => {
    if (!user) return;

    try {
      const ordersApi = (api as any).orders;
      if (!ordersApi?.getOrders) return;
      const ordersData = (await ordersApi.getOrders()) || [];
      setOrders(ordersData);
    } catch (error: any) {
      console.error('Erreur chargement commandes:', error);
      toast.error('Impossible de charger les commandes');
    }
  };

  // Créer une commande
  const createOrder = async (paymentMethod: string): Promise<Order> => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      const cartApi = (api as any).cart;
      const ordersApi = (api as any).orders;
      if (!cartApi?.getCart || !ordersApi?.createOrder) {
        throw new Error('Fonctionnalité commande indisponible');
      }

      const cartData = (await cartApi.getCart()) || { items: [], total: 0 };
      
      const order = await ordersApi.createOrder({
        items: (cartData.items || []).map((item: any) => ({
          bookId: item.bookId,
          quantity: item.quantity,
        })),
        total: cartData.total,
        paymentMethod,
      });

      await clearCart();
      await loadOrders();
      
      return order;
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création de la commande');
      throw error;
    }
  };

  // Charger les livres
  const loadBooks = async (params?: {
    category?: string;
    search?: string;
    page?: number;
  }) => {
    try {
      setBooksLoading(true);
      const booksApi = (api as any).books;
      if (!booksApi?.getBooks) {
        setBooks([]);
        return;
      }
      const response = (await booksApi.getBooks(params)) || {};
      const booksData = response.books || response || [];
      setBooks(Array.isArray(booksData) ? booksData : []);
    } catch (error: any) {
      console.error('Erreur chargement livres:', error);
      setBooks([]);
      toast.error('Backend indisponible : impossible de charger les livres.');
    } finally {
      setBooksLoading(false);
    }
  };

  // Charger les statistiques admin
  const loadAdminStats = async () => {
    if (!user || user.role !== 'admin') return;

    try {
      const adminApi = (api as any).admin;
      const ordersApi = (api as any).orders;
      if (!adminApi?.getStats) {
        return;
      }
      const [stats, orderSummary] = await Promise.all([
        adminApi.getStats(),
        ordersApi?.getAdminSummary ? ordersApi.getAdminSummary() : Promise.resolve(null),
      ]);
      const totals = stats?.totals || {};
      const topProducts = (stats?.topProducts ?? stats?.topLivres ?? []) as any[];
      const topTitles = topProducts.map((item) => {
        if (typeof item === 'string') return item;
        if (!item) return 'Produit';
        return item.title || item.name || 'Produit';
      });
      setAdminStats((prev) => ({
        ...prev,
        ...(stats || {}),
        totalUsers: totals.users ?? stats?.totalUsers ?? prev.totalUsers ?? 0,
        totalBooks: totals.books ?? stats?.totalBooks ?? prev.totalBooks ?? 0,
        totalOrders: totals.orders ?? orderSummary?.totalOrders ?? stats?.totalOrders ?? prev.totalOrders ?? 0,
        totalRevenue: totals.revenue ?? orderSummary?.totalAmount ?? stats?.totalRevenue ?? prev.totalRevenue ?? 0,
        totalVentes: totals.revenue ?? orderSummary?.totalAmount ?? stats?.totalVentes ?? stats?.totalRevenue ?? prev.totalVentes ?? 0,
        ordersToday: stats?.ordersToday ?? orderSummary?.ordersToday ?? prev.ordersToday ?? 0,
        locationsActives: stats?.locationsActives ?? prev.locationsActives ?? 0,
        retards: stats?.retards ?? prev.retards ?? 0,
        topLivres: topTitles.length ? topTitles : prev.topLivres ?? [],
        revenueTrend: stats?.revenueTrend ?? stats?.salesData ?? prev.revenueTrend ?? [],
        categoryDistribution: stats?.categoryDistribution ?? stats?.categories ?? prev.categoryDistribution ?? [],
        recentOrders: stats?.recentOrders ?? prev.recentOrders ?? [],
        salesData: stats?.salesData ?? prev.salesData ?? [],
      }));
    } catch (error: any) {
      console.error('Erreur chargement stats:', error);
      toast.error('Impossible de charger les statistiques');
    }
  };

  const navigateWithData = (page: string, data?: any) => {
    if (data && page === 'book-details') {
      setSelectedBook(data);
    }
    setCurrentPage(page);
  };

  const value: AppContextType = {
    currentPage,
    setCurrentPage,
    navigateWithData,
    user,
    setUser,
    login,
    register,
    logout,
    cart,
    cartLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCart,
    selectedBook,
    setSelectedBook,
    orders,
    loadOrders,
    createOrder,
    books,
    booksLoading,
    loadBooks,
    isLoading,
    setIsLoading,
    adminStats,
    loadAdminStats,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
