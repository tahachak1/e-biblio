import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Shield, LogIn } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export const OTPLoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithOTP } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim()) {
      toast.error('Veuillez saisir votre email');
      return;
    }

    setLoading(true);

    try {
      const result = await loginWithOTP(identifier.trim());
      toast.success('Code de vérification envoyé');

      navigate('/verify-otp', {
        state: {
          userId: result.userId,
          email: identifier.trim(),
          isLogin: true
        }
      });
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'envoi du code');
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
              <Shield className="h-10 w-10" />
            </div>
          </div>
          <h1 className="text-3xl text-gray-900">Connexion sans mot de passe</h1>
          <p className="text-gray-600 mt-2">
            Recevez un code de vérification pour vous connecter
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connexion OTP</CardTitle>
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
                    <LogIn className="w-5 h-5 mr-2" />
                    Recevoir le code
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600">
                Vous préférez utiliser un mot de passe ?{' '}
                <Link to="/login" className="text-blue-600 hover:underline">
                  Connexion classique
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                Pas encore de compte ?{' '}
                <Link to="/register" className="text-blue-600 hover:underline">
                  S'inscrire
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
