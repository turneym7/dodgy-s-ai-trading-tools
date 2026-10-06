import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { CONTRACTS } from "@/lib/trading";
import { ArrowLeft, ShieldCheck } from "lucide-react";

const inputCls =
  "w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D42A2A] transition-colors";
const labelCls = "text-xs text-[#A0A0A0] mb-1.5 block font-medium";

export default function TradeValidator() {
  const [form, setForm] = useState({
    instrument: "NQ",
    direction: "long",
    entry: "",
    stop: "",
    target: "",
    setupType: "IFVG",
  });
  const [result, setResult] = useState(null);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const entry = parseFloat(form.entry);
    const stop = parseFloat(form.stop);
    const target = parseFloat(form.target);
    if (!entry || !stop || !target) return;

    const risk = Math.abs(entry - stop);
    const reward = Math.abs(target - entry);
    const rr = risk > 0 ? reward / risk : 0;

    let grade = "D";
    if (rr >= 3) grade = "A+";
    else if (rr >= 2) grade = "A";
    else if (rr >= 1.5) grade = "B";
    else if (rr >= 1) grade = "C";

    const valid = rr >= 1.5;
    const contract = CONTRACTS[form.instrument];
    const riskDollars = risk * contract.pointValue;

    setResult({ risk, reward, rr, grade, valid, riskDollars });

    base44.entities.ValidatedSetup.create({
      instrument: form.instrument,
      direction: form.direction,
      entry_price: entry,
      stop_loss: stop,
      take_profit: target,
      grade,
      result: valid ? "validated" : "rejected",
      rr_ratio: rr,
      validation_date: new Date().toISOString(),
    }).catch(() => {});
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Trade Validator</h1>
        <p className="text-sm text-[#A0A0A0] mt-1">Grade the setup before you risk your live account.</p>
      </div>

      <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Instrument</label>
            <select value={form.instrument} onChange={(e) => update("instrument", e.target.value)} className={inputCls}>
              <option value="NQ">NQ</option>
              <option value="ES">ES</option>
              <option value="MNQ">MNQ</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Direction</label>
            <select value={form.direction} onChange={(e) => update("direction", e.target.value)} className={inputCls}>
              <option value="long">Long</option>
              <option value="short">Short</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Entry</label>
            <input type="number" value={form.entry} onChange={(e) => update("entry", e.target.value)} className={inputCls} placeholder="0.00" />
          </div>
          <div>
            <label className={labelCls}>Stop Loss</label>
            <input type="number" value={form.stop} onChange={(e) => update("stop", e.target.value)} className={inputCls} placeholder="0.00" />
          </div>
          <div>
            <label className={labelCls}>Target</label>
            <input type="number" value={form.target} onChange={(e) => update("target", e.target.value)} className={inputCls} placeholder="0.00" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Setup Type</label>
          <input value={form.setupType} onChange={(e) => update("setupType", e.target.value)} className={inputCls} placeholder="IFVG" />
        </div>
        <button
          onClick={validate}
          disabled={!form.entry || !form.stop || !form.target}
          className="w-full flex items-center justify-center gap-2 bg-[#D42A2A] hover:bg-[#b82424] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          <ShieldCheck size={16} /> Validate Setup
        </button>
      </div>

      {result && (
        <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-[#A0A0A0]">Result</span>
            <span
              className={`text-xs font-medium px-3 py-1 rounded-full ${
                result.valid ? "bg-[#22C55E]/10 text-[#22C55E]" : "bg-[#EF4444]/10 text-[#EF4444]"
              }`}
            >
              {result.valid ? "Validated" : "Rejected"} · Grade {result.grade}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-[#A0A0A0] mb-1">R:R</div>
              <div className="text-lg font-bold text-white">{result.rr.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-[#A0A0A0] mb-1">Risk (pts)</div>
              <div className="text-lg font-bold text-[#EF4444]">{result.risk.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-[#A0A0A0] mb-1">Risk ($/ctr)</div>
              <div className="text-lg font-bold text-[#EF4444]">${result.riskDollars.toFixed(2)}</div>
            </div>
          </div>
          <p className="text-sm text-[#A0A0A0] mt-5 pt-4 border-t border-[#1A1A1A]">
            Tell AI Dodgy 'Log Trade' to record this setup.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 mt-4 text-sm text-[#D42A2A] hover:underline"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}