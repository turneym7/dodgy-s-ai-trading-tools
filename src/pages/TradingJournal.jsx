import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CONTRACTS, getPnl } from "@/lib/trading";
import { Plus, Trash2, X } from "lucide-react";

const inputCls =
  "w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D42A2A] transition-colors";
const labelCls = "text-xs text-[#A0A0A0] mb-1 block";

export default function TradingJournal() {
  const [trades, setTrades] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");

  const load = () => {
    base44.entities.Trade.list("-trade_date", 500).then(setTrades).catch(() => {});
  };
  useEffect(load, []);

  const empty = {
    instrument: "NQ",
    direction: "long",
    entry: "",
    exit: "",
    stop: "",
    target: "",
    contracts: "1",
    grade: "B",
    validated: false,
    emotional_state: "1",
    setupType: "IFVG",
    notes: "",
    date: new Date().toISOString().slice(0, 10),
  };
  const [form, setForm] = useState(empty);
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    const entry = parseFloat(form.entry);
    const exit = parseFloat(form.exit);
    const contracts = parseFloat(form.contracts) || 1;
    const pnl = getPnl(form.instrument, form.direction, entry, exit, contracts);
    base44.entities.Trade.create({
      instrument: form.instrument,
      direction: form.direction,
      entry_price: entry,
      exit_price: exit,
      stop_loss: parseFloat(form.stop) || undefined,
      take_profit: parseFloat(form.target) || undefined,
      contracts,
      pnl,
      points: exit - entry,
      grade: form.grade,
      validated: form.validated,
      emotional_state: parseInt(form.emotional_state) || undefined,
      setup_type: form.setupType,
      notes: form.notes,
      trade_date: new Date(form.date).toISOString(),
    }).then(() => {
      setForm(empty);
      setShowForm(false);
      load();
    });
  };

  const remove = (id) => {
    base44.entities.Trade.delete(id).then(load);
  };

  const filtered = trades.filter((t) => {
    if (filter === "all") return true;
    if (filter === "validated") return t.validated;
    if (filter === "unvalidated") return !t.validated;
    return t.instrument === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Trading Journal</h1>
          <p className="text-sm text-[#A0A0A0] mt-1">Journal every trade. Winners and losers.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#D42A2A] hover:bg-[#b82424] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> Log Trade
        </button>
      </div>

      {trades.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {["all", "NQ", "ES", "MNQ", "validated", "unvalidated"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full capitalize transition-colors ${
                filter === f ? "bg-[#D42A2A] text-white" : "bg-[#141414] text-[#A0A0A0] hover:text-white border border-[#1A1A1A]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-10 text-center">
          <p className="text-sm text-[#A0A0A0]">
            No trades logged yet. Tell AI Dodgy 'Log Trade' in your agent chat to get started.
          </p>
        </div>
      ) : (
        <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#A0A0A0] text-xs border-b border-[#1A1A1A]">
                  <th className="text-left font-medium px-4 py-3">Date</th>
                  <th className="text-left font-medium px-4 py-3">Instrument</th>
                  <th className="text-left font-medium px-4 py-3">Dir</th>
                  <th className="text-left font-medium px-4 py-3">Grade</th>
                  <th className="text-left font-medium px-4 py-3">Validated</th>
                  <th className="text-right font-medium px-4 py-3">P&amp;L</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b border-[#1A1A1A] last:border-0">
                    <td className="px-4 py-3 text-white text-xs">
                      {new Date(t.trade_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{t.instrument}</td>
                    <td className={`px-4 py-3 ${t.direction === "long" ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                      {t.direction?.toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-[#A0A0A0]">{t.grade || "-"}</td>
                    <td className="px-4 py-3 text-[#A0A0A0]">{t.validated ? "Yes" : "No"}</td>
                    <td className={`px-4 py-3 text-right font-medium ${t.pnl >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                      {t.pnl >= 0 ? "+" : ""}${(t.pnl || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => remove(t.id)} className="text-[#A0A0A0] hover:text-[#EF4444]">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold">Log Trade</h2>
              <button onClick={() => setShowForm(false)} className="text-[#A0A0A0] hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Instrument</label>
                  <select value={form.instrument} onChange={(e) => update("instrument", e.target.value)} className={inputCls}>
                    <option>NQ</option>
                    <option>ES</option>
                    <option>MNQ</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Direction</label>
                  <select value={form.direction} onChange={(e) => update("direction", e.target.value)} className={inputCls}>
                    <option value="long">Long</option>
                    <option value="short">Short</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Contracts</label>
                  <input type="number" value={form.contracts} onChange={(e) => update("contracts", e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Entry</label>
                  <input type="number" value={form.entry} onChange={(e) => update("entry", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Exit</label>
                  <input type="number" value={form.exit} onChange={(e) => update("exit", e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Stop</label>
                  <input type="number" value={form.stop} onChange={(e) => update("stop", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Target</label>
                  <input type="number" value={form.target} onChange={(e) => update("target", e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Grade</label>
                  <select value={form.grade} onChange={(e) => update("grade", e.target.value)} className={inputCls}>
                    {["A+", "A", "B", "C", "D"].map((g) => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Emotion (1-5)</label>
                  <select value={form.emotional_state} onChange={(e) => update("emotional_state", e.target.value)} className={inputCls}>
                    {[1, 2, 3, 4, 5].map((g) => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Validated?</label>
                  <select value={form.validated} onChange={(e) => update("validated", e.target.value === "true")} className={inputCls}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Setup Type</label>
                <input value={form.setupType} onChange={(e) => update("setupType", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Date</label>
                <input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Notes</label>
                <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} className={inputCls} rows={2} />
              </div>
              <button onClick={save} className="w-full bg-[#D42A2A] hover:bg-[#b82424] text-white font-medium py-2.5 rounded-lg transition-colors">
                Save Trade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}