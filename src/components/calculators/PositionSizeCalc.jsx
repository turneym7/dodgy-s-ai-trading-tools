import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { CONTRACTS } from "@/lib/trading";
import { ArrowRight } from "lucide-react";

const inputCls =
  "w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D42A2A] transition-colors";
const labelCls = "text-xs text-[#A0A0A0] mb-1.5 block font-medium";

const INSTRUMENT_SPECS = {
  NQ: "NQ - Nasdaq Futures - $20/pt - $5/tick - 4 ticks/pt",
  ES: "ES - S&P 500 Futures - $50/pt - $12.50/tick - 4 ticks/pt",
  MNQ: "MNQ - Micro Nasdaq - $2/pt - $0.50/tick - 4 ticks/pt",
};

export default function PositionSizeCalc({ settings }) {
  const [form, setForm] = useState({
    accountSize: "",
    instrument: "NQ",
    riskMode: "%",
    riskValue: "1",
    stopMode: "points",
    stopDistance: "",
  });

  // Pre-fill account size from settings if available
  useEffect(() => {
    if (settings?.account_size) setForm((f) => ({ ...f, accountSize: String(settings.account_size) }));
  }, [settings]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const result = useMemo(() => {
    const account = parseFloat(form.accountSize);
    const riskVal = parseFloat(form.riskValue);
    const stopDist = parseFloat(form.stopDistance);
    if (!account || !riskVal || !stopDist) return null;

    const contract = CONTRACTS[form.instrument];
    const riskDollars = form.riskMode === "%" ? account * (riskVal / 100) : riskVal;
    const stopPoints = form.stopMode === "ticks" ? stopDist / contract.ticksPerPoint : stopDist;
    const riskPerContract = stopPoints * contract.pointValue;
    const contracts = riskPerContract > 0 ? Math.floor(riskDollars / riskPerContract) : 0;
    const actualRisk = contracts * riskPerContract;
    const riskPct = account > 0 ? (actualRisk / account) * 100 : 0;

    return { riskDollars, stopPoints, contracts, actualRisk, riskPct };
  }, [form]);

  const riskBarColor = result ? (result.riskPct < 2 ? "#22C55E" : result.riskPct <= 3 ? "#EAB308" : "#EF4444") : "#3A3A3A";

  return (
    <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-5 space-y-4">
      <h2 className="text-white font-bold">Position Size Calculator</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Account Size ($)</label>
          <input type="number" value={form.accountSize} onChange={(e) => set("accountSize", e.target.value)} className={inputCls} placeholder="e.g. 50000" />
        </div>
        <div>
          <label className={labelCls}>Instrument</label>
          <select value={form.instrument} onChange={(e) => set("instrument", e.target.value)} className={inputCls}>
            <option value="NQ">NQ</option>
            <option value="ES">ES</option>
            <option value="MNQ">MNQ</option>
          </select>
          <p className="text-xs text-[#A0A0A0] mt-1.5">{INSTRUMENT_SPECS[form.instrument]}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Risk Per Trade</label>
          <div className="flex gap-2">
            <div className="flex bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg overflow-hidden">
              {["%", "$"].map((m) => (
                <button
                  key={m}
                  onClick={() => set("riskMode", m)}
                  className={`px-3 py-2.5 text-sm font-medium transition-colors ${
                    form.riskMode === m ? "bg-[#D42A2A] text-white" : "text-[#A0A0A0] hover:text-white"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <input
              type="number"
              step="0.1"
              value={form.riskValue}
              onChange={(e) => set("riskValue", e.target.value)}
              className={inputCls}
              placeholder={form.riskMode === "%" ? "1" : "500"}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Stop Loss Distance</label>
          <div className="flex gap-2">
            <div className="flex bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg overflow-hidden">
              {["points", "ticks"].map((m) => (
                <button
                  key={m}
                  onClick={() => set("stopMode", m)}
                  className={`px-3 py-2.5 text-sm font-medium transition-colors ${
                    form.stopMode === m ? "bg-[#D42A2A] text-white" : "text-[#A0A0A0] hover:text-white"
                  }`}
                >
                  {m === "points" ? "pts" : "ticks"}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={form.stopDistance}
              onChange={(e) => set("stopDistance", e.target.value)}
              className={inputCls}
              placeholder="e.g. 5"
            />
          </div>
        </div>
      </div>

      {result && (
        <div className="space-y-4 pt-2 border-t border-[#1A1A1A]">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0A0A0A] rounded-lg p-4">
              <div className="text-xs text-[#A0A0A0] mb-1">Contracts to trade</div>
              <div className="text-3xl font-bold text-white">{result.contracts}</div>
            </div>
            <div className="bg-[#0A0A0A] rounded-lg p-4">
              <div className="text-xs text-[#A0A0A0] mb-1">Dollar amount at risk</div>
              <div className="text-3xl font-bold text-[#EF4444]">${result.actualRisk.toFixed(0)}</div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-[#A0A0A0] mb-1.5">
              <span>Risk as % of account</span>
              <span className="text-white font-medium">{result.riskPct.toFixed(2)}%</span>
            </div>
            <div className="h-2.5 bg-[#1A1A1A] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (result.riskPct / 5) * 100)}%`, backgroundColor: riskBarColor }} />
            </div>
            <div className="flex justify-between text-[10px] text-[#A0A0A0] mt-1">
              <span>&lt;2% safe</span>
              <span>2-3% caution</span>
              <span>&gt;3% danger</span>
            </div>
          </div>

          <Link
            to="/validator"
            className="w-full flex items-center justify-center gap-2 bg-[#1A1A1A] hover:bg-[#222] text-white text-sm font-medium py-2.5 rounded-lg transition-colors border border-[#1A1A1A]"
          >
            Validate This Setup <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}