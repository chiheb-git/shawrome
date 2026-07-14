import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useGetCar, useUpdateCarPrice, useMarkCarAsSold, getGetCarQueryKey, useListPriceHistory } from "@workspace/api-client-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Gauge, Fuel, Settings2, CheckCircle2, TrendingDown, TrendingUp, History } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CarDetail() {
  const [, params] = useRoute("/cars/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: car, isLoading } = useGetCar(id);
  const { data: historyData } = useListPriceHistory({ carId: id });
  
  const updatePrice = useUpdateCarPrice();
  const markAsSold = useMarkCarAsSold();

  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
  const [newPrice, setNewPrice] = useState("");

  if (isLoading || !car) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Chargement des données du véhicule...</div>;
  }

  const handleUpdatePrice = () => {
    if (!newPrice || isNaN(Number(newPrice))) return;
    updatePrice.mutate({ id, data: { sellingPrice: Number(newPrice) } }, {
      onSuccess: () => {
        toast.success("Prix mis à jour");
        setIsPriceDialogOpen(false);
        setNewPrice("");
        queryClient.invalidateQueries({ queryKey: getGetCarQueryKey(id) });
      },
      onError: () => toast.error("Erreur lors de la mise à jour")
    });
  };

  const handleMarkSold = () => {
    if (!confirm(`Confirmez-vous la vente de ${car.brand} ${car.model} pour ${formatCurrency(car.sellingPrice)} ?`)) return;
    
    markAsSold.mutate({ id }, {
      onSuccess: () => {
        toast.success("Véhicule vendu !");
        queryClient.invalidateQueries({ queryKey: getGetCarQueryKey(id) });
      },
      onError: () => toast.error("Erreur lors de la transaction")
    });
  };

  const margin = car.sellingPrice - car.purchasePrice;
  const marginPercent = (margin / car.purchasePrice) * 100;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/cars">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{car.brand} {car.model}</h1>
            <p className="text-muted-foreground mt-1 uppercase text-sm font-mono">VIN/ID: #{car.id.toString().padStart(6, '0')} • Ajouté le {format(new Date(car.createdAt), "dd MMM yyyy", { locale: fr })}</p>
          </div>
          <div className="flex items-center gap-3">
            {car.status === "available" && (
              <Badge className="bg-green-500/10 text-green-500 text-lg px-4 py-1 border-green-500/20">Disponible</Badge>
            )}
            {car.status === "reserved" && (
              <Badge className="bg-amber-500/10 text-amber-500 text-lg px-4 py-1 border-amber-500/20">Réservé</Badge>
            )}
            {car.status === "sold" && (
              <Badge variant="secondary" className="text-lg px-4 py-1">Vendu le {car.soldAt ? format(new Date(car.soldAt), "dd MMM yyyy") : ""}</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {car.photos && car.photos.length > 0 ? (
            <Card className="overflow-hidden border-0 shadow-lg bg-black">
              <div className="aspect-[16/9] relative">
                <img src={car.photos[0]} alt={`${car.brand} ${car.model}`} className="object-contain w-full h-full opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              {car.photos.length > 1 && (
                <div className="flex gap-2 p-4 bg-card overflow-x-auto">
                  {car.photos.slice(1).map((photo, i) => (
                    <div key={i} className="h-20 w-20 shrink-0 rounded-md overflow-hidden border border-border">
                      <img src={photo} className="object-cover w-full h-full" alt="thumbnail" />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            <Card className="h-[400px] flex items-center justify-center bg-secondary/20 border-dashed border-2">
              <div className="text-center text-muted-foreground">
                <div className="text-4xl mb-2">📸</div>
                <p>Aucune photo disponible</p>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <Calendar className="h-6 w-6 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Année</span>
                <span className="font-bold text-lg">{car.year}</span>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <Gauge className="h-6 w-6 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Kilométrage</span>
                <span className="font-bold text-lg font-mono">{formatNumber(car.mileage)}</span>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <Fuel className="h-6 w-6 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Carburant</span>
                <span className="font-bold text-lg capitalize">{car.fuel}</span>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <Settings2 className="h-6 w-6 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Boîte</span>
                <span className="font-bold text-lg capitalize">{car.transmission}</span>
              </CardContent>
            </Card>
          </div>

          {car.description && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Description</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{car.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-primary/5 pb-4 border-b border-border">
              <CardTitle>Finance</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div>
                <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">Prix de vente</div>
                <div className="text-3xl font-bold font-mono text-primary flex items-end gap-2">
                  {formatCurrency(car.sellingPrice)}
                  {car.status !== "sold" && (
                    <Dialog open={isPriceDialogOpen} onOpenChange={setIsPriceDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 text-xs underline decoration-dotted">Modifier</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Modifier le prix de vente</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <Label>Nouveau prix (DZD)</Label>
                          <Input 
                            type="number" 
                            className="mt-2 font-mono text-lg" 
                            placeholder={car.sellingPrice.toString()}
                            value={newPrice}
                            onChange={e => setNewPrice(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsPriceDialogOpen(false)}>Annuler</Button>
                          <Button onClick={handleUpdatePrice} disabled={updatePrice.isPending}>Valider</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Prix d'achat</div>
                  <div className="text-lg font-mono">{formatCurrency(car.purchasePrice)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Marge Projetée</div>
                  <div className={`text-lg font-mono font-bold ${margin >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {margin > 0 ? "+" : ""}{formatCurrency(margin)}
                    <span className="text-xs ml-1 opacity-70">({marginPercent.toFixed(1)}%)</span>
                  </div>
                </div>
              </div>

              {car.status !== "sold" && (
                <div className="pt-4 border-t border-border">
                  <Button 
                    className="w-full text-lg h-14 font-bold tracking-wide" 
                    size="lg"
                    onClick={handleMarkSold}
                    disabled={markAsSold.isPending}
                  >
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    MARQUER COMME VENDU
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5" /> Historique des prix
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyData && historyData.history.length > 0 ? (
                <div className="space-y-4 pt-2 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                  {historyData.history.map((record) => {
                    const isDrop = record.newPrice < record.oldPrice;
                    return (
                      <div key={record.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full border border-background bg-secondary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow absolute left-0 md:left-1/2 z-10" />
                        <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] ml-8 md:ml-0 p-3 rounded border border-border bg-card shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <div className={`text-sm font-bold font-mono flex items-center gap-1 ${isDrop ? "text-red-500" : "text-green-500"}`}>
                              {isDrop ? <TrendingDown size={14}/> : <TrendingUp size={14}/>}
                              {formatCurrency(record.newPrice)}
                            </div>
                            <time className="text-xs text-muted-foreground">{format(new Date(record.createdAt), "dd/MM", {locale:fr})}</time>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono line-through">
                            {formatCurrency(record.oldPrice)}
                          </div>
                          <div className="text-xs mt-1 text-muted-foreground text-right italic">
                            par {record.modifiedByName}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">Aucune modification enregistrée</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Vendeur Assigné</div>
              <div className="font-medium text-foreground">{car.sellerName || "Aucun vendeur assigné"}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
