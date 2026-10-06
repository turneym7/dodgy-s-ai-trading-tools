import React from "react";
import { useLocation, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const labels = {
  "/": "Dashboard",
  "/validator": "Trade Validator",
  "/journal": "Trading Journal",
  "/calculators": "Position Size & Risk Cal...",
  "/settings": "Settings",
};

export default function Breadcrumb() {
  const location = useLocation();
  const path = location.pathname;
  const current = labels[path] || "Dashboard";
  return (
    <div className="flex items-center gap-1.5 text-xs text-[#A0A0A0] mb-5">
      <Link to="/" className="hover:text-white">Dashboard</Link>
      {path !== "/" && (
        <>
          <ChevronRight size={12} />
          <span className="text-white">{current}</span>
        </>
      )}
    </div>
  );
}