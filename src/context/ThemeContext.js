// context/ThemeContext.js
import React, { createContext, useState, useEffect } from "react";

// Creamos el contexto
export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Verificar si hay una preferencia guardada
  const storedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  // Estado inicial basado en preferencia guardada o preferencia del sistema
  const [isDarkMode, setIsDarkMode] = useState(
    storedTheme ? storedTheme === "dark" : prefersDark
  );

  // Efecto para aplicar el tema al documento HTML
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // Función para cambiar el tema
  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
