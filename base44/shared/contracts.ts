// Shared contract specs for backend functions (server-side mirror of src/lib/trading.js).
// Do not import src/ from functions — this is the server-side copy.

export const CONTRACTS = {
  NQ: { pointValue: 20 },
  ES: { pointValue: 50 },
  MNQ: { pointValue: 2 },
};

export function calcPnl(instrument, direction, entry, exit, contracts = 1) {
  const c = CONTRACTS[instrument];
  if (!c || entry == null || exit == null) return 0;
  const pts = direction === "long" ? exit - entry : entry - exit;
  return pts * c.pointValue * contracts;
}

export function calcPoints(direction, entry, exit) {
  if (entry == null || exit == null) return 0;
  return direction === "long" ? exit - entry : entry - exit;
}