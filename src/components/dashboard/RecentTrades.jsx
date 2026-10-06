import React from "react";

export default function RecentTrades({ trades }) {
  const recent = [...trades]
    .sort((a, b) => new Date(b.trade_date || b.created_date) - new Date(a.trade_date || a.created_date))
    .slice(0, 5);

  return (
    <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-5">
      <h3 className="text-white font-bold mb-4">Recent Trades</h3>
      {recent.length === 0 ? (
        <p className="text-sm text-[#A0A0A0]">
          No trades logged yet. Tell AI Dodgy 'Log Trade' in your agent chat to get started.
        </p>
      ) : (
        <div className="space-y-1">
          {recent.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between text-sm py-2.5 border-b border-[#1A1A1A] last:border-0"
            >
              <div className="flex items-center gap-3">
                <span className="text-white text-xs">
                  {new Date(t.trade_date || t.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <span className="text-white font-medium">{t.instrument}</span>
                <span className={t.direction === "long" ? "text-[#22C55E]" : "text-[#EF4444]"}>
                  {t.direction?.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={t.pnl >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}>
                  {t.pnl >= 0 ? "+" : ""}${(t.pnl || 0).toFixed(2)}
                </span>
                <span className="text-[#A0A0A0] text-xs w-6 text-center">{t.grade || "-"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}