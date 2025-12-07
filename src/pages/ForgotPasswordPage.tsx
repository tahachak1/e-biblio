import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, KeyRound } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export const ForgotPasswordPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const { requestPasswordReset } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim()) {
      toast.error('Veuillez saisir votre email');
      return;
    }

    setLoading(true);

    try {
      const response = await requestPasswordReset(identifier.trim());
      toast.success('Si un compte existe, un code de vérification a été envoyé');

      navigate('/reset-password', {
        state: {
          identifier: identifier.trim(),
          userId: response.userId || null
        }
      });
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la demande de réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 text-white p-4 rounded-2xl">
              <KeyRound className="h-10 w-10" />
            </div>
          </div>
          <h1 className="text-3xl text-gray-900">Mot de passe oublié</h1>
          <p className="text-gray-600 mt-2">
            Recevez un code de vérification pour réinitialiser votre mot de passe
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Réinitialisation du mot de passe</CardTitle>
            <CardDescription>
              Entrez votre email pour recevoir un code de vérification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Identifier Input */}
              <div className="space-y-2">
                <Label htmlFor="identifier">Adresse email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="identifier"
                    type="email"
                    placeholder="votre@email.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={loading}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-5 h-5 mr-2" />
                    Envoyer le code
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Vous vous souvenez de votre mot de passe ?{' '}
                <Link to="/login" className="text-blue-600 hover:underline">
                  Se connecter
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-blue-600"
          >
            ← Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
};
