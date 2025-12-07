import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { Button } from './ui/button';

export function BackendStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkBackend = async () => {
    setIsChecking(true);
    try {
      const API_URL = 'http://localhost:4000/api';
      const response = await fetch(`${API_URL}/books?limit=1`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      setIsConnected(response.ok);
    } catch (error) {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkBackend();
  }, []);

  if (isConnected === null) {
    return null;
  }

  if (isConnected) {
    return (
      <Alert className="border-green-200 bg-green-50 mb-4">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Backend connecté</AlertTitle>
        <AlertDescription className="text-green-700">
          Votre backend est accessible sur http://localhost:4000
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-orange-200 bg-orange-50 mb-4">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800">Mode démo - Backend non connecté</AlertTitle>
      <AlertDescription className="text-orange-700">
        <p className="mb-2">
          L'application fonctionne en mode démo avec des données factices.
        </p>
        <div className="space-y-1 text-sm">
          <p className="font-semibold">Pour connecter votre backend :</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Démarrez votre backend : <code className="bg-orange-100 px-1 rounded">npm start</code></li>
            <li>Vérifiez qu'il tourne sur <code className="bg-orange-100 px-1 rounded">http://localhost:4000</code></li>
            <li>
              <Button
                variant="outline"
                size="sm"
                onClick={checkBackend}
                disabled={isChecking}
                className="ml-2 h-7"
              >
                {isChecking ? 'Vérification...' : 'Réessayer'}
              </Button>
            </li>
          </ol>
        </div>
      </AlertDescription>
    </Alert>
  );
}
