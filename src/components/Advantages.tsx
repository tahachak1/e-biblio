import { Download, Shield, Bell } from "lucide-react";

export function Advantages() {
  const advantages = [
    {
      icon: Download,
      title: "Téléchargement instantané",
      description: "Accède aux supports numériques immédiatement après achat."
    },
    {
      icon: Shield,
      title: "Paiement sécurisé",
      description: "Paiements par carte et services (Stripe / Paypal)."
    },
    {
      icon: Bell,
      title: "Rappels automatiques",
      description: "Notifications pour les retours de location."
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {advantages.map((advantage, index) => {
            const IconComponent = advantage.icon;
            return (
              <div key={index} className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="bg-blue-100 p-4 rounded-full">
                    <IconComponent className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{advantage.title}</h3>
                <p className="text-gray-600">{advantage.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
