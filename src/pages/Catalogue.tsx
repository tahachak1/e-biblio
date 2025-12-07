import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { BookCard } from '../components/BookCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import api from '../services/api';
import { toast } from 'sonner';

interface Book {
  _id: string;
  title: string;
  author: string;
  price: number;
  rentPrice?: number;
  image: string;
  category?: string;
  description?: string;
  type?: 'papier' | 'numerique';
}

export const Catalogue: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [categories, setCategories] = useState<{ _id: string; nom: string }[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'papier' | 'numerique'>('all');
  const [sortBy, setSortBy] = useState('title');
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    loadBooks();
  }, [currentPage, category, sortBy, typeFilter]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/books/categories');
        setCategories(response.data.categories || []);
      } catch (error) {
        console.error('Erreur chargement catégories:', error);
      }
    };
    fetchCategories();
  }, []);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/books', {
        params: {
          page: currentPage,
          limit: 12,
          categorieId: category !== 'all' ? category : undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined,
          sortBy,
        },
      });
      setBooks(response.data.books || response.data);
      setTotalPages(response.data.totalPages || 1);
      setUsingMockData(false);
    } catch (error) {
      console.error('Error loading books:', error);
      setBooks([]);
      setTotalPages(1);
      setUsingMockData(false);
      toast.error('Backend indisponible : impossible de charger les livres.');
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter((book) =>
    (book.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (book.author?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900">Notre catalogue</h1>
          <p className="text-gray-600 mt-2">
            {filteredBooks.length > 0 ? `${filteredBooks.length} livres disponibles` : 'Chargement...'}
          </p>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Recherche */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher un livre ou un auteur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Catégorie */}
            <div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>
                      {cat.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div>
              <Select value={typeFilter} onValueChange={(value: 'all' | 'papier' | 'numerique') => setTypeFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Type de livre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="papier">Papier</SelectItem>
                  <SelectItem value="numerique">Numérique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tri */}
            <div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Titre</SelectItem>
                  <SelectItem value="author">Auteur</SelectItem>
                  <SelectItem value="price">Prix croissant</SelectItem>
                  <SelectItem value="-price">Prix décroissant</SelectItem>
                  <SelectItem value="-createdAt">Plus récents</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Grille de livres */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-96"></div>
            ))}
          </div>
        ) : filteredBooks.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book._id}
                  id={book._id}
                  title={book.title}
                  author={book.author}
                  price={book.price}
                  rentPrice={book.rentPrice}
                  image={book.image}
                  category={book.category}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="text-gray-600">
                  Page {currentPage} sur {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">
              Aucun livre trouvé
            </p>
            <Button
              onClick={() => {
                setSearchTerm('');
                setCategory('all');
                setTypeFilter('all');
              }}
              className="mt-4 bg-blue-600 hover:bg-blue-700"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
