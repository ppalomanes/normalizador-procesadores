// components/DataTable.js
import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { Table, Check, AlertCircle } from "lucide-react";

const DataTable = ({
  normalizedData,
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  sortConfig,
  setSortConfig,
}) => {
  const { isDarkMode } = useContext(ThemeContext);

  // Función para ordenar datos
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Datos filtrados y ordenados para la tabla
  const getFilteredSortedData = () => {
    if (!normalizedData) return [];

    // Filtrar por pestaña activa
    let filteredData = normalizedData;
    if (activeTab === "cumple") {
      filteredData = normalizedData.filter(
        (row) => row["Cumple Requisitos"] === "Sí"
      );
    } else if (activeTab === "noCumple") {
      filteredData = normalizedData.filter(
        (row) => row["Cumple Requisitos"] === "No"
      );
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filteredData = filteredData.filter((row) => {
        return Object.values(row).some(
          (value) =>
            value &&
            typeof value === "string" &&
            value.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Ordenar datos
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredData;
  };

  // Columnas a mostrar en la tabla
  const getTableColumns = () => {
    if (!normalizedData || normalizedData.length === 0) return [];

    // Columnas clave que queremos mostrar en este orden
    const keyColumns = [
      "Hostname",
      "Procesador (marca, modelo y velocidad)",
      "Procesador Normalizado",
      "Marca Procesador",
      "Modelo Procesador",
      "Generación",
      "Velocidad",
      "Cumple Requisitos",
      "Motivo Incumplimiento",
    ];

    // Filtrar columnas que existen en los datos
    return keyColumns.filter((col) => normalizedData[0].hasOwnProperty(col));
  };

  return (
    <div
      className={`${
        isDarkMode ? "bg-dark-bg-secondary" : "bg-white"
      } p-6 rounded-lg shadow-md mb-8`}
    >
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Table className="mr-2 text-blue-600 dark:text-blue-400" size={22} />
        Datos normalizados
      </h2>

      {/* Controles de tabla */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-4">
        <div className="flex">
          <button
            onClick={() => setActiveTab("todos")}
            className={`px-4 py-2 rounded-l-lg border ${
              activeTab === "todos"
                ? isDarkMode
                  ? "bg-blue-700 text-white border-blue-700"
                  : "bg-blue-600 text-white border-blue-600"
                : isDarkMode
                ? "bg-dark-bg-tertiary text-dark-text-primary border-dark-border hover:bg-dark-bg-secondary"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveTab("cumple")}
            className={`px-4 py-2 border-t border-b ${
              activeTab === "cumple"
                ? isDarkMode
                  ? "bg-green-700 text-white border-green-700"
                  : "bg-green-600 text-white border-green-600"
                : isDarkMode
                ? "bg-dark-bg-tertiary text-dark-text-primary border-dark-border hover:bg-dark-bg-secondary"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center">
              <Check size={16} className="mr-1" />
              Cumplen
            </span>
          </button>
          <button
            onClick={() => setActiveTab("noCumple")}
            className={`px-4 py-2 rounded-r-lg border ${
              activeTab === "noCumple"
                ? isDarkMode
                  ? "bg-red-700 text-white border-red-700"
                  : "bg-red-600 text-white border-red-600"
                : isDarkMode
                ? "bg-dark-bg-tertiary text-dark-text-primary border-dark-border hover:bg-dark-bg-secondary"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center">
              <AlertCircle size={16} className="mr-1" />
              No cumplen
            </span>
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Buscar..."
            className={`pl-10 pr-4 py-2 border ${
              isDarkMode
                ? "bg-dark-bg-tertiary border-dark-border text-dark-text-primary"
                : "border-gray-300 bg-white"
            } rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className={`h-5 w-5 ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* DataTable */}
      <div
        className={`overflow-x-auto rounded-lg border ${
          isDarkMode ? "border-dark-border" : "border-gray-200"
        }`}
      >
        <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
          <thead className={isDarkMode ? "bg-dark-bg-tertiary" : "bg-gray-50"}>
            <tr>
              {getTableColumns().map((column) => (
                <th
                  key={column}
                  onClick={() => requestSort(column)}
                  className={`px-6 py-3 text-left text-xs font-medium ${
                    isDarkMode ? "text-dark-text-secondary" : "text-gray-500"
                  } uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-bg-secondary`}
                >
                  <div className="flex items-center">
                    {column}
                    {sortConfig.key === column && (
                      <span className="ml-1">
                        {sortConfig.direction === "ascending" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            className={`${
              isDarkMode ? "bg-dark-bg-secondary" : "bg-white"
            } divide-y divide-gray-200 dark:divide-dark-border`}
          >
            {getFilteredSortedData()
              .slice(0, 100)
              .map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={
                    row["Cumple Requisitos"] === "Sí"
                      ? `${
                          isDarkMode
                            ? "hover:bg-green-900/20"
                            : "hover:bg-green-50"
                        }`
                      : `${
                          isDarkMode ? "hover:bg-red-900/20" : "hover:bg-red-50"
                        }`
                  }
                >
                  {getTableColumns().map((column) => (
                    <td
                      key={`${rowIndex}-${column}`}
                      className={`px-6 py-4 whitespace-nowrap text-sm ${
                        column === "Cumple Requisitos"
                          ? row[column] === "Sí"
                            ? isDarkMode
                              ? "text-green-400 font-medium"
                              : "text-green-600 font-medium"
                            : isDarkMode
                            ? "text-red-400 font-medium"
                            : "text-red-600 font-medium"
                          : isDarkMode
                          ? "text-dark-text-primary"
                          : "text-gray-800"
                      }`}
                    >
                      {row[column] || ""}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>

        {/* Paginación mejorada */}
        <div
          className={`${
            isDarkMode ? "bg-dark-bg-tertiary" : "bg-gray-50"
          } px-4 py-3 border-t ${
            isDarkMode ? "border-dark-border" : "border-gray-200"
          } sm:px-6`}
        >
          <div className="flex items-center justify-between">
            <div
              className={`text-sm ${
                isDarkMode ? "text-dark-text-secondary" : "text-gray-700"
              }`}
            >
              Mostrando primeras 100 filas de {getFilteredSortedData().length}{" "}
              resultados
            </div>
            <div className="flex-1 flex justify-end">
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border ${
                    isDarkMode
                      ? "border-dark-border bg-dark-bg-secondary text-dark-text-secondary"
                      : "border-gray-300 bg-white text-gray-500"
                  } hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary text-sm font-medium`}
                >
                  &laquo; Anterior
                </button>
                <button
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border ${
                    isDarkMode
                      ? "border-dark-border bg-dark-bg-secondary text-dark-text-secondary"
                      : "border-gray-300 bg-white text-gray-500"
                  } hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary text-sm font-medium`}
                >
                  Siguiente &raquo;
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
