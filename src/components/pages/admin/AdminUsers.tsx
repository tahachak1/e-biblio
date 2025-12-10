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
import { ArrowLeft, Search, Shield, ShieldOff, Trash2, Eye, UserPlus, Edit } from "lucide-react";
import { useApp } from "../../AppContext";
import { toast } from "sonner@2.0.3";
import api from "../../../services/api";

interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  motDePasse?: string;
  role: 'user' | 'admin';
  statut: 'actif' | 'bloqué' | 'suspendu';
  dateInscription?: string;
  derniereConnexion?: string;
  totalCommandes: number;
  totalDepense: number;
}

interface UserFormData {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  role: 'user' | 'admin';
  statut: 'actif' | 'bloqué' | 'suspendu';
}

export function AdminUsers() {
  const { setCurrentPage } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<UserFormData>({
    nom: "",
    prenom: "",
    email: "",
    motDePasse: "",
    role: "user",
    statut: "actif"
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const mapUser = (u: any): User => ({
    id: u._id || u.id,
    nom: u.lastName || u.nom || "",
    prenom: u.firstName || u.prenom || "",
    email: u.email,
    role: u.role === "admin" ? "admin" : "user",
    statut: u.status || "actif",
    dateInscription: u.createdAt,
    derniereConnexion: u.lastLogin || u.updatedAt || u.createdAt,
    totalCommandes: u.stats?.totalCommandes || 0,
    totalDepense: u.stats?.totalDepense || 0,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { users: data } = await api.admin.getUsers();
      setUsers((data || []).map(mapUser));
    } catch (error: any) {
      console.error(error);
      toast.error("Impossible de charger les utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBackToDashboard = () => {
    setCurrentPage('admin-dashboard');
    navigate('/admin/dashboard');
  };

  const handleBlockUser = async (userId: string) => {
    try {
      const target = users.find(u => u.id === userId);
      const nextStatus = target?.statut === 'bloqué' ? 'actif' : 'bloqué';
      await api.admin.updateUser(userId, { status: nextStatus });
      await fetchUsers();
      toast.success(`Utilisateur ${nextStatus === 'bloqué' ? 'bloqué' : 'débloqué'}`);
    } catch (error: any) {
      console.error(error);
      toast.error("Impossible de mettre à jour l'utilisateur");
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      const target = users.find(u => u.id === userId);
      const nextStatus = target?.statut === 'suspendu' ? 'actif' : 'suspendu';
      await api.admin.updateUser(userId, { status: nextStatus });
      await fetchUsers();
      toast.success(`Utilisateur ${nextStatus === 'suspendu' ? 'suspendu' : 'réactivé'}`);
    } catch (error: any) {
      console.error(error);
      toast.error("Impossible de mettre à jour l'utilisateur");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await api.admin.deleteUser(userId);
      await fetchUsers();
      toast.success("Utilisateur supprimé avec succès");
    } catch (error: any) {
      console.error(error);
      toast.error("Suppression impossible");
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setUserFormData({
      nom: "",
      prenom: "",
      email: "",
      motDePasse: "",
      role: "user",
      statut: "actif"
    });
    setIsUserDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      motDePasse: "",
      role: user.role,
      statut: user.statut
    });
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!userFormData.nom || !userFormData.prenom || !userFormData.email) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (editingUser) {
      try {
        await api.admin.updateUser(editingUser.id, {
          firstName: userFormData.prenom,
          lastName: userFormData.nom,
          email: userFormData.email,
          role: userFormData.role,
          status: userFormData.statut,
        });
        toast.success("Utilisateur modifié avec succès");
        await fetchUsers();
      } catch (error: any) {
        console.error(error);
        toast.error("Erreur lors de la modification");
        return;
      }
    } else {
      try {
        await api.admin.createUser({
          firstName: userFormData.prenom,
          lastName: userFormData.nom,
          email: userFormData.email,
          role: userFormData.role,
          status: userFormData.statut,
        });
        toast.success("Utilisateur ajouté avec succès");
        await fetchUsers();
      } catch (error: any) {
        console.error(error);
        toast.error(error.response?.data?.message || "Erreur lors de la création");
        return;
      }
    }
    
    setIsUserDialogOpen(false);
    setEditingUser(null);
    setUserFormData({
      nom: "",
      prenom: "",
      email: "",
      motDePasse: "",
      role: "user",
      statut: "actif"
    });
  };

  const handleCloseUserDialog = () => {
    setIsUserDialogOpen(false);
    setEditingUser(null);
    setUserFormData({
      nom: "",
      prenom: "",
      email: "",
      motDePasse: "",
      role: "user",
      statut: "actif"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'actif': return 'text-green-600 bg-green-100';
      case 'bloqué': return 'text-red-600 bg-red-100';
      case 'suspendu': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'text-purple-600 bg-purple-100' : 'text-blue-600 bg-blue-100';
  };

  const filteredUsers = useMemo(() => users.filter(user => {
    const matchesSearch = user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    const matchesStatus = selectedStatus === "all" || user.statut === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  }), [users, searchTerm, selectedRole, selectedStatus]);

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
              <h1 className="text-3xl text-gray-900">Gestion des Utilisateurs</h1>
              <p className="text-gray-600">Gérez les comptes utilisateurs de la plateforme</p>
            </div>
          </div>

          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleAddUser}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Ajouter utilisateur
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Utilisateurs Actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.statut === 'actif').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Bloqués</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {users.filter(u => u.statut === 'bloqué').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Administrateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {users.filter(u => u.role === 'admin').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher par nom, prénom ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrer par rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="user">Utilisateur</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="bloqué">Bloqué</SelectItem>
                  <SelectItem value="suspendu">Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs ({filteredUsers.length}) {loading && <span className="text-xs text-gray-500">(chargement...)</span>}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Inscription</TableHead>
                  <TableHead>Dernière connexion</TableHead>
                  <TableHead>Commandes</TableHead>
                  <TableHead>Total dépensé</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.prenom} {user.nom}</div>
                        <div className="text-sm text-gray-500">ID: {user.id}</div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(user.statut)}>
                        {user.statut.charAt(0).toUpperCase() + user.statut.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.dateInscription ? new Date(user.dateInscription).toLocaleDateString('fr-FR') : "-"}</TableCell>
                    <TableCell>{user.derniereConnexion ? new Date(user.derniereConnexion).toLocaleDateString('fr-FR') : "-"}</TableCell>
                    <TableCell>{user.totalCommandes}</TableCell>
                    <TableCell>${user.totalDepense.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Dialog open={selectedUser?.id === user.id} onOpenChange={(open) => !open && setSelectedUser(null)}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewUser(user)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Détails de l'utilisateur</DialogTitle>
                              <DialogDescription>
                                Informations complètes sur {user.prenom} {user.nom}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedUser && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Nom complet</label>
                                    <p>{selectedUser.prenom} {selectedUser.nom}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Email</label>
                                    <p>{selectedUser.email}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Rôle</label>
                                    <p>
                                      <Badge className={getRoleColor(selectedUser.role)}>
                                        {selectedUser.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                                      </Badge>
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Statut</label>
                                    <p>
                                      <Badge className={getStatusColor(selectedUser.statut)}>
                                        {selectedUser.statut}
                                      </Badge>
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Date d'inscription</label>
                                    <p>{selectedUser.dateInscription ? new Date(selectedUser.dateInscription).toLocaleDateString('fr-FR') : "-"}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Dernière connexion</label>
                                    <p>{selectedUser.derniereConnexion ? new Date(selectedUser.derniereConnexion).toLocaleDateString('fr-FR') : "-"}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Total commandes</label>
                                    <p>{selectedUser.totalCommandes}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">Total dépensé</label>
                                    <p>${selectedUser.totalDepense.toFixed(2)}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {user.role !== 'admin' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBlockUser(user.id)}
                              className={user.statut === 'bloqué' ? 'text-green-600' : 'text-red-600'}
                            >
                              {user.statut === 'bloqué' ? <Shield className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSuspendUser(user.id)}
                              className="text-orange-600"
                            >
                              {user.statut === 'suspendu' ? 'Réactiver' : 'Suspendre'}
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">{loading ? "Chargement..." : "Aucun utilisateur trouvé avec ces critères"}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog pour ajouter/modifier un utilisateur */}
        <Dialog open={isUserDialogOpen} onOpenChange={handleCloseUserDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Modifier un utilisateur' : 'Ajouter un utilisateur'}
              </DialogTitle>
              <DialogDescription>
                {editingUser 
                  ? 'Modifiez les informations de l\'utilisateur'
                  : 'Créez un nouveau compte utilisateur'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom *</Label>
                  <Input
                    id="prenom"
                    value={userFormData.prenom}
                    onChange={(e) => setUserFormData({...userFormData, prenom: e.target.value})}
                    placeholder="Prénom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    value={userFormData.nom}
                    onChange={(e) => setUserFormData({...userFormData, nom: e.target.value})}
                    placeholder="Nom"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                  placeholder="email@exemple.com"
                />
              </div>

              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="motDePasse">Mot de passe (sera généré côté backend)</Label>
                  <Input
                    id="motDePasse"
                    type="password"
                    value={userFormData.motDePasse}
                    onChange={(e) => setUserFormData({...userFormData, motDePasse: e.target.value})}
                    placeholder="Optionnel (laisse vide pour générer)"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Select value={userFormData.role} onValueChange={(value: 'user' | 'admin') => setUserFormData({...userFormData, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Utilisateur</SelectItem>
                      <SelectItem value="admin">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="statut">Statut</Label>
                  <Select value={userFormData.statut} onValueChange={(value: 'actif' | 'bloqué' | 'suspendu') => setUserFormData({...userFormData, statut: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="actif">Actif</SelectItem>
                      <SelectItem value="bloqué">Bloqué</SelectItem>
                      <SelectItem value="suspendu">Suspendu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={handleCloseUserDialog}>
                Annuler
              </Button>
              <Button onClick={handleSaveUser} className="bg-blue-600 hover:bg-blue-700">
                {editingUser ? 'Modifier' : 'Ajouter'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
