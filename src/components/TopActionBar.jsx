import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Calculator, X, Plus } from "lucide-react";

export default function TopActionBar() {
  const [fabOpen, setFabOpen] = useState(false);
  return (
    <>
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/80 backdrop-blur border-b border-[#1A1A1A] px-4 md:px-6 py-3 flex justify-end">
        <div className="hidden md:flex gap-2">
          <Link
            to="/validator"
            className="flex items-center gap-2 bg-[#D42A2A] hover:bg-[#b82424] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <ShieldCheck size={16} /> Validate
          </Link>
          <Link
            to="/calculators"
            className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#222] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-[#1A1A1A]"
          >
            <Calculator size={16} /> Calculator
          </Link>
        </div>
      </div>

      {/* Mobile FAB */}
      <div className="md:hidden fixed bottom-20 right-4 z-40 flex flex-col items-end">
        {fabOpen && (
          <div className="flex flex-col gap-2 mb-3">
            <Link
              to="/validator"
              onClick={() => setFabOpen(false)}
              className="flex items-center gap-2 bg-[#D42A2A] text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg"
            >
              <ShieldCheck size={16} /> Validate
            </Link>
            <Link
              to="/calculators"
              onClick={() => setFabOpen(false)}
              className="flex items-center gap-2 bg-[#1A1A1A] text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg border border-[#1A1A1A]"
            >
              <Calculator size={16} /> Calculator
            </Link>
          </div>
        )}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className="w-12 h-12 rounded-full bg-[#D42A2A] text-white flex items-center justify-center shadow-lg"
        >
          {fabOpen ? <X size={22} /> : <Plus size={22} />}
        </button>
      </div>
    </>
  );
}