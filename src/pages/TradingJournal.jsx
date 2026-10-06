import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Book } from "lucide-react";
import JournalList from "@/components/journal/JournalList";
import AIAnalysis from "@/components/journal/AIAnalysis";

export default function TradingJournal() {
  const [trades, setTrades] = useState([]);
  const [tab, setTab] = useState("journal");

  useEffect(() => {
    base44.entities.Trade.list("-trade_date", 500).then(setTrades).catch(() => {});
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#D42A2A]/15 flex items-center justify-center">
            <Book size={20} className="text-[#D42A2A]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Trading Journal</h1>
        </div>
        <span className="text-xs text-[#A0A0A0] bg-[#1A1A1A] px-2.5 py-1 rounded-full whitespace-nowrap mt-1">
          {trades.length} {trades.length === 1 ? "trade" : "trades"} logged
        </span>
      </div>

      {/* Info banner */}
      <div className="bg-[#141414] border border-[#1A1A1A] border-l-2 border-l-[#D42A2A] rounded-lg px-4 py-3">
        <p className="text-sm text-[#A0A0A0]">
          Trades are logged through AI Dodgy. Open your agent chat and say "Log Trade" to record a trade.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#1A1A1A]">
        {[
          { key: "journal", label: "Journal" },
          { key: "analysis", label: "AI Analysis" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? "text-white border-[#D42A2A]"
                : "text-[#A0A0A0] border-transparent hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "journal" ? (
        <JournalList trades={trades} />
      ) : (
        <AIAnalysis trades={trades} />
      )}
    </div>
  );
}