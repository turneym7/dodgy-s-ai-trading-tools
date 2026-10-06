// Trading rules compliance engine — mirror only, no coaching or lockouts.
// Each rule evaluates against journal trades + validation history.

export const RULE_DEFINITIONS = [
  { key: "max_trades_per_day", label: "Maximum [X] trades per day", default: "2", type: "number" },
  { key: "only_a_plus_setups", label: "Only take A or A+ validated setups", default: null, type: "toggle" },
  { key: "only_ny_open_or_data_release", label: "Only trade during NY Open (9:30-12:00) or Data Release (8:30)", default: null, type: "toggle" },
  { key: "stop_after_daily_loss", label: "Stop trading after hitting daily loss limit", default: null, type: "toggle" },
  { key: "validate_every_trade", label: "Validate every trade before entry", default: null, type: "toggle" },
  { key: "journal_every_trade", label: "Journal every trade", default: null, type: "toggle" },
  { key: "no_emotional_trading", label: "Don't trade when emotional state is 4+", default: null, type: "toggle" },
  { key: "min_risk_reward", label: "Minimum [X]:1 risk/reward", default: "2", type: "number" },
  { key: "only_instrument", label: "Only trade [instrument]", default: "NQ", type: "instrument" },
  { key: "no_trading_after_losses", label: "No trading after [X] consecutive losses", default: "1", type: "number" },
  { key: "only_engineered_liquidity", label: "Only target engineered liquidity", default: null, type: "toggle" },
  { key: "close_based_stops", label: "Use close-based stops, not wick-based", default: null, type: "toggle" },
  { key: "move_to_break_even", label: "Move to break-even at first internal level", default: null, type: "toggle" },
  { key: "no_reentry_after_be_stop", label: "Don't re-enter after break-even stop", default: null, type: "toggle" },
  { key: "only_light_bulb_live", label: "Only trade light bulb setups on live account", default: null, type: "toggle" },
];

// Get ET-day boundaries for filtering "today's" trades.
function getETDayRange() {
  const now = new Date();
  const etStr = now.toLocaleString("en-US", { timeZone: "America/New_York", year: "numeric", month: "numeric", day: "numeric" });
  const [m, d, y] = etStr.split("/").map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0);
  const end = new Date(y, m - 1, d, 23, 59, 59);
  return { start, end };
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const { start, end } = getETDayRange();
  const t = new Date(dateStr);
  return t >= start && t <= end;
}

function getTodayTrades(trades) {
  return (trades || []).filter((t) => isToday(t.trade_date));
}

function getTodayValidations(validations) {
  return (validations || []).filter((v) => isToday(v.validation_date));
}

function getConsecutiveLosses(trades) {
  const sorted = [...trades].sort((a, b) => new Date(b.trade_date) - new Date(a.trade_date));
  let count = 0;
  for (const t of sorted) {
    if ((t.pnl || 0) < 0) count++;
    else break;
  }
  return count;
}

// Evaluate a single rule. Returns { compliant: boolean, detail: string }.
// compliant=true means rule IS being followed; compliant=false means a violation exists.
export function evaluateRule(rule, trades, validations) {
  if (!rule.enabled) return { compliant: true, detail: "Disabled", neutral: true };
  const todayTrades = getTodayTrades(trades);
  const todayValidations = getTodayValidations(validations);
  const val = rule.value;

  switch (rule.rule_key) {
    case "max_trades_per_day": {
      const max = parseInt(val) || 2;
      const ok = todayTrades.length <= max;
      return { compliant: ok, detail: `${todayTrades.length}/${max} today` };
    }
    case "only_a_plus_setups": {
      const bad = todayValidations.filter((v) => v.grade && !["A+", "A"].includes(v.grade));
      return { compliant: bad.length === 0, detail: bad.length ? `${bad.length} sub-A grades` : "All A/A+" };
    }
    case "only_ny_open_or_data_release": {
      const bad = todayTrades.filter((t) => {
        const s = t.session || "";
        return s !== "NY Open" && s !== "Data Release Window";
      });
      return { compliant: bad.length === 0, detail: bad.length ? `${bad.length} off-session` : "On session" };
    }
    case "stop_after_daily_loss": {
      const todayPnl = todayTrades.reduce((s, t) => s + (t.pnl || 0), 0);
      // Compliant if NOT in loss, OR in loss but stopped (no trades after crossing limit).
      // We can't know the exact crossing time easily, so: if todayPnl is negative AND there are trades, check if last trade was a loss.
      if (todayPnl >= 0) return { compliant: true, detail: "No loss hit" };
      const stillTrading = todayTrades.length > 1;
      return { compliant: !stillTrading, detail: stillTrading ? "Traded past limit" : "Stopped" };
    }
    case "validate_every_trade": {
      const ratio = todayTrades.length > 0 ? todayValidations.length / todayTrades.length : 1;
      return { compliant: ratio >= 1, detail: `${todayValidations.length}/${todayTrades.length} validated` };
    }
    case "journal_every_trade": {
      // Every validation should have a corresponding trade (best-effort check by count).
      const unlogged = Math.max(0, todayValidations.length - todayTrades.length);
      return { compliant: unlogged === 0, detail: unlogged ? `${unlogged} unlogged` : "All logged" };
    }
    case "no_emotional_trading": {
      const bad = todayValidations.filter((v) => (v.emotional_state || 0) >= 4);
      return { compliant: bad.length === 0, detail: bad.length ? `${bad.length} emotional` : "Calm" };
    }
    case "min_risk_reward": {
      const min = parseFloat(val) || 2;
      const bad = todayValidations.filter((v) => v.rr_ratio != null && v.rr_ratio < min);
      return { compliant: bad.length === 0, detail: bad.length ? `${bad.length} below ${min}:1` : `≥ ${min}:1` };
    }
    case "only_instrument": {
      const bad = todayTrades.filter((t) => t.instrument !== val);
      return { compliant: bad.length === 0, detail: bad.length ? `${bad.length} off-instrument` : `Only ${val}` };
    }
    case "no_trading_after_losses": {
      const max = parseInt(val) || 1;
      const losses = getConsecutiveLosses(trades);
      const ok = losses < max;
      return { compliant: ok, detail: `${losses} consec losses` };
    }
    case "only_engineered_liquidity": {
      const bad = todayValidations.filter((v) => !(v.checklist?.draw_on_liquidity));
      return { compliant: bad.length === 0, detail: bad.length ? `${bad.length} no draw` : "All engineered" };
    }
    case "close_based_stops":
    case "move_to_break_even":
    case "no_reentry_after_be_stop":
    case "only_light_bulb_live": {
      // These are qualitative — we mark neutral unless we can infer from data.
      const lightBulb = todayValidations.some((v) => v.is_light_bulb);
      if (rule.rule_key === "only_light_bulb_live") {
        const bad = todayValidations.filter((v) => !v.is_light_bulb);
        return { compliant: bad.length === 0, detail: bad.length ? `${bad.length} non-bulb` : "All light bulb" };
      }
      return { compliant: true, detail: "Manual check", neutral: true };
    }
    default:
      return { compliant: true, detail: "—", neutral: true };
  }
}

// Evaluate all enabled rules → summary for dashboard card.
export function evaluateAllRules(rules, trades, validations) {
  const enabled = (rules || []).filter((r) => r.enabled);
  if (enabled.length === 0) return { total: 0, compliant: 0, violations: [], hasData: false };
  const results = enabled.map((r) => ({ rule: r, ...evaluateRule(r, trades, validations) }));
  const violations = results.filter((r) => !r.compliant && !r.neutral);
  return {
    total: enabled.length,
    compliant: enabled.length - violations.length,
    violations,
    hasData: true,
  };
}