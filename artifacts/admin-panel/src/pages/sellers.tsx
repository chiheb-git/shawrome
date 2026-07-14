import { useState } from "react";
import { useGetSellerStats, useCreateUser, useToggleUserActive, useListUsers } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, User, Mail, Phone, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const sellerSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Mot de passe requis (6 min)"),
  phone: z.string().optional(),
  role: z.literal("seller"),
});

type SellerFormValues = z.infer<typeof sellerSchema>;

export default function SellersList() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data: statsData, isLoading: statsLoading } = useGetSellerStats();
  const { data: usersData, isLoading: usersLoading } = useListUsers({ role: "seller" });
  
  const createUser = useCreateUser();
  const toggleActive = useToggleUserActive();

  const form = useForm<SellerFormValues>({
    resolver: zodResolver(sellerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "seller",
    },
  });

  const onSubmit = (data: SellerFormValues) => {
    createUser.mutate({ data }, {
      onSuccess: () => {
        toast.success("Vendeur créé avec succès");
        setIsModalOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        queryClient.invalidateQueries({ queryKey: ["/api/sales/sellers/stats"] });
      },
      onError: () => toast.error("Erreur lors de la création")
    });
  };

  const handleToggleActive = (id: number, active: boolean) => {
    toggleActive.mutate({ id, data: { active } }, {
      onSuccess: () => {
        toast.success(active ? "Compte réactivé" : "Compte désactivé");
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      },
      onError: () => toast.error("Erreur")
    });
  };

  // Merge stats with base user info
  const enrichedSellers = usersData?.users.map(user => {
    const stats = statsData?.sellers.find(s => s.userId === user.id);
    return { ...user, stats };
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Équipe de Vente</h1>
          <p className="text-muted-foreground mt-1">Gérez les accès vendeurs et surveillez leurs performances.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} /> Ajouter un vendeur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau Vendeur</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom complet</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input className="pl-10" placeholder="Jean Dupont" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email professionnel</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input className="pl-10 font-mono" placeholder="jean@shawrome.dz" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input className="pl-10 font-mono" placeholder="05 55 55 55 55" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe provisoire</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type="password" className="pl-10 font-mono" placeholder="••••••" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                  <Button type="submit" disabled={createUser.isPending}>Créer le compte</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Vendeur</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-center">Véhicules Gérés</TableHead>
              <TableHead className="text-right">Ventes Conclues</TableHead>
              <TableHead className="text-right">CA Généré</TableHead>
              <TableHead className="text-right">Bénéfice Rapporté</TableHead>
              <TableHead className="text-center w-24">Accès</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersLoading || statsLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : enrichedSellers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Aucun vendeur trouvé
                </TableCell>
              </TableRow>
            ) : (
              enrichedSellers.map((seller) => (
                <TableRow key={seller.id} className={!seller.active ? "opacity-60 bg-muted/20" : ""}>
                  <TableCell>
                    <div className="font-medium text-foreground">{seller.name}</div>
                    <div className="text-xs text-muted-foreground">ID: #{seller.id}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-mono text-foreground">{seller.email}</div>
                    <div className="text-xs text-muted-foreground font-mono">{seller.phone || "-"}</div>
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    <Badge variant="outline">{seller.stats?.carsManaged || 0}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {seller.stats?.totalSales || 0}
                  </TableCell>
                  <TableCell className="text-right font-mono text-primary">
                    {formatCurrency(seller.stats?.totalRevenue || 0)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-green-500 font-medium">
                    {formatCurrency(seller.stats?.totalProfit || 0)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch 
                      checked={seller.active} 
                      onCheckedChange={(checked) => handleToggleActive(seller.id, checked)}
                      className={seller.active ? "bg-primary" : "bg-muted"}
                    />
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
