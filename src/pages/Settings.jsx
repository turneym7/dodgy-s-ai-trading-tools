import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { RULE_DEFINITIONS } from "@/lib/rules";

const inputCls =
  "w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D42A2A] transition-colors";
const labelCls = "text-xs text-[#A0A0A0] mb-1.5 block font-medium";

const INSTRUMENTS = ["NQ", "ES", "MNQ"];

export default function Settings() {
  const [rules, setRules] = useState([]);
  const [funded, setFunded] = useState(null);
  const [settings, setSettings] = useState(null);
  const [fundedForm, setFundedForm] = useState({
    firm_name: "", account_size: "", payout_target: "", max_drawdown: "", start_date: new Date().toISOString().slice(0, 10),
  });
  const [riskForm, setRiskForm] = useState({ daily_loss_limit: "", risk_per_trade: "", account_size: "", default_instrument: "NQ" });

  useEffect(() => {
    base44.entities.Rule.list().then(setRules).catch(() => {});
    base44.entities.FundedAccount.list().then((f) => {
      setFunded(f[0] || null);
      if (f[0]) setFundedForm({
        firm_name: f[0].firm_name, account_size: f[0].account_size, payout_target: f[0].payout_target || "",
        max_drawdown: f[0].max_drawdown || "", start_date: f[0].start_date || new Date().toISOString().slice(0, 10),
      });
    }).catch(() => {});
    base44.entities.UserSettings.list().then((s) => {
      setSettings(s[0] || null);
      if (s[0]) setRiskForm({
        daily_loss_limit: s[0].daily_loss_limit || "",
        risk_per_trade: s[0].risk_per_trade || "",
        account_size: s[0].account_size || "",
        default_instrument: s[0].default_instrument || "NQ",
      });
    }).catch(() => {});
  }, []);

  // Merge DB rules with definitions so all 15 always render.
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
      base44.entities.Rule.update(existing.id, { enabled }).then((updated) => {
        setRules((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
      });
    } else {
      const def = RULE_DEFINITIONS.find((d) => d.key === ruleKey);
      base44.entities.Rule.create({ rule_key: ruleKey, enabled, value: def?.default || null }).then((created) => {
        setRules((rs) => [...rs, created]);
      });
    }
  };

  const updateRuleValue = (ruleKey, value) => {
    const existing = ruleMap.get(ruleKey);
    if (existing) {
      base44.entities.Rule.update(existing.id, { value, enabled: true }).then((updated) => {
        setRules((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
      });
    } else {
      base44.entities.Rule.create({ rule_key: ruleKey, enabled: true, value }).then((created) => {
        setRules((rs) => [...rs, created]);
      });
    }
  };

  const saveFunded = () => {
    const data = {
      firm_name: fundedForm.firm_name,
      account_size: parseFloat(fundedForm.account_size) || 0,
      payout_target: parseFloat(fundedForm.payout_target) || 0,
      max_drawdown: parseFloat(fundedForm.max_drawdown) || 0,
      start_date: fundedForm.start_date,
      current_pnl: funded?.current_pnl || 0,
    };
    if (funded) {
      base44.entities.FundedAccount.update(funded.id, data).then((f) => setFunded(f));
    } else {
      base44.entities.FundedAccount.create(data).then((f) => setFunded(f));
    }
  };

  const saveRisk = () => {
    const data = {
      daily_loss_limit: parseFloat(riskForm.daily_loss_limit) || undefined,
      risk_per_trade: parseFloat(riskForm.risk_per_trade) || undefined,
      account_size: parseFloat(riskForm.account_size) || undefined,
      default_instrument: riskForm.default_instrument || "NQ",
    };
    if (settings) {
      base44.entities.UserSettings.update(settings.id, data).then((s) => setSettings(s));
    } else {
      base44.entities.UserSettings.create(data).then((s) => setSettings(s));
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-[#A0A0A0] mt-1">Set your rules, risk, and funded account.</p>
      </div>

      {/* Risk Settings */}
      <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-6 space-y-4">
        <h2 className="text-white font-bold">Risk Settings</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Daily Loss Limit ($)</label>
            <input type="number" value={riskForm.daily_loss_limit} onChange={(e) => setRiskForm({ ...riskForm, daily_loss_limit: e.target.value })} className={inputCls} placeholder="500" />
          </div>
          <div>
            <label className={labelCls}>Risk Per Trade (%)</label>
            <input type="number" step="0.1" value={riskForm.risk_per_trade} onChange={(e) => setRiskForm({ ...riskForm, risk_per_trade: e.target.value })} className={inputCls} placeholder="1" />
          </div>
          <div>
            <label className={labelCls}>Account Size ($)</label>
            <input type="number" value={riskForm.account_size} onChange={(e) => setRiskForm({ ...riskForm, account_size: e.target.value })} className={inputCls} placeholder="10000" />
          </div>
          <div>
            <label className={labelCls}>Default Instrument</label>
            <select value={riskForm.default_instrument} onChange={(e) => setRiskForm({ ...riskForm, default_instrument: e.target.value })} className={inputCls}>
              {INSTRUMENTS.map((i) => <option key={i}>{i}</option>)}
            </select>
          </div>
        </div>
        <button onClick={saveRisk} className="bg-[#D42A2A] hover:bg-[#b82424] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Save Risk Settings
        </button>
      </div>

      {/* Funded Account */}
      <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-6 space-y-4">
        <h2 className="text-white font-bold">Funded Account</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Firm Name</label>
            <input value={fundedForm.firm_name} onChange={(e) => setFundedForm({ ...fundedForm, firm_name: e.target.value })} className={inputCls} placeholder="Apex, Topstep..." />
          </div>
          <div>
            <label className={labelCls}>Account Size ($)</label>
            <input type="number" value={fundedForm.account_size} onChange={(e) => setFundedForm({ ...fundedForm, account_size: e.target.value })} className={inputCls} placeholder="50000" />
          </div>
          <div>
            <label className={labelCls}>Payout Target ($)</label>
            <input type="number" value={fundedForm.payout_target} onChange={(e) => setFundedForm({ ...fundedForm, payout_target: e.target.value })} className={inputCls} placeholder="3000" />
          </div>
          <div>
            <label className={labelCls}>Max Drawdown ($)</label>
            <input type="number" value={fundedForm.max_drawdown} onChange={(e) => setFundedForm({ ...fundedForm, max_drawdown: e.target.value })} className={inputCls} placeholder="2000" />
          </div>
          <div>
            <label className={labelCls}>Start Date</label>
            <input type="date" value={fundedForm.start_date} onChange={(e) => setFundedForm({ ...fundedForm, start_date: e.target.value })} className={inputCls} />
          </div>
        </div>
        <button onClick={saveFunded} className="bg-[#D42A2A] hover:bg-[#b82424] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          {funded ? "Update Funded Account" : "Set Up Funded Account"}
        </button>
      </div>

      {/* Trading Rules Tracker */}
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
    </div>
  );
}

function RuleRow({ rule, onToggle, onValueChange }) {
  const label = rule.label.replace("[X]", "").replace("[instrument]", "").trim();

  return (
    <div className="bg-[#0A0A0A] rounded-lg p-3 flex items-center gap-3">
      <button
        onClick={() => onToggle(rule.key, !rule.enabled)}
        className={`w-10 h-5 rounded-full relative shrink-0 transition-colors ${
          rule.enabled ? "bg-[#D42A2A]" : "bg-[#3A3A3A]"
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
            rule.enabled ? "left-[22px]" : "left-0.5"
          }`}
        />
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