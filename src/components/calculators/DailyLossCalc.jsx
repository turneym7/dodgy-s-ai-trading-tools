import React, { useState, useEffect, useMemo } from "react";
import { CONTRACTS } from "@/lib/trading";

const inputCls =
  "w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D42A2A] transition-colors";
const labelCls = "text-xs text-[#A0A0A0] mb-1.5 block font-medium";

export default function DailyLossCalc({ funded, settings }) {
  const [form, setForm] = useState({
    baseMode: "account",
    baseValue: "",
    riskPct: "2",
    instrument: "NQ",
    stopPoints: "",
  });

  // Pre-fill from funded/settings
  useEffect(() => {
    if (settings?.daily_loss_limit) {
      setForm((f) => ({ ...f, baseValue: String(settings.daily_loss_limit), baseMode: "drawdown" }));
    } else if (funded?.max_drawdown) {
      setForm((f) => ({ ...f, baseValue: String(funded.max_drawdown), baseMode: "drawdown" }));
    } else if (settings?.account_size) {
      setForm((f) => ({ ...f, baseValue: String(settings.account_size) }));
    }
  }, [funded, settings]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const result = useMemo(() => {
    const base = parseFloat(form.baseValue);
    const riskPct = parseFloat(form.riskPct);
    const stopPts = parseFloat(form.stopPoints);
    if (!base || !riskPct || !stopPts) return null;

    const contract = CONTRACTS[form.instrument];
    const maxDailyLoss = form.baseMode === "account" ? base * (riskPct / 100) : base;
    const riskPerContract = stopPts * contract.pointValue;
    const maxContracts = riskPerContract > 0 ? Math.floor(maxDailyLoss / riskPerContract) : 0;
    const maxLosingTrades = riskPerContract > 0 ? Math.floor(maxDailyLoss / riskPerContract) : 0;

    return { maxDailyLoss, riskPerContract, maxContracts, maxLosingTrades };
  }, [form]);

  const limitReached = false; // informational calculator — no live tracking

  return (
    <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-5 space-y-4">
      <h2 className="text-white font-bold">Daily Loss Limit Calculator</h2>

      <div>
        <label className={labelCls}>Base Amount</label>
        <div className="flex gap-2">
          <div className="flex bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg overflow-hidden">
            <button
              onClick={() => set("baseMode", "account")}
              className={`px-3 py-2.5 text-sm font-medium transition-colors ${form.baseMode === "account" ? "bg-[#D42A2A] text-white" : "text-[#A0A0A0] hover:text-white"}`}
            >
              Account $
            </button>
            <button
              onClick={() => set("baseMode", "drawdown")}
              className={`px-3 py-2.5 text-sm font-medium transition-colors ${form.baseMode === "drawdown" ? "bg-[#D42A2A] text-white" : "text-[#A0A0A0] hover:text-white"}`}
            >
              Drawdown $
            </button>
          </div>
          <input
            type="number"
            value={form.baseValue}
            onChange={(e) => set("baseValue", e.target.value)}
            className={inputCls}
            placeholder={form.baseMode === "account" ? "e.g. 50000" : "e.g. 3000"}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Max Risk Per Day (%)</label>
          <input type="number" step="0.1" value={form.riskPct} onChange={(e) => set("riskPct", e.target.value)} className={inputCls} placeholder="2" />
        </div>
        <div>
          <label className={labelCls}>Instrument</label>
          <select value={form.instrument} onChange={(e) => set("instrument", e.target.value)} className={inputCls}>
            <option value="NQ">NQ ($20/pt)</option>
            <option value="ES">ES ($50/pt)</option>
            <option value="MNQ">MNQ ($2/pt)</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Avg Stop Loss (pts)</label>
          <input type="number" value={form.stopPoints} onChange={(e) => set("stopPoints", e.target.value)} className={inputCls} placeholder="e.g. 5" />
        </div>
      </div>

      {result && (
        <div className="space-y-3 pt-2 border-t border-[#1A1A1A]">
          <div className="bg-[#0A0A0A] rounded-lg p-4">
            <div className="text-xs text-[#A0A0A0] mb-1">Max dollar loss for the day</div>
            <div className="text-2xl font-bold text-[#EF4444]">${result.maxDailyLoss.toFixed(0)}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0A0A0A] rounded-lg p-3">
              <div className="text-xs text-[#A0A0A0] mb-1">Max contracts at this stop</div>
              <div className="text-lg font-bold text-white">{result.maxContracts}</div>
            </div>
            <div className="bg-[#0A0A0A] rounded-lg p-3">
              <div className="text-xs text-[#A0A0A0] mb-1">Max losing trades before stop</div>
              <div className="text-lg font-bold text-white">{result.maxLosingTrades}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}