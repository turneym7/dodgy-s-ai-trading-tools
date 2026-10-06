import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

const inputCls =
  "w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D42A2A] transition-colors";
const labelCls = "text-xs text-[#A0A0A0] mb-1.5 block font-medium";

const FIRMS = [
  "Apex Trader Funding", "Tradeify", "Lucid Trading", "Alpha Futures",
  "FundedNext Futures", "Take Profit Trader", "Topstep", "Funded Futures Family",
];

export default function FundedAccountsSection() {
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    firm_name: "", account_size: "", account_type: "eval", current_pnl: "", start_date: new Date().toISOString().slice(0, 10),
  });

  const load = () => {
    base44.entities.FundedAccount.list().then(setAccounts).catch(() => {});
  };
  useEffect(load, []);

  const startEdit = (acc) => {
    setEditId(acc.id);
    setForm({
      firm_name: acc.firm_name || "",
      account_size: acc.account_size ? String(acc.account_size) : "",
      account_type: acc.account_type || "eval",
      current_pnl: acc.current_pnl != null ? String(acc.current_pnl) : "",
      start_date: acc.start_date || new Date().toISOString().slice(0, 10),
    });
    setShowForm(true);
  };

  const save = () => {
    const data = {
      firm_name: form.firm_name,
      account_size: parseFloat(form.account_size) || 0,
      account_type: form.account_type,
      current_pnl: parseFloat(form.current_pnl) || 0,
      start_date: form.start_date,
    };
    if (editId) {
      base44.entities.FundedAccount.update(editId, data).then(() => { load(); reset(); });
    } else {
      base44.entities.FundedAccount.create(data).then(() => { load(); reset(); });
    }
  };

  const remove = (id) => {
    base44.entities.FundedAccount.delete(id).then(() => setAccounts(accounts.filter((a) => a.id !== id)));
  };

  const reset = () => {
    setShowForm(false);
    setEditId(null);
    setForm({ firm_name: "", account_size: "", account_type: "eval", current_pnl: "", start_date: new Date().toISOString().slice(0, 10) });
  };

  return (
    <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold">Funded Accounts</h2>
        {accounts.length > 0 && (
          <button onClick={() => { setEditId(null); setShowForm(!showForm); }} className="flex items-center gap-1.5 text-sm text-[#D42A2A] hover:underline">
            <Plus size={16} /> Add account
          </button>
        )}
      </div>

      {accounts.length === 0 && !showForm ? (
        <div className="space-y-3">
          <p className="text-sm text-[#A0A0A0]">No funded accounts added yet.</p>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-[#D42A2A] hover:bg-[#b82424] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={16} /> Add Funded Account
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {accounts.map((acc) => (
              <div key={acc.id} className="bg-[#0A0A0A] rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">{acc.firm_name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${acc.account_type === "funded" ? "bg-[#22C55E]/10 text-[#22C55E]" : "bg-[#1A1A1A] text-[#A0A0A0]"}`}>
                        {acc.account_type || "eval"}
                      </span>
                    </div>
                    <div className="text-xs text-[#A0A0A0] mt-1">
                      ${acc.account_size?.toLocaleString() || 0} · P&L: <span className={(acc.current_pnl || 0) >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}>${(acc.current_pnl || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <button onClick={() => startEdit(acc)} className="text-xs text-[#A0A0A0] hover:text-white">Edit</button>
                    <button onClick={() => remove(acc.id)} className="text-[#A0A0A0] hover:text-[#EF4444]"><Trash2 size={15} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showForm && (
            <div className="space-y-3 pt-3 border-t border-[#1A1A1A]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Firm</label>
                  <select value={form.firm_name} onChange={(e) => setForm({ ...form, firm_name: e.target.value })} className={inputCls}>
                    <option value="">Select firm...</option>
                    {FIRMS.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Account Size ($)</label>
                  <input type="number" value={form.account_size} onChange={(e) => setForm({ ...form, account_size: e.target.value })} className={inputCls} placeholder="50000" />
                </div>
                <div>
                  <label className={labelCls}>Account Type</label>
                  <select value={form.account_type} onChange={(e) => setForm({ ...form, account_type: e.target.value })} className={inputCls}>
                    <option value="eval">Eval</option>
                    <option value="funded">Funded</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Current P&L ($)</label>
                  <input type="number" value={form.current_pnl} onChange={(e) => setForm({ ...form, current_pnl: e.target.value })} className={inputCls} placeholder="0" />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Start Date</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={save} disabled={!form.firm_name || !form.account_size} className="flex-1 bg-[#D42A2A] hover:bg-[#b82424] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-lg transition-colors">
                  {editId ? "Update" : "Add"} Account
                </button>
                <button onClick={reset} className="px-4 bg-[#1A1A1A] text-[#A0A0A0] hover:text-white text-sm py-2 rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}