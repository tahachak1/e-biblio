import { useEffect, useState } from "react";
import { Hero } from "../Hero";
import { Filters } from "../Filters";
import { BookCard } from "../BookCard";
import { Advantages } from "../Advantages";
import { BackendStatus } from "../BackendStatus";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "../AppContext";
import type { Book } from "../../types";

export function HomePage() {
  const { books, booksLoading, loadBooks } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Charger les livres au montage du composant
  useEffect(() => {
    loadBooks({ page: currentPage, category: selectedCategory, search: searchQuery });
  }, [currentPage, selectedCategory, searchQuery]);

  const handleFilterChange = (category: string, search: string) => {
    setSelectedCategory(category);
    setSearchQuery(search);
    setCurrentPage(1); // Reset à la page 1 lors du changement de filtre
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      <Hero />
      <Advantages />
      
      {/* Catalogue Section */}
      <section id="catalog" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackendStatus />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="text-3xl text-gray-900">Notre catalogue</h2>
              <p className="text-gray-600 mt-2">
                {books.length > 0 ? `${books.length} livres disponibles` : 'Chargement...'}
              </p>
            </div>
          </div>

          <Filters onFilterChange={handleFilterChange} />

          {/* Grille de livres */}
          {booksLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-96"></div>
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-600 text-lg">Aucun livre trouvé</p>
              <Button
                onClick={() => {
                  setSelectedCategory("");
                  setSearchQuery("");
                }}
                className="mt-4 bg-blue-600 hover:bg-blue-700"
              >
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
              {books.map((book) => (
                <BookCard
                  key={book._id}
                  id={book._id}
                  title={book.title}
                  author={book.author}
                  category={book.category}
                  priceAchat={book.price}
                  stock={book.stock}
                  coverImage={book.coverImage}
                  description={book.description}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!booksLoading && books.length > 0 && (
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
