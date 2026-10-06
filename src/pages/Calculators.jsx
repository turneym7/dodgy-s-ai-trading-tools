import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { CONTRACTS } from "@/lib/trading";
import { Calculator, ArrowRight } from "lucide-react";

const inputCls =
  "w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D42A2A] transition-colors";
const labelCls = "text-xs text-[#A0A0A0] mb-1.5 block font-medium";

export default function Calculators() {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({
    instrument: "NQ",
    accountSize: "",
    riskPercent: "1",
    entry: "",
    stop: "",
  });
  const [result, setResult] = useState(null);

  useEffect(() => {
    base44.entities.UserSettings.list().then((s) => {
      setSettings(s[0] || null);
      if (s[0]?.account_size) setForm((f) => ({ ...f, accountSize: String(s[0].account_size) }));
      if (s[0]?.risk_per_trade) setForm((f) => ({ ...f, riskPercent: String(s[0].risk_per_trade) }));
    }).catch(() => {});
  }, []);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const calc = () => {
    const account = parseFloat(form.accountSize);
    const riskPct = parseFloat(form.riskPercent);
    const entry = parseFloat(form.entry);
    const stop = parseFloat(form.stop);
    if (!account || !riskPct || !entry || !stop) return;

    const contract = CONTRACTS[form.instrument];
    const riskAmount = account * (riskPct / 100);
    const stopPoints = Math.abs(entry - stop);
    const dollarsPerPoint = contract.pointValue;
    const contracts = stopPoints > 0 ? Math.floor(riskAmount / (stopPoints * dollarsPerPoint)) : 0;
    const actualRisk = contracts * stopPoints * dollarsPerPoint;
    const ticks = stopPoints * contract.ticksPerPoint;

    setResult({ riskAmount, stopPoints, contracts, actualRisk, ticks, contract });
  };

  const validatorUrl = `/validator?instrument=${form.instrument}&entry=${form.entry || ""}&stop=${form.stop || ""}`;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Position Size &amp; Risk Calculator</h1>
        <p className="text-sm text-[#A0A0A0] mt-1">Know your risk before you enter.</p>
      </div>

      <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Instrument</label>
            <select value={form.instrument} onChange={(e) => update("instrument", e.target.value)} className={inputCls}>
              <option value="NQ">NQ ($20/pt)</option>
              <option value="ES">ES ($50/pt)</option>
              <option value="MNQ">MNQ ($2/pt)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Account Size ($)</label>
            <input type="number" value={form.accountSize} onChange={(e) => update("accountSize", e.target.value)} className={inputCls} placeholder="10000" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Risk Per Trade (%)</label>
            <input type="number" step="0.1" value={form.riskPercent} onChange={(e) => update("riskPercent", e.target.value)} className={inputCls} placeholder="1" />
          </div>
          <div>
            <label className={labelCls}>Entry Price</label>
            <input type="number" value={form.entry} onChange={(e) => update("entry", e.target.value)} className={inputCls} placeholder="0.00" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Stop Loss Price</label>
          <input type="number" value={form.stop} onChange={(e) => update("stop", e.target.value)} className={inputCls} placeholder="0.00" />
        </div>
        <button
          onClick={calc}
          disabled={!form.accountSize || !form.entry || !form.stop}
          className="w-full flex items-center justify-center gap-2 bg-[#D42A2A] hover:bg-[#b82424] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          <Calculator size={16} /> Calculate
        </button>
      </div>

      {result && (
        <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0A0A0A] rounded-lg p-4">
              <div className="text-xs text-[#A0A0A0] mb-1">Position Size</div>
              <div className="text-2xl font-bold text-white">{result.contracts}</div>
              <div className="text-xs text-[#A0A0A0] mt-0.5">contract{result.contracts === 1 ? "" : "s"}</div>
            </div>
            <div className="bg-[#0A0A0A] rounded-lg p-4">
              <div className="text-xs text-[#A0A0A0] mb-1">Risk Amount</div>
              <div className="text-2xl font-bold text-[#EF4444]">${result.riskAmount.toFixed(2)}</div>
              <div className="text-xs text-[#A0A0A0] mt-0.5">max loss</div>
            </div>
          </div>
          <div className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-[#A0A0A0]">Stop distance</span><span className="text-white">{result.stopPoints.toFixed(2)} pts ({result.ticks} ticks)</span></div>
            <div className="flex justify-between"><span className="text-[#A0A0A0]">Actual risk</span><span className="text-[#EF4444]">${result.actualRisk.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-[#A0A0A0]">Contract value</span><span className="text-white">${result.contract.pointValue}/pt</span></div>
          </div>
          <Link
            to="/validator"
            className="mt-5 w-full flex items-center justify-center gap-2 bg-[#1A1A1A] hover:bg-[#222] text-white text-sm font-medium py-2.5 rounded-lg transition-colors border border-[#1A1A1A]"
          >
            Validate This Setup <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}