import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home, Search, Moon, Sun, Sparkles, Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';

export default function Layout() {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#1C1917] text-[#1C1917] dark:text-[#FAFAF9] transition-colors duration-300">

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#FAFAF9]/85 dark:bg-[#26221F]/85 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-bold text-[#C2410C] dark:text-[#E0561B] transition-colors"
          >
            <Home className="w-6 h-6 stroke-[2.2]" />
            <span className="tracking-tight">
              Smart<span className="text-[#1C1917] dark:text-[#FAFAF9]">Keja</span>
            </span>
          </Link>

          {/* 🖥 Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">

            <NavLink to="/" active={isActive('/')}>
              <Search className="w-4 h-4" /> Explore
            </NavLink>

            <NavLink to="/recommendations" active={isActive('/recommendations')}>
              <Sparkles className="w-4 h-4" /> Recommendations
            </NavLink>

            {/* 🌙 Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="ml-2 p-2.5 rounded-full text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-stone-700" />}
            </button>
          </nav>

          {/* 📱 Mobile Controls */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-full text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-stone-700" />}
            </button>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle Menu"
              className="p-2 rounded-full text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* 📱 Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden px-4 pb-4 pt-2 space-y-1 bg-[#FAFAF9] dark:bg-[#26221F] border-t border-stone-200 dark:border-stone-800 shadow-lg">
            <MobileLink to="/" active={isActive('/')} onClick={() => setMenuOpen(false)}>
              <Search className="w-4 h-4 inline mr-2" /> Explore
            </MobileLink>
            <MobileLink to="/recommendations" active={isActive('/recommendations')} onClick={() => setMenuOpen(false)}>
              <Sparkles className="w-4 h-4 inline mr-2" /> Recommendations
            </MobileLink>
          </div>
        )}
      </header>

      {/* 📦 MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}

/* 🔹 Reusable Desktop NavLink */
function NavLink({ to, children, active }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
        active
          ? 'bg-[#C2410C]/10 text-[#C2410C] dark:bg-[#E0561B]/15 dark:text-[#E0561B]'
          : 'text-stone-600 dark:text-stone-300 hover:text-[#C2410C] dark:hover:text-[#E0561B] hover:bg-stone-200/50 dark:hover:bg-stone-800/60'
      }`}
    >
      {children}
    </Link>
  );
}

/* 🔹 Reusable Mobile Link */
function MobileLink({ to, children, onClick, active }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`block px-3 py-2.5 rounded-xl font-medium transition ${
        active
          ? 'bg-[#C2410C]/10 text-[#C2410C] dark:bg-[#E0561B]/15 dark:text-[#E0561B]'
          : 'text-stone-700 dark:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800'
      }`}
    >
      {children}
    </Link>
  );
}