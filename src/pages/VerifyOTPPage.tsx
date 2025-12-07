import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Mail, Shield, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export const VerifyOTPPage: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { verifyOTP, resendOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userId = location.state?.userId;
  const email = location.state?.email;
  const isLogin = Boolean(location.state?.isLogin);
  const otpType = isLogin ? 'login' : 'register';

  useEffect(() => {
    if (!userId) {
      navigate('/register');
      return;
    }

    // Start countdown for resend
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [userId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error('Le code doit contenir 6 chiffres');
      return;
    }

    setLoading(true);

    try {
      const authenticatedUser = await verifyOTP(userId, otp, otpType);
      toast.success('Compte vérifié avec succès !');

      if (authenticatedUser?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la vérification');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);

    try {
      await resendOTP(userId, otpType);
      toast.success('Code de vérification renvoyé');
      setCountdown(60);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du renvoi');
    } finally {
      setResendLoading(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
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
          <h1 className="text-3xl text-gray-900">Vérification</h1>
          <p className="text-gray-600 mt-2">
            Entrez le code de vérification envoyé par email
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Code de vérification</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>Envoyé à {email || 'votre adresse email'}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="otp" className="text-sm font-medium text-gray-700">
                  Code à 6 chiffres
                </label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="000000"
                  disabled={loading}
                  required
                  className="text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Vérification...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Vérifier le code
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-4">
                Vous n'avez pas reçu le code ?
              </p>
              <Button
                variant="outline"
                onClick={handleResendOTP}
                disabled={resendLoading || countdown > 0}
                className="w-full"
              >
                {resendLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Renvoi en cours...
                  </>
                ) : countdown > 0 ? (
                  `Renvoyer dans ${countdown}s`
                ) : (
                  'Renvoyer le code'
                )}
              </Button>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/register"
                className="inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à l'inscription
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
