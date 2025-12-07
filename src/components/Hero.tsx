import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { CheckCircle, Download, Truck } from "lucide-react";

export function Hero() {
  const scrollToCatalog = () => {
    const catalogSection = document.getElementById('catalog');
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-gradient-to-br from-blue-50 to-cyan-50 py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content Left */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl leading-tight text-gray-900">
                Trouve tes livres en{" "}
                <span className="text-blue-600">un clic</span>
              </h1>
              <p className="text-lg lg:text-xl text-gray-600 leading-relaxed">
                Achetez ou louez des manuels, fiches et polycopiés
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg"
                onClick={scrollToCatalog}
              >
                Parcourir le catalogue
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg"
                  >
                    Comment ça marche ?
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Comment fonctionne e-Biblio ?</DialogTitle>
                    <DialogDescription>
                      Découvrez notre plateforme en 3 étapes simples
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <CheckCircle className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">1. Parcourez notre catalogue</h3>
                        <p className="text-gray-600 text-sm">
                          Recherchez parmi des milliers de manuels, fiches et polycopiés. 
                          Utilisez nos filtres pour trouver exactement ce dont vous avez besoin.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="bg-green-100 p-3 rounded-full">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">2. Choisissez : Achat ou Location</h3>
                        <p className="text-gray-600 text-sm">
                          <strong>Achat :</strong> Le livre vous appartient pour toujours<br/>
                          <strong>Location :</strong> Accès temporaire à prix réduit, parfait pour un semestre
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="bg-cyan-100 p-3 rounded-full">
                        <Download className="h-6 w-6 text-cyan-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">3. Recevez vos livres</h3>
                        <p className="text-gray-600 text-sm">
                          <strong>Livres numériques :</strong> Téléchargement immédiat après paiement<br/>
                          <strong>Livres papier :</strong> Livraison gratuite sous 24-48h
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Avantages e-Biblio</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Livraison gratuite pour tous les livres</li>
                        <li>• Garantie de remboursement 30 jours</li>
                        <li>• Support étudiant dédié</li>
                        <li>• Rappels automatiques pour les locations</li>
                      </ul>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Illustration Right */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1685463894505-d33387aa8430?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwc3R1ZHlpbmclMjBib29rcyUyMGlsbHVzdHJhdGlvbnxlbnwxfHx8fDE3NTkxODQ4Mjh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Étudiant avec livres"
                className="w-full h-80 lg:h-96 object-cover"
              />
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-cyan-400 rounded-full"></div>
            <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-green-400 rounded-full"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
