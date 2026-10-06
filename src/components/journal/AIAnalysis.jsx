import React, { useMemo } from "react";
import { analyzeTrades } from "@/lib/journal-analytics";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function AIAnalysis({ trades }) {
  const a = useMemo(() => analyzeTrades(trades), [trades]);

  if (trades.length < 5) {
    return (
      <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-12 text-center">
        <p className="text-sm text-[#A0A0A0]">
          Log at least 5 trades to unlock AI analysis. The more data you add, the smarter the insights get.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Your Patterns */}
      <div className="bg-[#141414] border border-[#1A1A1A] border-l-2 border-l-[#D42A2A] rounded-xl p-5">
        <h2 className="text-white font-bold mb-1">Your Patterns</h2>
        <p className="text-xs text-[#A0A0A0] mb-4">Based on {a.total} trades</p>
        <div className="space-y-4">
          <PatternTable title="By Setup Type" data={a.bySetupType} />
          <PatternTable title="By Session" data={a.bySession} />
          <PatternTable title="By Day of Week" data={a.byDayOfWeek} />
          <PatternTable title="By Emotional State" data={a.byEmotionalState} />
          <PatternTable title="By Trade Count" data={a.byTradeNumber} />
          <PatternTable title="By Grade" data={a.byGrade} />
          <PatternTable title="Validated vs Unvalidated" data={a.byValidation} />
          <PatternTable title="Light Bulb vs Non" data={a.byLightBulb} />
          <PatternTable title="Followed Plan vs Didn't" data={a.byPlan} />
        </div>
      </div>

      {/* Rule Violations */}
      <div className="bg-[#141414] border border-[#1A1A1A] border-l-2 border-l-[#D42A2A] rounded-xl p-5">
        <h2 className="text-white font-bold mb-1">Rule Violations</h2>
        <p className="text-xs text-[#A0A0A0] mb-4">Based on {a.total} trades</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ViolationRow label="Trades not validated" count={a.violations.notValidated} pct={a.violationsPct.notValidated} />
          <ViolationRow label="Trades at emotional state 4+" count={a.violations.emotional4Plus} pct={a.violationsPct.emotional4Plus} />
          <ViolationRow label="Trades on C or F setups" count={a.violations.gradeCF} pct={a.violationsPct.gradeCF} />
          <ViolationRow label="Trades where plan wasn't followed" count={a.violations.planNotFollowed} pct={a.violationsPct.planNotFollowed} />
        </div>
      </div>

      {/* Best / Worst */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#141414] border border-[#1A1A1A] border-l-2 border-l-[#D42A2A] rounded-xl p-5">
          <h2 className="text-white font-bold mb-1">Best Performing</h2>
          <p className="text-xs text-[#A0A0A0] mb-4">Based on {a.total} trades</p>
          <div className="space-y-3 text-sm">
            <PerfRow label="Setup type" data={a.bestSetup} />
            <PerfRow label="Session" data={a.bestSession} />
            <PerfRow label="Day of week" data={a.bestDay} />
          </div>
        </div>
        <div className="bg-[#141414] border border-[#1A1A1A] border-l-2 border-l-[#D42A2A] rounded-xl p-5">
          <h2 className="text-white font-bold mb-1">Worst Performing</h2>
          <p className="text-xs text-[#A0A0A0] mb-4">Based on {a.total} trades</p>
          <div className="space-y-3 text-sm">
            <PerfRow label="Setup type" data={a.worstSetup} />
            <PerfRow label="Session" data={a.worstSession} />
            <PerfRow label="Day of week" data={a.worstDay} />
          </div>
        </div>
      </div>

      {/* Consistency Score */}
      <div className="bg-[#141414] border border-[#1A1A1A] border-l-2 border-l-[#D42A2A] rounded-xl p-5">
        <h2 className="text-white font-bold mb-1">Consistency Score</h2>
        <p className="text-xs text-[#A0A0A0] mb-4">Based on {a.total} trades</p>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-bold text-white">{a.consistencyScore}</span>
          <span className="text-sm text-[#A0A0A0]">/ 100</span>
        </div>
        <div className="space-y-2 mb-5 text-sm">
          <ScoreComponent label="% trades validated" pct={a.total > 0 ? a.violations.notValidated < a.total ? Math.round(((a.total - a.violations.notValidated) / a.total) * 100) : 0 : 0} points={25} />
          <ScoreComponent label="% trades plan followed" pct={a.total > 0 ? Math.round(((a.total - a.violations.planNotFollowed) / a.total) * 100) : 0} points={25} />
          <ScoreComponent label="% trades emotional state 1-3" pct={a.total > 0 ? Math.round(((a.total - a.violations.emotional4Plus) / a.total) * 100) : 0} points={25} />
          <ScoreComponent label="Journal completion rate" pct={a.total > 0 ? Math.round((trades.filter((t) => t.notes || t.screenshot_uri).length / a.total) * 100) : 0} points={25} />
        </div>
        {a.weeklyScores.length >= 2 ? (
          <div>
            <div className="text-xs text-[#A0A0A0] mb-2">Weekly scores over time</div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={a.weeklyScores}>
                  <CartesianGrid stroke="#1A1A1A" strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fill: "#A0A0A0", fontSize: 11 }} tickFormatter={(w) => new Date(w).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#A0A0A0", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#141414", border: "1px solid #1A1A1A", borderRadius: "8px", fontSize: "12px" }}
                    labelStyle={{ color: "#A0A0A0" }}
                    formatter={(v) => [`${v}/100`, "Score"]}
                    labelFormatter={(w) => new Date(w).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  />
                  <Line type="monotone" dataKey="score" stroke="#D42A2A" strokeWidth={2} dot={{ fill: "#D42A2A", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#A0A0A0]">Not enough weekly data for a trend chart.</p>
        )}
      </div>

      {/* Weekly Summary */}
      {a.weeklySummary.hasData ? (
        <div className="bg-[#141414] border border-[#1A1A1A] border-l-2 border-l-[#D42A2A] rounded-xl p-5">
          <h2 className="text-white font-bold mb-1">Weekly Summary</h2>
          <p className="text-xs text-[#A0A0A0] mb-4">Based on {a.weeklySummary.trades} trades this week</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <SummaryStat label="Total trades" value={a.weeklySummary.trades} />
            <SummaryStat label="Win rate" value={`${a.weeklySummary.winRate}%`} />
            <SummaryStat label="Total P&L" value={`$${a.weeklySummary.pnl >= 0 ? "+" : ""}${a.weeklySummary.pnl.toFixed(0)}`} color={a.weeklySummary.pnl >= 0 ? "#22C55E" : "#EF4444"} />
            <SummaryStat label="Avg R:R" value={a.weeklySummary.avgRr != null ? `${a.weeklySummary.avgRr.toFixed(2)}:1` : "—"} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <div className="bg-[#0A0A0A] rounded-lg p-3">
              <div className="text-xs text-[#A0A0A0] mb-1">Biggest winner</div>
              <div className="text-sm text-[#22C55E] font-medium">
                {a.weeklySummary.biggestWinner ? `+${(a.weeklySummary.biggestWinner.pnl || 0).toFixed(2)}` : "—"}
                {a.weeklySummary.biggestWinner && <span className="text-[#A0A0A0] text-xs ml-2">{a.weeklySummary.biggestWinner.instrument} {a.weeklySummary.biggestWinner.direction?.toUpperCase()}</span>}
              </div>
            </div>
            <div className="bg-[#0A0A0A] rounded-lg p-3">
              <div className="text-xs text-[#A0A0A0] mb-1">Biggest loser</div>
              <div className="text-sm text-[#EF4444] font-medium">
                {a.weeklySummary.biggestLoser ? `${(a.weeklySummary.biggestLoser.pnl || 0).toFixed(2)}` : "—"}
                {a.weeklySummary.biggestLoser && <span className="text-[#A0A0A0] text-xs ml-2">{a.weeklySummary.biggestLoser.instrument} {a.weeklySummary.biggestLoser.direction?.toUpperCase()}</span>}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <SummaryStat label="Consistency" value={`${a.weeklySummary.consistencyScore}/100`} />
            <SummaryStat label="Prev week P&L" value={`$${a.weeklySummary.prevWeekPnl >= 0 ? "+" : ""}${a.weeklySummary.prevWeekPnl.toFixed(0)}`} color={a.weeklySummary.prevWeekPnl >= 0 ? "#22C55E" : "#EF4444"} />
            <SummaryStat label="Prev week WR" value={a.weeklySummary.prevWeekTrades > 0 ? `${a.weeklySummary.prevWeekWinRate}%` : "—"} />
          </div>
          {a.weeklySummary.feedback.length > 0 && (
            <div className="border-t border-[#1A1A1A] pt-4 space-y-2">
              {a.weeklySummary.feedback.map((f, i) => (
                <p key={i} className="text-sm text-white">{f}</p>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#141414] border border-[#1A1A1A] border-l-2 border-l-[#D42A2A] rounded-xl p-5">
          <h2 className="text-white font-bold mb-1">Weekly Summary</h2>
          <p className="text-sm text-[#A0A0A0]">No trades this week yet.</p>
        </div>
      )}
    </div>
  );
}

function PatternTable({ title, data }) {
  return (
    <div>
      <div className="text-sm text-white font-medium mb-2">{title}</div>
      {data.length === 0 ? (
        <p className="text-xs text-[#A0A0A0]">Not enough data</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#A0A0A0] text-xs border-b border-[#1A1A1A]">
                <th className="text-left font-medium py-1.5 pr-3">{title.replace("By ", "")}</th>
                <th className="text-right font-medium py-1.5 px-2">Trades</th>
                <th className="text-right font-medium py-1.5 px-2">Wins</th>
                <th className="text-right font-medium py-1.5 px-2">Losses</th>
                <th className="text-right font-medium py-1.5 pl-2">Win rate</th>
              </tr>
            </thead>
            <tbody>
              {data.map((g) => (
                <tr key={g.key} className="border-b border-[#1A1A1A] last:border-0">
                  <td className="py-1.5 pr-3 text-white">{g.key}</td>
                  <td className="py-1.5 px-2 text-right text-[#A0A0A0]">{g.trades}</td>
                  <td className="py-1.5 px-2 text-right text-[#22C55E]">{g.wins}</td>
                  <td className="py-1.5 px-2 text-right text-[#EF4444]">{g.losses}</td>
                  <td className="py-1.5 pl-2 text-right text-white font-medium">{g.winRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ViolationRow({ label, count, pct }) {
  return (
    <div className="flex items-center justify-between bg-[#0A0A0A] rounded-lg px-3 py-2.5">
      <span className="text-sm text-[#A0A0A0]">{label}</span>
      <span className="text-sm text-white font-medium">{count} <span className="text-[#A0A0A0] text-xs">({pct}%)</span></span>
    </div>
  );
}

function PerfRow({ label, data }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#A0A0A0]">{label}</span>
      {data ? (
        <span className="text-white font-medium">
          {data.key} <span className="text-[#A0A0A0] text-xs ml-1">{data.winRate}% WR</span>
        </span>
      ) : (
        <span className="text-[#A0A0A0] text-xs">Not enough data</span>
      )}
    </div>
  );
}

function ScoreComponent({ label, pct, points }) {
  const earned = Math.round((pct / 100) * points);
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#A0A0A0]">{label}</span>
      <span className="text-white">{earned}/{points} <span className="text-[#A0A0A0] text-xs">({pct}%)</span></span>
    </div>
  );
}

function SummaryStat({ label, value, color }) {
  return (
    <div className="bg-[#0A0A0A] rounded-lg p-3">
      <div className="text-xs text-[#A0A0A0] mb-1">{label}</div>
      <div className="text-sm font-medium" style={{ color: color || "#ffffff" }}>{value}</div>
    </div>
  );
}