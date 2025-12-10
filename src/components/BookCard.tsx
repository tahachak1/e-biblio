import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface BookCardProps {
  id: string;
  title: string;
  author: string;
  price: number;
  rentPrice?: number;
  image: string;
  category?: string;
  type?: string;
}

export const BookCard: React.FC<BookCardProps> = ({
  id,
  title,
  author,
  price,
  rentPrice,
  image,
  category,
  type,
}) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const rawType = (type || '').toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();
  const typeValue = rawType === 'numerique' ? 'numerique' : rawType === 'papier' ? 'papier' : null;
  const typeLabel = typeValue === 'numerique' ? 'Numérique' : typeValue === 'papier' ? 'Papier' : null;
  const typeBg = typeValue === 'numerique' ? 'bg-red-500' : 'bg-green-600';

  const handleCardClick = () => {
    navigate(`/book/${id}`);
  };

  const handleAddToCart = (type: 'purchase' | 'rent') => {
    const rentBase = rentPrice ?? price;
    addToCart({
      id: `${id}-${type}`,
      title,
      author,
      price: type === 'rent' ? rentBase : price,
      rentPrice: type === 'rent' ? rentBase : undefined,
      rentalDuration: type === 'rent' ? 7 : undefined,
      image,
      type,
    });
    toast.success(`"${title}" ajouté au panier`);
  };

  return (
    <div
      className="group bg-white dark:bg-[#1a1a1a] rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-gray-100 dark:bg-[#1f1f1f]">
        <ImageWithFallback
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {category && (
            <span className="bg-cyan-500 text-white text-xs px-2 py-1 rounded-full inline-flex items-center">
              {category}
            </span>
          )}
          {typeLabel && (
            <span className={`text-white text-xs px-2 py-1 rounded-full inline-flex items-center ${typeBg}`}>
              {typeLabel}
            </span>
          )}
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <Link to={`/book/${id}`}>
          <h3 className="hover:text-blue-600 cursor-pointer text-gray-900 dark:text-slate-100">
            {title}
          </h3>
        </Link>
        <p className="text-sm text-gray-600 dark:text-slate-300">
          {author}
        </p>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-slate-300">Prix: <span className="text-gray-900 dark:text-slate-100">${(price || 0).toFixed(2)}</span></p>
            {rentPrice && (
              <p className="text-sm text-gray-600 dark:text-slate-300">Location: <span className="text-green-500">${rentPrice.toFixed(2)}</span></p>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleAddToCart('purchase'); }}
            className="flex-1 bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Acheter
          </Button>
          
          <Link to={`/book/${id}`} className="flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => e.stopPropagation()}
              className="border-blue-600 text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-2"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        {rentPrice && (
          <Button
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleAddToCart('rent'); }}
            variant="outline"
            className="w-full border-green-600 text-green-600 hover:bg-green-50"
          >
            Louer
          </Button>
        )}
      </div>
    </div>
  );
};
