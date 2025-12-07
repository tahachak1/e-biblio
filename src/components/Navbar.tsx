import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Menu, X, BookOpen, LayoutDashboard, Sun, Moon, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { ChatbotWidget } from './ChatbotWidget';

const THEME_KEY = 'ebiblio-theme';

type ThemeMode = 'light' | 'dark';

export const Navbar = () => {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const displayName = user?.firstName || user?.prenom || user?.name || user?.email || 'utilisateur';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 h-18 bg-white shadow-sm border-b border-gray-200 dark:bg-[#1a1a1a] dark:border-[#2a2a2a] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 cursor-pointer hover:opacity-80">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <BookOpen className="h-6 w-6" />
            </div>
            <h1 className="text-xl text-gray-900">e-Biblio</h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {!isAuthenticated ? (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Connexion
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <span className="text-sm text-gray-600">
                  Bonjour, {displayName}
                </span>
                
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/admin')}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <LayoutDashboard className="h-4 w-4 mr-1" />
                    Admin
                  </Button>
                )}
              </>
            )}
            
            <div className="relative cursor-pointer" onClick={() => navigate('/cart')}>
              <ShoppingCart className="h-6 w-6 text-gray-600 hover:text-blue-600" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </div>

            <Button variant="outline" size="sm" onClick={toggleTheme} className="inline-flex items-center gap-2">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setChatbotOpen(true)}
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              title="Assistant IA"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-200">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    Mon profil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/orders')}>
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
                onClick={() => navigate('/login')}
              >
                <User className="h-4 w-4 text-gray-600" />
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-3">
            <Button 
              onClick={toggleTheme}
              variant="outline"
              className="w-full"
            >
              {theme === 'dark' ? 'Passer en clair' : 'Passer en sombre'}
            </Button>

            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Button 
                    onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }}
                    variant="ghost"
                    className="w-full text-blue-600"
                  >
                    Dashboard Admin
                  </Button>
                )}
                
                <Button 
                  onClick={() => { navigate('/cart'); setMobileMenuOpen(false); }}
                  variant="ghost"
                  className="w-full flex items-center justify-start gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Panier ({totalItems})
                </Button>
                
                <Button 
                  onClick={() => { navigate('/orders'); setMobileMenuOpen(false); }}
                  variant="ghost"
                  className="w-full"
                >
                  Mes commandes
                </Button>
                
                <Button 
                  onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
                  variant="ghost"
                  className="w-full"
                >
                  Mon profil
                </Button>
                
                <div className="py-2 text-sm text-gray-600">
                  Connecté en tant que {displayName}
                </div>
                
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full"
                >
                  Déconnexion
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block">
                  <Button variant="outline" className="w-full">
                    Connexion
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <ChatbotWidget open={chatbotOpen} onClose={() => setChatbotOpen(false)} />
    </nav>
  );
};
