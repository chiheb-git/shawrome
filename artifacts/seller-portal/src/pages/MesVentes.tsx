import { useEffect, useState } from "react";

type Period = "day" | "week" | "month" | "year";

interface Sale {
  id: number;
  carBrand: string;
  carModel: string;
  carYear: number;
  finalPrice: number;
  purchasePrice: number;
  profit: number;
  profitPercent: number;
  soldAt: string;
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${localStorage.getItem("shawrome_seller_token")}`,
  };
}

export default function MesVentes() {
  const [period, setPeriod] = useState<Period>("month");
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/sales?period=${period}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => setSales(data.sales ?? []))
      .finally(() => setLoading(false));
  }, [period]);

  const periods: { value: Period; label: string }[] = [
    { value: "day", label: "Aujourd'hui" },
    { value: "week", label: "Semaine" },
    { value: "month", label: "Mois" },
    { value: "year", label: "Année" },
  ];

  const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Mes ventes</h1>
        <div className="flex gap-1 rounded-lg bg-white/5 p-1">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                period === p.value
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-gray-400">Profit total sur la période</p>
        <p
          className={`text-xl font-bold ${
            totalProfit >= 0 ? "text-green-400" : "text-red-400"
          }`}
        >
          {totalProfit >= 0 ? "+" : ""}
          {totalProfit.toLocaleString("fr-DZ")} DA
        </p>
      </div>

      {loading ? (
        <p className="text-gray-400">Chargement...</p>
      ) : sales.length === 0 ? (
        <p className="text-gray-400">Aucune vente sur cette période.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-gray-400">
              <tr>
                <th className="px-4 py-3">Voiture</th>
                <th className="px-4 py-3">Prix de vente</th>
                <th className="px-4 py-3">Profit</th>
                <th className="px-4 py-3">Marge</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="border-t border-white/10">
                  <td className="px-4 py-3 text-white">
                    {sale.carBrand} {sale.carModel} ({sale.carYear})
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {sale.finalPrice.toLocaleString("fr-DZ")} DA
                  </td>
                  <td
                    className={`px-4 py-3 font-medium ${
                      sale.profit >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {sale.profit >= 0 ? "+" : ""}
                    {sale.profit.toLocaleString("fr-DZ")} DA
                  </td>
                  <td
                    className={`px-4 py-3 ${
                      sale.profitPercent >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {sale.profitPercent >= 0 ? "+" : ""}
                    {sale.profitPercent.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(sale.soldAt).toLocaleDateString("fr-DZ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
