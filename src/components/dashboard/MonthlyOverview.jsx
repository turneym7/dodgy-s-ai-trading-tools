import React, { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { getETDate } from "@/lib/trading";

export default function MonthlyOverview({ trades }) {
  const now = getETDate();
  const year = now.getFullYear();
  const month = now.getMonth();
  const [monthPnl, setMonthPnl] = useState(0);

  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startWeekday = firstDay.getDay();
    const arr = [];
    for (let i = 0; i < startWeekday; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [year, month]);

  const dayPnl = useMemo(() => {
    const map = {};
    trades.forEach((t) => {
      if (!t.trade_date) return;
      const d = new Date(t.trade_date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const k = d.getDate();
        map[k] = (map[k] || 0) + (t.pnl || 0);
      }
    });
    return map;
  }, [trades, year, month]);

  const total = useMemo(() => {
    let s = 0;
    trades.forEach((t) => {
      if (!t.trade_date) return;
      const d = new Date(t.trade_date);
      if (d.getFullYear() === year && d.getMonth() === month) s += t.pnl || 0;
    });
    return s;
  }, [trades, year, month]);

  const monthName = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const downloadReport = () => {
    const rows = ["Date,P&L"];
    Object.entries(dayPnl).forEach(([day, pnl]) => {
      rows.push(`${monthName} ${day},${pnl.toFixed(2)}`);
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dodgy-report-${monthName.replace(" ", "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-bold">Monthly Overview</h3>
          <p className="text-xs text-[#A0A0A0] mt-0.5">{monthName}</p>
        </div>
        <button
          onClick={downloadReport}
          className="flex items-center gap-1.5 text-xs text-[#A0A0A0] hover:text-white border border-[#1A1A1A] hover:border-[#333] rounded-lg px-3 py-1.5 transition-colors"
        >
          <Download size={14} /> Report
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] text-[#A0A0A0] mb-2">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((c, i) => {
          if (!c) return <div key={i} />;
          const pnl = dayPnl[c] || 0;
          const has = c in dayPnl;
          const bg = !has ? "#1A1A1A" : pnl > 0 ? "#22C55E" : pnl < 0 ? "#EF4444" : "#1A1A1A";
          const txt = has ? "#fff" : "#A0A0A0";
          return (
            <div
              key={i}
              className="aspect-square rounded-md flex flex-col items-center justify-center text-[11px]"
              style={{ background: bg, color: txt }}
              title={has ? `${monthName} ${c}: $${pnl.toFixed(2)}` : undefined}
            >
              {c}
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-sm text-[#A0A0A0]">
        Monthly P&L:{" "}
        <span className={total === 0 ? "text-white font-medium" : total > 0 ? "text-[#22C55E] font-medium" : "text-[#EF4444] font-medium"}>
          {total >= 0 ? "+" : ""}${total.toFixed(2)}
        </span>
      </div>
    </div>
  );
}