import { useState } from "react";
import { Link } from "wouter";
import { useListCars, useDeleteCar, useUpdateCarStatus, getListCarsQueryKey } from "@workspace/api-client-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye, Edit, Trash2, CheckCircle2, MoreHorizontal, Fuel, Settings2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { CarStatus, CarFuel, CarTransmission, CarCondition } from "@workspace/api-client-react/src/generated/api.schemas";

export default function CarsList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [fuel, setFuel] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useListCars({
    search: search || undefined,
    status: status !== "all" ? status as CarStatus : undefined,
    fuel: fuel !== "all" ? fuel as CarFuel : undefined,
    page,
    limit: 1000
  });

  const deleteCar = useDeleteCar();
  const updateStatus = useUpdateCarStatus();

  const handleDelete = (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer ce véhicule ?")) return;
    deleteCar.mutate({ id }, {
      onSuccess: () => {
        toast.success("Véhicule supprimé");
        queryClient.invalidateQueries({ queryKey: getListCarsQueryKey() });
      },
      onError: () => toast.error("Erreur lors de la suppression")
    });
  };

  const handleMarkSold = (id: number) => {
    updateStatus.mutate({ id, data: { status: "sold" } }, {
      onSuccess: () => {
        toast.success("Véhicule marqué comme vendu");
        queryClient.invalidateQueries({ queryKey: getListCarsQueryKey() });
      },
      onError: () => toast.error("Erreur")
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available': return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">Disponible</Badge>;
      case 'reserved': return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">Réservé</Badge>;
      case 'sold': return <Badge variant="secondary" className="bg-muted text-muted-foreground">Vendu</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Inventaire Voitures</h1>
          <p className="text-muted-foreground mt-1">Gérez votre flotte et suivez les statuts de vente.</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/cars/new">
            <Plus size={16} />
            Ajouter un véhicule
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Rechercher par marque, modèle..." 
            className="pl-9 font-mono"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="available">Disponible</SelectItem>
            <SelectItem value="reserved">Réservé</SelectItem>
            <SelectItem value="sold">Vendu</SelectItem>
          </SelectContent>
        </Select>
        <Select value={fuel} onValueChange={setFuel}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Carburant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous carburants</SelectItem>
            <SelectItem value="essence">Essence</SelectItem>
            <SelectItem value="diesel">Diesel</SelectItem>
            <SelectItem value="hybride">Hybride</SelectItem>
            <SelectItem value="electrique">Électrique</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Véhicule</TableHead>
              <TableHead>Détails</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Prix Achat</TableHead>
              <TableHead className="text-right">Prix Vente</TableHead>
              <TableHead className="text-right">Marge</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : data?.cars.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Aucun véhicule trouvé
                </TableCell>
              </TableRow>
            ) : (
              data?.cars.map((car) => {
                const margin = car.sellingPrice - car.purchasePrice;
                const marginPercent = (margin / car.purchasePrice) * 100;
                
                return (
                  <TableRow key={car.id} className="group">
                    <TableCell>
                      <div className="font-semibold text-foreground">{car.brand} {car.model}</div>
                      <div className="text-xs text-muted-foreground font-mono">{car.year} • {formatNumber(car.mileage)} km</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Fuel size={12} /> {car.fuel}</span>
                        <span className="flex items-center gap-1"><Settings2 size={12} /> {car.transmission}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(car.status)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {formatCurrency(car.purchasePrice)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(car.sellingPrice)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <div className={margin >= 0 ? "text-green-500" : "text-red-500"}>
                        {margin > 0 ? "+" : ""}{formatCurrency(margin)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {marginPercent.toFixed(1)}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/cars/${car.id}`} className="flex items-center cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" /> Détails
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {car.status !== "sold" && (
                            <DropdownMenuItem onClick={() => handleMarkSold(car.id)} className="text-green-500 focus:text-green-500 cursor-pointer">
                              <CheckCircle2 className="mr-2 h-4 w-4" /> Marquer vendu
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(car.id)} className="text-destructive focus:text-destructive cursor-pointer">
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
