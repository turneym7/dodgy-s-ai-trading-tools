import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { getWeekStart } from "@/lib/trading";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function WeeklyChart({ trades }) {
  const data = useMemo(() => {
    const weekStart = getWeekStart();
    const byDay = DAYS.map((d) => ({ day: d, pnl: 0 }));
    trades.forEach((t) => {
      if (!t.trade_date) return;
      const d = new Date(t.trade_date);
      const diff = Math.floor((d - weekStart) / (1000 * 60 * 60 * 24));
      if (diff >= 0 && diff < 7) byDay[diff].pnl += t.pnl || 0;
    });
    return byDay;
  }, [trades]);

  const hasData = trades.some((t) => t.trade_date);

  return (
    <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-5 h-full">
      <h3 className="text-white font-bold mb-4">Weekly Performance</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis dataKey="day" stroke="#A0A0A0" fontSize={12} axisLine={false} tickLine={false} />
            <YAxis stroke="#A0A0A0" fontSize={11} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "#1A1A1A" }}
              contentStyle={{ background: "#141414", border: "1px solid #1A1A1A", borderRadius: 8, color: "#fff" }}
              formatter={(v) => [`$${v.toFixed(2)}`, "P&L"]}
            />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.pnl > 0 ? "#22C55E" : d.pnl < 0 ? "#EF4444" : "#2A2A2A"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {!hasData && <p className="text-xs text-[#A0A0A0] text-center mt-2">No trades this week yet.</p>}
    </div>
  );
}