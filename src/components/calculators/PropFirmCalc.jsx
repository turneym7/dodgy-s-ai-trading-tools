import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";


const inputCls =
  "w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D42A2A] transition-colors";
const labelCls = "text-xs text-[#A0A0A0] mb-1.5 block font-medium";

const FIRM_RULES = {
  "Apex Trader Funding": {
    target: 6000, drawdown: 3000, drawdownType: "trailing", dailyLimit: null, minDays: 8,
    payouts: "1st=$2K, 2nd=$2.5K, 3rd-4th=$3K, 5th-6th=$4K", split: "100% to $25K then 90%", maxAccounts: 20,
    accountSizes: [25000, 50000, 100000, 150000, 300000],
  },
  "Tradeify": {
    target: 6000, drawdown: 3000, drawdownType: "EOD", dailyLimit: null,
    payouts: "Daily $1.5K cap or flex $2K-$4K caps", split: "—", maxAccounts: 5,
    accountSizes: [50000, 100000],
  },
  "Lucid Trading": {
    target: 3000, drawdown: 1500, drawdownType: "EOD", dailyLimit: null,
    payouts: "90% split, $2K cap/account", split: "90%", maxAccounts: null,
    accountSizes: [25000, 50000],
  },
  "Alpha Futures": {
    target: 6000, drawdown: 3000, drawdownType: "trailing", dailyLimit: null,
    payouts: "100% withdrawal. Zero: $2.5K cap. Advanced: $15K cap", split: "100%", maxAccounts: null,
    accountSizes: [50000, 100000],
  },
  "FundedNext Futures": {
    target: 6000, drawdown: 3000, drawdownType: "trailing", dailyLimit: null,
    payouts: "$2.5K cap first 5 payouts then uncapped", split: "80%", maxAccounts: null,
    accountSizes: [50000, 100000],
  },
  "Take Profit Trader": {
    target: 6000, drawdown: 3000, drawdownType: "trailing", dailyLimit: null,
    payouts: "Uncapped", split: "80%", maxAccounts: null,
    accountSizes: [50000, 100000],
  },
  "Topstep": {
    target: 6000, drawdown: 3000, drawdownType: "EOD", dailyLimit: null,
    payouts: "$3K cap/account", split: "100% to $10K then 90%", maxAccounts: null,
    accountSizes: [50000, 100000, 150000],
  },
  "Funded Futures Family": {
    target: 6000, drawdown: 3000, drawdownType: "EOD", dailyLimit: null,
    payouts: "—", split: "100% to $10K then 90%", maxAccounts: null,
    accountSizes: [50000, 100000],
  },
};

export default function PropFirmCalc({ funded }) {
  const [form, setForm] = useState({
    firm: "", accountSize: "100000", accountType: "eval", currentPnl: "",
  });

  // Pre-fill from existing funded account
  useEffect(() => {
    if (funded) setForm((f) => ({
      ...f,
      firm: funded.firm_name || "",
      accountSize: String(funded.account_size || "100000"),
      currentPnl: String(funded.current_pnl || ""),
    }));
  }, [funded]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const rules = form.firm ? FIRM_RULES[form.firm] : null;
  const accountSize = parseFloat(form.accountSize) || 100000;
  const currentPnl = parseFloat(form.currentPnl) || 0;

  // Scale target/drawdown proportionally for non-100K accounts (most firms scale linearly)
  const scale = accountSize / 100000;
  const target = rules ? Math.round(rules.target * scale) : 0;
  const drawdown = rules ? Math.round(rules.drawdown * scale) : 0;

  const drawdownUsed = Math.abs(Math.min(0, currentPnl));
  const drawdownRemaining = Math.max(0, drawdown - drawdownUsed);
  const drawdownPctUsed = drawdown > 0 ? (drawdownUsed / drawdown) * 100 : 0;
  const targetProgress = target > 0 ? Math.min(100, (currentPnl / target) * 100) : 0;

  const statusColor = drawdownPctUsed < 50 ? "#22C55E" : drawdownPctUsed < 75 ? "#EAB308" : "#EF4444";
  const isRedZone = drawdownPctUsed >= 75;
  const isYellowZone = drawdownPctUsed >= 50 && drawdownPctUsed < 75;

  // Days active
  const daysActive = funded?.start_date ? Math.max(1, Math.floor((Date.now() - new Date(funded.start_date).getTime()) / 86400000)) : 0;

  const saveToDb = () => {
    if (!form.firm) return;
    const data = {
      firm_name: form.firm,
      account_size: accountSize,
      payout_target: target,
      max_drawdown: drawdown,
      start_date: funded?.start_date || new Date().toISOString().slice(0, 10),
      current_pnl: currentPnl,
    };
    if (funded) {
      base44.entities.FundedAccount.update(funded.id, data).catch(() => {});
    } else {
      base44.entities.FundedAccount.create(data).catch(() => {});
    }
  };

  if (!form.firm) {
    return (
      <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-5 space-y-4">
        <h2 className="text-white font-bold">Prop Firm Tracker</h2>
        <div>
          <label className={labelCls}>Prop Firm</label>
          <select value={form.firm} onChange={(e) => set("firm", e.target.value)} className={inputCls}>
            <option value="">Select a firm...</option>
            {Object.keys(FIRM_RULES).map((f) => <option key={f}>{f}</option>)}
          </select>
          <p className="text-xs text-[#D42A2A] mt-2 font-medium">Use code DODGY for a discount</p>
        </div>
        <p className="text-sm text-[#A0A0A0]">Set up your funded account to track drawdown and progress.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-5 space-y-4">
      <h2 className="text-white font-bold">Prop Firm Tracker</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Prop Firm</label>
          <select value={form.firm} onChange={(e) => set("firm", e.target.value)} className={inputCls}>
            {Object.keys(FIRM_RULES).map((f) => <option key={f}>{f}</option>)}
          </select>
          <p className="text-xs text-[#D42A2A] mt-1.5 font-medium">Use code DODGY for a discount</p>
        </div>
        <div>
          <label className={labelCls}>Account Size</label>
          <select value={form.accountSize} onChange={(e) => set("accountSize", e.target.value)} className={inputCls}>
            {(rules?.accountSizes || [100000]).map((s) => <option key={s} value={s}>{`$${s.toLocaleString()}`}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Account Type</label>
          <select value={form.accountType} onChange={(e) => set("accountType", e.target.value)} className={inputCls}>
            <option value="eval">Eval</option>
            <option value="funded">Funded</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Current P&L ($)</label>
          <input type="number" value={form.currentPnl} onChange={(e) => set("currentPnl", e.target.value)} className={inputCls} placeholder="e.g. 1200 or -800" />
        </div>
      </div>

      {/* Progress bars */}
      <div className="space-y-4 pt-2 border-t border-[#1A1A1A]">
        <div>
          <div className="flex justify-between text-xs text-[#A0A0A0] mb-1.5">
            <span>Profit Target Progress</span>
            <span className="text-white">${currentPnl >= 0 ? currentPnl.toFixed(0) : 0} / ${target.toLocaleString()}</span>
          </div>
          <div className="h-2.5 bg-[#1A1A1A] rounded-full overflow-hidden">
            <div className="h-full bg-[#22C55E] rounded-full transition-all" style={{ width: `${targetProgress}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-[#A0A0A0] mb-1.5">
            <span>Max Drawdown Remaining</span>
            <span className="text-white">${drawdownRemaining.toLocaleString()} / ${drawdown.toLocaleString()}</span>
          </div>
          <div className="h-2.5 bg-[#1A1A1A] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${100 - drawdownPctUsed}%`, backgroundColor: statusColor }} />
          </div>
        </div>

        {/* Payout eligibility */}
        {rules && (
          <div className="bg-[#0A0A0A] rounded-lg p-3 space-y-1">
            <div className="text-xs text-[#A0A0A0] font-medium mb-1">Payout Eligibility</div>
            <div className="text-xs text-white">Payouts: {rules.payouts}</div>
            <div className="text-xs text-[#A0A0A0]">Split: {rules.split}</div>
            {rules.minDays && <div className="text-xs text-[#A0A0A0]">Min {rules.minDays} days for payout</div>}
            {rules.maxAccounts && <div className="text-xs text-[#A0A0A0]">Max {rules.maxAccounts} funded accounts</div>}
            <div className="text-xs text-[#A0A0A0]">Drawdown type: {rules.drawdownType}</div>
          </div>
        )}

        {/* Days active */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[#A0A0A0]">Days active:</span>
          <span className="text-white font-medium">{daysActive}</span>
        </div>

        {/* Drawdown banners */}
        {isRedZone && (
          <div className="bg-[#EF4444]/15 border border-[#EF4444]/30 rounded-lg px-4 py-3">
            <p className="text-sm text-[#EF4444] font-medium">
              Funded Account: ${drawdownRemaining.toLocaleString()} remaining before breach. Know your numbers.
            </p>
          </div>
        )}
        {isYellowZone && (
          <div className="bg-[#EAB308]/15 border border-[#EAB308]/30 rounded-lg px-4 py-3">
            <p className="text-sm text-[#EAB308] font-medium">
              Funded Account Alert: ${drawdownRemaining.toLocaleString()} of drawdown remaining.
            </p>
          </div>
        )}

        <button onClick={saveToDb} className="w-full bg-[#D42A2A] hover:bg-[#b82424] text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
          Save to Funded Account
        </button>
      </div>
    </div>
  );
}