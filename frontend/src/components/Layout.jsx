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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors">

      {/* 🔝 HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* 🏷 Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-bold text-blue-600 dark:text-blue-400"
          >
            <Home className="w-6 h-6" />
            <span>
              Property<span className="text-gray-800 dark:text-white">Finder</span>
            </span>
          </Link>

          {/* 🖥 Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">

            <NavLink to="/" active={isActive('/')}>
              <Search className="w-4 h-4" /> Explore
            </NavLink>

            <NavLink to="/recommendations" active={isActive('/recommendations')}>
              <Sparkles className="w-4 h-4" /> Recommendations
            </NavLink>

            {/* 🌙 Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </nav>

          {/* 📱 Mobile Controls */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {isDark ? <Sun /> : <Moon />}
            </button>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* 📱 Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden px-4 pb-4 space-y-2 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
            <MobileLink to="/" onClick={() => setMenuOpen(false)}>
              Explore
            </MobileLink>
            <MobileLink to="/recommendations" onClick={() => setMenuOpen(false)}>
              Recommendations
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

/* 🔹 Reusable NavLink */
function NavLink({ to, children, active }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-1 text-sm font-medium transition ${
        active
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
      }`}
    >
      {children}
    </Link>
  );
}

/* 🔹 Mobile Link */
function MobileLink({ to, children, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      {children}
    </Link>
  );
}