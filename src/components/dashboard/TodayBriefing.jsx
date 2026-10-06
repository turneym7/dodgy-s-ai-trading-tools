import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function TodayBriefing({ trades }) {
  const [visible, setVisible] = useState(false);
  const [funded, setFunded] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const today = new Date().toDateString();
    if (localStorage.getItem("dodgy_briefing_dismissed") !== today) setVisible(true);
    base44.entities.FundedAccount.list().then((f) => setFunded(f[0] || null)).catch(() => {});
    base44.entities.UserSettings.list().then((s) => setSettings(s[0] || null)).catch(() => {});
  }, []);

  const dismiss = () => {
    localStorage.setItem("dodgy_briefing_dismissed", new Date().toDateString());
    setVisible(false);
  };

  if (!visible) return null;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yTrades = trades.filter(
    (t) => t.trade_date && new Date(t.trade_date).toDateString() === yesterday.toDateString()
  );
  const yPnl = yTrades.reduce((s, t) => s + (t.pnl || 0), 0);
  const yWins = yTrades.filter((t) => t.pnl > 0).length;
  const yWinRate = yTrades.length ? Math.round((yWins / yTrades.length) * 100) : 0;

  const lossLimit = settings?.daily_loss_limit;

  return (
    <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-5 relative">
      <button onClick={dismiss} className="absolute top-4 right-4 text-[#A0A0A0] hover:text-white">
        <X size={18} />
      </button>
      <h2 className="text-white font-bold text-lg mb-4">Today's Briefing</h2>
      <div className="space-y-2.5 text-sm">
        <div className="text-[#A0A0A0]">
          <span className="text-white">Yesterday:</span>{" "}
          {yTrades.length
            ? `${yTrades.length} trade${yTrades.length === 1 ? "" : "s"} · ${yPnl >= 0 ? "+" : ""}$${yPnl.toFixed(2)} · ${yWinRate}% win rate`
            : "No trades yesterday."}
        </div>
        <div className="text-[#A0A0A0]">
          <span className="text-white">Funded account:</span>{" "}
          {funded ? `${funded.firm_name} · $${(funded.current_pnl || 0).toLocaleString()} P&L` : "Funded account not set up."}
        </div>
        <div className="text-[#A0A0A0]">
          <span className="text-white">Daily loss limit:</span>{" "}
          {lossLimit ? `$${lossLimit.toLocaleString()}` : "Set your daily loss limit in Settings."}
        </div>
        <div className="text-[#A0A0A0]">
          <span className="text-white">Streak:</span> 0 days
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-[#1A1A1A] text-sm text-[#A0A0A0]">
        Welcome to Dodgy's AI Trading Tools. Start by validating your first setup.
      </div>
    </div>
  );
}