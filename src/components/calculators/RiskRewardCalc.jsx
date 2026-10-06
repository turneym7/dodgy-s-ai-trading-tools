import React, { useState, useMemo } from "react";
import { CONTRACTS } from "@/lib/trading";

const inputCls =
  "w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D42A2A] transition-colors";
const labelCls = "text-xs text-[#A0A0A0] mb-1.5 block font-medium";

export default function RiskRewardCalc() {
  const [form, setForm] = useState({
    entry: "",
    stop: "",
    target1: "",
    target2: "",
    target3: "",
    instrument: "NQ",
    contracts: "1",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const result = useMemo(() => {
    const entry = parseFloat(form.entry);
    const stop = parseFloat(form.stop);
    const contract = CONTRACTS[form.instrument];
    const contracts = parseFloat(form.contracts) || 1;

    if (!entry || !stop) return null;

    const riskPoints = Math.abs(entry - stop);
    const riskDollars = riskPoints * contract.pointValue * contracts;

    const targets = [form.target1, form.target2, form.target3]
      .map((t, i) => {
        const tp = parseFloat(t);
        if (!tp) return null;
        const rewardPoints = Math.abs(tp - entry);
        const rewardDollars = rewardPoints * contract.pointValue * contracts;
        const rr = riskPoints > 0 ? rewardPoints / riskPoints : 0;
        return { idx: i + 1, rewardPoints, rewardDollars, rr };
      })
      .filter(Boolean);

    if (targets.length === 0) return { riskPoints, riskDollars, targets: [], primaryRr: null };

    const primaryRr = targets[0].rr;
    return { riskPoints, riskDollars, targets, primaryRr };
  }, [form]);

  const rrColor = result?.primaryRr != null
    ? result.primaryRr >= 2 ? "#22C55E"
    : result.primaryRr >= 1.5 ? "#EAB308"
    : "#EF4444"
    : "#3A3A3A";

  return (
    <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-5 space-y-4">
      <h2 className="text-white font-bold">Risk : Reward Calculator</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Entry Price</label>
          <input type="number" value={form.entry} onChange={(e) => set("entry", e.target.value)} className={inputCls} placeholder="0.00" />
        </div>
        <div>
          <label className={labelCls}>Stop Loss Price</label>
          <input type="number" value={form.stop} onChange={(e) => set("stop", e.target.value)} className={inputCls} placeholder="0.00" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Target 1</label>
          <input type="number" value={form.target1} onChange={(e) => set("target1", e.target.value)} className={inputCls} placeholder="0.00" />
        </div>
        <div>
          <label className={labelCls}>Target 2 (opt.)</label>
          <input type="number" value={form.target2} onChange={(e) => set("target2", e.target.value)} className={inputCls} placeholder="0.00" />
        </div>
        <div>
          <label className={labelCls}>Target 3 (opt.)</label>
          <input type="number" value={form.target3} onChange={(e) => set("target3", e.target.value)} className={inputCls} placeholder="0.00" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Instrument</label>
          <select value={form.instrument} onChange={(e) => set("instrument", e.target.value)} className={inputCls}>
            <option value="NQ">NQ ($20/pt)</option>
            <option value="ES">ES ($50/pt)</option>
            <option value="MNQ">MNQ ($2/pt)</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Contracts</label>
          <input type="number" value={form.contracts} onChange={(e) => set("contracts", e.target.value)} className={inputCls} placeholder="1" />
        </div>
      </div>

      {result && (
        <div className="space-y-4 pt-2 border-t border-[#1A1A1A]">
          <div>
            <div className="text-xs text-[#A0A0A0] mb-1">Risk</div>
            <div className="text-sm text-[#EF4444] font-medium">
              {result.riskPoints.toFixed(2)} pts (${result.riskDollars.toFixed(2)})
            </div>
          </div>

          {result.targets.map((t) => (
            <div key={t.idx}>
              <div className="text-xs text-[#A0A0A0] mb-1">Target {t.idx}</div>
              <div className="text-sm text-[#22C55E] font-medium">
                {t.rewardPoints.toFixed(2)} pts (${t.rewardDollars.toFixed(2)})
              </div>
              {/* Visual comparison bar */}
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 h-3 bg-[#1A1A1A] rounded-full overflow-hidden flex">
                  <div className="h-full bg-[#EF4444]" style={{ width: `${100 / (1 + t.rr)}%` }} />
                  <div className="h-full bg-[#22C55E]" style={{ width: `${(t.rr / (1 + t.rr)) * 100}%` }} />
                </div>
                <span className="text-xs text-[#A0A0A0] w-10 text-right">R</span>
              </div>
            </div>
          ))}

          {result.primaryRr != null && (
            <div className="text-center py-2">
              <div className="text-3xl font-bold" style={{ color: rrColor }}>
                {result.primaryRr.toFixed(2)}:1
              </div>
              <div className="text-xs text-[#A0A0A0] mt-1">R:R ratio (Target 1)</div>
            </div>
          )}

          {result.primaryRr != null && result.primaryRr < 1 && (
            <p className="text-sm text-[#EF4444]">The math doesn't work. No setup is good enough to justify negative R:R.</p>
          )}
          {result.primaryRr != null && result.primaryRr >= 1 && result.primaryRr < 1.5 && (
            <p className="text-sm text-[#EAB308]">Below 1.5R usually isn't worth the risk.</p>
          )}

          <div className="bg-[#0A0A0A] rounded-lg p-4 space-y-1.5">
            <div className="text-xs text-[#A0A0A0] font-medium mb-1">Win Rate + R:R Reference</div>
            <p className="text-xs text-[#A0A0A0]">1:1 R:R needs 60%+ win rate to profit</p>
            <p className="text-xs text-[#A0A0A0]">2:1 R:R needs only 50% win rate to profit</p>
            <p className="text-xs text-white">Win rate alone will not make you profitable. It's win rate PLUS R:R.</p>
          </div>
        </div>
      )}
    </div>
  );
}