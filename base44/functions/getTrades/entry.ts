import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    const limit = Math.min(Math.max(parseInt(body.limit) || 50, 1), 500);
    const skip = Math.max(parseInt(body.skip) || 0, 0);

    // Build filter from optional params
    const filter = {};
    if (body.instrument) filter.instrument = body.instrument;
    if (body.direction) filter.direction = String(body.direction).toLowerCase();
    if (body.start_date) filter.trade_date = { $gte: body.start_date };
    if (body.end_date) {
      filter.trade_date = { ...(filter.trade_date || {}), $lte: body.end_date };
    }

    const trades = await base44.entities.Trade.filter(filter, '-trade_date', limit + 1, skip);
    const hasMore = trades.length > limit;
    const resultTrades = hasMore ? trades.slice(0, limit) : trades;

    return Response.json({
      trades: resultTrades,
      total_count: resultTrades.length,
      has_more: hasMore,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}