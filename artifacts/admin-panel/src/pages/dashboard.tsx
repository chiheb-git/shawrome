import { useState } from "react";
import { useGetAdminDashboard, useGetTopCars } from "@workspace/api-client-react";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Car, CheckCircle2, Clock, DollarSign, Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Period = "today" | "week" | "month" | "year";
type TopPeriod = "day" | "week" | "month";

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>("month");
  const [topPeriod, setTopPeriod] = useState<TopPeriod>("month");

  const { data: dashboard, isLoading } = useGetAdminDashboard();
  const { data: topCarsData } = useGetTopCars({ period: topPeriod });

  if (isLoading || !dashboard) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2"><div className="h-4 bg-muted rounded w-1/2"></div></CardHeader>
              <CardContent><div className="h-8 bg-muted rounded w-3/4"></div></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const periodDataMap = {
    today: dashboard.todayStats,
    week: dashboard.weekStats,
    month: dashboard.monthStats,
    year: dashboard.yearStats,
  };

  const currentPeriodStats = periodDataMap[period];
  const isProfit = currentPeriodStats.profitPercent >= 0;
  const topCars = topCarsData?.topCars ?? [];

  return (
    <div className="space-y-8 pb-8">
      {/* Header + period selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Vue d'ensemble</h1>
          <p className="text-muted-foreground mt-1">Gérez votre inventaire et suivez vos performances commerciales.</p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)} className="w-auto">
          <TabsList className="grid grid-cols-4 w-[400px]">
            <TabsTrigger value="today">Aujourd'hui</TabsTrigger>
            <TabsTrigger value="week">Semaine</TabsTrigger>
            <TabsTrigger value="month">Mois</TabsTrigger>
            <TabsTrigger value="year">Année</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Fleet KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Flotte Totale</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{formatNumber(dashboard.totalCars)}</div>
            <p className="text-xs text-muted-foreground mt-1">Véhicules enregistrés</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Disponibles</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-green-500">{formatNumber(dashboard.availableCars)}</div>
            <p className="text-xs text-muted-foreground mt-1">Prêts à la vente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Réservés</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-amber-500">{formatNumber(dashboard.reservedCars)}</div>
            <p className="text-xs text-muted-foreground mt-1">En attente de paiement</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vendus (Total)</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-primary">{formatNumber(dashboard.soldCars)}</div>
            <p className="text-xs text-muted-foreground mt-1">Historique complet</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance + recent sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Periodic performance */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Performances Périodiques</CardTitle>
              <CardDescription>Indicateurs de revenus et bénéfices pour la période sélectionnée</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-secondary/30 p-4 rounded-lg border border-border">
                  <div className="text-sm text-muted-foreground mb-1">Chiffre d'Affaires</div>
                  <div className="text-xl font-bold font-mono">{formatCurrency(currentPeriodStats.revenue)}</div>
                </div>
                <div className="bg-secondary/30 p-4 rounded-lg border border-border">
                  <div className="text-sm text-muted-foreground mb-1">Bénéfice Net</div>
                  <div className={cn("text-xl font-bold font-mono", isProfit ? "text-green-500" : "text-red-500")}>
                    {formatCurrency(currentPeriodStats.profit)}
                  </div>
                </div>
                <div className="bg-secondary/30 p-4 rounded-lg border border-border">
                  <div className="text-sm text-muted-foreground mb-1">Marge</div>
                  <div className="flex items-center gap-2 mt-1">
                    {isProfit
                      ? <TrendingUp className="h-5 w-5 text-green-500" />
                      : <TrendingDown className="h-5 w-5 text-red-500" />}
                    <Badge
                      variant={isProfit ? "default" : "destructive"}
                      className="font-mono text-base px-3 py-0.5"
                    >
                      {currentPeriodStats.profitPercent > 0 ? "+" : ""}{currentPeriodStats.profitPercent.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="h-[260px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Ventes', value: currentPeriodStats.sales, label: `${currentPeriodStats.sales} vente(s)` },
                    { name: 'Objectif', value: Math.max(1, Math.ceil(currentPeriodStats.sales * 1.2)), label: '' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--secondary))' }}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Bar dataKey="value" name="Ventes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent sales */}
          <Card>
            <CardHeader>
              <CardTitle>Ventes Récentes</CardTitle>
              <CardDescription>Les dernières transactions effectuées</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Vendeur</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Prix Final</TableHead>
                    <TableHead className="text-right">Bénéfice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.recentSales.length > 0 ? (
                    dashboard.recentSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">
                          {sale.carBrand} {sale.carModel} <span className="text-muted-foreground text-xs">({sale.carYear})</span>
                        </TableCell>
                        <TableCell>{sale.sellerName}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(sale.soldAt), 'dd MMM yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {formatCurrency(sale.finalPrice)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          <span className={sale.profit >= 0 ? "text-green-500" : "text-red-500"}>
                            {sale.profit > 0 ? "+" : ""}{formatCurrency(sale.profit)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Aucune vente récente
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right column: top sellers + top 5 cars */}
        <div className="space-y-8">
          {/* Top sellers */}
          <Card>
            <CardHeader>
              <CardTitle>Meilleurs Vendeurs</CardTitle>
              <CardDescription>Classement par chiffre d'affaires</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {dashboard.topSellers.length > 0 ? (
                  dashboard.topSellers.map((seller, index) => (
                    <div key={seller.userId} className="flex items-center">
                      <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs mr-3 shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="text-sm font-medium leading-none truncate">{seller.userName}</p>
                        <p className="text-xs text-muted-foreground">{seller.totalSales} véhicule{seller.totalSales > 1 ? 's' : ''}</p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="text-xs font-bold font-mono">{formatCurrency(seller.totalRevenue)}</div>
                        <div className="text-xs text-green-500 font-mono">+{formatCurrency(seller.totalProfit)}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">Données insuffisantes</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top 5 cars */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <CardTitle>Top 5 Voitures</CardTitle>
                </div>
                <Tabs value={topPeriod} onValueChange={(v) => setTopPeriod(v as TopPeriod)}>
                  <TabsList className="h-7 text-xs">
                    <TabsTrigger value="day" className="text-xs px-2 h-5">Auj.</TabsTrigger>
                    <TabsTrigger value="week" className="text-xs px-2 h-5">Sem.</TabsTrigger>
                    <TabsTrigger value="month" className="text-xs px-2 h-5">Mois</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <CardDescription>Classées par nombre de ventes</CardDescription>
            </CardHeader>
            <CardContent>
              {topCars.length > 0 ? (
                <div className="space-y-4">
                  {topCars.map((car, index) => (
                    <div key={car.carId} className="flex items-start gap-3">
                      <div className={cn(
                        "w-6 h-6 rounded flex items-center justify-center font-bold text-xs shrink-0 mt-0.5",
                        index === 0 ? "bg-amber-400/20 text-amber-400" :
                        index === 1 ? "bg-slate-400/20 text-slate-400" :
                        index === 2 ? "bg-orange-700/20 text-orange-600" :
                        "bg-secondary text-muted-foreground"
                      )}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight truncate">
                          {car.brand} {car.model} <span className="text-muted-foreground font-normal">({car.year})</span>
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">{car.salesCount} vente{car.salesCount > 1 ? 's' : ''}</span>
                          <span className="text-xs text-green-500 font-mono">+{formatCurrency(car.totalProfit)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">{formatCurrency(car.totalRevenue)} CA</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  Aucune vente sur cette période
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
