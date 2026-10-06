import React, { useMemo } from "react";

const TAG_COLORS = { blue: "#3B82F6", orange: "#F97316", green: "#22C55E" };

function Insight({ tag, color, text, count }) {
  return (
    <div className="flex gap-3 items-start">
      <span
        className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
        style={{ background: (TAG_COLORS[color] || "#3B82F6") + "22", color: TAG_COLORS[color] || "#3B82F6" }}
      >
        {tag}
      </span>
      <div>
        <p className="text-sm text-white">{text}</p>
        <p className="text-xs text-[#A0A0A0] mt-0.5">Based on {count} trades</p>
      </div>
    </div>
  );
}

export default function AIInsights({ trades }) {
  const insights = useMemo(() => {
    if (trades.length < 10) return [];
    const out = [];

    const validated = trades.filter((t) => t.validated);
    const unvalidated = trades.filter((t) => !t.validated);
    if (validated.length >= 5 && unvalidated.length >= 5) {
      const vWin = validated.filter((t) => t.pnl > 0).length / validated.length;
      const uWin = unvalidated.filter((t) => t.pnl > 0).length / unvalidated.length;
      if (vWin - uWin > 0.1) {
        out.push({
          tag: "Warning",
          color: "orange",
          text: `Validated trades: ${Math.round(vWin * 100)}% win rate. Unvalidated: ${Math.round(uWin * 100)}%.`,
          count: trades.length,
        });
      }
    }

    const high = trades.filter((t) => (t.emotional_state || 0) >= 3);
    const low = trades.filter((t) => (t.emotional_state || 0) > 0 && (t.emotional_state || 0) < 3);
    if (high.length >= 5 && low.length >= 5) {
      const hWin = high.filter((t) => t.pnl > 0).length / high.length;
      const lWin = low.filter((t) => t.pnl > 0).length / low.length;
      if (lWin - hWin > 0.1) {
        out.push({
          tag: "Pattern",
          color: "blue",
          text: `Your win rate drops from ${Math.round(lWin * 100)}% to ${Math.round(hWin * 100)}% when emotional state is 3+.`,
          count: trades.length,
        });
      }
    }

    const ifvg = trades.filter((t) => (t.setup_type || "").toLowerCase().includes("ifvg"));
    if (ifvg.length >= 5) {
      const wins = ifvg.filter((t) => t.pnl > 0).length;
      const wr = Math.round((wins / ifvg.length) * 100);
      if (wr >= 60) {
        out.push({
          tag: "Strength",
          color: "green",
          text: `Your IFVG setups hit at ${wr}% (${wins} for ${ifvg.length}). That's where your edge is.`,
          count: ifvg.length,
        });
      }
    }
    return out.slice(0, 3);
  }, [trades]);

  const wrapper = (children) => (
    <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-5" style={{ borderLeft: "2px solid #D42A2A" }}>
      <h3 className="text-white font-bold mb-3">Dodgy's AI Insights</h3>
      {children}
    </div>
  );

  if (trades.length < 10) {
    return wrapper(
      <p className="text-sm text-[#A0A0A0]">
        Log at least 10 trades to unlock AI insights. Dodgy needs data to find your patterns.
      </p>
    );
  }
  if (insights.length === 0) {
    return wrapper(
      <p className="text-sm text-[#A0A0A0]">Not enough consistent data yet to find patterns. Keep logging.</p>
    );
  }
  return wrapper(
    <div className="space-y-3">
      {insights.map((ins, i) => (
        <Insight key={i} {...ins} />
      ))}
    </div>
  );
}