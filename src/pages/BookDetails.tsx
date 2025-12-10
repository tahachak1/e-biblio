import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Package, Truck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useCart } from '../contexts/CartContext';
import api from '../services/api';
import { toast } from 'sonner';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

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
  language?: string;
  type?: 'papier' | 'numerique';
}

const formatCurrency = (value: number = 0) =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(value);

export const BookDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    if (id) {
      fetchBookDetails();
    }
  }, [id]);

  const fetchBookDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/books/${id}`);
      setBook(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement du livre');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (type: 'purchase' | 'rent') => {
    if (!book) return;
    const rentBase = book.rentPrice ?? book.price;
    
    addToCart({
      id: `${book._id}-${type}`,
      title: book.title,
      author: book.author,
      price: type === 'rent' ? rentBase : book.price,
      rentPrice: type === 'rent' ? rentBase : undefined,
      rentalDuration: type === 'rent' ? 7 : undefined,
      image: book.image,
      type,
    });
    toast.success(`"${book.title}" ajouté au panier`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#2563EB' }}></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="text-center py-12">
        <p className="text-xl" style={{ color: '#374151' }}>Livre non trouvé</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bouton retour */}
        <Button
          onClick={() => navigate('/catalogue')}
          variant="ghost"
          className="mb-6 flex items-center gap-2"
          style={{ color: '#374151' }}
        >
          <ArrowLeft className="w-5 h-5" />
          Retour au catalogue
        </Button>

        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            {/* Image */}
            <div>
              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
                <ImageWithFallback
                  src={book.image}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Détails */}
            <div>
              {book.category && (
                <span 
                  className="inline-block px-3 py-1 text-sm text-white rounded-full mb-4"
                  style={{ backgroundColor: '#06B6D4' }}
                >
                  {book.category}
                </span>
              )}
              
              <h1 className="text-4xl mb-4" style={{ color: '#2563EB' }}>
                {book.title}
              </h1>
              
              <p className="text-xl mb-6" style={{ color: '#374151' }}>
                par {book.author}
              </p>

              {book.description && (
                <div className="mb-6">
                  <h2 className="text-xl mb-3" style={{ color: '#374151' }}>Description</h2>
                  <p className="text-sm leading-relaxed" style={{ color: '#374151', opacity: 0.8 }}>
                    {book.description}
                  </p>
                </div>
              )}

              {/* Informations du livre */}
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                {book.isbn && (
                  <div>
                    <p className="text-sm opacity-75" style={{ color: '#374151' }}>ISBN</p>
                    <p style={{ color: '#374151' }}>{book.isbn}</p>
                  </div>
                )}
                {book.publisher && (
                  <div>
                    <p className="text-sm opacity-75" style={{ color: '#374151' }}>Éditeur</p>
                    <p style={{ color: '#374151' }}>{book.publisher}</p>
                  </div>
                )}
                {book.publicationYear && (
                  <div>
                    <p className="text-sm opacity-75" style={{ color: '#374151' }}>Année</p>
                    <p style={{ color: '#374151' }}>{book.publicationYear}</p>
                  </div>
                )}
                {book.pages && (
                  <div>
                    <p className="text-sm opacity-75" style={{ color: '#374151' }}>Pages</p>
                    <p style={{ color: '#374151' }}>{book.pages}</p>
                  </div>
                )}
                {book.language && (
                  <div>
                    <p className="text-sm opacity-75" style={{ color: '#374151' }}>Langue</p>
                    <p style={{ color: '#374151' }}>{book.language}</p>
                  </div>
                )}
                {book.type && (
                  <div>
                    <p className="text-sm opacity-75" style={{ color: '#374151' }}>Type</p>
                    <p style={{ color: '#374151' }}>{book.type === 'numerique' ? 'Numérique' : 'Papier'}</p>
                  </div>
                )}
              </div>

              {/* Prix et actions */}
              <div className="border-t pt-6">
                <div className="mb-6">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-sm" style={{ color: '#374151' }}>Prix d'achat:</span>
                    <span className="text-3xl" style={{ color: '#2563EB' }}>
                      {formatCurrency(book.price)}
                    </span>
                  </div>
                  {book.rentPrice && (
                    <div className="flex items-baseline gap-3">
                      <span className="text-sm" style={{ color: '#374151' }}>Prix de location:</span>
                      <span className="text-2xl" style={{ color: '#10B981' }}>
                        {formatCurrency(book.rentPrice ?? 0)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => handleAddToCart('purchase')}
                    className="w-full flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#2563EB', color: '#FFFFFF' }}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Acheter
                  </Button>

                  {book.rentPrice && (
                    <Button
                      onClick={() => handleAddToCart('rent')}
                      className="w-full flex items-center justify-center gap-2"
                      style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
                    >
                      <Package className="w-5 h-5" />
                      Louer
                    </Button>
                  )}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-5 h-5" style={{ color: '#2563EB' }} />
                    <span style={{ color: '#2563EB' }}>Livraison gratuite</span>
                  </div>
                  <p className="text-sm" style={{ color: '#374151' }}>
                    Pour toute commande supérieure à {formatCurrency(25)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
