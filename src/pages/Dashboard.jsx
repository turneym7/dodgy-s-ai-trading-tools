import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getETDate, getTradingSession } from "@/lib/trading";
import TodayBriefing from "@/components/dashboard/TodayBriefing";
import StatsRow from "@/components/dashboard/StatsRow";
import AIInsights from "@/components/dashboard/AIInsights";
import ThreeCardRow from "@/components/dashboard/ThreeCardRow";
import RecentTrades from "@/components/dashboard/RecentTrades";
import WeeklyChart from "@/components/dashboard/WeeklyChart";
import DodgyRules from "@/components/dashboard/DodgyRules";
import MonthlyOverview from "@/components/dashboard/MonthlyOverview";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [trades, setTrades] = useState([]);
  const [session, setSession] = useState(getTradingSession());

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.Trade.list("-trade_date", 200).then(setTrades).catch(() => {});
    const t = setInterval(() => setSession(getTradingSession()), 60000);
    return () => clearInterval(t);
  }, []);

  const et = getETDate();
  const dateStr = et.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const firstName = user?.full_name?.split(" ")[0] || "trader";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {firstName}.</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-sm text-[#A0A0A0]">{dateStr}</span>
            <span
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
                session.active ? "bg-[#22C55E]/10 text-[#22C55E]" : "bg-[#1A1A1A] text-[#A0A0A0]"
              }`}
            >
              {session.active && <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />}
              {session.name}
            </span>
          </div>
        </div>
      </div>

      <TodayBriefing trades={trades} />
      <StatsRow trades={trades} />
      <AIInsights trades={trades} />
      <ThreeCardRow trades={trades} />
      <RecentTrades trades={trades} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WeeklyChart trades={trades} />
        <DodgyRules />
      </div>
      <MonthlyOverview trades={trades} />
    </div>
  );
}