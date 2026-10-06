import React, { useState, useEffect } from "react";
import { DODGY_QUOTES } from "@/lib/trading";

export default function DodgyRules() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * DODGY_QUOTES.length));

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % DODGY_QUOTES.length), 10000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-[#141414] border border-[#1A1A1A] rounded-xl p-5 h-full flex flex-col">
      <h3 className="text-white font-bold mb-3">Dodgy's Rules</h3>
      <div className="flex-1 flex items-center">
        <p className="text-[#A0A0A0] text-sm leading-relaxed italic">"{DODGY_QUOTES[idx]}"</p>
      </div>
    </div>
  );
}