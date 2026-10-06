import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { calcPnl, calcPoints, CONTRACTS } from '../../shared/contracts.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    // Required fields
    if (!body.instrument || !body.direction) {
      return Response.json({ success: false, error: 'instrument and direction are required' }, { status: 400 });
    }
    if (!CONTRACTS[body.instrument]) {
      return Response.json({ success: false, error: 'Invalid instrument. Must be NQ, ES, or MNQ.' }, { status: 400 });
    }
    if (body.entry_price == null) {
      return Response.json({ success: false, error: 'entry_price is required' }, { status: 400 });
    }

    // Normalize direction to lowercase
    const direction = String(body.direction).toLowerCase();
    if (direction !== 'long' && direction !== 'short') {
      return Response.json({ success: false, error: 'direction must be Long or Short' }, { status: 400 });
    }

    const entry = Number(body.entry_price);
    const exit = body.exit_price != null ? Number(body.exit_price) : null;
    const contracts = body.contracts != null ? Number(body.contracts) : 1;

    // Auto-calculate points if not provided
    let points = body.points != null ? Number(body.points) : null;
    if (points == null && exit != null) {
      points = calcPoints(direction, entry, exit);
    }

    // Auto-calculate P&L if not provided
    let pnl = body.pnl != null ? Number(body.pnl) : null;
    if (pnl == null && exit != null) {
      pnl = calcPnl(body.instrument, direction, entry, exit, contracts);
    }

    // Calculate R:R if stop and target provided
    let rrRatio = null;
    const stop = body.stop_price != null ? Number(body.stop_price) : null;
    const target = body.target_price != null ? Number(body.target_price) : null;
    if (stop != null && target != null) {
      const risk = Math.abs(entry - stop);
      const reward = Math.abs(target - entry);
      rrRatio = risk > 0 ? reward / risk : 0;
    }

    const trade = await base44.entities.Trade.create({
      instrument: body.instrument,
      direction,
      entry_price: entry,
      exit_price: exit,
      stop_loss: stop,
      take_profit: target,
      contracts,
      pnl: pnl || 0,
      points: points || 0,
      grade: body.grade || null,
      validated: Boolean(body.validated),
      ivg_score: body.ivg_score != null ? Number(body.ivg_score) : null,
      emotional_state: body.emotional_state != null ? Number(body.emotional_state) : null,
      setup_type: body.setup_type || null,
      session: body.session || null,
      is_light_bulb: Boolean(body.is_light_bulb),
      followed_plan: body.followed_plan !== false,
      rr_ratio: rrRatio,
      tags: Array.isArray(body.tags) ? body.tags : [],
      screenshot_uri: body.screenshot_uri || null,
      what_went_well: body.what_went_well || null,
      what_to_improve: body.what_to_improve || null,
      rules_followed: Array.isArray(body.rules_followed) ? body.rules_followed : [],
      rules_broken: Array.isArray(body.rules_broken) ? body.rules_broken : [],
      notes: body.notes || null,
      trade_date: body.trade_date || new Date().toISOString(),
    });

    return Response.json({
      success: true,
      trade_id: trade.id,
      pnl: trade.pnl,
      points: trade.points,
      message: `Trade logged: ${trade.instrument} ${direction.toUpperCase()} ${contracts}c — P&L $${(trade.pnl || 0).toFixed(2)}`,
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}