import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Check } from "lucide-react";

const inputCls =
  "w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D42A2A] transition-colors";
const labelCls = "text-xs text-[#A0A0A0] mb-1.5 block font-medium";

export default function Settings() {
  const [rules, setRules] = useState([]);
  const [funded, setFunded] = useState(null);
  const [settings, setSettings] = useState(null);
  const [newRule, setNewRule] = useState("");
  const [fundedForm, setFundedForm] = useState({
    firm_name: "", account_size: "", payout_target: "", max_drawdown: "", start_date: new Date().toISOString().slice(0, 10),
  });
  const [riskForm, setRiskForm] = useState({ daily_loss_limit: "", risk_per_trade: "", account_size: "" });

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
      });
    }).catch(() => {});
  }, []);

  const addRule = () => {
    if (!newRule.trim()) return;
    base44.entities.Rule.create({ text: newRule.trim(), active: true }).then((r) => {
      setRules([...rules, r]);
      setNewRule("");
    });
  };
  const deleteRule = (id) => {
    base44.entities.Rule.delete(id).then(() => setRules(rules.filter((r) => r.id !== id)));
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
        <div className="grid grid-cols-3 gap-4">
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

      {/* Rules */}
      <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-6 space-y-4">
        <h2 className="text-white font-bold">Trading Rules</h2>
        <div className="flex gap-2">
          <input
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addRule()}
            className={inputCls}
            placeholder="Add a rule..."
          />
          <button onClick={addRule} className="bg-[#1A1A1A] hover:bg-[#222] text-white px-3 rounded-lg border border-[#1A1A1A]">
            <Plus size={18} />
          </button>
        </div>
        {rules.length === 0 ? (
          <p className="text-sm text-[#A0A0A0]">No rules yet. Add the rules you trade by.</p>
        ) : (
          <div className="space-y-2">
            {rules.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-[#0A0A0A] rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2 text-sm text-white">
                  <Check size={14} className="text-[#22C55E]" />
                  {r.text}
                </div>
                <button onClick={() => deleteRule(r.id)} className="text-[#A0A0A0] hover:text-[#EF4444]">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}