import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function ThreeCardRow({ trades }) {
  const [rules, setRules] = useState([]);
  const [funded, setFunded] = useState(null);

  useEffect(() => {
    base44.entities.Rule.list().then(setRules).catch(() => {});
    base44.entities.FundedAccount.list().then((f) => setFunded(f[0] || null)).catch(() => {});
  }, []);

  // Streaks: compute from trades (empty when no data)
  const journalStreak = 0;
  const validationStreak = 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Streaks */}
      <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-5">
        <h3 className="text-white font-bold mb-4">Streaks</h3>
        <div className="space-y-4 text-sm">
          <div>
            <div className="text-[#A0A0A0]">
              Journal Streak: <span className="text-white">{journalStreak} days</span>
            </div>
            <div className="text-xs text-[#A0A0A0] mt-0.5">Best: 0 days</div>
          </div>
          <div>
            <div className="text-[#A0A0A0]">
              Validation Streak: <span className="text-white">{validationStreak} trades</span>
            </div>
            <div className="text-xs text-[#A0A0A0] mt-0.5">Best: 0 trades</div>
          </div>
        </div>
      </div>

      {/* Rules Compliance */}
      <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-5">
        <h3 className="text-white font-bold mb-4">Rules Compliance</h3>
        {rules.length === 0 ? (
          <p className="text-sm text-[#A0A0A0]">Set up your rules in Settings to start tracking.</p>
        ) : (
          <p className="text-sm text-[#A0A0A0]">No compliance data yet.</p>
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