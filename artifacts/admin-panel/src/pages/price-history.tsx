import { useListPriceHistory } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TrendingDown, TrendingUp, ArrowRight } from "lucide-react";

export default function PriceHistory() {
  const { data, isLoading } = useListPriceHistory({ limit: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Historique des prix</h1>
        <p className="text-muted-foreground mt-1">Audit des modifications de tarification sur la flotte.</p>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Date</TableHead>
              <TableHead>Véhicule</TableHead>
              <TableHead>Ancien Prix</TableHead>
              <TableHead className="w-8"></TableHead>
              <TableHead>Nouveau Prix</TableHead>
              <TableHead>Tendance</TableHead>
              <TableHead>Modifié par</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : data?.history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Aucun historique trouvé
                </TableCell>
              </TableRow>
            ) : (
              data?.history.map((record) => {
                const isDrop = record.newPrice < record.oldPrice;
                const diff = Math.abs(record.newPrice - record.oldPrice);
                const diffPercent = (diff / record.oldPrice) * 100;

                return (
                  <TableRow key={record.id}>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(record.createdAt), "dd MMM yyyy, HH:mm", { locale: fr })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {record.carBrand} {record.carModel} <span className="text-xs text-muted-foreground font-mono">#{record.carId}</span>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground line-through">
                      {formatCurrency(record.oldPrice)}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      <ArrowRight size={14} />
                    </TableCell>
                    <TableCell className={`font-mono font-bold ${isDrop ? 'text-red-500' : 'text-green-500'}`}>
                      {formatCurrency(record.newPrice)}
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md inline-flex ${isDrop ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                        {isDrop ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                        {diffPercent.toFixed(1)}% ({formatCurrency(diff)})
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {record.modifiedByName}
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
