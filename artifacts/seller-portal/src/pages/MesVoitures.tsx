import { useEffect, useState, useRef } from "react";
import { Plus, Pencil, DollarSign, CheckCircle2, X, Link2, Image, Camera, Trash2 } from "lucide-react";

interface Car {
  id: number;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  description: string;
  purchasePrice: number;
  sellingPrice: number;
  fuel: string;
  transmission: string;
  color: string;
  condition: string;
  status: "available" | "reserved" | "sold";
  photos: string[];
}

const emptyForm = {
  brand: "",
  model: "",
  year: "",
  mileage: "",
  description: "",
  purchasePrice: "",
  sellingPrice: "",
  fuel: "essence",
  transmission: "manuelle",
  color: "",
  condition: "occasion",
  photos: [] as string[],
};

function authHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("shawrome_seller_token")}`,
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type PhotoTab = "url" | "gallery" | "camera";

export default function MesVoitures() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [priceEditId, setPriceEditId] = useState<number | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [photoTab, setPhotoTab] = useState<PhotoTab>("url");
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  async function loadCars() {
    setLoading(true);
    const meRes = await fetch("/api/auth/me", { headers: authHeaders() });
    const me = await meRes.json();
    const res = await fetch(`/api/cars?sellerId=${me.id}`, { headers: authHeaders() });
    const data = await res.json();
    setCars(data.cars ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadCars();
  }, []);

  function openCreateForm() {
    setForm(emptyForm);
    setEditingId(null);
    setUrlInput("");
    setPhotoTab("url");
    setShowForm(true);
  }

  function openEditForm(car: Car) {
    setForm({
      brand: car.brand,
      model: car.model,
      year: String(car.year),
      mileage: String(car.mileage),
      description: car.description,
      purchasePrice: String(car.purchasePrice),
      sellingPrice: String(car.sellingPrice),
      fuel: car.fuel,
      transmission: car.transmission,
      color: car.color,
      condition: car.condition,
      photos: [...car.photos],
    });
    setEditingId(car.id);
    setUrlInput("");
    setPhotoTab("url");
    setShowForm(true);
  }

  function addPhotoUrl() {
    const url = urlInput.trim();
    if (!url) return;
    setForm((f) => ({ ...f, photos: [...f.photos, url] }));
    setUrlInput("");
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const base64s = await Promise.all(
        Array.from(files).map((file) => fileToBase64(file)),
      );
      setForm((f) => ({ ...f, photos: [...f.photos, ...base64s] }));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removePhoto(index: number) {
    setForm((f) => ({ ...f, photos: f.photos.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      year: Number(form.year),
      mileage: Number(form.mileage),
      purchasePrice: Number(form.purchasePrice),
      sellingPrice: Number(form.sellingPrice),
    };

    const url = editingId ? `/api/cars/${editingId}` : "/api/cars";
    const method = editingId ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    setShowForm(false);
    loadCars();
  }

  async function handlePriceUpdate(carId: number) {
    const price = Number(newPrice);
    if (!price || price <= 0) return;

    await fetch(`/api/cars/${carId}/price`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ sellingPrice: price }),
    });

    setPriceEditId(null);
    setNewPrice("");
    loadCars();
  }

  async function handleMarkAsSold(carId: number) {
    if (!confirm("Confirmer la vente de cette voiture ?")) return;
    await fetch(`/api/cars/${carId}/sell`, {
      method: "POST",
      headers: authHeaders(),
    });
    loadCars();
  }

  const statusLabel: Record<string, string> = {
    available: "Disponible",
    reserved: "Reservee",
    sold: "Vendue",
  };

  const statusColor: Record<string, string> = {
    available: "bg-green-500/10 text-green-400",
    reserved: "bg-yellow-500/10 text-yellow-400",
    sold: "bg-gray-500/10 text-gray-400",
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Mes voitures</h1>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={16} />
          Ajouter une voiture
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Chargement...</p>
      ) : cars.length === 0 ? (
        <p className="text-gray-400">Aucune voiture pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cars.map((car) => (
            <div
              key={car.id}
              className="overflow-hidden rounded-xl border border-white/10 bg-white/5"
            >
              <div className="aspect-video bg-black/30">
                {car.photos[0] ? (
                  <img
                    src={car.photos[0]}
                    alt={`${car.brand} ${car.model}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-600">
                    Pas de photo
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white">
                      {car.brand} {car.model}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {car.year} - {car.mileage.toLocaleString("fr-DZ")} km
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${statusColor[car.status]}`}
                  >
                    {statusLabel[car.status]}
                  </span>
                </div>

                {priceEditId === car.id ? (
                  <div className="mb-3 flex gap-2">
                    <input
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="Nouveau prix"
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm text-white outline-none"
                    />
                    <button
                      onClick={() => handlePriceUpdate(car.id)}
                      className="rounded-lg bg-blue-600 px-2 text-sm text-white"
                    >
                      OK
                    </button>
                    <button
                      onClick={() => setPriceEditId(null)}
                      className="rounded-lg bg-white/10 px-2 text-sm text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <p className="mb-3 text-lg font-bold text-white">
                    {car.sellingPrice.toLocaleString("fr-DZ")} DA
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditForm(car)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white/5 py-1.5 text-xs text-gray-300 hover:bg-white/10"
                  >
                    <Pencil size={14} />
                    Modifier
                  </button>
                  {car.status !== "sold" && (
                    <>
                      <button
                        onClick={() => {
                          setPriceEditId(car.id);
                          setNewPrice(String(car.sellingPrice));
                        }}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white/5 py-1.5 text-xs text-gray-300 hover:bg-white/10"
                      >
                        <DollarSign size={14} />
                        Prix
                      </button>
                      <button
                        onClick={() => handleMarkAsSold(car.id)}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-600/20 py-1.5 text-xs text-green-400 hover:bg-green-600/30"
                      >
                        <CheckCircle2 size={14} />
                        Vendue
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-[#0f0f16] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingId ? "Modifier la voiture" : "Ajouter une voiture"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  placeholder="Marque"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                />
                <input
                  required
                  placeholder="Modele"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                />
                <input
                  required
                  type="number"
                  placeholder="Annee"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                />
                <input
                  required
                  type="number"
                  placeholder="Kilometrage"
                  value={form.mileage}
                  onChange={(e) => setForm({ ...form, mileage: e.target.value })}
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                />
                <input
                  required
                  type="number"
                  placeholder="Prix d'achat"
                  value={form.purchasePrice}
                  onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                />
                <input
                  required
                  type="number"
                  placeholder="Prix de vente"
                  value={form.sellingPrice}
                  onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                />
                <select
                  value={form.fuel}
                  onChange={(e) => setForm({ ...form, fuel: e.target.value })}
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="essence">Essence</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybride">Hybride</option>
                  <option value="electrique">Electrique</option>
                  <option value="gpl">GPL</option>
                </select>
                <select
                  value={form.transmission}
                  onChange={(e) => setForm({ ...form, transmission: e.target.value })}
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="manuelle">Manuelle</option>
                  <option value="automatique">Automatique</option>
                </select>
                <input
                  required
                  placeholder="Couleur"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                />
                <select
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value })}
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="occasion">Occasion</option>
                  <option value="neuf">Neuf</option>
                </select>
              </div>

              <textarea
                required
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
              />

              <div>
                <label className="mb-2 block text-sm text-gray-300">Photos</label>

                <div className="mb-2 flex gap-1 rounded-lg bg-white/5 p-1">
                  <button
                    type="button"
                    onClick={() => setPhotoTab("url")}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs transition ${
                      photoTab === "url" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Link2 size={14} />
                    URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoTab("gallery")}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs transition ${
                      photoTab === "gallery" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Image size={14} />
                    Galerie
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoTab("camera")}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs transition ${
                      photoTab === "camera" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Camera size={14} />
                    Camera
                  </button>
                </div>

                {photoTab === "url" && (
                  <div className="flex gap-2">
                    <input
                      placeholder="https://exemple.com/photo.jpg"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={addPhotoUrl}
                      className="rounded-lg bg-blue-600 px-3 text-sm text-white hover:bg-blue-700"
                    >
                      Ajouter
                    </button>
                  </div>
                )}

                {photoTab === "gallery" && (
                  <div>
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={uploading}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 py-3 text-sm text-gray-300 hover:border-blue-500 hover:text-white disabled:opacity-50"
                    >
                      <Image size={16} />
                      {uploading ? "Chargement..." : "Choisir depuis la galerie"}
                    </button>
                  </div>
                )}

                {photoTab === "camera" && (
                  <div>
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={uploading}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 py-3 text-sm text-gray-300 hover:border-blue-500 hover:text-white disabled:opacity-50"
                    >
                      <Camera size={16} />
                      {uploading ? "Chargement..." : "Prendre une photo"}
                    </button>
                  </div>
                )}

                {form.photos.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {form.photos.map((photo, index) => (
                      <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border border-white/10">
                        <img src={photo} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition group-hover:opacity-100"
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {editingId ? "Enregistrer les modifications" : "Ajouter la voiture"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
