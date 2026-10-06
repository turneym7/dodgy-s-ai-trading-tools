import React, { useState, useMemo } from "react";
import { CONTRACTS } from "@/lib/trading";

const inputCls =
  "w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D42A2A] transition-colors";
const labelCls = "text-xs text-[#A0A0A0] mb-1.5 block font-medium";

export default function PointsToDollarsCalc() {
  const [form, setForm] = useState({
    points: "",
    dollars: "",
    instrument: "NQ",
    contracts: "1",
    lastEdited: "points",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v, lastEdited: k }));

  const result = useMemo(() => {
    const contract = CONTRACTS[form.instrument];
    const contracts = parseFloat(form.contracts) || 1;
    const pointValue = contract.pointValue * contracts;

    let points = parseFloat(form.points);
    let dollars = parseFloat(form.dollars);

    if (form.lastEdited === "points" && !isNaN(points) && points != null) {
      dollars = points * pointValue;
    } else if (form.lastEdited === "dollars" && !isNaN(dollars) && dollars != null) {
      points = dollars / pointValue;
    } else if (!isNaN(points) && points != null) {
      dollars = points * pointValue;
    } else if (!isNaN(dollars) && dollars != null) {
      points = dollars / pointValue;
    } else {
      return null;
    }

    const ticks = points * contract.ticksPerPoint;
    const tickDollarValue = contract.tickValue * contracts;

    return { points, dollars, ticks, tickDollarValue, pointValue: contract.pointValue, contracts };
  }, [form]);

  // Sync the non-edited field for display
  const displayPoints = result ? result.points.toFixed(2) : "";
  const displayDollars = result ? result.dollars.toFixed(2) : "";

  return (
    <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-5 space-y-4">
      <h2 className="text-white font-bold">Points to Dollars Converter</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Points</label>
          <input
            type="number"
            value={form.lastEdited === "points" ? form.points : displayPoints}
            onChange={(e) => set("points", e.target.value)}
            className={inputCls}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className={labelCls}>Dollars ($)</label>
          <input
            type="number"
            value={form.lastEdited === "dollars" ? form.dollars : displayDollars}
            onChange={(e) => set("dollars", e.target.value)}
            className={inputCls}
            placeholder="0.00"
          />
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
        <div className="space-y-3 pt-2 border-t border-[#1A1A1A]">
          <div className="bg-[#0A0A0A] rounded-lg p-4 text-center">
            <div className="text-xs text-[#A0A0A0] mb-1">Dollar Value</div>
            <div className="text-3xl font-bold text-white">${result.dollars.toFixed(2)}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0A0A0A] rounded-lg p-3">
              <div className="text-xs text-[#A0A0A0] mb-1">Tick equivalent</div>
              <div className="text-sm font-medium text-white">{result.ticks.toFixed(0)} ticks</div>
            </div>
            <div className="bg-[#0A0A0A] rounded-lg p-3">
              <div className="text-xs text-[#A0A0A0] mb-1">Tick dollar value</div>
              <div className="text-sm font-medium text-white">${result.tickDollarValue.toFixed(2)}/tick</div>
            </div>
          </div>
          <div className="text-xs text-[#A0A0A0] text-center">
            {result.points.toFixed(2)} pts × ${result.pointValue}/pt × {result.contracts} contract{result.contracts === 1 ? "" : "s"}
          </div>
        </div>
      )}
    </div>
  );
}