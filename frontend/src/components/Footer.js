// components/Footer.js
import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { GithubIcon, Heart, Code } from "lucide-react";

const Footer = () => {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <footer
      className={`py-6 ${
        isDarkMode
          ? "bg-dark-bg-tertiary text-dark-text-secondary"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0">
            <p className="text-sm">Normalizador de Procesadores v1.0.0</p>
            <p className="text-xs mt-1">
              Una herramienta para facilitar la auditoría y normalización de
              información de procesadores
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/tuusuario/normalizador-procesadores"
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm flex items-center hover:${
                isDarkMode ? "text-white" : "text-gray-900"
              } transition-colors`}
            >
              <GithubIcon className="mr-1" size={16} />
              Repositorio
            </a>

            <span className="text-sm flex items-center">
              <Code className="mr-1" size={16} />
              Licencia MIT
            </span>

            <span className="text-sm flex items-center">
              <Heart className="mr-1 text-red-500" size={16} />
              {new Date().getFullYear()}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
