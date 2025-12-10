import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Textarea } from "../../ui/textarea";
import { ArrowLeft, Plus, Edit, Trash2, Search } from "lucide-react";
import { useApp } from "../../AppContext";
import { toast } from "sonner@2.0.3";
import api from "../../../services/api";

interface Book {
  id: string;
  title: string;
  author: string;
  category?: string;
  categorieId?: string;
  price: number;
  rentPrice?: number;
  image?: string;
  type: 'papier' | 'numerique';
  description?: string;
  isbn?: string;
  publisher?: string;
  publicationYear?: number;
  pages?: number;
  pdfUrl?: string;
}

interface Category {
  id: string;
  nom: string;
  type?: string;
}

export function AdminCatalog() {
  const { setCurrentPage } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const [books, setBooks] = useState<Book[]>([]);
  const [newBook, setNewBook] = useState<Partial<Book & { pdfBase64?: string; pdfFileName?: string }>>({
    title: "",
    author: "",
    category: "",
    price: 0,
    rentPrice: 0,
    type: 'papier',
    description: ""
  });

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      setLoading(true);
      const [{ books: fetched = [] }, { categories: cats = [] } = { categories: [] }] = await Promise.all([
        api.books.getBooks({ limit: 200 }),
        api.admin.getCategories().catch(() => ({ categories: [] }))
      ]);
      setBooks((fetched || []).map((b: any) => ({
        id: b._id || b.id,
        title: b.title,
        author: b.author,
        category: b.category,
        categorieId: b.categorieId,
        price: Number(b.price) || 0,
        rentPrice: b.rentPrice,
        image: b.image,
        type: b.type || 'papier',
        description: b.description,
        isbn: b.isbn,
        publisher: b.publisher,
        publicationYear: b.publicationYear,
        pages: b.pages,
        pdfUrl: b.pdfUrl,
      })));
      setCategories((cats || []).map((c: any) => ({
        id: c._id || c.id,
        nom: c.nom || c.name || c.slug || 'Sans nom',
        type: c.type,
      })));
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger le catalogue");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    setCurrentPage('admin-dashboard');
    navigate('/admin/dashboard');
  };

  const resetForm = () => {
    setNewBook({
      title: "",
      author: "",
      category: "",
      price: 0,
      rentPrice: 0,
      type: 'papier',
      description: "",
      isbn: "",
      publisher: "",
      publicationYear: undefined,
      pages: undefined,
      pdfBase64: "",
      pdfFileName: "",
      image: "",
      categorieId: ""
    });
    setEditingBook(null);
  };

  const ensurePdf = () => {
    if (newBook.type === 'numerique') {
      if (!newBook.pdfBase64 && !newBook.pdfFileName && !newBook.pdfUrl) {
        toast.error("Un PDF est requis pour un livre numérique");
        return false;
      }
    }
    return true;
  };

  const handleAddBook = () => {
    if (!newBook.title || !newBook.author || newBook.price === undefined) {
      toast.error("Titre, auteur et prix sont obligatoires");
      return;
    }
    if (!ensurePdf()) return;

    const payload: any = {
      title: newBook.title,
      author: newBook.author,
      price: Number(newBook.price) || 0,
      rentPrice: newBook.rentPrice ? Number(newBook.rentPrice) : undefined,
      category: newBook.category,
      categorieId: newBook.categorieId || undefined,
      description: newBook.description,
      isbn: newBook.isbn,
      publisher: newBook.publisher,
      publicationYear: newBook.publicationYear ? Number(newBook.publicationYear) : undefined,
      pages: newBook.pages ? Number(newBook.pages) : undefined,
      image: newBook.image,
      type: newBook.type || 'papier',
      pdfBase64: newBook.pdfBase64,
      pdfFileName: newBook.pdfFileName,
    };

    setSaving(true);
    api.admin.createBook(payload).then(() => {
      toast.success("Livre ajouté avec succès");
      loadCatalog();
      setIsAddingBook(false);
      resetForm();
    }).catch((err: any) => {
      console.error(err);
      toast.error(err.response?.data?.message || "Erreur lors de la création");
    }).finally(() => setSaving(false));
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setNewBook({
      ...book,
      pdfBase64: "",
      pdfFileName: "",
    });
  };

  const handleUpdateBook = () => {
    if (!editingBook || !newBook.title || !newBook.author || newBook.price === undefined) {
      toast.error("Titre, auteur et prix sont obligatoires");
      return;
    }
    if (!ensurePdf()) return;

    const payload: any = {
      title: newBook.title,
      author: newBook.author,
      price: Number(newBook.price) || 0,
      rentPrice: newBook.rentPrice ? Number(newBook.rentPrice) : undefined,
      category: newBook.category,
      categorieId: newBook.categorieId || undefined,
      description: newBook.description,
      isbn: newBook.isbn,
      publisher: newBook.publisher,
      publicationYear: newBook.publicationYear ? Number(newBook.publicationYear) : undefined,
      pages: newBook.pages ? Number(newBook.pages) : undefined,
      image: newBook.image,
      type: newBook.type || 'papier',
      pdfBase64: newBook.pdfBase64,
      pdfFileName: newBook.pdfFileName,
      pdfUrl: newBook.pdfUrl || editingBook.pdfUrl,
    };

    setSaving(true);
    api.admin.updateBook(editingBook.id, payload).then(() => {
      toast.success("Livre mis à jour avec succès");
      loadCatalog();
      resetForm();
    }).catch((err: any) => {
      console.error(err);
      toast.error(err.response?.data?.message || "Erreur lors de la mise à jour");
    }).finally(() => setSaving(false));
  };

  const handleDeleteBook = (bookId: string) => {
    if (!window.confirm("Supprimer ce livre ?")) return;
    api.admin.deleteBook(bookId).then(() => {
      toast.success("Livre supprimé avec succès");
      loadCatalog();
    }).catch((err: any) => {
      console.error(err);
      toast.error("Suppression impossible");
    });
  };

  const onPdfSelected = (file?: File) => {
    if (!file) {
      setNewBook({ ...newBook, pdfBase64: "", pdfFileName: "" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setNewBook({
        ...newBook,
        pdfBase64: (reader.result as string) || "",
        pdfFileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const filteredBooks = useMemo(() => books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      (selectedCategory === "none" && !book.category && !book.categorieId) ||
      book.category === selectedCategory ||
      book.categorieId === selectedCategory;
    return matchesSearch && matchesCategory;
  }), [books, searchTerm, selectedCategory]);

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
          <Select
            value={newBook.categorieId || (newBook.category ? "custom" : "none")}
            onValueChange={(value) => {
              if (value === "none") {
                setNewBook({ ...newBook, categorieId: "", category: "" });
                return;
              }
              if (value === "custom") {
                setNewBook({ ...newBook, categorieId: "", category: "" });
                return;
              }
              const cat = categories.find(c => c.id === value);
              if (cat) {
                setNewBook({ ...newBook, categorieId: value, category: cat.nom });
              }
            }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-- Aucune --</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.nom}</SelectItem>
              ))}
              <SelectItem value="custom">Autre (texte libre)</SelectItem>
            </SelectContent>
          </Select>
          {(newBook.categorieId === "" || !newBook.categorieId) && (
            <Input
              className="mt-2"
              placeholder="Nom de catégorie (facultatif)"
              value={newBook.category || ""}
              onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Prix d'achat ($) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={newBook.price || 0}
            onChange={(e) => setNewBook({...newBook, price: parseFloat(e.target.value) || 0})}
            placeholder="Prix d'achat"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priceLocation">Prix de location ($/semaine)</Label>
          <Input
            id="priceLocation"
            type="number"
            step="0.01"
            value={newBook.rentPrice || 0}
            onChange={(e) => setNewBook({...newBook, rentPrice: parseFloat(e.target.value) || 0})}
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="isbn">ISBN</Label>
          <Input
            id="isbn"
            value={newBook.isbn || ""}
            onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
            placeholder="ISBN"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="publisher">Éditeur</Label>
          <Input
            id="publisher"
            value={newBook.publisher || ""}
            onChange={(e) => setNewBook({ ...newBook, publisher: e.target.value })}
            placeholder="Maison d'édition"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="publicationYear">Année de publication</Label>
          <Input
            id="publicationYear"
            type="number"
            value={newBook.publicationYear || ""}
            onChange={(e) => setNewBook({ ...newBook, publicationYear: parseInt(e.target.value) || undefined })}
            placeholder="2024"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pages">Pages</Label>
          <Input
            id="pages"
            type="number"
            value={newBook.pages || ""}
            onChange={(e) => setNewBook({ ...newBook, pages: parseInt(e.target.value) || undefined })}
            placeholder="Nombre de pages"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Image (URL)</Label>
        <Input
          id="image"
          value={newBook.image || ""}
          onChange={(e) => setNewBook({ ...newBook, image: e.target.value })}
          placeholder="https://..."
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

      {newBook.type === 'numerique' && (
        <div className="space-y-2">
          <Label htmlFor="pdf">Fichier PDF *</Label>
          <Input
            id="pdf"
            type="file"
            accept="application/pdf"
            onChange={(e) => onPdfSelected(e.target.files?.[0])}
          />
          {newBook.pdfFileName && (
            <p className="text-sm text-gray-500">Fichier sélectionné : {newBook.pdfFileName}</p>
          )}
          {!newBook.pdfFileName && newBook.pdfUrl && (
            <p className="text-sm text-gray-500">PDF déjà présent (sera conservé)</p>
          )}
        </div>
      )}
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
                <Button onClick={handleAddBook} disabled={saving}>
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
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.nom}</SelectItem>
                  ))}
                  <SelectItem value="none">Sans catégorie</SelectItem>
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
                    <TableHead>Prix</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>ISBN</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBooks.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{book.category || '—'}</Badge>
                      </TableCell>
                      <TableCell>${book.price.toFixed(2)}</TableCell>
                      <TableCell>{typeof book.rentPrice === 'number' ? `$${book.rentPrice.toFixed(2)}` : '-'}</TableCell>
                      <TableCell>
                        {book.type === 'numerique' ? (
                          <Badge className="bg-cyan-100 text-cyan-800">Numérique</Badge>
                        ) : (
                          <Badge variant="outline">Papier</Badge>
                        )}
                      </TableCell>
                      <TableCell>{book.isbn || '-'}</TableCell>
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
                                <Button variant="outline" onClick={() => resetForm()}>
                                  Annuler
                                </Button>
                                <Button onClick={handleUpdateBook} disabled={saving}>
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

            {(loading || filteredBooks.length === 0) && (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {loading ? "Chargement..." : "Aucun livre trouvé avec ces critères"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
