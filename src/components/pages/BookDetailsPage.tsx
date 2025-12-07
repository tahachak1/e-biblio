import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { ArrowLeft, ShoppingCart, Package, Star, Download } from "lucide-react";
import { useApp } from "../AppContext";
import { BookCard } from "../BookCard";
import { toast } from "sonner@2.0.3";

export function BookDetailsPage() {
  const { selectedBook, setCurrentPage, addToCart } = useApp();

  if (!selectedBook) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-gray-900 mb-4">Livre non trouvé</h2>
          <Button onClick={() => setCurrentPage('home')}>
            Retour au catalogue
          </Button>
        </div>
      </div>
    );
  }

  const handleBackToCatalog = () => {
    setCurrentPage('home');
  };

  const handleBuyBook = () => {
    addToCart({
      id: selectedBook.id,
      title: selectedBook.title,
      author: selectedBook.author,
      type: 'achat',
      price: selectedBook.priceAchat,
      coverImage: selectedBook.coverImage
    });
    toast.success(`"${selectedBook.title}" ajouté au panier (Achat)`);
  };

  const handleRentBook = () => {
    if (selectedBook.priceLocation) {
      addToCart({
        id: selectedBook.id + '-location',
        title: selectedBook.title,
        author: selectedBook.author,
        type: 'location',
        price: selectedBook.priceLocation,
        coverImage: selectedBook.coverImage
      });
      toast.success(`"${selectedBook.title}" ajouté au panier (Location)`);
    }
  };

  const isOutOfStock = selectedBook.stock === 0;

  const getBadgeColor = () => {
    switch (selectedBook.badgeType) {
      case 'new': return 'bg-green-500';
      case 'promo': return 'bg-red-500';
      case 'rupture': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  // Livres similaires (données simulées)
  const similarBooks = [
    {
      id: "similar-1",
      title: "Mathématiques 2 — Applications",
      author: "Khaled Mansour",
      category: "Manuel",
      priceAchat: 26.99,
      priceLocation: 5.99,
      stock: 8,
      coverImage: "https://images.unsplash.com/photo-1614548428893-5fa2cb74a442"
    },
    {
      id: "similar-2", 
      title: "Algèbre linéaire — Cours complet",
      author: "Marie Lefort",
      category: "Manuel",
      priceAchat: 32.99,
      stock: 5,
      coverImage: "https://images.unsplash.com/photo-1613495895664-ced1a7ce7cdd"
    },
    {
      id: "similar-3",
      title: "Exercices de Mathématiques",
      author: "Jean Durand",
      category: "Cahier",
      priceAchat: 15.99,
      stock: 12,
      coverImage: "https://images.unsplash.com/photo-1614548428893-5fa2cb74a442"
    },
    {
      id: "similar-4",
      title: "Formulaire de Mathématiques",
      author: "Sophie Martin",
      category: "Fiche",
      priceAchat: 8.99,
      stock: 20,
      type: 'numerique',
      coverImage: "https://images.unsplash.com/photo-1613495895664-ced1a7ce7cdd"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={handleBackToCatalog}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au catalogue
          </Button>
        </div>

        {/* Book Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Image */}
          <div className="space-y-4">
            <div className="relative">
              <div className="aspect-[2/3] overflow-hidden rounded-lg shadow-lg">
                <ImageWithFallback
                  src={selectedBook.coverImage}
                  alt={`Couverture de ${selectedBook.title}`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {selectedBook.badge && (
                <Badge className={`absolute top-4 left-4 ${getBadgeColor()} text-white px-3 py-1`}>
                  {selectedBook.badge}
                </Badge>
              )}

              {selectedBook.type === 'numerique' && (
                <Badge className="absolute top-4 right-4 bg-cyan-500 text-white px-3 py-1">
                  <Download className="h-4 w-4 mr-1" />
                  Numérique
                </Badge>
              )}
            </div>

            {/* Preview buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="w-full">
                Aperçu gratuit
              </Button>
              <Button variant="outline" className="w-full">
                Table des matières
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="outline" className="mb-2">
                {selectedBook.category}
              </Badge>
              <h1 className="text-3xl text-gray-900 mb-2">{selectedBook.title}</h1>
              <p className="text-xl text-gray-600 mb-4">par {selectedBook.author}</p>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-sm text-gray-600 ml-2">(4.8/5 - 124 avis)</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4" />
                {isOutOfStock ? (
                  <span className="text-red-600">En rupture de stock</span>
                ) : (
                  <span className="text-green-600">En stock ({selectedBook.stock} exemplaires)</span>
                )}
              </div>
            </div>

            {/* Pricing */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Achat</h3>
                      <p className="text-sm text-gray-600">Livre à vous pour toujours</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {selectedBook.priceAchat.toFixed(2)} $
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleBuyBook}
                    disabled={isOutOfStock}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {isOutOfStock ? 'En rupture' : 'Acheter'}
                  </Button>

                  {selectedBook.priceLocation && (
                    <>
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">Location</h3>
                            <p className="text-sm text-gray-600">Pour une durée limitée</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                              ${selectedBook.priceLocation.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-600">
                              par {selectedBook.locationPer || 'semaine'}
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          className="w-full mt-4"
                          onClick={handleRentBook}
                          disabled={isOutOfStock}
                        >
                          Louer
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Description</h3>
              <p className="text-gray-700 leading-relaxed">
                {selectedBook.description}
              </p>
            </div>

            {/* Specifications */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Informations</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Auteur :</span>
                  <span className="ml-2">{selectedBook.author}</span>
                </div>
                <div>
                  <span className="text-gray-600">Catégorie :</span>
                  <span className="ml-2">{selectedBook.category}</span>
                </div>
                <div>
                  <span className="text-gray-600">Type :</span>
                  <span className="ml-2">{selectedBook.type === 'numerique' ? 'Numérique' : 'Papier'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Disponibilité :</span>
                  <span className="ml-2">{isOutOfStock ? 'En rupture' : 'En stock'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Books */}
        <div>
          <h2 className="text-2xl text-gray-900 mb-8">Livres similaires</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarBooks.map((book) => (
              <BookCard key={book.id} {...book} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
