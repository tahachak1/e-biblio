import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, KeyRound, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export const ResetPasswordPage: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userId = location.state?.userId;
  const identifier = location.state?.identifier;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error('Le code doit contenir 6 chiffres');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(userId, otp, newPassword);
      toast.success('Mot de passe réinitialisé avec succès !');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Session expirée. Veuillez recommencer.</p>
              <Link to="/forgot-password">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Retour à la réinitialisation
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <h1 className="text-3xl text-gray-900">Nouveau mot de passe</h1>
          <p className="text-gray-600 mt-2">
            Entrez le code de vérification et votre nouveau mot de passe
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Réinitialisation du mot de passe</CardTitle>
            <CardDescription>
              Code envoyé à {identifier || 'votre adresse email'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* OTP Input */}
              <div className="space-y-2">
                <Label htmlFor="otp">Code de vérification (6 chiffres)</Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="000000"
                  disabled={loading}
                  required
                  className="text-center text-xl tracking-widest font-mono"
                  maxLength={6}
                />
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={8}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={8}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading || otp.length !== 6 || newPassword.length < 8 || newPassword !== confirmPassword}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Réinitialisation...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Réinitialiser le mot de passe
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/forgot-password"
                className="text-blue-600 hover:underline text-sm"
              >
                ← Retour à la demande de code
              </Link>
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
