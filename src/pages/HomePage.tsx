import React, { useEffect, useState } from "react";
import { Hero } from "../components/Hero";
import { Advantages } from "../components/Advantages";
import { BookCard } from "../components/BookCard";
import { Button } from "../components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Search } from "lucide-react";
import api from "../services/api";
import { toast } from "sonner";

interface Book {
  _id: string;
  title: string;
  author: string;
  price: number;
  rentPrice?: number;
  image: string;
  category?: string;
  stock?: number;
  coverImage?: string;
  description?: string;
  type?: 'papier' | 'numerique';
}

export function HomePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState<{ _id: string; nom: string }[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'papier' | 'numerique'>('all');
  const [priceSort, setPriceSort] = useState<'none' | 'asc' | 'desc'>('none');
  const [searchQuery, setSearchQuery] = useState("");
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    loadBooks();
  }, [currentPage, selectedCategory, typeFilter, priceSort]);

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
          const response = await api.get("/books", {
            params: {
              page: currentPage,
              limit: 8,
              categorieId: selectedCategory !== "all" ? selectedCategory : undefined,
              type: typeFilter !== 'all' ? typeFilter : undefined,
              sort: priceSort === 'asc' ? 'price_asc' : priceSort === 'desc' ? 'price_desc' : undefined,
            },
          });
          setBooks(response.data.books || response.data);
      setUsingMockData(false);
    } catch (error) {
      console.error("Error loading books:", error);
      setBooks([]);
      setUsingMockData(false);
      toast.error("Backend indisponible : impossible de charger les livres de la base.");
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter((book) =>
    (book.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (book.author?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (priceSort === 'asc') return (a.price || 0) - (b.price || 0);
    if (priceSort === 'desc') return (b.price || 0) - (a.price || 0);
    return 0;
  });

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToCatalog = () => {
    const catalogSection = document.getElementById("catalog");
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen">
      <Hero />
      <Advantages />

      {/* Catalogue Section */}
      <section id="catalog" className="py-16 bg-white dark:bg-[#131313]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="text-3xl text-gray-900">Notre catalogue</h2>
              <p className="text-gray-600 mt-2">
                {sortedBooks.length > 0 ? `${sortedBooks.length} livres disponibles` : "Chargement..."}
              </p>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-6 mb-8 interactive-panel soft-entrance">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher un livre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>
                      {cat.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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

              <Select value={priceSort} onValueChange={(value: 'none' | 'asc' | 'desc') => setPriceSort(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Prix" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tri par défaut</SelectItem>
                  <SelectItem value="asc">Prix croissant</SelectItem>
                  <SelectItem value="desc">Prix décroissant</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                  setTypeFilter('all');
                  setPriceSort('none');
                }}
                className="flex items-center gap-2 md:col-span-1 w-full"
              >
                Réinitialiser les filtres
              </Button>
            </div>
          </div>

          {/* Grille de livres */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-96"></div>
              ))}
            </div>
          ) : sortedBooks.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-600 text-lg">Aucun livre trouvé</p>
              <Button
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                }}
                className="mt-4 bg-blue-600 hover:bg-blue-700"
              >
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
              {sortedBooks.map((book) => (
                <BookCard
                  key={book._id}
                  id={book._id}
                  title={book.title}
                  author={book.author}
                  price={book.price}
                  rentPrice={book.rentPrice}
                  image={book.coverImage || book.image}
                  category={book.category}
                  type={book.type}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && sortedBooks.length > 0 && (
            <div className="flex justify-center items-center gap-2 mt-12">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex gap-2">
                {[1, 2, 3, 4].map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    className={currentPage === page ? "bg-blue-600" : ""}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
