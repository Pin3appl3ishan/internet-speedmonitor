// import React from "react"; // Not needed in React 18 with new JSX transform
import { useEffect, useState } from "react";
import { Dashboard } from "./components/Dashboard";
import "./index.css";

function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") return true;
    if (saved === "light") return false;
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary-600">
            <span className="text-2xl" aria-label="Logo">
              ⚡
            </span>
          </div>
          <button
            onClick={() => setIsDark((d) => !d)}
            className="w-10 h-10 rounded-full border border-gray-300 bg-white text-gray-700 flex items-center justify-center hover:bg-gray-50 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            aria-label="Toggle dark mode"
          >
            {isDark ? <span>🌙</span> : <span>🔆</span>}
          </button>
        </div>
      </header>

      <main className="flex-1">
        <Dashboard />
      </main>

      <footer className="w-full border-t border-gray-200 bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} Internet Speed Monitor
          </span>
          <a
            href="https://github.com/Pin3appl3ishan/internet-speedmonitor"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 dark:text-primary-500 dark:hover:text-primary-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.263.82-.582 0-.287-.012-1.243-.017-2.252-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.758-1.333-1.758-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.776.418-1.304.76-1.604-2.665-.305-5.466-1.332-5.466-5.93 0-1.31.468-2.382 1.236-3.222-.124-.304-.536-1.53.117-3.187 0 0 1.008-.323 3.3 1.23a11.5 11.5 0 0 1 3.003-.403 11.5 11.5 0 0 1 3.003.403c2.29-1.553 3.297-1.23 3.297-1.23.654 1.657.242 2.883.118 3.187.77.84 1.235 1.912 1.235 3.222 0 4.61-2.804 5.624-5.476 5.92.43.372.81 1.104.81 2.224 0 1.606-.014 2.898-.014 3.293 0 .322.217.7.826.58C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>View on GitHub</span>
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
