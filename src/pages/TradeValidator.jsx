import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getTradingSession } from "@/lib/trading";
import { validateSetup, SETUP_TYPES, CHECKLIST_ITEMS } from "@/lib/validator";
import {
  ShieldCheck, ChevronDown, ArrowLeft, Camera, Check,
} from "lucide-react";

const inputCls =
  "w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D42A2A] transition-colors";
const labelCls = "text-xs text-[#A0A0A0] mb-2 block font-medium";

const INSTRUMENTS = ["NQ", "ES", "MNQ"];
const DIRECTIONS = [
  { key: "long", label: "LONG", activeColor: "bg-[#22C55E] text-white" },
  { key: "short", label: "SHORT", activeColor: "bg-[#EF4444] text-white" },
];

export default function TradeValidator() {
  const [settings, setSettings] = useState(null);
  const [funded, setFunded] = useState(null);
  const [trades, setTrades] = useState([]);
  const [validations, setValidations] = useState([]);
  const [session, setSession] = useState(getTradingSession());
  const [result, setResult] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    instrument: "NQ",
    direction: "long",
    setupType: "IFVG",
    checklist: {
      draw_on_liquidity: false,
      structure_aligned: false,
      candle_close_confirmed: false,
      htf_bias_checked: false,
    },
    emotionalState: 2,
    // optional details
    entry: "",
    stop: "",
    target: "",
    sessionOverride: "",
    isRevenge: false,
    isLightBulb: false,
    tradesTodayOverride: "",
    inLossOverride: null,
    notes: "",
  });

  useEffect(() => {
    base44.entities.UserSettings.list().then((s) => {
      setSettings(s[0] || null);
      if (s[0]?.default_instrument) setForm((f) => ({ ...f, instrument: s[0].default_instrument }));
    }).catch(() => {});
    base44.entities.FundedAccount.list().then((f) => setFunded(f[0] || null)).catch(() => {});
    base44.entities.Trade.list("-trade_date", 500).then(setTrades).catch(() => {});
    base44.entities.ValidatedSetup.list("-validation_date", 20).then(setValidations).catch(() => {});
    const t = setInterval(() => setSession(getTradingSession()), 60000);
    return () => clearInterval(t);
  }, []);

  // Today's trade count from journal
  const todayStr = new Date().toLocaleDateString("en-US", { timeZone: "America/New_York" });
  const tradesToday = trades.filter(
    (t) => t.trade_date && new Date(t.trade_date).toLocaleDateString("en-US", { timeZone: "America/New_York" }) === todayStr
  ).length;
  const todayPnl = trades
    .filter((t) => t.trade_date && new Date(t.trade_date).toLocaleDateString("en-US", { timeZone: "America/New_York" }) === todayStr)
    .reduce((s, t) => s + (t.pnl || 0), 0);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleCheck = (k) => setForm((f) => ({ ...f, checklist: { ...f.checklist, [k]: !f.checklist[k] } }));

  const handleScreenshot = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      setScreenshot(file_uri);
    } catch {
      // ignore upload errors silently — optional field
    }
  };

  const doValidate = () => {
    const r = validateSetup(form, form.checklist, session, tradesToday, todayPnl, funded);

    const entry = parseFloat(form.entry);
    const stop = parseFloat(form.stop);
    const target = parseFloat(form.target);

    const record = {
      instrument: form.instrument,
      direction: form.direction,
      setup_type: form.setupType,
      entry_price: entry || undefined,
      stop_loss: stop || undefined,
      take_profit: target || undefined,
      grade: r.grade,
      score: r.score,
      score_setup: r.breakdown.setup,
      score_risk: r.breakdown.risk,
      score_emotional: r.breakdown.emotional,
      override: r.override,
      override_reason: r.overrideReason || undefined,
      rr_ratio: r.rr || undefined,
      emotional_state: form.emotionalState,
      session: form.sessionOverride || session.name,
      checklist: form.checklist,
      is_revenge: form.isRevenge,
      is_light_bulb: form.isLightBulb,
      trades_today: form.tradesTodayOverride !== "" ? parseInt(form.tradesTodayOverride) : tradesToday,
      in_loss: form.inLossOverride != null ? form.inLossOverride : todayPnl < 0,
      screenshot_uri: screenshot || undefined,
      notes: form.notes || undefined,
      trade_taken: false,
      result: r.override ? "rejected" : "validated",
      validation_date: new Date().toISOString(),
    };

    base44.entities.ValidatedSetup.create(record).then((saved) => {
      setValidations([saved, ...validations].slice(0, 20));
      setResult(r);
    }).catch(() => setResult(r));
  };

  const toggleTradeTaken = (v) => {
    base44.entities.ValidatedSetup.update(v.id, { trade_taken: !v.trade_taken }).then((updated) => {
      setValidations(validations.map((x) => (x.id === v.id ? updated : x)));
    });
  };

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#D42A2A]/15 flex items-center justify-center">
            <ShieldCheck size={20} className="text-[#D42A2A]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Validator</h1>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-xs text-[#A0A0A0] bg-[#1A1A1A] px-2.5 py-1 rounded-full">{session.name}</span>
          <span className="text-xs text-[#A0A0A0] bg-[#1A1A1A] px-2.5 py-1 rounded-full">
            Trade #{tradesToday + 1} today
          </span>
        </div>
      </div>

      {/* Form — single compact flow */}
      <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-5 space-y-5">
        {/* Row 1: Instrument & Direction */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className={labelCls}>Instrument</label>
            <div className="flex gap-1.5">
              {INSTRUMENTS.map((inst) => (
                <button
                  key={inst}
                  onClick={() => set("instrument", inst)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    form.instrument === inst
                      ? "bg-[#D42A2A] text-white"
                      : "bg-[#141414] text-[#A0A0A0] border border-[#1A1A1A] hover:text-white"
                  }`}
                >
                  {inst}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <label className={labelCls}>Direction</label>
            <div className="flex gap-1.5">
              {DIRECTIONS.map((d) => (
                <button
                  key={d.key}
                  onClick={() => set("direction", d.key)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    form.direction === d.key
                      ? d.activeColor
                      : "bg-[#141414] text-[#A0A0A0] border border-[#1A1A1A] hover:text-white"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Setup Type */}
        <div>
          <label className={labelCls}>Setup Type</label>
          <div className="flex gap-1.5 flex-wrap">
            {SETUP_TYPES.map((st) => (
              <button
                key={st}
                onClick={() => set("setupType", st)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  form.setupType === st
                    ? "bg-[#D42A2A] text-white"
                    : "bg-[#141414] text-[#A0A0A0] border border-[#1A1A1A] hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Checklist */}
        <div>
          <label className={labelCls}>Setup Checklist</label>
          <div className="space-y-1">
            {CHECKLIST_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => toggleCheck(item.key)}
                className="w-full flex items-center gap-3 py-2 px-1 group"
              >
                <span
                  className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    form.checklist[item.key]
                      ? "bg-[#D42A2A] border-[#D42A2A]"
                      : "border-[#3A3A3A] group-hover:border-[#A0A0A0]"
                  }`}
                >
                  {form.checklist[item.key] && <Check size={13} className="text-white" />}
                </span>
                <span className={`text-sm ${form.checklist[item.key] ? "text-white" : "text-[#A0A0A0]"}`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Row 4: Emotional state slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-[#A0A0A0] font-medium">Emotional state</label>
            <span className="text-sm text-white font-medium">{form.emotionalState}/5</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={form.emotionalState}
            onChange={(e) => set("emotionalState", parseInt(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #D42A2A 0%, #D42A2A ${((form.emotionalState - 1) / 4) * 100}%, #3A3A3A ${((form.emotionalState - 1) / 4) * 100}%, #3A3A3A 100%)`,
            }}
          />
          <div className="flex justify-between mt-1 text-[10px] text-[#A0A0A0]">
            <span>Calm</span>
            <span>Tilted</span>
          </div>
        </div>

        {/* Row 5: Submit */}
        <button
          onClick={doValidate}
          className="w-full flex items-center justify-center gap-2 bg-[#D42A2A] hover:bg-[#b82424] text-white font-medium py-3 rounded-lg transition-colors"
        >
          <ShieldCheck size={18} /> Validate This Setup
        </button>

        {/* Row 6: Optional details */}
        <div>
          <button
            onClick={() => setDetailsOpen(!detailsOpen)}
            className="w-full flex items-center justify-center gap-2 text-sm text-[#A0A0A0] hover:text-white py-1 transition-colors"
          >
            Add details (optional)
            <ChevronDown size={16} className={`transition-transform ${detailsOpen ? "rotate-180" : ""}`} />
          </button>
          {detailsOpen && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Entry Price</label>
                  <input type="number" value={form.entry} onChange={(e) => set("entry", e.target.value)} className={inputCls} placeholder="0.00" />
                </div>
                <div>
                  <label className={labelCls}>Stop Loss</label>
                  <input type="number" value={form.stop} onChange={(e) => set("stop", e.target.value)} className={inputCls} placeholder="0.00" />
                </div>
                <div>
                  <label className={labelCls}>Take Profit</label>
                  <input type="number" value={form.target} onChange={(e) => set("target", e.target.value)} className={inputCls} placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Session (override auto-detected)</label>
                <select value={form.sessionOverride} onChange={(e) => set("sessionOverride", e.target.value)} className={inputCls}>
                  <option value="">Auto ({session.name})</option>
                  <option>Asia</option>
                  <option>London</option>
                  <option>Pre-Market</option>
                  <option>Data Release Window</option>
                  <option>NY Open</option>
                  <option>NY Afternoon</option>
                  <option>After Hours</option>
                  <option>Closed</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ToggleField label="Revenge trade?" value={form.isRevenge} onChange={(v) => set("isRevenge", v)} />
                <ToggleField label="Light bulb trade?" value={form.isLightBulb} onChange={(v) => set("isLightBulb", v)} helper="Most obvious, highest-conviction of the day." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Trades today</label>
                  <input
                    type="number"
                    value={form.tradesTodayOverride}
                    onChange={(e) => set("tradesTodayOverride", e.target.value)}
                    className={inputCls}
                    placeholder={`Auto: ${tradesToday}`}
                  />
                </div>
                <div>
                  <label className={labelCls}>In a loss today?</label>
                  <div className="flex gap-1.5">
                    {[
                      { k: "yes", label: "Yes", val: true },
                      { k: "no", label: "No", val: false },
                    ].map((o) => (
                      <button
                        key={o.k}
                        onClick={() => set("inLossOverride", o.val)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          form.inLossOverride === o.val
                            ? "bg-[#D42A2A] text-white"
                            : "bg-[#0A0A0A] text-[#A0A0A0] border border-[#1A1A1A] hover:text-white"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className={labelCls}>Chart screenshot (optional)</label>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleScreenshot} className="hidden" />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 bg-[#0A0A0A] border border-[#1A1A1A] text-[#A0A0A0] hover:text-white py-2.5 rounded-lg text-sm transition-colors"
                >
                  <Camera size={16} /> {screenshot ? "Screenshot added" : "Upload screenshot"}
                </button>
                {screenshot && <p className="text-xs text-[#22C55E] mt-1">Screenshot uploaded.</p>}
              </div>
              <div>
                <label className={labelCls}>Notes — Why are you taking this trade?</label>
                <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} className={inputCls} rows={3} placeholder="Reason for entry..." />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl font-bold shrink-0"
              style={{ backgroundColor: `${result.gradeColor}20`, color: result.gradeColor }}
            >
              {result.grade}
            </div>
            <div className="flex-1">
              <div className="text-white text-lg font-bold">{result.score}/100</div>
              <div className="text-sm text-[#A0A0A0]">{result.feedback}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <ScoreBar label="Setup Quality" value={result.breakdown.setup} max={40} />
            <ScoreBar label="Risk Mgmt" value={result.breakdown.risk} max={30} />
            <ScoreBar label="Emotional" value={result.breakdown.emotional} max={30} />
          </div>

          {result.rr != null && (
            <div className="text-sm text-[#A0A0A0]">
              R:R <span className="text-white font-medium">{result.rr.toFixed(2)}:1</span>
            </div>
          )}

          {result.drawdownRemaining != null && (
            <div className="text-sm text-[#A0A0A0] pt-3 border-t border-[#1A1A1A]">
              You have <span className="text-white font-medium">${result.drawdownRemaining.toLocaleString()}</span> drawdown remaining.
            </div>
          )}

          <p className="text-xs text-[#A0A0A0]">
            To log this trade, tell AI Dodgy "Log Trade" in your agent chat.
          </p>

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-[#D42A2A] hover:underline font-medium"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </div>
      )}

      {/* Validation History */}
      <div className="pt-2">
        <h2 className="text-xs text-[#A0A0A0] uppercase tracking-wider font-medium mb-3">Recent Validations</h2>
        {validations.length === 0 ? (
          <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-8 text-center">
            <p className="text-sm text-[#A0A0A0]">No validations yet. Grade your first setup above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {validations.map((v) => (
              <div key={v.id} className="bg-[#141414] border border-[#1A1A1A] rounded-lg p-3 flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                  style={{
                    backgroundColor: v.override ? "#EF444420" : v.grade === "A+" || v.grade === "A" ? "#22C55E20" : v.grade === "B" ? "#EAB30820" : v.grade === "C" ? "#F9731620" : "#EF444420",
                    color: v.override ? "#EF4444" : v.grade === "A+" || v.grade === "A" ? "#22C55E" : v.grade === "B" ? "#EAB308" : v.grade === "C" ? "#F97316" : "#EF4444",
                  }}
                >
                  {v.override ? "F" : v.grade}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">{v.instrument}</span>
                    <span className={`text-xs ${v.direction === "long" ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                      {v.direction?.toUpperCase()}
                    </span>
                    <span className="text-[#A0A0A0] text-xs">· {v.score}/100</span>
                  </div>
                  <div className="text-[#A0A0A0] text-xs">
                    {new Date(v.validation_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {v.setup_type}
                  </div>
                </div>
                <button
                  onClick={() => toggleTradeTaken(v)}
                  className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                    v.trade_taken
                      ? "bg-[#22C55E]/15 text-[#22C55E]"
                      : "bg-[#1A1A1A] text-[#A0A0A0] hover:text-white"
                  }`}
                >
                  {v.trade_taken ? "Taken" : "Mark taken"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleField({ label, value, onChange, helper }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex gap-1.5">
        {[
          { k: "yes", label: "Yes", val: true },
          { k: "no", label: "No", val: false },
        ].map((o) => (
          <button
            key={o.k}
            onClick={() => onChange(o.val)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              value === o.val
                ? "bg-[#D42A2A] text-white"
                : "bg-[#0A0A0A] text-[#A0A0A0] border border-[#1A1A1A] hover:text-white"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {helper && <p className="text-[10px] text-[#A0A0A0] mt-1">{helper}</p>}
    </div>
  );
}

function ScoreBar({ label, value, max }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const color = pct >= 75 ? "#22C55E" : pct >= 50 ? "#EAB308" : pct >= 25 ? "#F97316" : "#EF4444";
  return (
    <div>
      <div className="text-xs text-[#A0A0A0] mb-1">{label}</div>
      <div className="text-sm text-white font-medium">{value}/{max}</div>
      <div className="h-1.5 bg-[#1A1A1A] rounded-full mt-1 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}