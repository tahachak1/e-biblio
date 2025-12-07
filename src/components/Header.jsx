import React, { useEffect, useState } from "react";
import { FiMoon, FiSun, FiMenu } from "react-icons/fi";

// Header with theme toggle and mobile sidebar trigger
export default function Header({ onMenuToggle = () => {} }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    if (localStorage.theme) return localStorage.theme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.theme = theme;
  }, [theme]);

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <button
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-gray-800 md:hidden"
          onClick={onMenuToggle}
          aria-label="Open sidebar"
        >
          <FiMenu size={20} />
        </button>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-600">Admin</p>
          <h1 className="text-lg font-semibold text-slate-800 dark:text-white">Dashboard</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-full bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200 dark:bg-gray-800 dark:text-slate-200 dark:hover:bg-gray-700"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
        </button>
      </div>
    </header>
  );
}
