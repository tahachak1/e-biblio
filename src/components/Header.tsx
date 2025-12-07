import { Search, ShoppingCart, User, BookOpen, Menu, Settings } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useApp } from "./AppContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";

export function Header() {
  const { user, cart, setCurrentPage, logout } = useApp();
  
  const handleLogoClick = () => {
    setCurrentPage('home');
  };

  const handleLoginClick = () => {
    setCurrentPage('login');
  };

  const handleCartClick = () => {
    setCurrentPage('cart');
  };

  const handleProfileClick = () => {
    if (user) {
      setCurrentPage('profile');
    } else {
      setCurrentPage('login');
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleAdminClick = () => {
    setCurrentPage('admin-dashboard');
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 h-18 bg-white dark:bg-[#1a1a1a] shadow-sm border-b border-gray-200 dark:border-[#2a2a2a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80"
            onClick={handleLogoClick}
          >
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <BookOpen className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">e-Biblio</h1>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher un livre..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {!user ? (
              <Button variant="outline" size="sm" onClick={handleLoginClick}>
                Connexion
              </Button>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  Bonjour, {user.firstName}
                </span>
                {user.role === 'admin' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAdminClick}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Admin
                  </Button>
                )}
              </div>
            )}
            
            <div className="relative cursor-pointer" onClick={handleCartClick}>
              <ShoppingCart className="h-6 w-6 text-gray-600 hover:text-blue-600" />
              {cartItemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                  {cartItemCount}
                </Badge>
              )}
            </div>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-200">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleProfileClick}>
                    Mon profil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentPage('orders')}>
                    Mes commandes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div 
                className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-400"
                onClick={handleProfileClick}
              >
                <User className="h-4 w-4 text-gray-600" />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
