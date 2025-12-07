import { useApp } from "./AppContext";

export function useNavigation() {
  const { setCurrentPage, navigateWithData } = useApp();

  return {
    // Navigation simple
    goHome: () => setCurrentPage('home'),
    goToLogin: () => setCurrentPage('login'),
    goToCart: () => setCurrentPage('cart'),
    goToProfile: () => setCurrentPage('profile'),
    goToOrders: () => setCurrentPage('orders'),
    
    // Navigation avec données
    goToBookDetails: (book: any) => navigateWithData('book-details', book),
    
    // Navigation admin
    goToAdminDashboard: () => setCurrentPage('admin-dashboard'),
    goToAdminUsers: () => setCurrentPage('admin-users'),
    goToAdminCatalog: () => setCurrentPage('admin-catalog'),
    goToAdminOrders: () => setCurrentPage('admin-orders'),
    goToAdminNotifications: () => setCurrentPage('admin-notifications'),
    
    // Navigation conditionnelle
    goToCheckout: () => setCurrentPage('checkout'),
    goToConfirmation: () => setCurrentPage('confirmation'),
    
    // Navigation générique
    navigateTo: (page: string) => setCurrentPage(page),
    navigateWithData: (page: string, data?: any) => navigateWithData(page, data)
  };
}