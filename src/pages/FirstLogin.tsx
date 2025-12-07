import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Lock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';

export const FirstLogin: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { completeFirstLogin } = useAuth();
  const initialEmail = (location.state as { email?: string } | undefined)?.email || '';

  const [email, setEmail] = useState(initialEmail);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await completeFirstLogin(email, temporaryPassword, newPassword);
      toast.success(`Bienvenue ${updatedUser?.prenom || updatedUser?.firstName || ''} !`);
      navigate(updatedUser?.role === 'admin' ? '/admin' : '/');
    } catch (error: any) {
      toast.error(error.message || 'Impossible de mettre à jour le mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-3xl text-gray-900">Première connexion</h1>
          <p className="text-gray-600 mt-2">
            Entrez votre mot de passe provisoire puis personnalisez votre accès.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Sécurisez votre compte</CardTitle>
            <CardDescription>
              Le mot de passe provisoire est valable une seule fois.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temporaryPassword">Mot de passe provisoire</Label>
                <Input
                  id="temporaryPassword"
                  type="password"
                  placeholder="Mot de passe reçu par email"
                  value={temporaryPassword}
                  onChange={(e) => setTemporaryPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Choisissez un mot de passe sécurisé"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirmez votre mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                />
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={loading}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {loading ? 'Mise à jour...' : 'Mettre à jour et continuer'}
                </Button>
                <div className="flex justify-center">
                  <Button
                    type="submit"
                    className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700"
                    disabled={loading}
                  >
                    Confirmer
                  </Button>
                </div>
              </div>
            </form>

            <p className="mt-4 text-center text-sm text-gray-500">
              Besoin d'aide ? Contactez votre administrateur ou notre support.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
