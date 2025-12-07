import { NavLink } from "react-router-dom";

const links = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/orders", label: "Commandes" },
  { to: "/admin/users", label: "Utilisateurs" },
  { to: "/admin/catalog", label: "Catalogue" },
  { to: "/admin/notifications", label: "Notifications" },
];

export default function AdminTopNav() {
  return (
    <div className="hidden border-b border-slate-200 bg-white shadow-[0_1px_15px_rgba(15,23,42,0.08)] md:block">
      <nav className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-3 px-4 py-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `relative inline-flex items-center rounded-2xl px-4 py-2 text-sm font-semibold transition duration-200 ${
                isActive
                  ? "bg-slate-900 text-white shadow-[0_8px_25px_rgba(15,23,42,0.35)]"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
