import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { evaluateAllRules } from "@/lib/rules";

export default function ThreeCardRow({ trades }) {
  const [rules, setRules] = useState([]);
  const [validations, setValidations] = useState([]);
  const [funded, setFunded] = useState(null);

  useEffect(() => {
    base44.entities.Rule.list().then(setRules).catch(() => {});
    base44.entities.ValidatedSetup.list("-validation_date", 200).then(setValidations).catch(() => {});
    base44.entities.FundedAccount.list().then((f) => setFunded(f[0] || null)).catch(() => {});
  }, [trades]);

  const compliance = evaluateAllRules(rules, trades, validations);
  const hasData = trades.length > 0 || validations.length > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Streaks */}
      <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-5">
        <h3 className="text-white font-bold mb-4">Streaks</h3>
        <div className="space-y-4 text-sm">
          <div>
            <div className="text-[#A0A0A0]">
              Journal Streak: <span className="text-white">{trades.length > 0 ? "—" : "0 days"}</span>
            </div>
            <div className="text-xs text-[#A0A0A0] mt-0.5">Best: 0 days</div>
          </div>
          <div>
            <div className="text-[#A0A0A0]">
              Validation Streak: <span className="text-white">{validations.length > 0 ? "—" : "0 trades"}</span>
            </div>
            <div className="text-xs text-[#A0A0A0] mt-0.5">Best: 0 trades</div>
          </div>
        </div>
      </div>

      {/* Rules Compliance */}
      <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-5">
        <h3 className="text-white font-bold mb-4">Rules Compliance</h3>
        {compliance.total === 0 ? (
          <p className="text-sm text-[#A0A0A0]">Set up your rules in Settings to start tracking.</p>
        ) : !hasData ? (
          <p className="text-sm text-[#A0A0A0]">No compliance data yet.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{compliance.compliant}</span>
              <span className="text-sm text-[#A0A0A0]">/ {compliance.total} rules followed</span>
            </div>
            {compliance.violations.length > 0 ? (
              <div className="space-y-1.5">
                {compliance.violations.slice(0, 3).map((v) => (
                  <div key={v.rule.id || v.rule.key} className="flex items-center gap-2 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] shrink-0" />
                    <span className="text-[#A0A0A0] truncate">{v.rule.label.replace("[X]", v.rule.value || "").replace("[instrument]", v.rule.value || "")}</span>
                    <span className="text-[#EF4444] ml-auto">{v.detail}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] shrink-0" />
                <span className="text-[#22C55E]">All rules followed</span>
              </div>
            )}
            <Link to="/settings" className="text-xs text-[#D42A2A] hover:underline font-medium">
              Manage rules →
            </Link>
          </div>
        )}
      </div>

      {/* Funded Account */}
      <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-5">
        <h3 className="text-white font-bold mb-4">Funded Account</h3>
        {funded ? (
          <div className="space-y-3 text-sm">
            <div className="text-white font-medium">{funded.firm_name}</div>
            <div className="text-[#A0A0A0]">Account: ${funded.account_size.toLocaleString()}</div>
            <div>
              <div className="flex justify-between text-xs text-[#A0A0A0] mb-1">
                <span>P&amp;L Progress</span>
                <span>${(funded.current_pnl || 0).toLocaleString()} / ${(funded.payout_target || 0).toLocaleString()}</span>
              </div>
              <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#22C55E] rounded-full"
                  style={{
                    width: `${Math.min(100, ((funded.current_pnl || 0) / (funded.payout_target || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-[#A0A0A0] mb-1">
                <span>Drawdown Remaining</span>
                <span>${(funded.max_drawdown || 0).toLocaleString()}</span>
              </div>
              <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
                <div className="h-full bg-[#D42A2A] rounded-full" style={{ width: "100%" }} />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-[#A0A0A0] mb-3">
              Track drawdown and progress toward your payout target.
            </p>
            <Link to="/settings" className="text-xs text-[#D42A2A] hover:underline font-medium">
              Set up your funded account →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}