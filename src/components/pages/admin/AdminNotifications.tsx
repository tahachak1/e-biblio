import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import { Textarea } from "../../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { ArrowLeft, Send, Bell, Users, User, Mail, MessageSquare, Calendar } from "lucide-react";
import { useApp } from "../../AppContext";
import { toast } from "sonner@2.0.3";
import api from "../../../services/api";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'general' | 'promo' | 'rappel' | 'urgent';
  recipient: 'all' | 'users' | 'specific';
  recipientDetails?: string;
  dateSent: string;
  status: 'sent' | 'draft' | 'scheduled';
  readCount?: number;
  totalRecipients?: number;
}

export function AdminNotifications() {
  const { setCurrentPage } = useApp();
  const navigate = useNavigate();
  const [isCreatingNotification, setIsCreatingNotification] = useState(false);
  const [selectedTab, setSelectedTab] = useState('sent');
  const [sending, setSending] = useState(false);

  // Données simulées des notifications
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Nouvelle collection de manuels disponible",
      message: "Découvrez notre nouvelle collection de manuels pour la rentrée 2025. Plus de 50 nouveaux titres ajoutés !",
      type: "general",
      recipient: "all",
      dateSent: "2025-01-20T10:00:00Z",
      status: "sent",
      readCount: 45,
      totalRecipients: 78
    },
    {
      id: "2",
      title: "Promotion exceptionnelle - 20% de réduction",
      message: "Profitez de 20% de réduction sur tous les livres de mathématiques jusqu'au 31 janvier !",
      type: "promo",
      recipient: "users",
      dateSent: "2025-01-19T14:30:00Z",
      status: "sent",
      readCount: 32,
      totalRecipients: 65
    },
    {
      id: "3",
      title: "Rappel de retour - Location expire bientôt",
      message: "Votre location du livre 'Programmation PHP & Symfony' expire dans 3 jours. Pensez à le prolonger ou le retourner.",
      type: "rappel",
      recipient: "specific",
      recipientDetails: "jean.martin@email.com",
      dateSent: "2025-01-18T09:00:00Z",
      status: "sent",
      readCount: 1,
      totalRecipients: 1
    },
    {
      id: "4",
      title: "Maintenance programmée du site",
      message: "Une maintenance est prévue le 25 janvier de 2h à 4h du matin. Le site sera temporairement indisponible.",
      type: "urgent",
      recipient: "all",
      dateSent: "",
      status: "draft"
    }
  ]);

  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "general" as const,
    recipient: "all" as const,
    recipientDetails: "",
    scheduleDate: "",
    ctaLabel: "Voir les détails",
    ctaUrl: ""
  });

  const handleBackToDashboard = () => {
    setCurrentPage('admin-dashboard');
    navigate('/admin/dashboard');
  };

  const handleSendNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      toast.error("Veuillez remplir le titre et le message");
      return;
    }

    if (newNotification.recipient === 'specific' && !newNotification.recipientDetails) {
      toast.error("Merci d'indiquer l'email du destinataire");
      return;
    }

    setSending(true);
    try {
      const payload = {
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        recipient: newNotification.recipient,
        recipientEmail: newNotification.recipient === 'specific' ? newNotification.recipientDetails : undefined,
        ctaLabel: newNotification.ctaLabel || undefined,
        ctaUrl: newNotification.ctaUrl || undefined,
      };
      const { sent } = await api.admin.sendNotification(payload);

      const notification: Notification = {
        id: Date.now().toString(),
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        recipient: newNotification.recipient,
        recipientDetails: newNotification.recipientDetails || undefined,
        dateSent: new Date().toISOString(),
        status: newNotification.scheduleDate ? "scheduled" : "sent",
        readCount: 0,
        totalRecipients: sent,
      };

      setNotifications([notification, ...notifications]);
      setNewNotification({
        title: "",
        message: "",
        type: "general",
        recipient: "all",
        recipientDetails: "",
        scheduleDate: "",
        ctaLabel: "Voir les détails",
        ctaUrl: ""
      });
      setIsCreatingNotification(false);
      
      toast.success(newNotification.scheduleDate ? "Notification programmée" : "Notification envoyée avec succès");
    } catch (error: any) {
      console.error(error);
      toast.error("Envoi impossible. Vérifiez la configuration email.");
    } finally {
      setSending(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'general': return 'text-blue-600 bg-blue-100';
      case 'promo': return 'text-green-600 bg-green-100';
      case 'rappel': return 'text-orange-600 bg-orange-100';
      case 'urgent': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-600 bg-green-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRecipientIcon = (recipient: string) => {
    switch (recipient) {
      case 'all': return <Users className="h-4 w-4" />;
      case 'users': return <Users className="h-4 w-4" />;
      case 'specific': return <User className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (selectedTab === 'sent') return notification.status === 'sent';
    if (selectedTab === 'draft') return notification.status === 'draft';
    if (selectedTab === 'scheduled') return notification.status === 'scheduled';
    return true;
  });

  const getTotalSent = () => notifications.filter(n => n.status === 'sent').length;
  const getTotalDrafts = () => notifications.filter(n => n.status === 'draft').length;
  const getTotalScheduled = () => notifications.filter(n => n.status === 'scheduled').length;
  const getTotalReads = () => notifications.reduce((sum, n) => sum + (n.readCount || 0), 0);

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
              <h1 className="text-3xl text-gray-900">Gestion des Notifications</h1>
              <p className="text-gray-600">Envoyez et gérez vos communications</p>
            </div>
          </div>

          <Dialog open={isCreatingNotification} onOpenChange={setIsCreatingNotification}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Send className="h-4 w-4 mr-2" />
                Nouvelle notification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle notification</DialogTitle>
                <DialogDescription>
                  Rédigez votre message à envoyer aux utilisateurs
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                    placeholder="Titre de la notification"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                    placeholder="Contenu du message..."
                    rows={4}
                  />
                  <div className="text-sm text-gray-500">
                    {newNotification.message.length}/500 caractères
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type de notification</Label>
                    <Select value={newNotification.type} onValueChange={(value: any) => setNewNotification({...newNotification, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">
                          <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            Général
                          </div>
                        </SelectItem>
                        <SelectItem value="promo">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Promotion
                          </div>
                        </SelectItem>
                        <SelectItem value="rappel">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Rappel
                          </div>
                        </SelectItem>
                        <SelectItem value="urgent">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Urgent
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Destinataires</Label>
                    <Select value={newNotification.recipient} onValueChange={(value: any) => setNewNotification({...newNotification, recipient: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Tous les utilisateurs
                          </div>
                        </SelectItem>
                        <SelectItem value="users">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Utilisateurs seulement
                          </div>
                        </SelectItem>
                        <SelectItem value="specific">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Utilisateur spécifique
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {newNotification.recipient === 'specific' && (
                  <div className="space-y-2">
                    <Label htmlFor="recipientDetails">Email du destinataire</Label>
                    <Input
                      id="recipientDetails"
                      value={newNotification.recipientDetails}
                      onChange={(e) => setNewNotification({...newNotification, recipientDetails: e.target.value})}
                      placeholder="utilisateur@email.com"
                      type="email"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ctaLabel">Texte du bouton (optionnel)</Label>
                    <Input
                      id="ctaLabel"
                      value={newNotification.ctaLabel}
                      onChange={(e) => setNewNotification({ ...newNotification, ctaLabel: e.target.value })}
                      placeholder="Ex: Découvrir l'offre"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ctaUrl">Lien du bouton (optionnel)</Label>
                    <Input
                      id="ctaUrl"
                      value={newNotification.ctaUrl}
                      onChange={(e) => setNewNotification({ ...newNotification, ctaUrl: e.target.value })}
                      placeholder="https://votre-site.com/offre"
                      type="url"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduleDate">Programmer l'envoi (optionnel)</Label>
                  <Input
                    id="scheduleDate"
                    type="datetime-local"
                    value={newNotification.scheduleDate}
                    onChange={(e) => setNewNotification({...newNotification, scheduleDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreatingNotification(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSendNotification} disabled={sending}>
                  {sending ? 'Envoi...' : newNotification.scheduleDate ? 'Programmer' : 'Envoyer'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Notifications Envoyées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalSent()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Brouillons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {getTotalDrafts()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Programmées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {getTotalScheduled()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Lectures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {getTotalReads()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="flex border-b">
              <button
                onClick={() => setSelectedTab('sent')}
                className={`px-6 py-3 text-sm font-medium ${
                  selectedTab === 'sent' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Envoyées ({getTotalSent()})
              </button>
              <button
                onClick={() => setSelectedTab('draft')}
                className={`px-6 py-3 text-sm font-medium ${
                  selectedTab === 'draft' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Brouillons ({getTotalDrafts()})
              </button>
              <button
                onClick={() => setSelectedTab('scheduled')}
                className={`px-6 py-3 text-sm font-medium ${
                  selectedTab === 'scheduled' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Programmées ({getTotalScheduled()})
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedTab === 'sent' && 'Notifications Envoyées'}
              {selectedTab === 'draft' && 'Brouillons'}
              {selectedTab === 'scheduled' && 'Notifications Programmées'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Destinataires</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  {selectedTab === 'sent' && <TableHead>Lectures</TableHead>}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{notification.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {notification.message}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(notification.type)}>
                        {notification.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRecipientIcon(notification.recipient)}
                        <div>
                          <div className="text-sm">
                            {notification.recipient === 'all' && 'Tous les utilisateurs'}
                            {notification.recipient === 'users' && 'Utilisateurs'}
                            {notification.recipient === 'specific' && 'Spécifique'}
                          </div>
                          {notification.recipientDetails && (
                            <div className="text-xs text-gray-500">
                              {notification.recipientDetails}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {notification.dateSent ? (
                        <div className="text-sm">
                          {new Date(notification.dateSent).toLocaleDateString('fr-FR')}
                          <div className="text-xs text-gray-500">
                            {new Date(notification.dateSent).toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(notification.status)}>
                        {notification.status === 'sent' && 'Envoyée'}
                        {notification.status === 'draft' && 'Brouillon'}
                        {notification.status === 'scheduled' && 'Programmée'}
                      </Badge>
                    </TableCell>
                    {selectedTab === 'sent' && (
                      <TableCell>
                        <div className="text-sm">
                          {notification.readCount || 0} / {notification.totalRecipients || 0}
                          <div className="text-xs text-gray-500">
                            {notification.totalRecipients ? 
                              Math.round(((notification.readCount || 0) / notification.totalRecipients) * 100) : 0}% lu
                          </div>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          Voir
                        </Button>
                        {notification.status === 'draft' && (
                          <Button size="sm" variant="outline">
                            Modifier
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredNotifications.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {selectedTab === 'sent' && 'Aucune notification envoyée'}
                  {selectedTab === 'draft' && 'Aucun brouillon'}
                  {selectedTab === 'scheduled' && 'Aucune notification programmée'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
