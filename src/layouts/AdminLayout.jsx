import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import AdminTopNav from "../components/AdminTopNav";

// Simple admin shell: mobile sidebar + desktop horizontal nav
export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 text-slate-900 dark:bg-gray-950 dark:text-slate-100">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col">
        <Header onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
        <AdminTopNav />

        <main className="flex-1 bg-[#F9FAFB] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
