import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Crosshair, Scale, Building2, OctagonX, DollarSign } from "lucide-react";
import PositionSizeCalc from "@/components/calculators/PositionSizeCalc";
import RiskRewardCalc from "@/components/calculators/RiskRewardCalc";
import PropFirmCalc from "@/components/calculators/PropFirmCalc";
import DailyLossCalc from "@/components/calculators/DailyLossCalc";
import PointsToDollarsCalc from "@/components/calculators/PointsToDollarsCalc";

const CALCULATORS = [
  { key: "position", title: "Position Size", desc: "Size your trade by risk.", icon: Crosshair },
  { key: "rr", title: "Risk : Reward", desc: "Map out your R:R.", icon: Scale },
  { key: "prop", title: "Prop Firm Tracker", desc: "Track funded account progress.", icon: Building2 },
  { key: "daily", title: "Daily Loss Limit", desc: "Your hard stop for the day.", icon: OctagonX },
  { key: "p2d", title: "Points to Dollars", desc: "Convert points to $.", icon: DollarSign },
];

export default function Calculators() {
  const [active, setActive] = useState(null);
  const [funded, setFunded] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    base44.entities.FundedAccount.list().then((f) => setFunded(f[0] || null)).catch(() => {});
    base44.entities.UserSettings.list().then((s) => setSettings(s[0] || null)).catch(() => {});
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Calculators</h1>
        <p className="text-sm text-[#A0A0A0] mt-1">Know your numbers before you click buy.</p>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CALCULATORS.map((calc, idx) => {
          const Icon = calc.icon;
          const span = (idx === 3 || idx === 4) ? "lg:col-span-3 lg:max-w-[calc(50%-0.5rem)]" : "";
          return (
            <button
              key={calc.key}
              onClick={() => setActive(calc.key)}
              className={`bg-[#141414] border border-[#1A1A1A] hover:border-[#D42A2A] rounded-xl p-5 text-left transition-colors group ${active === calc.key ? "border-[#D42A2A]" : ""}`}
            >
              <div className="w-10 h-10 rounded-lg bg-[#D42A2A]/15 flex items-center justify-center mb-3">
                <Icon size={20} className="text-[#D42A2A]" />
              </div>
              <h3 className="text-white font-bold text-sm">{calc.title}</h3>
              <p className="text-xs text-[#A0A0A0] mt-1">{calc.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Active calculator */}
      {active === "position" && <PositionSizeCalc settings={settings} />}
      {active === "rr" && <RiskRewardCalc />}
      {active === "prop" && <PropFirmCalc funded={funded} />}
      {active === "daily" && <DailyLossCalc funded={funded} settings={settings} />}
      {active === "p2d" && <PointsToDollarsCalc />}
    </div>
  );
}