import { useState } from "react";
import { useListSales, useGetSaleStats } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function SalesList() {
  const [period, setPeriod] = useState<"day" | "week" | "month" | "year">("month");
  
  const { data: salesData, isLoading: salesLoading } = useListSales({ period, limit: 50 });
  const { data: statsData, isLoading: statsLoading } = useGetSaleStats({ period });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Registre des Ventes</h1>
          <p className="text-muted-foreground mt-1">Analyse des revenus et marges de l'entreprise.</p>
        </div>
        
        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-auto">
          <TabsList className="grid grid-cols-4 w-[400px]">
            <TabsTrigger value="day">Jour</TabsTrigger>
            <TabsTrigger value="week">Sem</TabsTrigger>
            <TabsTrigger value="month">Mois</TabsTrigger>
            <TabsTrigger value="year">Année</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {statsData && !statsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Volume (Ventes)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">{statsData.totalSales}</div>
            </CardContent>
          </Card>
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Chiffre d'Affaires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-primary">{formatCurrency(statsData.totalRevenue)}</div>
            </CardContent>
          </Card>
          <Card className="border-green-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Bénéfice Net</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3">
                <div className={`text-3xl font-bold font-mono ${statsData.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(statsData.totalProfit)}
                </div>
                <Badge variant={statsData.profitPercent >= 0 ? "default" : "destructive"} className="mb-1 font-mono text-sm bg-green-500 text-white hover:bg-green-600">
                  {statsData.profitPercent > 0 ? "+" : ""}{statsData.profitPercent.toFixed(1)}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {statsData?.chartData && statsData.chartData.length > 0 && (
        <Card className="pt-6">
          <div className="h-[300px] w-full px-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={statsData.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000000}M`} />
                <Tooltip 
                  contentStyle={{backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px'}}
                  formatter={(value: number, name: string) => [formatCurrency(value), name === 'revenue' ? 'CA' : 'Profit']}
                />
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area yAxisId="left" type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Véhicule</TableHead>
              <TableHead>Date de Vente</TableHead>
              <TableHead>Vendeur</TableHead>
              <TableHead className="text-right">Coût Achat</TableHead>
              <TableHead className="text-right">Prix Final</TableHead>
              <TableHead className="text-right">Bénéfice</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salesLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : salesData?.sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  Aucune vente sur cette période
                </TableCell>
              </TableRow>
            ) : (
              salesData?.sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">
                    {sale.carBrand} {sale.carModel} <span className="text-xs text-muted-foreground">({sale.carYear})</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(sale.soldAt), "dd MMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell>{sale.sellerName}</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {formatCurrency(sale.purchasePrice)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-foreground">
                    {formatCurrency(sale.finalPrice)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <div className={sale.profit >= 0 ? "text-green-500" : "text-red-500"}>
                      {sale.profit > 0 ? "+" : ""}{formatCurrency(sale.profit)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {sale.profitPercent.toFixed(1)}%
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
