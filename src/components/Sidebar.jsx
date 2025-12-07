import React from "react";
import { NavLink } from "react-router-dom";
import { FiHome, FiShoppingCart, FiUsers, FiSettings, FiX } from "react-icons/fi";

const links = [
  { to: "/admin/dashboard", label: "Dashboard", icon: FiHome },
  { to: "/admin/orders", label: "Commandes", icon: FiShoppingCart },
  { to: "/admin/users", label: "Utilisateurs", icon: FiUsers },
  { to: "/admin/catalog", label: "Catalogue", icon: FiSettings },
  { to: "/admin/notifications", label: "Notifications", icon: FiSettings },
];

export default function Sidebar({ open = false, onClose = () => {} }) {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity duration-200 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-68 max-w-xs bg-slate-950/95 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-md transition-transform duration-200 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 md:py-6 border-b border-white/10">
          <div className="text-2xl font-bold text-white">e-Biblio</div>
          <button
            className="rounded-lg p-2 text-slate-200 hover:bg-white/10 md:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <FiX size={20} />
          </button>
        </div>

        <nav className="px-4 pb-8 pt-4 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-white/10 ${
                  isActive ? "bg-white/10 text-white" : "text-slate-200"
                }`
              }
              onClick={onClose}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
