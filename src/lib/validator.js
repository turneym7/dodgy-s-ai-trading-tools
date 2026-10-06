// 100-point scoring engine for trade setup validation.
// Setup Quality (40) + Risk Management (30) + Emotional/Behavioral (30).

export const SETUP_TYPES = ["IFVG", "Structure Break", "Liquidity Sweep", "V-Shape Recovery", "Other"];
export const CHECKLIST_ITEMS = [
  { key: "draw_on_liquidity", label: "Clear draw on liquidity" },
  { key: "structure_aligned", label: "Structure aligned with bias" },
  { key: "candle_close_confirmed", label: "Candle closure confirmed" },
  { key: "htf_bias_checked", label: "Higher timeframe bias checked" },
];

const GRADE_THRESHOLDS = [
  { min: 85, grade: "A+", color: "#22C55E", feedback: "Clean setup. Execute your plan." },
  { min: 70, grade: "A", color: "#22C55E", feedback: "Solid. The edge is there." },
  { min: 55, grade: "B", color: "#EAB308", feedback: "Something's off. Check what scored low." },
  { min: 40, grade: "C", color: "#F97316", feedback: "More wrong than right. Sit this one out." },
  { min: 0, grade: "F", color: "#EF4444", feedback: "No. Step away." },
];

const SETUP_TYPE_POINTS = {
  IFVG: 15,
  "V-Shape Recovery": 15,
  "Structure Break": 10,
  "Liquidity Sweep": 10,
  Other: 5,
};

// 0=Sun..6=Sat — weekend check used to mark sessions as "Closed" quality-wise.
function isWeekendET() {
  const etStr = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
  const et = new Date(etStr);
  return et.getDay() === 0 || et.getDay() === 6;
}

// Score setup quality (max 40).
function scoreSetup(form, checklist) {
  let pts = 0;
  pts += SETUP_TYPE_POINTS[form.setupType] || 0; // /15
  if (checklist.draw_on_liquidity) pts += 10;
  if (checklist.structure_aligned) pts += 10;
  if (checklist.candle_close_confirmed) pts += 5;
  return pts;
}

// Score risk management (max 30).
function scoreRisk(form, checklist, session) {
  let pts = 0;
  // R:R
  const entry = parseFloat(form.entry);
  const stop = parseFloat(form.stop);
  const target = parseFloat(form.target);
  if (entry && stop && target) {
    const risk = Math.abs(entry - stop);
    const reward = Math.abs(target - entry);
    const rr = risk > 0 ? reward / risk : 0;
    if (rr >= 2) pts += 15;
    else if (rr >= 1.5) pts += 10;
    else if (rr >= 1) pts += 5;
    else pts += 0;
  } else {
    pts += 10; // neutral default when optional fields skipped
  }
  // HTF bias
  if (checklist.htf_bias_checked) pts += 10;
  // Session timing (NY Open or Data Release for NQ/ES)
  const s = form.sessionOverride || session.name;
  if ((s === "NY Open" || s === "Data Release Window") && (form.instrument === "NQ" || form.instrument === "ES")) {
    pts += 5;
  }
  return pts;
}

// Score emotional/behavioral (max 30).
function scoreEmotional(form, tradesToday, inLoss) {
  let pts = 0;
  // Emotional state 1-5
  const emo = form.emotionalState;
  if (emo <= 2) pts += 15;
  else if (emo === 3) pts += 10;
  else if (emo === 4) pts += 5;
  else pts += 0;
  // Trades today
  const t = form.tradesTodayOverride != null ? form.tradesTodayOverride : tradesToday;
  if (t <= 1) pts += 10;
  else if (t === 2) pts += 7;
  else if (t === 3) pts += 3;
  else pts += 0;
  // Loss state
  const loss = form.inLossOverride != null ? form.inLossOverride : inLoss;
  if (!loss) pts += 5;
  else if (emo <= 2) pts += 3;
  else pts += 0;
  return pts;
}

// Full validation: returns { score, breakdown, grade, override, overrideReason, rr }
export function validateSetup(form, checklist, session, tradesToday, todayPnl, funded) {
  const setup = scoreSetup(form, checklist);
  const risk = scoreRisk(form, checklist, session);
  const emotional = scoreEmotional(form, tradesToday, todayPnl < 0);
  const score = setup + risk + emotional;

  // R:R for display + override
  let rr = null;
  const e = parseFloat(form.entry), s = parseFloat(form.stop), t = parseFloat(form.target);
  if (e && s && t) {
    const r = Math.abs(e - s);
    rr = r > 0 ? Math.abs(t - e) / r : 0;
  }

  // Overrides → force F
  let override = false;
  let overrideReason = "";
  const tradesTodayCount = form.tradesTodayOverride != null ? form.tradesTodayOverride : tradesToday;
  const inLoss = form.inLossOverride != null ? form.inLossOverride : todayPnl < 0;

  if (form.emotionalState === 5) {
    override = true;
    overrideReason = "You're trading your emotions, not your plan. Close the charts.";
  } else if (tradesTodayCount >= 4 && inLoss) {
    override = true;
    overrideReason = "You're revenge trading. Every trader who blows an account says 'just one more.' Stop.";
  } else if (rr != null && rr < 1) {
    override = true;
    overrideReason = "The math doesn't work. No setup is good enough to justify negative R:R.";
  }

  const gradeInfo = override
    ? GRADE_THRESHOLDS.find((g) => g.grade === "F")
    : GRADE_THRESHOLDS.find((g) => score >= g.min);

  const drawdownRemaining = funded ? (funded.max_drawdown || 0) - Math.abs(Math.min(0, funded.current_pnl || 0)) : null;

  return {
    score: override ? 0 : score,
    breakdown: { setup, risk, emotional },
    grade: gradeInfo.grade,
    gradeColor: gradeInfo.color,
    feedback: override ? overrideReason : gradeInfo.feedback,
    override,
    overrideReason,
    rr,
    drawdownRemaining,
  };
}