import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Textarea } from "../../ui/textarea";
import { ArrowLeft, Plus, Edit, Trash2, Search, Filter } from "lucide-react";
import { useApp } from "../../AppContext";
import { toast } from "sonner@2.0.3";

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  priceAchat: number;
  priceLocation?: number;
  stock: number;
  type: 'papier' | 'numerique';
  description: string;
}

export function AdminCatalog() {
  const { setCurrentPage } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // Données simulées des livres
  const [books, setBooks] = useState<Book[]>([
    {
      id: "1",
      title: "Mathématiques 1 — Cours et exercices",
      author: "Khaled Mansour",
      category: "Manuel",
      priceAchat: 24.99,
      priceLocation: 4.99,
      stock: 12,
      type: 'papier',
      description: "Manuel complet de mathématiques niveau 1"
    },
    {
      id: "2",
      title: "Anglais - Fiches de grammaire",
      author: "Marie Dupont",
      category: "Fiche",
      priceAchat: 6.99,
      stock: 8,
      type: 'numerique',
      description: "Fiches de révision pour la grammaire anglaise"
    },
    {
      id: "3",
      title: "Programmation PHP & Symfony",
      author: "T. Elouga",
      category: "Manuel",
      priceAchat: 34.99,
      priceLocation: 6.99,
      stock: 5,
      type: 'papier',
      description: "Guide complet de programmation PHP et Symfony"
    }
  ]);

  const [newBook, setNewBook] = useState<Partial<Book>>({
    title: "",
    author: "",
    category: "Manuel",
    priceAchat: 0,
    priceLocation: 0,
    stock: 0,
    type: 'papier',
    description: ""
  });

  const handleBackToDashboard = () => {
    setCurrentPage('admin-dashboard');
  };

  const handleAddBook = () => {
    if (!newBook.title || !newBook.author || !newBook.priceAchat) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const book: Book = {
      id: Date.now().toString(),
      title: newBook.title!,
      author: newBook.author!,
      category: newBook.category!,
      priceAchat: newBook.priceAchat!,
      priceLocation: newBook.priceLocation || undefined,
      stock: newBook.stock!,
      type: newBook.type || 'papier',
      description: newBook.description!
    };

    setBooks([...books, book]);
    setNewBook({
      title: "",
      author: "",
      category: "Manuel",
      priceAchat: 0,
      priceLocation: 0,
      stock: 0,
      type: 'papier',
      description: ""
    });
    setIsAddingBook(false);
    toast.success("Livre ajouté avec succès");
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setNewBook(book);
  };

  const handleUpdateBook = () => {
    if (!editingBook || !newBook.title || !newBook.author || !newBook.priceAchat) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const updatedBook: Book = {
      ...editingBook,
      title: newBook.title!,
      author: newBook.author!,
      category: newBook.category!,
      priceAchat: newBook.priceAchat!,
      priceLocation: newBook.priceLocation || undefined,
      stock: newBook.stock!,
      type: newBook.type || 'papier',
      description: newBook.description!
    };

    setBooks(books.map(b => b.id === editingBook.id ? updatedBook : b));
    setEditingBook(null);
    setNewBook({
      title: "",
      author: "",
      category: "Manuel",
      priceAchat: 0,
      priceLocation: 0,
      stock: 0,
      type: 'papier',
      description: ""
    });
    toast.success("Livre mis à jour avec succès");
  };

  const handleDeleteBook = (bookId: string) => {
    setBooks(books.filter(b => b.id !== bookId));
    toast.success("Livre supprimé avec succès");
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const BookForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Titre *</Label>
          <Input
            id="title"
            value={newBook.title || ""}
            onChange={(e) => setNewBook({...newBook, title: e.target.value})}
            placeholder="Titre du livre"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="author">Auteur *</Label>
          <Input
            id="author"
            value={newBook.author || ""}
            onChange={(e) => setNewBook({...newBook, author: e.target.value})}
            placeholder="Nom de l'auteur"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Catégorie</Label>
          <Select value={newBook.category} onValueChange={(value) => setNewBook({...newBook, category: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Manuel">Manuel</SelectItem>
              <SelectItem value="Fiche">Fiche</SelectItem>
              <SelectItem value="Cahier">Cahier</SelectItem>
              <SelectItem value="Pack">Pack</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Stock *</Label>
          <Input
            id="stock"
            type="number"
            value={newBook.stock || 0}
            onChange={(e) => setNewBook({...newBook, stock: parseInt(e.target.value) || 0})}
            placeholder="Quantité en stock"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priceAchat">Prix d'achat ($) *</Label>
          <Input
            id="priceAchat"
            type="number"
            step="0.01"
            value={newBook.priceAchat || 0}
            onChange={(e) => setNewBook({...newBook, priceAchat: parseFloat(e.target.value) || 0})}
            placeholder="Prix d'achat"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priceLocation">Prix de location ($/semaine)</Label>
          <Input
            id="priceLocation"
            type="number"
            step="0.01"
            value={newBook.priceLocation || 0}
            onChange={(e) => setNewBook({...newBook, priceLocation: parseFloat(e.target.value) || 0})}
            placeholder="Prix de location (optionnel)"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={newBook.description || ""}
          onChange={(e) => setNewBook({...newBook, description: e.target.value})}
          placeholder="Description du livre"
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="book-type"
          checked={newBook.type === 'numerique'}
          onChange={(e) => setNewBook({ ...newBook, type: e.target.checked ? 'numerique' : 'papier' })}
          className="h-4 w-4"
        />
        <Label htmlFor="book-type">Disponible au format numérique</Label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBackToDashboard}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tableau de bord
            </Button>
            <div>
              <h1 className="text-3xl text-gray-900">Gestion du Catalogue</h1>
              <p className="text-gray-600">Gérez vos livres et publications</p>
            </div>
          </div>

          <Dialog open={isAddingBook} onOpenChange={setIsAddingBook}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un livre
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Ajouter un nouveau livre</DialogTitle>
                <DialogDescription>
                  Remplissez les informations du livre à ajouter au catalogue
                </DialogDescription>
              </DialogHeader>
              <BookForm />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddingBook(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAddBook}>
                  Ajouter le livre
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher par titre ou auteur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrer par catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  <SelectItem value="Manuel">Manuel</SelectItem>
                  <SelectItem value="Fiche">Fiche</SelectItem>
                  <SelectItem value="Cahier">Cahier</SelectItem>
                  <SelectItem value="Pack">Pack</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Books Table */}
        <Card>
          <CardHeader>
            <CardTitle>Catalogue ({filteredBooks.length} livres)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Auteur</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Prix Achat</TableHead>
                  <TableHead>Prix Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBooks.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell className="font-medium">{book.title}</TableCell>
                    <TableCell>{book.author}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{book.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={book.stock === 0 ? 'text-red-600' : book.stock < 5 ? 'text-orange-600' : 'text-green-600'}>
                        {book.stock}
                      </span>
                    </TableCell>
                    <TableCell>${book.priceAchat.toFixed(2)}</TableCell>
                    <TableCell>{book.priceLocation ? `${book.priceLocation.toFixed(2)}` : '-'}</TableCell>
                    <TableCell>
                      {book.type === 'numerique' ? (
                        <Badge className="bg-cyan-100 text-cyan-800">Numérique</Badge>
                      ) : (
                        <Badge variant="outline">Papier</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog open={editingBook?.id === book.id} onOpenChange={(open) => !open && setEditingBook(null)}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditBook(book)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Modifier le livre</DialogTitle>
                              <DialogDescription>
                                Modifiez les informations du livre
                              </DialogDescription>
                            </DialogHeader>
                            <BookForm />
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setEditingBook(null)}>
                                Annuler
                              </Button>
                              <Button onClick={handleUpdateBook}>
                                Sauvegarder
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteBook(book.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredBooks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Aucun livre trouvé avec ces critères</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
