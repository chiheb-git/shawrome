import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateCar, useUploadCarPhotos, useListUsers } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, UploadCloud, X } from "lucide-react";
import { Link } from "wouter";

const carSchema = z.object({
  brand: z.string().min(1, "Marque requise"),
  model: z.string().min(1, "Modèle requis"),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
  mileage: z.coerce.number().min(0),
  purchasePrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  fuel: z.enum(["essence", "diesel", "hybride", "electrique", "gpl"]),
  transmission: z.enum(["manuelle", "automatique"]),
  color: z.string().min(1, "Couleur requise"),
  condition: z.enum(["neuf", "occasion"]),
  description: z.string().optional(),
  sellerId: z.coerce.number().optional(),
});

type CarFormValues = z.infer<typeof carSchema>;

export default function CarNew() {
  const [, setLocation] = useLocation();
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { data: sellersData } = useListUsers({ role: "seller" });
  const createCar = useCreateCar();
  const uploadPhotos = useUploadCarPhotos();

  const form = useForm<CarFormValues>({
    resolver: zodResolver(carSchema),
    defaultValues: {
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      mileage: 0,
      purchasePrice: 0,
      sellingPrice: 0,
      fuel: "essence",
      transmission: "manuelle",
      color: "Noir",
      condition: "occasion",
      description: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          setPhotos(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: CarFormValues) => {
    setIsUploading(true);
    createCar.mutate({ data }, {
      onSuccess: (newCar) => {
        if (photos.length > 0) {
          uploadPhotos.mutate({ id: newCar.id, data: { photos } }, {
            onSuccess: () => {
              toast.success("Véhicule créé avec photos");
              setLocation(`/cars/${newCar.id}`);
            },
            onError: () => {
              toast.error("Véhicule créé mais échec de l'upload des photos");
              setLocation(`/cars/${newCar.id}`);
            }
          });
        } else {
          toast.success("Véhicule créé avec succès");
          setLocation(`/cars/${newCar.id}`);
        }
      },
      onError: () => {
        toast.error("Erreur lors de la création du véhicule");
        setIsUploading(false);
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/cars">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Ajouter un Véhicule</h1>
          <p className="text-muted-foreground mt-1">Entrez les spécifications pour intégrer un véhicule à l'inventaire.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Informations Générales</CardTitle>
                <CardDescription>Détails principaux du véhicule</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marque</FormLabel>
                        <FormControl><Input placeholder="BMW, Audi..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modèle</FormLabel>
                        <FormControl><Input placeholder="A3, Série 3..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Année</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mileage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kilométrage</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>État</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="neuf">Neuf</SelectItem>
                            <SelectItem value="occasion">Occasion</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Couleur</FormLabel>
                        <FormControl><Input placeholder="Noir, Blanc..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Tarification</CardTitle>
                  <CardDescription>Coûts et prix de vente (en DZD)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="purchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prix d'Achat</FormLabel>
                        <FormControl><Input type="number" className="font-mono text-muted-foreground" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sellingPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prix de Vente</FormLabel>
                        <FormControl><Input type="number" className="font-mono font-bold text-primary border-primary/50" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mécanique</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fuel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carburant</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="essence">Essence</SelectItem>
                            <SelectItem value="diesel">Diesel</SelectItem>
                            <SelectItem value="hybride">Hybride</SelectItem>
                            <SelectItem value="electrique">Électrique</SelectItem>
                            <SelectItem value="gpl">GPL</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="transmission"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transmission</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="manuelle">Manuelle</SelectItem>
                            <SelectItem value="automatique">Automatique</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Médias & Assignation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="sellerId"
                render={({ field }) => (
                  <FormItem className="max-w-md">
                    <FormLabel>Assigner à un vendeur (Optionnel)</FormLabel>
                    <Select 
                      onValueChange={(val) => field.onChange(val === "none" ? undefined : parseInt(val))} 
                      defaultValue={field.value?.toString() || "none"}
                    >
                      <FormControl><SelectTrigger><SelectValue placeholder="Non assigné" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">Non assigné</SelectItem>
                        {sellersData?.users.map(seller => (
                          <SelectItem key={seller.id} value={seller.id.toString()}>{seller.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description détaillée</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Options, réparations effectuées, historique..." className="h-24" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel className="block mb-2">Photos du véhicule</FormLabel>
                <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-secondary/50 transition-colors relative">
                  <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-sm font-medium">Cliquez pour uploader ou glissez-déposez</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, JPEG (max 5MB par image)</p>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                  />
                </div>
                
                {photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                    {photos.map((photo, i) => (
                      <div key={i} className="relative aspect-square rounded-md overflow-hidden border border-border group">
                        <img src={photo} alt={`Upload ${i}`} className="object-cover w-full h-full" />
                        <button 
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pb-12">
            <Button type="button" variant="outline" asChild>
              <Link href="/cars">Annuler</Link>
            </Button>
            <Button type="submit" size="lg" disabled={isUploading || createCar.isPending}>
              {isUploading || createCar.isPending ? "Création en cours..." : "Ajouter le véhicule"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
