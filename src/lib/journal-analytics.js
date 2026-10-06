// Trading journal analytics — win-rate breakdowns, rule violations, consistency score.
// Minimum 5 data points per pattern. Never fabricates data.

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function isWin(t) {
  return (t.pnl || 0) > 0;
}

function etDayOfWeek(dateStr) {
  if (!dateStr) return null;
  const etStr = new Date(dateStr).toLocaleString("en-US", { timeZone: "America/New_York", weekday: "short" });
  const map = { Sun: "Sunday", Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday" };
  return map[etStr] || null;
}

function etWeekKey(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

// Group trades by a key function and compute win rate stats.
function groupStats(trades, keyFn) {
  const groups = {};
  trades.forEach((t) => {
    const key = keyFn(t);
    if (key == null || key === "") return;
    if (!groups[key]) groups[key] = { key, trades: 0, wins: 0, losses: 0, pnl: 0 };
    groups[key].trades++;
    if (isWin(t)) groups[key].wins++;
    else if ((t.pnl || 0) < 0) groups[key].losses++;
    groups[key].pnl += t.pnl || 0;
  });
  return Object.values(groups).map((g) => ({
    ...g,
    winRate: g.trades > 0 ? Math.round((g.wins / g.trades) * 100) : 0,
    avgPnl: g.trades > 0 ? g.pnl / g.trades : 0,
  }));
}

export function analyzeTrades(trades) {
  const all = trades || [];
  const total = all.length;

  // ---- Your Patterns ----
  const bySetupType = groupStats(all, (t) => t.setup_type).filter((g) => g.trades >= 5);
  const bySession = groupStats(all, (t) => t.session).filter((g) => g.trades >= 5);
  const byDayOfWeek = groupStats(all, etDayOfWeek).filter((g) => g.trades >= 5);

  // By emotional state buckets: 1-2, 3, 4-5
  const emoBuckets = { "1-2": { key: "1-2", trades: 0, wins: 0, losses: 0 }, "3": { key: "3", trades: 0, wins: 0, losses: 0 }, "4-5": { key: "4-5", trades: 0, wins: 0, losses: 0 } };
  all.forEach((t) => {
    const e = t.emotional_state;
    if (e == null) return;
    const bucket = e <= 2 ? "1-2" : e === 3 ? "3" : "4-5";
    emoBuckets[bucket].trades++;
    if (isWin(t)) emoBuckets[bucket].wins++;
    else if ((t.pnl || 0) < 0) emoBuckets[bucket].losses++;
  });
  const byEmotionalState = Object.values(emoBuckets).filter((g) => g.trades >= 5).map((g) => ({ ...g, winRate: g.trades > 0 ? Math.round((g.wins / g.trades) * 100) : 0 }));

  // By trade count per day — does performance drop after trade #2?
  const dayGroups = {};
  all.forEach((t) => {
    if (!t.trade_date) return;
    const dayKey = new Date(t.trade_date).toLocaleDateString("en-US", { timeZone: "America/New_York" });
    if (!dayGroups[dayKey]) dayGroups[dayKey] = [];
    dayGroups[dayKey].push(t);
  });
  const tradeNumberBuckets = { "1-2": { key: "Trades 1-2", trades: 0, wins: 0, losses: 0 }, "3+": { key: "Trade 3+", trades: 0, wins: 0, losses: 0 } };
  Object.values(dayGroups).forEach((dayTrades) => {
    const sorted = dayTrades.sort((a, b) => new Date(a.trade_date) - new Date(b.trade_date));
    sorted.forEach((t, idx) => {
      if (idx < 2) {
        tradeNumberBuckets["1-2"].trades++;
        if (isWin(t)) tradeNumberBuckets["1-2"].wins++;
        else if ((t.pnl || 0) < 0) tradeNumberBuckets["1-2"].losses++;
      } else {
        tradeNumberBuckets["3+"].trades++;
        if (isWin(t)) tradeNumberBuckets["3+"].wins++;
        else if ((t.pnl || 0) < 0) tradeNumberBuckets["3+"].losses++;
      }
    });
  });
  const byTradeNumber = Object.values(tradeNumberBuckets).filter((g) => g.trades >= 5).map((g) => ({ ...g, winRate: g.trades > 0 ? Math.round((g.wins / g.trades) * 100) : 0 }));

  // By grade buckets: A+, A, B, C/F
  const gradeBuckets = { "A+": { key: "A+", trades: 0, wins: 0, losses: 0 }, "A": { key: "A", trades: 0, wins: 0, losses: 0 }, "B": { key: "B", trades: 0, wins: 0, losses: 0 }, "C/F": { key: "C/F", trades: 0, wins: 0, losses: 0 } };
  all.forEach((t) => {
    const g = t.grade;
    if (!g) return;
    const bucket = g === "A+" ? "A+" : g === "A" ? "A" : g === "B" ? "B" : "C/F";
    gradeBuckets[bucket].trades++;
    if (isWin(t)) gradeBuckets[bucket].wins++;
    else if ((t.pnl || 0) < 0) gradeBuckets[bucket].losses++;
  });
  const byGrade = Object.values(gradeBuckets).filter((g) => g.trades >= 5).map((g) => ({ ...g, winRate: g.trades > 0 ? Math.round((g.wins / g.trades) * 100) : 0 }));

  // Validated vs unvalidated
  const validatedStats = { validated: { key: "Validated", trades: 0, wins: 0, losses: 0 }, unvalidated: { key: "Unvalidated", trades: 0, wins: 0, losses: 0 } };
  all.forEach((t) => {
    const bucket = t.validated ? "validated" : "unvalidated";
    validatedStats[bucket].trades++;
    if (isWin(t)) validatedStats[bucket].wins++;
    else if ((t.pnl || 0) < 0) validatedStats[bucket].losses++;
  });
  const byValidation = Object.values(validatedStats).filter((g) => g.trades >= 5).map((g) => ({ ...g, winRate: g.trades > 0 ? Math.round((g.wins / g.trades) * 100) : 0 }));

  // Light bulb vs non
  const bulbStats = { lightBulb: { key: "Light bulb", trades: 0, wins: 0, losses: 0 }, nonBulb: { key: "Non-light bulb", trades: 0, wins: 0, losses: 0 } };
  all.forEach((t) => {
    const bucket = t.is_light_bulb ? "lightBulb" : "nonBulb";
    bulbStats[bucket].trades++;
    if (isWin(t)) bulbStats[bucket].wins++;
    else if ((t.pnl || 0) < 0) bulbStats[bucket].losses++;
  });
  const byLightBulb = Object.values(bulbStats).filter((g) => g.trades >= 5).map((g) => ({ ...g, winRate: g.trades > 0 ? Math.round((g.wins / g.trades) * 100) : 0 }));

  // Followed plan vs didn't
  const planStats = { followed: { key: "Followed plan", trades: 0, wins: 0, losses: 0 }, notFollowed: { key: "Didn't follow", trades: 0, wins: 0, losses: 0 } };
  all.forEach((t) => {
    const bucket = t.followed_plan ? "followed" : "notFollowed";
    planStats[bucket].trades++;
    if (isWin(t)) planStats[bucket].wins++;
    else if ((t.pnl || 0) < 0) planStats[bucket].losses++;
  });
  const byPlan = Object.values(planStats).filter((g) => g.trades >= 5).map((g) => ({ ...g, winRate: g.trades > 0 ? Math.round((g.wins / g.trades) * 100) : 0 }));

  // ---- Rule Violations ----
  const violations = {
    notValidated: all.filter((t) => !t.validated).length,
    emotional4Plus: all.filter((t) => (t.emotional_state || 0) >= 4).length,
    gradeCF: all.filter((t) => t.grade === "C" || t.grade === "D").length,
    planNotFollowed: all.filter((t) => t.followed_plan === false).length,
  };
  const violationsPct = {
    notValidated: total > 0 ? Math.round((violations.notValidated / total) * 100) : 0,
    emotional4Plus: total > 0 ? Math.round((violations.emotional4Plus / total) * 100) : 0,
    gradeCF: total > 0 ? Math.round((violations.gradeCF / total) * 100) : 0,
    planNotFollowed: total > 0 ? Math.round((violations.planNotFollowed / total) * 100) : 0,
  };

  // ---- Best/Worst ----
  const sortedByWinRate = (arr) => arr.filter((g) => g.trades >= 5).sort((a, b) => b.winRate - a.winRate || b.avgPnl - a.avgPnl);
  const bestSetup = sortedByWinRate(bySetupType)[0] || null;
  const worstSetup = [...sortedByWinRate(bySetupType)].pop() || null;
  const bestSession = sortedByWinRate(bySession)[0] || null;
  const worstSession = [...sortedByWinRate(bySession)].pop() || null;
  const bestDay = sortedByWinRate(byDayOfWeek)[0] || null;
  const worstDay = [...sortedByWinRate(byDayOfWeek)].pop() || null;

  // ---- Consistency Score ----
  const pctValidated = total > 0 ? all.filter((t) => t.validated).length / total : 0;
  const pctPlan = total > 0 ? all.filter((t) => t.followed_plan !== false).length / total : 0;
  const pctEmotionalOk = total > 0 ? all.filter((t) => (t.emotional_state || 3) <= 3).length / total : 0;
  // Journal completion: trades with notes OR screenshot count as "complete"
  const pctComplete = total > 0 ? all.filter((t) => t.notes || t.screenshot_uri).length / total : 0;
  const consistencyScore = Math.round((pctValidated * 25 + pctPlan * 25 + pctEmotionalOk * 25 + pctComplete * 25));

  // Weekly consistency scores for line chart
  const weekGroups = {};
  all.forEach((t) => {
    const wk = etWeekKey(t.trade_date);
    if (!wk) return;
    if (!weekGroups[wk]) weekGroups[wk] = [];
    weekGroups[wk].push(t);
  });
  const weeklyScores = Object.entries(weekGroups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, wkTrades]) => {
      const tot = wkTrades.length;
      const v = tot > 0 ? wkTrades.filter((t) => t.validated).length / tot : 0;
      const p = tot > 0 ? wkTrades.filter((t) => t.followed_plan !== false).length / tot : 0;
      const e = tot > 0 ? wkTrades.filter((t) => (t.emotional_state || 3) <= 3).length / tot : 0;
      const c = tot > 0 ? wkTrades.filter((t) => t.notes || t.screenshot_uri).length / tot : 0;
      return { week, score: Math.round((v + p + e + c) * 25), trades: tot };
    });

  // ---- Weekly Summary ----
  const weeks = Object.entries(weekGroups).sort(([a], [b]) => b.localeCompare(a));
  const thisWeekTrades = weeks[0] ? weeks[0][1] : [];
  const prevWeekTrades = weeks[1] ? weeks[1][1] : [];

  const weekWins = thisWeekTrades.filter(isWin).length;
  const weekWinRate = thisWeekTrades.length > 0 ? Math.round((weekWins / thisWeekTrades.length) * 100) : 0;
  const weekPnl = thisWeekTrades.reduce((s, t) => s + (t.pnl || 0), 0);
  const weekRrs = thisWeekTrades.filter((t) => t.rr_ratio != null).map((t) => t.rr_ratio);
  const weekAvgRr = weekRrs.length > 0 ? weekRrs.reduce((a, b) => a + b, 0) / weekRrs.length : null;
  const biggestWinner = thisWeekTrades.length > 0 ? thisWeekTrades.reduce((max, t) => (t.pnl > max.pnl ? t : max)) : null;
  const biggestLoser = thisWeekTrades.length > 0 ? thisWeekTrades.reduce((min, t) => (t.pnl < min.pnl ? t : min)) : null;
  const prevWeekPnl = prevWeekTrades.reduce((s, t) => s + (t.pnl || 0), 0);
  const prevWeekWinRate = prevWeekTrades.length > 0 ? Math.round((prevWeekTrades.filter(isWin).length / prevWeekTrades.length) * 100) : 0;

  // Weekly consistency for this week
  const thisWeekScore = weeklyScores.length > 0 ? weeklyScores[weeklyScores.length - 1].score : 0;

  // Data-driven feedback
  let feedback = [];
  if (thisWeekTrades.length >= 5) {
    // Best setup this week
    const wkSetupStats = groupStats(thisWeekTrades, (t) => t.setup_type).filter((g) => g.trades >= 3);
    const wkBest = wkSetupStats.sort((a, b) => b.winRate - a.winRate)[0];
    const wkWorst = wkSetupStats.sort((a, b) => a.winRate - b.winRate)[0];
    if (wkBest && wkBest.winRate >= 60) {
      feedback.push(`Your ${wkBest.key} setups hit at ${wkBest.winRate}% this week. That's your edge.`);
    }
    if (wkWorst && wkWorst.winRate <= 40 && wkWorst.key !== wkBest?.key) {
      feedback.push(`You're ${wkWorst.wins} for ${wkWorst.trades} on ${wkWorst.key} setups${wkWorst.key !== "Structure Break" ? "" : " this month"} — the data says stop taking them.`);
    }
    // Day-of-week pattern
    const wkDayStats = groupStats(thisWeekTrades, etDayOfWeek).filter((g) => g.trades >= 2);
    if (wkDayStats.length >= 2) {
      const goodDay = wkDayStats.sort((a, b) => b.winRate - a.winRate)[0];
      const badDay = wkDayStats.sort((a, b) => a.winRate - b.winRate)[0];
      if (goodDay && badDay && goodDay.key !== badDay.key) {
        feedback.push(`${goodDay.key}: ${goodDay.trades} trades, ${goodDay.wins} winners. ${badDay.key}: ${badDay.trades} trades, ${badDay.wins} winners. What changed?`);
      }
    }
    // Trade count drop
    const wkTradeNum = Object.values(dayGroups)
      .filter((dk) => thisWeekTrades.some((t) => new Date(t.trade_date).toLocaleDateString("en-US", { timeZone: "America/New_York" }) === dk))
      .reduce((acc, dayTrades) => {
        const sorted = dayTrades.sort((a, b) => new Date(a.trade_date) - new Date(b.trade_date));
        sorted.forEach((t, idx) => {
          const bucket = idx < 2 ? "1-2" : "3+";
          if (!acc[bucket]) acc[bucket] = { trades: 0, wins: 0 };
          acc[bucket].trades++;
          if (isWin(t)) acc[bucket].wins++;
        });
        return acc;
      }, {});
    if (wkTradeNum["3+"] && wkTradeNum["3+"].trades >= 3) {
      const early = wkTradeNum["1-2"];
      const late = wkTradeNum["3+"];
      const earlyWr = early && early.trades > 0 ? Math.round((early.wins / early.trades) * 100) : 0;
      const lateWr = late.trades > 0 ? Math.round((late.wins / late.trades) * 100) : 0;
      if (earlyWr - lateWr >= 20) {
        feedback.push(`Trades 1-2: ${earlyWr}% win rate. Trade 3+: ${lateWr}%. You give it back after trade #2.`);
      }
    }
    if (feedback.length === 0) {
      feedback.push(`${weekWins} of ${thisWeekTrades.length} trades won this week. ${weekPnl >= 0 ? "Green week." : "Red week."} Keep journaling.`);
    }
  }

  return {
    total,
    bySetupType, bySession, byDayOfWeek, byEmotionalState, byTradeNumber,
    byGrade, byValidation, byLightBulb, byPlan,
    violations, violationsPct,
    bestSetup, worstSetup, bestSession, worstSession, bestDay, worstDay,
    consistencyScore, weeklyScores,
    weeklySummary: {
      trades: thisWeekTrades.length,
      winRate: weekWinRate,
      pnl: weekPnl,
      avgRr: weekAvgRr,
      biggestWinner, biggestLoser,
      consistencyScore: thisWeekScore,
      prevWeekPnl, prevWeekWinRate, prevWeekTrades: prevWeekTrades.length,
      feedback: feedback.slice(0, 3),
      hasData: thisWeekTrades.length > 0,
    },
  };
}