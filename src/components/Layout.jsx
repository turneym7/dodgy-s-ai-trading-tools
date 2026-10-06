import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import TopActionBar from "@/components/TopActionBar";
import Breadcrumb from "@/components/Breadcrumb";

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopActionBar />
        <main className="flex-1 px-4 md:px-6 py-5 pb-24 md:pb-8 max-w-[1400px] w-full mx-auto">
          <Breadcrumb />
          <Outlet />
        </main>
      </div>
    </div>
  );
}