import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Filter, Image as ImageIcon, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const INSTRUMENTS = ["NQ", "ES", "MNQ"];
const DIRECTIONS = ["long", "short"];
const SESSIONS = ["Asia", "London", "Pre-Market", "Data Release Window", "NY Open", "NY Afternoon", "After Hours", "Closed"];
const GRADES = ["A+", "A", "B", "C", "D"];
const SETUP_TYPES = ["IFVG", "Structure Break", "Liquidity Sweep", "V-Shape Recovery", "Other"];

export default function JournalList({ trades }) {
  const [expanded, setExpanded] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: "", dateTo: "", instrument: "", direction: "", pnl: "", setupType: "", grade: "", session: "", tag: "",
  });
  const [signedUrls, setSignedUrls] = useState({});

  const filtered = useMemo(() => {
    return trades.filter((t) => {
      if (filters.dateFrom && t.trade_date && new Date(t.trade_date) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && t.trade_date && new Date(t.trade_date) > new Date(filters.dateTo + "T23:59:59")) return false;
      if (filters.instrument && t.instrument !== filters.instrument) return false;
      if (filters.direction && t.direction !== filters.direction) return false;
      if (filters.pnl === "winners" && (t.pnl || 0) <= 0) return false;
      if (filters.pnl === "losers" && (t.pnl || 0) >= 0) return false;
      if (filters.setupType && t.setup_type !== filters.setupType) return false;
      if (filters.grade && t.grade !== filters.grade) return false;
      if (filters.session && t.session !== filters.session) return false;
      if (filters.tag && !(t.tags || []).includes(filters.tag)) return false;
      return true;
    });
  }, [trades, filters]);

  const allTags = useMemo(() => [...new Set(trades.flatMap((t) => t.tags || []))], [trades]);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const updateFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const clearFilters = () => setFilters({ dateFrom: "", dateTo: "", instrument: "", direction: "", pnl: "", setupType: "", grade: "", session: "", tag: "" });

  const viewScreenshot = async (t) => {
    if (!t.screenshot_uri) return;
    if (signedUrls[t.id]) {
      window.open(signedUrls[t.id], "_blank");
      return;
    }
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: t.screenshot_uri });
      setSignedUrls((s) => ({ ...s, [t.id]: signed_url }));
      window.open(signed_url, "_blank");
    } catch {}
  };

  if (trades.length === 0) {
    return (
      <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-12 text-center">
        <p className="text-sm text-[#A0A0A0]">
          No trades logged yet. Open your AI Dodgy chat and say "Log Trade" to record your first trade.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-[#A0A0A0]">{filtered.length} {filtered.length === 1 ? "trade" : "trades"} logged</span>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex items-center gap-2 text-sm text-[#A0A0A0] hover:text-white bg-[#141414] border border-[#1A1A1A] px-3 py-1.5 rounded-lg transition-colors"
        >
          <Filter size={14} /> Filters
          {activeFilterCount > 0 && (
            <span className="bg-[#D42A2A] text-white text-xs px-1.5 rounded-full">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {filtersOpen && (
        <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <FilterSelect label="Date from" value={filters.dateFrom} onChange={(v) => updateFilter("dateFrom", v)} type="date" />
            <FilterSelect label="Date to" value={filters.dateTo} onChange={(v) => updateFilter("dateTo", v)} type="date" />
            <FilterSelect label="Instrument" value={filters.instrument} onChange={(v) => updateFilter("instrument", v)} options={INSTRUMENTS} />
            <FilterSelect label="Direction" value={filters.direction} onChange={(v) => updateFilter("direction", v)} options={DIRECTIONS} />
            <FilterSelect label="P&L" value={filters.pnl} onChange={(v) => updateFilter("pnl", v)} options={["winners", "losers"]} />
            <FilterSelect label="Setup type" value={filters.setupType} onChange={(v) => updateFilter("setupType", v)} options={SETUP_TYPES} />
            <FilterSelect label="Grade" value={filters.grade} onChange={(v) => updateFilter("grade", v)} options={GRADES} />
            <FilterSelect label="Session" value={filters.session} onChange={(v) => updateFilter("session", v)} options={SESSIONS} />
            {allTags.length > 0 && <FilterSelect label="Tag" value={filters.tag} onChange={(v) => updateFilter("tag", v)} options={allTags} />}
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-xs text-[#D42A2A] hover:underline flex items-center gap-1">
              <X size={12} /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Trade list */}
      {filtered.length === 0 ? (
        <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-8 text-center">
          <p className="text-sm text-[#A0A0A0]">No trades match these filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <TradeRow key={t.id} trade={t} expanded={expanded === t.id} onToggle={() => setExpanded(expanded === t.id ? null : t.id)} onViewScreenshot={() => viewScreenshot(t)} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, type }) {
  return (
    <div>
      <label className="text-xs text-[#A0A0A0] mb-1 block">{label}</label>
      {type === "date" ? (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-[#D42A2A]"
        />
      ) : (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-[#D42A2A] capitalize"
        >
          <option value="">All</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      )}
    </div>
  );
}

function TradeRow({ trade, expanded, onToggle, onViewScreenshot }) {
  const pnl = trade.pnl || 0;
  const isWin = pnl >= 0;
  const borderColor = isWin ? "border-l-[#22C55E]" : "border-l-[#EF4444]";

  return (
    <div className={`bg-[#141414] border border-[#1A1A1A] border-l-2 ${borderColor} rounded-lg overflow-hidden`}>
      <button onClick={onToggle} className="w-full flex items-center gap-4 px-4 py-3 text-left">
        <div className="text-xs text-[#A0A0A0] w-16 shrink-0">
          {trade.trade_date ? new Date(trade.trade_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
        </div>
        <div className="text-white font-medium text-sm w-12 shrink-0">{trade.instrument}</div>
        <div className={`text-xs w-12 shrink-0 ${trade.direction === "long" ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
          {trade.direction?.toUpperCase()}
        </div>
        <div className="text-xs text-[#A0A0A0] w-24 shrink-0 truncate hidden sm:block">{trade.session || "—"}</div>
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {trade.ivg_score != null && (
            <span className="text-xs text-[#A0A0A0] bg-[#1A1A1A] px-1.5 py-0.5 rounded shrink-0">{trade.ivg_score}/100</span>
          )}
          {trade.grade && (
            <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 font-medium ${
              trade.grade === "A+" || trade.grade === "A" ? "text-[#22C55E] bg-[#22C55E]/10" :
              trade.grade === "B" ? "text-[#EAB308] bg-[#EAB308]/10" :
              "text-[#EF4444] bg-[#EF4444]/10"
            }`}>{trade.grade}</span>
          )}
        </div>
        <div className={`text-sm font-medium w-20 text-right shrink-0 ${isWin ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
          {isWin ? "+" : ""}${pnl.toFixed(2)}
        </div>
        {expanded ? <ChevronUp size={16} className="text-[#A0A0A0] shrink-0" /> : <ChevronDown size={16} className="text-[#A0A0A0] shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-[#1A1A1A] space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm pt-3">
            <Detail label="Entry" value={trade.entry_price?.toFixed(2)} />
            <Detail label="Exit" value={trade.exit_price?.toFixed(2)} />
            <Detail label="Stop" value={trade.stop_loss?.toFixed(2)} />
            <Detail label="Target" value={trade.take_profit?.toFixed(2)} />
            <Detail label="Contracts" value={trade.contracts} />
            <Detail label="Points" value={trade.points?.toFixed(2)} />
            <Detail label="R:R" value={trade.rr_ratio?.toFixed(2)} />
            <Detail label="Emotional" value={trade.emotional_state ? `${trade.emotional_state}/5` : null} />
            <Detail label="Setup" value={trade.setup_type} />
            <Detail label="Session" value={trade.session} />
            <Detail label="Validated" value={trade.validated ? "Yes" : "No"} />
            <Detail label="Light bulb" value={trade.is_light_bulb ? "Yes" : "No"} />
            <Detail label="Followed plan" value={trade.followed_plan === false ? "No" : "Yes"} />
          </div>
          {trade.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {trade.tags.map((tag) => (
                <span key={tag} className="text-xs text-[#A0A0A0] bg-[#1A1A1A] px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          )}
          {trade.notes && (
            <div className="pt-1">
              <div className="text-xs text-[#A0A0A0] mb-1">Notes</div>
              <p className="text-sm text-white">{trade.notes}</p>
            </div>
          )}
          {trade.screenshot_uri && (
            <button onClick={onViewScreenshot} className="flex items-center gap-2 text-sm text-[#D42A2A] hover:underline pt-1">
              <ImageIcon size={14} /> View chart screenshot
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div className="text-xs text-[#A0A0A0]">{label}</div>
      <div className="text-white text-sm">{value ?? "—"}</div>
    </div>
  );
}