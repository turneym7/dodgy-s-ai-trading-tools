import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

function getETDate() {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
}

function isSameETDay(dateStr, etDate) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const dEt = new Date(d.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  return dEt.getFullYear() === etDate.getFullYear() &&
    dEt.getMonth() === etDate.getMonth() &&
    dEt.getDate() === etDate.getDate();
}

function isSameETWeek(dateStr, weekStart) {
  if (!dateStr) return false;
  const d = new Date(new Date(dateStr).toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  return d >= weekStart && d < weekEnd;
}

function isSameETMonth(dateStr, etDate) {
  if (!dateStr) return false;
  const d = new Date(new Date(dateStr).toLocaleString('en-US', { timeZone: 'America/New_York' }));
  return d.getFullYear() === etDate.getFullYear() && d.getMonth() === etDate.getMonth();
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const trades = await base44.entities.Trade.list('-trade_date', 500);
    const et = getETDate();

    // Week start (Monday)
    const day = et.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const weekStart = new Date(et);
    weekStart.setDate(et.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);

    const totalTrades = trades.length;
    const winners = trades.filter((t) => (t.pnl || 0) > 0);
    const losers = trades.filter((t) => (t.pnl || 0) < 0);
    const winRate = totalTrades > 0 ? Math.round((winners.length / totalTrades) * 100) : 0;
    const totalPnl = trades.reduce((s, t) => s + (t.pnl || 0), 0);

    // Current streak: consecutive green days (most recent first)
    const dayMap = {};
    trades.forEach((t) => {
      if (!t.trade_date) return;
      const key = new Date(t.trade_date).toLocaleDateString('en-US', { timeZone: 'America/New_York' });
      if (!dayMap[key]) dayMap[key] = 0;
      dayMap[key] += t.pnl || 0;
    });
    const sortedDays = Object.entries(dayMap).sort((a, b) => new Date(b[0]) - new Date(a[0]));
    let currentStreak = 0;
    for (const [, pnl] of sortedDays) {
      if (pnl > 0) currentStreak++;
      else break;
    }

    const tradesToday = trades.filter((t) => isSameETDay(t.trade_date, et)).length;
    const tradesThisWeek = trades.filter((t) => isSameETWeek(t.trade_date, weekStart)).length;
    const tradesThisMonth = trades.filter((t) => isSameETMonth(t.trade_date, et)).length;

    const last5Trades = trades.slice(0, 5).map((t) => ({
      id: t.id,
      instrument: t.instrument,
      direction: t.direction,
      pnl: t.pnl || 0,
      grade: t.grade,
      validated: t.validated,
      trade_date: t.trade_date,
    }));

    const validatedCount = trades.filter((t) => t.validated).length;
    const validationRate = totalTrades > 0 ? Math.round((validatedCount / totalTrades) * 100) : 0;

    const emoWinners = winners.filter((t) => t.emotional_state != null).map((t) => t.emotional_state);
    const emoLosers = losers.filter((t) => t.emotional_state != null).map((t) => t.emotional_state);
    const avgEmotionalWinners = emoWinners.length > 0
      ? Math.round((emoWinners.reduce((s, e) => s + e, 0) / emoWinners.length) * 10) / 10
      : null;
    const avgEmotionalLosers = emoLosers.length > 0
      ? Math.round((emoLosers.reduce((s, e) => s + e, 0) / emoLosers.length) * 10) / 10
      : null;

    return Response.json({
      total_trades: totalTrades,
      win_rate: winRate,
      total_pnl: Math.round(totalPnl * 100) / 100,
      current_streak: currentStreak,
      trades_today: tradesToday,
      trades_this_week: tradesThisWeek,
      trades_this_month: tradesThisMonth,
      last_5_trades: last5Trades,
      validation_rate: validationRate,
      avg_emotional_winners: avgEmotionalWinners,
      avg_emotional_losers: avgEmotionalLosers,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}