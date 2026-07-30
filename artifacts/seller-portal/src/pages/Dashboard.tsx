import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Car, DollarSign } from "lucide-react";

type Period = "day" | "week" | "month" | "year";

interface Stats {
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  profitPercent: number;
  chartData: { label: string; revenue: number; profit: number; sales: number }[];
}

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>("week");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(apiUrl(`/api/sales/stats?period=${period}`), {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("shawrome_seller_token")}`,
      },
    })
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, [period]);

  const periods: { value: Period; label: string }[] = [
    { value: "day", label: "Aujourd'hui" },
    { value: "week", label: "Semaine" },
    { value: "month", label: "Mois" },
    { value: "year", label: "Année" },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
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

      {loading || !stats ? (
        <p className="text-gray-400">Chargement...</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="mb-2 flex items-center gap-2 text-gray-400">
                <Car size={16} />
                <span className="text-sm">Ventes</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalSales}</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="mb-2 flex items-center gap-2 text-gray-400">
                <DollarSign size={16} />
                <span className="text-sm">Chiffre d'affaires</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {stats.totalRevenue.toLocaleString("fr-DZ")} DA
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="mb-2 flex items-center gap-2 text-gray-400">
                {stats.profitPercent >= 0 ? (
                  <TrendingUp size={16} className="text-green-400" />
                ) : (
                  <TrendingDown size={16} className="text-red-400" />
                )}
                <span className="text-sm">Marge</span>
              </div>
              <p
                className={`text-2xl font-bold ${
                  stats.profitPercent >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {stats.profitPercent >= 0 ? "+" : ""}
                {stats.profitPercent.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h3 className="mb-4 text-sm font-medium text-gray-300">
              Evolution du profit
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.chartData}>
                <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111827",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
