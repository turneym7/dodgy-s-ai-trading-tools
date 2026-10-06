import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { jsPDF } from 'npm:jspdf@4.2.1';

const CONTRACTS = { NQ: { pointValue: 20 }, ES: { pointValue: 50 }, MNQ: { pointValue: 2 } };
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function etDayOfWeek(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return DAY_NAMES[new Date(d.toLocaleString("en-US", { timeZone: "America/New_York" })).getDay()];
}

function groupStats(trades, keyFn) {
  const groups = {};
  trades.forEach((t) => {
    const key = keyFn(t);
    if (!key) return;
    if (!groups[key]) groups[key] = { key, trades: 0, wins: 0, losses: 0, pnl: 0 };
    groups[key].trades++;
    if ((t.pnl || 0) > 0) groups[key].wins++;
    else if ((t.pnl || 0) < 0) groups[key].losses++;
    groups[key].pnl += t.pnl || 0;
  });
  return Object.values(groups).map((g) => ({
    ...g, winRate: g.trades > 0 ? Math.round((g.wins / g.trades) * 100) : 0, avgPnl: g.trades > 0 ? g.pnl / g.trades : 0,
  }));
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const month = body.month; // "YYYY-MM"
    const userName = body.user_name || user.full_name || user.email || 'Trader';
    const fundedAccounts = Array.isArray(body.funded) ? body.funded : [];
    const validations = Array.isArray(body.validations) ? body.validations : [];

    if (!month) return Response.json({ error: 'month is required (YYYY-MM)' }, { status: 400 });

    // Fetch all trades, filter by month in ET
    const allTrades = await base44.entities.Trade.list('-trade_date', 500);
    const [year, mon] = month.split('-').map(Number);
    const monthTrades = allTrades.filter((t) => {
      if (!t.trade_date) return false;
      const d = new Date(t.trade_date);
      return d.getFullYear() === year && d.getMonth() + 1 === mon;
    });

    if (monthTrades.length === 0) {
      return Response.json({ error: 'No trades in selected month' }, { status: 404 });
    }

    const total = monthTrades.length;
    const winners = monthTrades.filter((t) => (t.pnl || 0) > 0);
    const losers = monthTrades.filter((t) => (t.pnl || 0) < 0);
    const winRate = total > 0 ? Math.round((winners.length / total) * 100) : 0;
    const totalPnl = monthTrades.reduce((s, t) => s + (t.pnl || 0), 0);
    const rrs = monthTrades.filter((t) => t.rr_ratio != null).map((t) => t.rr_ratio);
    const avgRr = rrs.length > 0 ? (rrs.reduce((a, b) => a + b, 0) / rrs.length).toFixed(2) : '—';

    // Best/worst day
    const dayStats = groupStats(monthTrades, etDayOfWeek).filter((g) => g.trades >= 1);
    const bestDay = dayStats.sort((a, b) => b.winRate - a.winRate)[0];
    const worstDay = dayStats.sort((a, b) => a.winRate - b.winRate)[0];

    // Breakdowns
    const bySetup = groupStats(monthTrades, (t) => t.setup_type);
    const bySession = groupStats(monthTrades, (t) => t.session);
    const byDay = groupStats(monthTrades, etDayOfWeek);
    const byInstrument = groupStats(monthTrades, (t) => t.instrument);
    const byGrade = groupStats(monthTrades, (t) => t.grade);

    // Behavioral
    const validatedCount = monthTrades.filter((t) => t.validated).length;
    const pctValidated = total > 0 ? Math.round((validatedCount / total) * 100) : 0;
    const planFollowed = monthTrades.filter((t) => t.followed_plan !== false).length;
    const pctPlan = total > 0 ? Math.round((planFollowed / total) * 100) : 0;
    const emoWinners = winners.filter((t) => t.emotional_state != null).map((t) => t.emotional_state);
    const emoLosers = losers.filter((t) => t.emotional_state != null).map((t) => t.emotional_state);
    const avgEmoWin = emoWinners.length > 0 ? (emoWinners.reduce((s, e) => s + e, 0) / emoWinners.length).toFixed(1) : '—';
    const avgEmoLose = emoLosers.length > 0 ? (emoLosers.reduce((s, e) => s + e, 0) / emoLosers.length).toFixed(1) : '—';
    const pctComplete = total > 0 ? Math.round((monthTrades.filter((t) => t.notes || t.screenshot_uri).length / total) * 100) : 0;
    const consistencyScore = Math.round((pctValidated / 100 * 25) + (pctPlan / 100 * 25) + (((total - monthTrades.filter((t) => (t.emotional_state || 3) >= 4).length) / total) * 25) + (pctComplete / 100 * 25));

    // Streaks
    const journalDays = new Set(monthTrades.map((t) => new Date(t.trade_date).toLocaleDateString('en-US', { timeZone: 'America/New_York' })));
    const valDays = new Set(validations.filter((v) => v.validation_date).filter((v) => {
      const d = new Date(v.validation_date); return d.getFullYear() === year && d.getMonth() + 1 === mon;
    }).map((v) => new Date(v.validation_date).toLocaleDateString('en-US', { timeZone: 'America/New_York' })));

    const monthName = new Date(year, mon - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // ---- Build PDF ----
    const doc = new jsPDF();
    const darkBg = [10, 10, 10];
    const cardBg = [20, 20, 20];
    const redAccent = [212, 42, 42];
    const gray = [160, 160, 160];
    const white = [255, 255, 255];

    // Header band
    doc.setFillColor(...darkBg);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(...white);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DODGY', 14, 14);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text('AI Trading Tools', 14, 20);

    doc.setTextColor(...white);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Monthly Trading Report - ${monthName}`, 14, 40);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text(userName, 14, 47);

    let y = 56;

    // Overview
    doc.setTextColor(...white);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Overview', 14, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text(`Total Trades: ${total}`, 14, y);
    doc.text(`Win Rate: ${winRate}%`, 70, y);
    doc.text(`Total P&L: $${totalPnl.toFixed(0)}`, 126, y);
    y += 5;
    doc.text(`Avg R:R: ${avgRr}`, 14, y);
    doc.text(`Best Day: ${bestDay ? bestDay.key : '—'} (${bestDay ? bestDay.winRate : 0}%)`, 70, y);
    doc.text(`Worst Day: ${worstDay ? worstDay.key : '—'} (${worstDay ? worstDay.winRate : 0}%)`, 126, y);
    y += 10;

    // Breakdown tables
    const drawTable = (title, data) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setTextColor(...white);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 14, y);
      y += 5;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...gray);
      if (data.length === 0) {
        doc.text('No data', 14, y);
        y += 8;
        return;
      }
      doc.text('Category', 14, y);
      doc.text('Trades', 90, y);
      doc.text('Wins', 110, y);
      doc.text('Losses', 130, y);
      doc.text('Win Rate', 155, y);
      y += 4;
      data.forEach((g) => {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.setTextColor(...white);
        doc.text(String(g.key).slice(0, 30), 14, y);
        doc.setTextColor(...gray);
        doc.text(String(g.trades), 90, y);
        doc.text(String(g.wins), 110, y);
        doc.text(String(g.losses), 130, y);
        doc.text(`${g.winRate}%`, 155, y);
        y += 5;
      });
      y += 5;
    };

    drawTable('Breakdown by Setup Type', bySetup);
    drawTable('Breakdown by Session', bySession);
    drawTable('Breakdown by Day of Week', byDay);
    drawTable('Breakdown by Instrument', byInstrument);
    drawTable('Breakdown by Grade', byGrade);

    // Behavioral
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setTextColor(...white);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Behavioral', 14, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text(`Avg Emotional State (Winners): ${avgEmoWin}/5`, 14, y);
    doc.text(`Avg Emotional State (Losers): ${avgEmoLose}/5`, 100, y);
    y += 5;
    doc.text(`% Validated: ${pctValidated}%`, 14, y);
    doc.text(`% Plan Followed: ${pctPlan}%`, 100, y);
    y += 5;
    doc.text(`Consistency Score: ${consistencyScore}/100`, 14, y);
    y += 10;

    // Funded accounts
    if (fundedAccounts.length > 0) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setTextColor(...white);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Funded Accounts', 14, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...gray);
      fundedAccounts.forEach((acc) => {
        if (y > 275) { doc.addPage(); y = 20; }
        const ddUsed = Math.abs(Math.min(0, acc.current_pnl || 0));
        const ddRemaining = Math.max(0, (acc.max_drawdown || 0) - ddUsed);
        doc.text(`${acc.firm_name} (${acc.account_type || 'eval'})`, 14, y);
        doc.text(`Balance: $${(acc.account_size || 0).toLocaleString()}`, 100, y);
        y += 5;
        doc.text(`P&L: $${(acc.current_pnl || 0).toLocaleString()}`, 14, y);
        doc.text(`Drawdown remaining: $${ddRemaining.toLocaleString()}`, 100, y);
        y += 8;
      });
    }

    // Streaks
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setTextColor(...white);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Streaks', 14, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text(`Journaling days this month: ${journalDays.size}`, 14, y);
    doc.text(`Validation days this month: ${valDays.size}`, 100, y);
    y += 10;

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(...gray);
    doc.text('Generated by Dodgy AI Trading Tools', 14, 288);
    doc.text(new Date().toLocaleDateString(), 180, 288);

    // Save to public storage and return URL
    const pdfBytes = doc.output('arraybuffer');
    const file = new File([pdfBytes], `monthly-report-${month}.pdf`, { type: 'application/pdf' });
    const { file_url } = await base44.asServiceRole.integrations.Core.UploadPublicFile({ file });

    return Response.json({ url: file_url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}