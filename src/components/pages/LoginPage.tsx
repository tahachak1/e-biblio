import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useApp } from "../AppContext";
import { toast } from "sonner@2.0.3";
import { BookOpen } from "lucide-react";

export function LoginPage() {
  const { login, register, setCurrentPage, isLoading } = useApp();
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form state
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      await login(loginEmail, loginPassword);
      // Redirection gérée dans AppContext selon le rôle
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role === 'admin') {
        setCurrentPage("admin-dashboard");
      } else {
        setCurrentPage("home");
      }
    } catch (error) {
      // Erreur déjà gérée dans login()
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerFirstName || !registerLastName || !registerEmail || !registerPassword || !registerConfirmPassword) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (registerPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    try {
      await register({
        firstName: registerFirstName,
        lastName: registerLastName,
        email: registerEmail,
        password: registerPassword,
      });
      setCurrentPage("home");
    } catch (error) {
      // Erreur déjà gérée dans register()
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 text-white p-4 rounded-2xl">
              <BookOpen className="h-10 w-10" />
            </div>
          </div>
          <h1 className="text-3xl text-gray-900">e-Biblio</h1>
          <p className="text-gray-600 mt-2">Votre bibliothèque en ligne</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            <TabsTrigger value="register">Inscription</TabsTrigger>
          </TabsList>
          
          {/* Onglet Connexion */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Connexion</CardTitle>
                <CardDescription>
                  Connectez-vous à votre compte e-Biblio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Mot de passe</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <a href="#" className="text-blue-600 hover:underline">
                      Mot de passe oublié ?
                    </a>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading}
                  >
                    {isLoading ? "Connexion..." : "Se connecter"}
                  </Button>
                </form>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900 mb-2">Comptes de test :</p>
                  <p className="text-xs text-blue-700">
                    <strong>Admin :</strong> admin@ebiblio.com / Admin123<br/>
                    <strong>User :</strong> user@ebiblio.com / User123
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Inscription */}
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Créer un compte</CardTitle>
                <CardDescription>
                  Rejoignez e-Biblio dès aujourd'hui
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-firstname">Prénom</Label>
                      <Input
                        id="register-firstname"
                        type="text"
                        placeholder="Jean"
                        value={registerFirstName}
                        onChange={(e) => setRegisterFirstName(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-lastname">Nom</Label>
                      <Input
                        id="register-lastname"
                        type="text"
                        placeholder="Dupont"
                        value={registerLastName}
                        onChange={(e) => setRegisterLastName(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Mot de passe</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Confirmer le mot de passe</Label>
                    <Input
                      id="register-confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading}
                  >
                    {isLoading ? "Création..." : "Créer mon compte"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => setCurrentPage("home")}
            className="text-gray-600 hover:text-blue-600"
          >
            ← Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
}
