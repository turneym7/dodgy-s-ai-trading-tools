import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Download, Loader2 } from "lucide-react";

export default function MonthlyReportSection() {
  const [trades, setTrades] = useState([]);
  const [user, setUser] = useState(null);
  const [funded, setFunded] = useState([]);
  const [validations, setValidations] = useState([]);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [downloading, setDownloading] = useState(false);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.Trade.list("-trade_date", 500).then((t) => {
      setTrades(t);
      setHasData(t.length > 0);
    }).catch(() => {});
    base44.entities.FundedAccount.list().then(setFunded).catch(() => {});
    base44.entities.ValidatedSetup.list("-validation_date", 500).then(setValidations).catch(() => {});
  }, []);

  // Prompt on dashboard: show if it's past the 1st of the month and there are trades from last month
  const [year, mon] = month.split("-").map(Number);
  const monthTrades = trades.filter((t) => {
    if (!t.trade_date) return false;
    const d = new Date(t.trade_date);
    return d.getFullYear() === year && d.getMonth() + 1 === mon;
  });

  const canDownload = monthTrades.length > 0;

  const handleDownload = async () => {
    if (!canDownload) return;
    setDownloading(true);
    try {
      const response = await base44.functions.invoke("generateMonthlyReport", { month, user_name: user?.full_name, funded, validations });
      // response.data is { url: "..." } or { file_url: "..." }
      const url = response.data?.url || response.data?.file_url;
      if (url) {
        window.open(url, "_blank");
      }
    } catch {
      // Fallback: generate client-side CSV
      generateCsv();
    } finally {
      setDownloading(false);
    }
  };

  const generateCsv = () => {
    const headers = ["Date", "Instrument", "Direction", "P&L", "Grade", "Setup", "Session", "Validated", "Emotional State"];
    const rows = monthTrades.map((t) => [
      new Date(t.trade_date).toLocaleDateString(),
      t.instrument, t.direction, t.pnl || 0, t.grade || "", t.setup_type || "", t.session || "", t.validated ? "Yes" : "No", t.emotional_state || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monthly-report-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const monthLabel = new Date(year, mon - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-6 space-y-4">
      <h2 className="text-white font-bold">Monthly Performance Report</h2>
      {!hasData ? (
        <p className="text-sm text-[#A0A0A0]">Complete your first month of trading to generate a report.</p>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs text-[#A0A0A0] mb-1.5 block font-medium">Month</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D42A2A]"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleDownload}
                disabled={!canDownload || downloading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#D42A2A] hover:bg-[#b82424] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                Download Report
              </button>
            </div>
          </div>
          {monthTrades.length === 0 ? (
            <p className="text-sm text-[#A0A0A0]">No trades in {monthLabel}. Select a different month.</p>
          ) : (
            <p className="text-xs text-[#A0A0A0]">{monthTrades.length} trade{monthTrades.length === 1 ? "" : "s"} in {monthLabel}. Report includes breakdowns by setup, session, day, instrument, grade, behavioral stats, and funded account status.</p>
          )}
        </>
      )}
    </div>
  );
}