// components/auth/Profile.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Building,
  Save,
  AlertCircle,
  CheckCircle,
  Key,
  UserCheck,
  LogOut,
  Cpu,
  RefreshCw,
} from "lucide-react";

const Profile = () => {
  const { user, updateProfile, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    company: "",
    password: "",
    confirmPassword: "",
  });
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar datos del usuario cuando el componente se monta
  useEffect(() => {
    if (user) {
      setFormData({
        ...formData,
        username: user.username || "",
        email: user.email || "",
        company: user.company || "",
      });
    }
  }, [user]);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar contraseñas si se está actualizando
    if (formData.password) {
      if (formData.password !== formData.confirmPassword) {
        showNotification("error", "Las contraseñas no coinciden");
        return;
      }

      if (formData.password.length < 6) {
        showNotification(
          "error",
          "La contraseña debe tener al menos 6 caracteres"
        );
        return;
      }
    }

    setIsLoading(true);

    try {
      // Solo enviar campos que han cambiado
      const updateData = {};

      if (formData.username !== user.username)
        updateData.username = formData.username;
      if (formData.email !== user.email) updateData.email = formData.email;
      if (formData.company !== user.company)
        updateData.company = formData.company;
      if (formData.password) updateData.password = formData.password;

      // Solo enviar la actualización si hay cambios
      if (Object.keys(updateData).length > 0) {
        await updateProfile(updateData);
        showNotification("success", "Perfil actualizado correctamente");
        // Limpiar campos de contraseña después de actualizar
        setFormData({
          ...formData,
          password: "",
          confirmPassword: "",
        });
      } else {
        showNotification("info", "No hay cambios para guardar");
      }
    } catch (error) {
      showNotification("error", error.message || "Error al actualizar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-dark-bg-primary">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 text-indigo-600 animate-spin dark:text-indigo-400" />
          <p className="text-gray-600 dark:text-gray-300">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-bg-primary">
      <div className="max-w-3xl px-4 py-8 mx-auto">
        <div className="flex items-center justify-center mb-6">
          <Cpu className="w-10 h-10 mr-3 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Normalizador de Hardware
          </h1>
        </div>

        <div className="p-6 mb-6 bg-white rounded-lg shadow-md dark:bg-dark-bg-secondary">
          <h2 className="flex items-center mb-4 text-xl font-semibold">
            <UserCheck
              className="mr-2 text-indigo-600 dark:text-indigo-400"
              size={24}
            />
            Tu Perfil
          </h2>

          {notification && (
            <div
              className={`mb-4 p-3 rounded-md flex items-center ${
                notification.type === "success"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                  : notification.type === "error"
                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
              }`}
            >
              {notification.type === "success" ? (
                <CheckCircle className="mr-2" size={18} />
              ) : notification.type === "error" ? (
                <AlertCircle className="mr-2" size={18} />
              ) : (
                <AlertCircle className="mr-2" size={18} />
              )}
              <span>{notification.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-gray-700 dark:text-gray-300">
                Nombre de usuario
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500"
                  size={18}
                />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border text-gray-900 dark:text-white rounded-md focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-gray-700 dark:text-gray-300">
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500"
                  size={18}
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border text-gray-900 dark:text-white rounded-md focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-gray-700 dark:text-gray-300">
                Empresa (opcional)
              </label>
              <div className="relative">
                <Building
                  className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500"
                  size={18}
                />
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border text-gray-900 dark:text-white rounded-md focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5"
                />
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-dark-border">
              <h3 className="mb-2 text-lg font-medium">Cambiar contraseña</h3>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Deja estos campos en blanco si no deseas cambiar tu contraseña.
              </p>

              <div>
                <label className="block mb-1 text-gray-700 dark:text-gray-300">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <Key
                    className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500"
                    size={18}
                  />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border text-gray-900 dark:text-white rounded-md focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block mb-1 text-gray-700 dark:text-gray-300">
                  Confirmar nueva contraseña
                </label>
                <div className="relative">
                  <Key
                    className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500"
                    size={18}
                  />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border text-gray-900 dark:text-white rounded-md focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5"
                    placeholder="Repite tu nueva contraseña"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-4 sm:flex-row">
              <button
                type="submit"
                disabled={isLoading}
                className={`flex justify-center items-center text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-medium rounded-md px-5 py-2.5 ${
                  isLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 animate-spin" size={18} />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2" size={18} />
                    Guardar Cambios
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex justify-center items-center text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-300 font-medium rounded-md px-5 py-2.5"
              >
                <LogOut className="mr-2" size={18} />
                Cerrar Sesión
              </button>

              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex justify-center items-center text-gray-700 bg-gray-200 hover:bg-gray-300 dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-300 font-medium rounded-md px-5 py-2.5"
              >
                Volver al Inicio
              </button>
            </div>
          </form>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md dark:bg-dark-bg-secondary">
          <h3 className="mb-2 text-lg font-medium">Información de cuenta</h3>
          <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Rol:</span>{" "}
            {user.role === "admin" ? "Administrador" : "Usuario"}
          </p>
          <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Miembro desde:</span>{" "}
            {user.created_at
              ? new Date(user.created_at).toLocaleDateString()
              : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
