import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Facebook, Twitter, Instagram, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <BookOpen className="h-6 w-6" />
              </div>
              <span className="text-xl text-gray-900">e-Biblio</span>
            </div>
            <p className="text-sm text-gray-600">
              Votre bibliothèque en ligne pour acheter et louer les meilleurs livres.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="mb-4 text-gray-900">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/catalogue" className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer">
                  Catalogue
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer">
                  Mes Commandes
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer">
                  Panier
                </Link>
              </li>
            </ul>
          </div>

          {/* À propos */}
          <div>
            <h3 className="mb-4 text-gray-900">À propos</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer">
                  Qui sommes-nous ?
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer">
                  Conditions d'utilisation
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer">
                  Politique de confidentialité
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-gray-900">Contact</h3>
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-4 h-4 text-blue-600" />
              <a href="mailto:contact@e-biblio.com" className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer">
                contact@e-biblio.com
              </a>
            </div>
            <div className="flex gap-4 mt-4">
              <a href="#" className="hover:opacity-80 cursor-pointer">
                <Facebook className="w-5 h-5 text-blue-600" />
              </a>
              <a href="#" className="hover:opacity-80 cursor-pointer">
                <Twitter className="w-5 h-5 text-blue-600" />
              </a>
              <a href="#" className="hover:opacity-80 cursor-pointer">
                <Instagram className="w-5 h-5 text-blue-600" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} e-Biblio. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};