import React from "react";
import { getETDate, getWeekStart } from "@/lib/trading";

function StatCard({ label, value, color }) {
  return (
    <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-5">
      <div className="text-xs text-[#A0A0A0] mb-2">{label}</div>
      <div className={`text-2xl font-bold ${color || "text-[#A0A0A0]"}`}>{value}</div>
    </div>
  );
}

export default function StatsRow({ trades }) {
  const et = getETDate();
  const todayStr = et.toDateString();
  const weekStart = getWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const todayTrades = trades.filter(
    (t) => t.trade_date && new Date(t.trade_date).toDateString() === todayStr
  );
  const todayPnl = todayTrades.reduce((s, t) => s + (t.pnl || 0), 0);

  const weekTrades = trades.filter((t) => {
    if (!t.trade_date) return false;
    const d = new Date(t.trade_date);
    return d >= weekStart && d < weekEnd;
  });
  const weekPnl = weekTrades.reduce((s, t) => s + (t.pnl || 0), 0);
  const weekWins = weekTrades.filter((t) => t.pnl > 0).length;
  const winRate = weekTrades.length ? Math.round((weekWins / weekTrades.length) * 100) : null;

  // streak: consecutive green days up to today
  let streak = 0;
  const byDay = {};
  trades.forEach((t) => {
    if (!t.trade_date) return;
    const k = new Date(t.trade_date).toDateString();
    byDay[k] = (byDay[k] || 0) + (t.pnl || 0);
  });
  let cursor = new Date(et);
  while (true) {
    const k = cursor.toDateString();
    if (k in byDay && byDay[k] > 0) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }

  const todayColor = todayTrades.length === 0 ? "text-[#A0A0A0]" : todayPnl >= 0 ? "text-[#22C55E]" : "text-[#EF4444]";
  const weekColor = weekTrades.length === 0 ? "text-[#A0A0A0]" : weekPnl >= 0 ? "text-[#22C55E]" : "text-[#EF4444]";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Today's P&L" value={`${todayPnl >= 0 ? "+" : ""}$${todayPnl.toFixed(2)}`} color={todayColor} />
      <StatCard label="Weekly P&L" value={`${weekPnl >= 0 ? "+" : ""}$${weekPnl.toFixed(2)}`} color={weekColor} />
      <StatCard label="Win Rate" value={winRate == null ? "- -" : `${winRate}%`} color={winRate == null ? "text-[#A0A0A0]" : "text-white"} />
      <StatCard label="Current Streak" value={`${streak} day${streak === 1 ? "" : "s"}`} color={streak === 0 ? "text-[#A0A0A0]" : "text-[#22C55E]"} />
    </div>
  );
}