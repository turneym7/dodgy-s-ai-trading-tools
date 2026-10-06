import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { RULE_DEFINITIONS } from "@/lib/rules";
import FundedAccountsSection from "@/components/settings/FundedAccountsSection";
import MonthlyReportSection from "@/components/settings/MonthlyReportSection";

const inputCls =
  "w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D42A2A] transition-colors";
const labelCls = "text-xs text-[#A0A0A0] mb-1.5 block font-medium";

const INSTRUMENTS = ["NQ", "ES", "MNQ"];
const SESSIONS = ["Asia", "London", "Pre-Market", "Data Release Window", "NY Open", "NY Afternoon", "After Hours"];
const TIMEZONES = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "Europe/London", label: "London" },
  { value: "Asia/Tokyo", label: "Tokyo" },
];

export default function Settings() {
  const [user, setUser] = useState(null);
  const [rules, setRules] = useState([]);
  const [settings, setSettings] = useState(null);
  const [defaultsForm, setDefaultsForm] = useState({
    default_instrument: "NQ", risk_per_trade: "", daily_loss_limit: "", account_size: "", daily_trade_limit: "", active_sessions: [], timezone: "America/New_York", theme: "dark",
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.Rule.list().then(setRules).catch(() => {});
    base44.entities.UserSettings.list().then((s) => {
      setSettings(s[0] || null);
      if (s[0]) setDefaultsForm({
        default_instrument: s[0].default_instrument || "NQ",
        risk_per_trade: s[0].risk_per_trade || "",
        daily_loss_limit: s[0].daily_loss_limit || "",
        account_size: s[0].account_size || "",
        daily_trade_limit: s[0].daily_trade_limit || "",
        active_sessions: s[0].active_sessions || [],
        timezone: s[0].timezone || "America/New_York",
        theme: s[0].theme || "dark",
      });
    }).catch(() => {});
  }, []);

  const ruleMap = new Map(rules.map((r) => [r.rule_key, r]));
  const mergedRules = RULE_DEFINITIONS.map((def) => {
    const existing = ruleMap.get(def.key);
    return existing
      ? { ...def, ...existing, enabled: existing.enabled !== false }
      : { ...def, enabled: false, value: def.default, id: null };
  });

  const toggleRule = (ruleKey, enabled) => {
    const existing = ruleMap.get(ruleKey);
    if (existing) {
      base44.entities.Rule.update(existing.id, { enabled }).then((updated) => setRules((rs) => rs.map((r) => (r.id === updated.id ? updated : r))));
    } else {
      const def = RULE_DEFINITIONS.find((d) => d.key === ruleKey);
      base44.entities.Rule.create({ rule_key: ruleKey, enabled, value: def?.default || null }).then((created) => setRules((rs) => [...rs, created]));
    }
  };

  const updateRuleValue = (ruleKey, value) => {
    const existing = ruleMap.get(ruleKey);
    if (existing) {
      base44.entities.Rule.update(existing.id, { value, enabled: true }).then((updated) => setRules((rs) => rs.map((r) => (r.id === updated.id ? updated : r))));
    } else {
      base44.entities.Rule.create({ rule_key: ruleKey, enabled: true, value }).then((created) => setRules((rs) => [...rs, created]));
    }
  };

  const saveDefaults = () => {
    const data = {
      default_instrument: defaultsForm.default_instrument || "NQ",
      risk_per_trade: parseFloat(defaultsForm.risk_per_trade) || undefined,
      daily_loss_limit: parseFloat(defaultsForm.daily_loss_limit) || undefined,
      account_size: parseFloat(defaultsForm.account_size) || undefined,
      daily_trade_limit: parseFloat(defaultsForm.daily_trade_limit) || undefined,
      active_sessions: defaultsForm.active_sessions,
      timezone: defaultsForm.timezone,
      theme: defaultsForm.theme,
    };
    if (settings) {
      base44.entities.UserSettings.update(settings.id, data).then((s) => setSettings(s));
    } else {
      base44.entities.UserSettings.create(data).then((s) => setSettings(s));
    }
    if (data.theme === "light") document.documentElement.classList.remove("dark");
    else document.documentElement.classList.add("dark");
  };

  const toggleSession = (session) => {
    setDefaultsForm((f) => ({
      ...f,
      active_sessions: f.active_sessions.includes(session)
        ? f.active_sessions.filter((s) => s !== session)
        : [...f.active_sessions, session],
    }));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-[#A0A0A0] mt-1">Set your rules, risk, and funded accounts.</p>
      </div>

      {/* Profile */}
      <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-6 space-y-4">
        <h2 className="text-white font-bold">Profile</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Name</label>
            <input value={user?.full_name || ""} readOnly className={inputCls} placeholder="Not set" />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input value={user?.email || ""} readOnly className={inputCls} placeholder="Not set" />
          </div>
        </div>
      </div>

      {/* Funded Accounts */}
      <FundedAccountsSection />

      {/* Defaults */}
      <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-6 space-y-4">
        <h2 className="text-white font-bold">Defaults</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Default Instrument</label>
            <select value={defaultsForm.default_instrument} onChange={(e) => setDefaultsForm({ ...defaultsForm, default_instrument: e.target.value })} className={inputCls}>
              {INSTRUMENTS.map((i) => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Default Risk Per Trade (%)</label>
            <input type="number" step="0.1" value={defaultsForm.risk_per_trade} onChange={(e) => setDefaultsForm({ ...defaultsForm, risk_per_trade: e.target.value })} className={inputCls} placeholder="1" />
          </div>
          <div>
            <label className={labelCls}>Daily Trade Limit</label>
            <input type="number" value={defaultsForm.daily_trade_limit} onChange={(e) => setDefaultsForm({ ...defaultsForm, daily_trade_limit: e.target.value })} className={inputCls} placeholder="2" />
          </div>
          <div>
            <label className={labelCls}>Daily Loss Limit ($)</label>
            <input type="number" value={defaultsForm.daily_loss_limit} onChange={(e) => setDefaultsForm({ ...defaultsForm, daily_loss_limit: e.target.value })} className={inputCls} placeholder="500" />
          </div>
          <div>
            <label className={labelCls}>Account Size ($)</label>
            <input type="number" value={defaultsForm.account_size} onChange={(e) => setDefaultsForm({ ...defaultsForm, account_size: e.target.value })} className={inputCls} placeholder="10000" />
          </div>
          <div>
            <label className={labelCls}>Timezone</label>
            <select value={defaultsForm.timezone} onChange={(e) => setDefaultsForm({ ...defaultsForm, timezone: e.target.value })} className={inputCls}>
              {TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
            </select>
          </div>
        </div>
        <button onClick={saveDefaults} className="bg-[#D42A2A] hover:bg-[#b82424] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Save Defaults
        </button>
      </div>

      {/* Sessions */}
      <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-6 space-y-4">
        <h2 className="text-white font-bold">Sessions</h2>
        <div>
          <label className={labelCls}>Active Sessions</label>
          <div className="flex flex-wrap gap-2">
            {SESSIONS.map((s) => (
              <button
                key={s}
                onClick={() => toggleSession(s)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  defaultsForm.active_sessions.includes(s)
                    ? "bg-[#D42A2A] text-white"
                    : "bg-[#0A0A0A] text-[#A0A0A0] border border-[#1A1A1A] hover:text-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Trading Rules */}
      <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-white font-bold">Trading Rules</h2>
          <p className="text-xs text-[#A0A0A0] mt-1">Toggle rules on/off. The app mirrors your compliance from journal and validation data — no warnings, no lockouts.</p>
        </div>
        <div className="space-y-2.5">
          {mergedRules.map((rule) => (
            <RuleRow key={rule.key} rule={rule} onToggle={toggleRule} onValueChange={updateRuleValue} />
          ))}
        </div>
      </div>

      {/* Monthly Report */}
      <MonthlyReportSection />

      {/* Display */}
      <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-6 space-y-4">
        <h2 className="text-white font-bold">Display</h2>
        <div>
          <label className={labelCls}>Theme</label>
          <div className="flex gap-2">
            {[
              { key: "dark", label: "Dark" },
              { key: "light", label: "Light" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setDefaultsForm({ ...defaultsForm, theme: t.key })}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  defaultsForm.theme === t.key ? "bg-[#D42A2A] text-white" : "bg-[#0A0A0A] text-[#A0A0A0] border border-[#1A1A1A] hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-[#A0A0A0] mt-2">Save Defaults to apply theme.</p>
        </div>
      </div>

      {/* AI Dodgy Connection */}
      <div className="bg-[#141414] border border-[#1A1A1A] border-l-2 border-l-[#D42A2A] rounded-xl p-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
          <h2 className="text-white font-bold">AI Dodgy Connection</h2>
        </div>
        <p className="text-sm text-[#A0A0A0]">
          AI Dodgy is connected. Trades logged through your AI Dodgy agent appear here automatically.
        </p>
        <div className="flex items-center justify-between bg-[#0A0A0A] rounded-lg px-3 py-2.5">
          <span className="text-sm text-[#A0A0A0]">Connection status</span>
          <span className="text-sm text-[#22C55E] font-medium">Connected</span>
        </div>
      </div>
    </div>
  );
}

function RuleRow({ rule, onToggle, onValueChange }) {
  const label = rule.label.replace("[X]", "").replace("[instrument]", "").trim();
  return (
    <div className="bg-[#0A0A0A] rounded-lg p-3 flex items-center gap-3">
      <button
        onClick={() => onToggle(rule.key, !rule.enabled)}
        className={`w-10 h-5 rounded-full relative shrink-0 transition-colors ${rule.enabled ? "bg-[#D42A2A]" : "bg-[#3A3A3A]"}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${rule.enabled ? "left-[22px]" : "left-0.5"}`} />
      </button>
      <div className="flex-1 min-w-0">
        <div className={`text-sm ${rule.enabled ? "text-white" : "text-[#A0A0A0]"}`}>
          {label}
          {rule.type === "number" && rule.label.includes("[X]") && (
            <input
              type="number"
              value={rule.value || ""}
              onChange={(e) => onValueChange(rule.key, e.target.value)}
              disabled={!rule.enabled}
              className="ml-2 w-16 bg-[#141414] border border-[#1A1A1A] rounded px-2 py-0.5 text-sm text-white focus:outline-none focus:border-[#D42A2A] disabled:opacity-50 inline-block"
              placeholder={rule.default}
            />
          )}
          {rule.type === "instrument" && (
            <select
              value={rule.value || "NQ"}
              onChange={(e) => onValueChange(rule.key, e.target.value)}
              disabled={!rule.enabled}
              className="ml-2 bg-[#141414] border border-[#1A1A1A] rounded px-2 py-0.5 text-sm text-white focus:outline-none focus:border-[#D42A2A] disabled:opacity-50 inline-block"
            >
              {INSTRUMENTS.map((i) => <option key={i}>{i}</option>)}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}