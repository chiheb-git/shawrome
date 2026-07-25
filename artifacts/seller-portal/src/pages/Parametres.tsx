import { useState } from "react";

export default function Parametres() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Les mots de passe ne correspondent pas." });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Le nouveau mot de passe doit faire au moins 6 caractères." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/me/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("shawrome_seller_token")}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Erreur lors du changement de mot de passe." });
        return;
      }

      setMessage({ type: "success", text: "Mot de passe modifié avec succès." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="mb-6 text-2xl font-bold text-white">Paramètres du compte</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-medium text-white">Changer le mot de passe</h2>

        <div>
          <label className="mb-1 block text-sm text-gray-300">Mot de passe actuel</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-300">Nouveau mot de passe</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-300">Confirmer le nouveau mot de passe</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-blue-500"
          />
        </div>

        {message && (
          <p
            className={`rounded-lg px-3 py-2 text-sm ${
              message.type === "success"
                ? "bg-green-500/10 text-green-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Modification..." : "Changer le mot de passe"}
        </button>
      </form>
    </div>
  );
}
