// Futures contract specs and trading-session helpers for Dodgy's AI Trading Tools.

export const CONTRACTS = {
  NQ: { name: "NQ", pointValue: 20, tickValue: 5, ticksPerPoint: 4 },
  ES: { name: "ES", pointValue: 50, tickValue: 12.5, ticksPerPoint: 4 },
  MNQ: { name: "MNQ", pointValue: 2, tickValue: 0.5, ticksPerPoint: 4 },
};

// P&L in dollars for a single trade.
export function getPnl(instrument, direction, entry, exit, contracts = 1) {
  const c = CONTRACTS[instrument];
  if (!c || entry == null || exit == null) return 0;
  const points = direction === "long" ? exit - entry : entry - exit;
  return points * c.pointValue * contracts;
}

// Points moved (signed by direction).
export function getPoints(direction, entry, exit) {
  if (entry == null || exit == null) return 0;
  return direction === "long" ? exit - entry : entry - exit;
}

// Current Date object in America/New_York (ET).
export function getETDate() {
  const now = new Date();
  const etStr = now.toLocaleString("en-US", { timeZone: "America/New_York" });
  return new Date(etStr);
}

// Active trading session based on ET clock.
export function getTradingSession() {
  const et = getETDate();
  const minutes = et.getHours() * 60 + et.getMinutes();
  // Asia: 7:00 PM (1140) – 2:00 AM (120)
  if (minutes >= 1140 || minutes < 120) return { name: "Asia", active: true };
  // London: 3:00 AM (180) – 4:00 AM (240)
  if (minutes >= 180 && minutes < 240) return { name: "London", active: true };
  // Pre-Market: 4:00 AM (240) – 8:30 AM (510)
  if (minutes >= 240 && minutes < 510) return { name: "Pre-Market", active: true };
  // Data Release Window: 8:30 AM (510) – 9:30 AM (570)
  if (minutes >= 510 && minutes < 570) return { name: "Data Release Window", active: true };
  // NY Open: 9:30 AM (570) – 12:00 PM (720)
  if (minutes >= 570 && minutes < 720) return { name: "NY Open", active: true };
  // NY Afternoon: 12:00 PM (720) – 4:00 PM (960)
  if (minutes >= 720 && minutes < 960) return { name: "NY Afternoon", active: true };
  // After Hours: 4:00 PM (960) – 8:00 PM (1200)
  if (minutes >= 960 && minutes < 1200) return { name: "After Hours", active: true };
  return { name: "Closed", active: false };
}

// Monday of the current week (ET).
export function getWeekStart() {
  const et = getETDate();
  const day = et.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday as start
  const monday = new Date(et);
  monday.setDate(et.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export const DODGY_QUOTES = [
  "It doesn't start with the inversion. It starts with the draw on liquidity.",
  "If it's not a light bulb, skip it.",
  "One bad trade doesn't have to become three.",
  "Grade the setup before you take it. If it's not an A or A+, don't risk your live account.",
  "Know your daily loss limit before the session starts.",
  "If you hit your loss limit, you're done for the day. No exceptions.",
  "Journal every trade. Winners and losers.",
  "The strategy works. Trust the process. Back test, back test, back test.",
  "React, don't predict.",
  "Don't trade your P&L. Trade your plan.",
  "Stop targeting non-engineered liquidity.",
  "Win rate alone will not make you profitable. It's win rate PLUS R:R.",
  "Close-based stops. Not wick-based. Wait for the close.",
];