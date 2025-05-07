// components/auth/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Cpu, LogIn, Key, AlertCircle, User } from "lucide-react";

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(formData);
      navigate("/"); // Redireccionar al dashboard después del login
    } catch (error) {
      console.error("Error en login:", error);
      setError(
        error.message ||
          "Error al iniciar sesión. Compruebe que el servidor backend está funcionando."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-dark-bg-primary">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md dark:bg-dark-bg-secondary">
        <div className="mb-6 text-center">
          <div className="flex justify-center mb-3">
            <Cpu className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Iniciar Sesión
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Accede a tu cuenta en el Normalizador de Hardware
          </p>
        </div>

        {error && (
          <div className="flex items-center p-3 mb-4 text-red-700 bg-red-100 rounded-md dark:bg-red-900 dark:text-red-200">
            <AlertCircle className="mr-2" size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-gray-700 dark:text-gray-300">
              Usuario o Email
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
                placeholder="Ingresa tu usuario o email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-gray-700 dark:text-gray-300">
              Contraseña
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
                placeholder="Ingresa tu contraseña"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`flex justify-center items-center w-full text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-medium rounded-md px-5 py-2.5 ${
              isLoading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? (
              <>
                <svg
                  className="w-4 h-4 mr-2 -ml-1 text-white animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Iniciando sesión...
              </>
            ) : (
              <>
                <LogIn className="mr-2" size={18} />
                Iniciar Sesión
              </>
            )}
          </button>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ¿No tienes una cuenta?{" "}
              <a
                href="/register"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Regístrate
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
