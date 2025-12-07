import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Filter, RotateCcw } from "lucide-react";
import { useState } from "react";

export function Filters() {
  const [priceRange, setPriceRange] = useState([0]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  return (
    <div className="sticky top-18 z-40 bg-white border-b border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Filters */}
        <div className="hidden lg:flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Select defaultValue="all">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="manuel">Manuel</SelectItem>
                <SelectItem value="fiche">Fiche</SelectItem>
                <SelectItem value="cahier">Cahier</SelectItem>
                <SelectItem value="pack">Pack</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="both">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Achat / Location</SelectItem>
                <SelectItem value="achat">Achat</SelectItem>
                <SelectItem value="location">Location</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-3 min-w-[200px]">
              <span className="text-sm text-gray-600 whitespace-nowrap">Prix: $0 - ${priceRange[0]}</span>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                max={100}
                step={5}
                className="flex-1"
              />
            </div>

            <Select defaultValue="popularity">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Popularité</SelectItem>
                <SelectItem value="newest">Nouveautés</SelectItem>
                <SelectItem value="price-asc">Prix (croissant)</SelectItem>
                <SelectItem value="price-desc">Prix (décroissant)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </Button>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden">
          <Button
            variant="outline"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full flex items-center justify-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtres
          </Button>

          {showMobileFilters && (
            <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  <SelectItem value="manuel">Manuel</SelectItem>
                  <SelectItem value="fiche">Fiche</SelectItem>
                  <SelectItem value="cahier">Cahier</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="both">
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Achat / Location</SelectItem>
                  <SelectItem value="achat">Achat</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                </SelectContent>
              </Select>

              <div className="space-y-2">
                <label className="text-sm text-gray-600">Prix: $0 - ${priceRange[0]}</label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={100}
                  step={5}
                />
              </div>

              <Select defaultValue="popularity">
                <SelectTrigger>
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Popularité</SelectItem>
                  <SelectItem value="newest">Nouveautés</SelectItem>
                  <SelectItem value="price-asc">Prix (croissant)</SelectItem>
                  <SelectItem value="price-desc">Prix (décroissant)</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" className="w-full flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}