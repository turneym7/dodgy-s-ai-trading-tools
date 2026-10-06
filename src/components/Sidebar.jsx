import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutGrid, ShieldCheck, BookOpen, Calculator, Settings as SettingsIcon,
  ChevronLeft, ChevronRight, LogOut,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutGrid },
  { label: "Trade Validator", path: "/validator", icon: ShieldCheck },
  { label: "Trading Journal", path: "/journal", icon: BookOpen },
  { label: "Position Size & Risk Cal...", path: "/calculators", icon: Calculator },
  { label: "Settings", path: "/settings", icon: SettingsIcon },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [unvalidated, setUnvalidated] = useState(0);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    base44.entities.Trade.filter({ validated: false })
      .then((t) => setUnvalidated(t.length))
      .catch(() => setUnvalidated(0));
  }, [location.pathname]);

  const handleLogout = () => base44.auth.logout(window.location.origin);
  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email ? user.email[0].toUpperCase() : "T";
  const displayName = user?.full_name || "Trader";

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-[#141414] border-r border-[#1A1A1A] transition-all duration-300 shrink-0 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <div className="p-4 flex items-center justify-between">
          <div className={collapsed ? "hidden" : "block"}>
            <div className="text-white font-bold text-lg tracking-tight leading-none">DODGY</div>
            <div className="text-[#A0A0A0] text-[11px] mt-1">AI Trading Tools</div>
          </div>
          {collapsed && <div className="text-white font-bold text-lg mx-auto">D</div>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-[#A0A0A0] hover:text-white p-1.5 rounded-md hover:bg-[#1A1A1A] transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 px-2 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active ? "bg-[#D42A2A] text-white" : "text-[#A0A0A0] hover:bg-[#1A1A1A] hover:text-white"
                }`}
              >
                <div className="relative shrink-0">
                  <Icon size={18} />
                  {item.path === "/journal" && unvalidated > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#D42A2A] rounded-full" />
                  )}
                </div>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={`px-4 py-2 text-[11px] text-[#A0A0A0] ${collapsed ? "hidden" : "block"}`}>
          <div className="font-medium text-white">IFVG</div>
          <div className="mt-0.5">NQ · ES · MNQ</div>
        </div>

        <div className="p-3 border-t border-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#D42A2A] flex items-center justify-center text-white font-bold text-sm shrink-0">
              {initials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-sm truncate">{displayName}</div>
                <div className="text-[#A0A0A0] text-xs">Trader</div>
              </div>
            )}
            {!collapsed && (
              <button onClick={handleLogout} className="text-[#A0A0A0] hover:text-white" title="Sign out">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#141414] border-t border-[#1A1A1A] flex justify-around py-2 z-40">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path} className={`flex flex-col items-center px-2 py-1 ${active ? "text-[#D42A2A]" : "text-[#A0A0A0]"}`}>
              <div className="relative">
                <Icon size={20} />
                {item.path === "/journal" && unvalidated > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#D42A2A] rounded-full" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </>
  );
}