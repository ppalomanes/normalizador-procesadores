// components/Header.js
import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import ThemeSwitcher from "./ThemeSwitcher";
import { Cpu, GitBranch } from "lucide-react";

const Header = () => {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <header
      className={`py-4 shadow-md ${
        isDarkMode ? "bg-dark-bg-secondary" : "bg-white"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Cpu className="mr-2 text-blue-600 dark:text-blue-400" size={28} />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
                Normalizador de Procesadores
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Analice y normalice información de procesadores para auditorías
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center text-sm text-gray-600 dark:text-gray-400">
              <GitBranch className="mr-1" size={14} />
              <span>v1.0.0</span>
            </div>
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
