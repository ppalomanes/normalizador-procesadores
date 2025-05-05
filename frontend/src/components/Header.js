// components/Header.js
import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import ThemeSwitcher from "./ThemeSwitcher";
import {
  Cpu,
  GitBranch,
  LogIn,
  UserPlus,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const Header = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`py-4 shadow-md ${
        isDarkMode ? "bg-dark-bg-secondary" : "bg-white"
      }`}
    >
      <div className="container px-4 mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Cpu className="mr-2 text-blue-600 dark:text-blue-400" size={28} />
            <div>
              <h1 className="text-xl font-bold text-gray-800 md:text-2xl dark:text-white">
                <Link to="/">Normalizador de Hardware</Link>
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Analice y normalice información de procesadores para auditorías
              </p>
            </div>
          </div>

          {/* Menú para pantallas grandes */}
          <div className="items-center hidden space-x-4 md:flex">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <GitBranch className="mr-1" size={14} />
              <span>v1.0.0</span>
            </div>

            <ThemeSwitcher />

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <User className="mr-1" size={20} />
                  <span className="mr-1">{user.username}</span>
                  {userMenuOpen ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 z-10 w-48 py-1 mt-2 bg-white rounded-md shadow-lg dark:bg-dark-bg-tertiary">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg-secondary"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="inline mr-2" size={16} />
                      Perfil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg-secondary"
                    >
                      <LogOut className="inline mr-2" size={16} />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <LogIn className="mr-1" size={16} />
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <UserPlus className="mr-1" size={16} />
                  Registrarse
                </Link>
              </div>
            )}
          </div>

          {/* Botón de menú móvil */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        {mobileMenuOpen && (
          <div className="py-2 mt-4 border-t border-gray-200 md:hidden dark:border-dark-border">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <GitBranch className="mr-1" size={14} />
                  <span>v1.0.0</span>
                </div>
                <ThemeSwitcher />
              </div>

              {isAuthenticated ? (
                <>
                  <div className="flex items-center py-2 text-gray-700 dark:text-gray-300">
                    <User className="mr-2" size={18} />
                    <span>{user.username}</span>
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="mr-2" size={18} />
                    Perfil
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center py-2 text-left text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <LogOut className="mr-2" size={18} />
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LogIn className="mr-2" size={18} />
                    Iniciar Sesión
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <UserPlus className="mr-2" size={18} />
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
