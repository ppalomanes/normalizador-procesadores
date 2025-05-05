// context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import ApiService from "../services/apiService";

// Crear el contexto de autenticación
const AuthContext = createContext();

// Hook personalizado para usar el contexto
export const useAuth = () => useContext(AuthContext);

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar si el usuario ya está autenticado al cargar la aplicación
  useEffect(() => {
    const checkLoggedIn = async () => {
      setIsLoading(true);
      try {
        // Verificar si hay un token en localStorage
        const token = localStorage.getItem("token");

        if (token) {
          // Obtener información del usuario actual
          const response = await ApiService.getCurrentUser();
          if (response.success) {
            setUser(response.user);
            setIsAuthenticated(true);
          } else {
            // Si el token es inválido, eliminarlo
            localStorage.removeItem("token");
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error al verificar autenticación:", error);
        localStorage.removeItem("token");
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Función para iniciar sesión
  const login = async (credentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ApiService.login(credentials);

      if (response.success) {
        // Guardar token en localStorage
        localStorage.setItem("token", response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        return response.user;
      } else {
        throw new Error(response.message || "Error al iniciar sesión");
      }
    } catch (error) {
      setError(error.message || "Error al iniciar sesión");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Función para registrar un nuevo usuario
  const register = async (userData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ApiService.register(userData);

      if (response.success) {
        // Guardar token en localStorage
        localStorage.setItem("token", response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        return response.user;
      } else {
        throw new Error(response.message || "Error al registrar usuario");
      }
    } catch (error) {
      setError(error.message || "Error al registrar usuario");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Función para actualizar perfil de usuario
  const updateProfile = async (userData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ApiService.updateUser(userData);

      if (response.success) {
        setUser(response.user);
        return response.user;
      } else {
        throw new Error(response.message || "Error al actualizar perfil");
      }
    } catch (error) {
      setError(error.message || "Error al actualizar perfil");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
  };

  // Valores y funciones que se compartirán a través del contexto
  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
