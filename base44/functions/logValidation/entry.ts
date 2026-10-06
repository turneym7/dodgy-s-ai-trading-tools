import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    if (!body.instrument || !body.direction) {
      return Response.json({ success: false, error: 'instrument and direction are required' }, { status: 400 });
    }

    const validation = await base44.entities.ValidatedSetup.create({
      instrument: body.instrument,
      direction: String(body.direction).toLowerCase(),
      setup_type: body.setup_type || 'IFVG',
      entry_price: Number(body.entry_price) || null,
      stop_loss: Number(body.stop_price) || null,
      take_profit: body.take_profit != null ? Number(body.take_profit) : null,
      grade: body.grade || 'B',
      score: Number(body.score) || 0,
      score_setup: Number(body.score_setup) || 0,
      score_risk: Number(body.score_risk) || 0,
      score_emotional: Number(body.score_emotional) || 0,
      override: Boolean(body.override),
      override_reason: body.override_reason || null,
      rr_ratio: body.rr_ratio != null ? Number(body.rr_ratio) : null,
      emotional_state: Number(body.emotional_state) || 2,
      session: body.session || null,
      checklist: {
        draw_on_liquidity: Boolean(body.draw_on_liquidity),
        structure_aligned: Boolean(body.structure_aligned),
        candle_close_confirmed: Boolean(body.candle_closure),
        htf_bias_checked: Boolean(body.htf_bias),
      },
      is_revenge: Boolean(body.is_revenge_trade),
      is_light_bulb: Boolean(body.is_light_bulb),
      trades_today: Number(body.trades_today) || 0,
      in_loss: Boolean(body.in_loss),
      screenshot_uri: body.screenshot_uri || null,
      notes: body.notes || null,
      trade_taken: Boolean(body.took_trade),
      result: body.override ? 'rejected' : 'validated',
      validation_date: body.validation_date || new Date().toISOString(),
    });

    return Response.json({
      success: true,
      validation_id: validation.id,
      grade: validation.grade,
      score: validation.score,
      message: `Validation logged: Grade ${validation.grade}, Score ${validation.score}/100`,
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}