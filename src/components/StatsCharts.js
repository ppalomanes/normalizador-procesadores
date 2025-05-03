// components/StatsCharts.js
import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import SpeedDistributionChart from "./SpeedDistributionChart";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A569BD",
  "#FF6B6B",
  "#5DADE2",
];

const StatsCharts = ({ stats, normalizedData }) => {
  const { isDarkMode } = useContext(ThemeContext);

  if (!stats) return null;

  // Preparar datos para el gráfico de marcas
  const brandData = Object.entries(stats.brandDistribution).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  // Preparar datos para el gráfico de modelos (top 5)
  const modelData = Object.entries(stats.modelDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({
      name,
      value,
    }));

  // Preparar datos para el gráfico de cumplimiento
  const complianceData = [
    { name: "Cumplen", value: stats.meetingRequirements },
    { name: "No Cumplen", value: stats.notMeetingRequirements },
  ];

  // Preparar datos para el gráfico de razones de incumplimiento (top 5)
  const reasonsData = Object.entries(stats.failureReasons)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({
      name: name.length > 30 ? name.substring(0, 30) + "..." : name,
      value,
      fullName: name, // Para mostrar el nombre completo en el tooltip
    }));

  // Si hay datos de generación, preparar gráfico de generaciones
  let generationData = [];
  if (stats.generationDistribution) {
    generationData = Object.entries(stats.generationDistribution)
      .filter(([name]) => name !== "N/A")
      .sort((a, b) => {
        // Intentar extraer número de generación para ordenar
        const aMatch = a[0].match(/(\d+)/);
        const bMatch = b[0].match(/(\d+)/);
        const aNum = aMatch ? parseInt(aMatch[1]) : 0;
        const bNum = bMatch ? parseInt(bMatch[1]) : 0;
        return aNum - bNum;
      })
      .map(([name, value]) => ({
        name,
        value,
      }));
  }

  return (
    <div
      className={`mb-8 ${
        isDarkMode ? "bg-dark-bg-secondary" : "bg-white"
      } p-6 rounded-lg shadow-md`}
    >
      <h2 className="text-xl font-semibold mb-6">Estadísticas visuales</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gráfico de cumplimiento */}
        <div
          className={`${
            isDarkMode ? "bg-dark-bg-tertiary" : "bg-gray-50"
          } p-4 rounded-lg`}
        >
          <h3 className="text-lg font-medium mb-4 text-center">
            Cumplimiento de requisitos
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={complianceData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(1)}%`
                }
              >
                {complianceData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? "#4CAF50" : "#FF5252"}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value} equipos`, "Cantidad"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de distribución por marca */}
        <div
          className={`${
            isDarkMode ? "bg-dark-bg-tertiary" : "bg-gray-50"
          } p-4 rounded-lg`}
        >
          <h3 className="text-lg font-medium mb-4 text-center">
            Distribución por marca
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={brandData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDarkMode ? "#333" : "#e0e0e0"}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: isDarkMode ? "#d1d5db" : "#333" }}
              />
              <YAxis tick={{ fill: isDarkMode ? "#d1d5db" : "#333" }} />
              <Tooltip
                formatter={(value) => [`${value} equipos`, "Cantidad"]}
                contentStyle={{
                  backgroundColor: isDarkMode ? "#2d2d2d" : "#fff",
                  borderColor: isDarkMode ? "#444" : "#ccc",
                }}
              />
              <Bar dataKey="value" fill="#3F51B5">
                {brandData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de modelos principales */}
        <div
          className={`${
            isDarkMode ? "bg-dark-bg-tertiary" : "bg-gray-50"
          } p-4 rounded-lg`}
        >
          <h3 className="text-lg font-medium mb-4 text-center">
            Top 5 modelos de procesadores
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={modelData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDarkMode ? "#333" : "#e0e0e0"}
              />
              <XAxis
                type="number"
                tick={{ fill: isDarkMode ? "#d1d5db" : "#333" }}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={150}
                tick={{ fill: isDarkMode ? "#d1d5db" : "#333" }}
              />
              <Tooltip
                formatter={(value) => [`${value} equipos`, "Cantidad"]}
                contentStyle={{
                  backgroundColor: isDarkMode ? "#2d2d2d" : "#fff",
                  borderColor: isDarkMode ? "#444" : "#ccc",
                }}
              />
              <Bar dataKey="value" fill="#009688">
                {modelData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de razones de incumplimiento */}
        <div
          className={`${
            isDarkMode ? "bg-dark-bg-tertiary" : "bg-gray-50"
          } p-4 rounded-lg`}
        >
          <h3 className="text-lg font-medium mb-4 text-center">
            Principales motivos de incumplimiento
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={reasonsData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDarkMode ? "#333" : "#e0e0e0"}
              />
              <XAxis
                type="number"
                tick={{ fill: isDarkMode ? "#d1d5db" : "#333" }}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={150}
                tick={{ fill: isDarkMode ? "#d1d5db" : "#333" }}
              />
              <Tooltip
                formatter={(value, name, props) => [
                  `${value} equipos`,
                  props.payload.fullName,
                ]}
                contentStyle={{
                  backgroundColor: isDarkMode ? "#2d2d2d" : "#fff",
                  borderColor: isDarkMode ? "#444" : "#ccc",
                }}
              />
              <Bar dataKey="value" fill="#E91E63">
                {reasonsData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de distribución por generación */}
      {generationData.length > 0 && (
        <div
          className={`mt-8 ${
            isDarkMode ? "bg-dark-bg-tertiary" : "bg-gray-50"
          } p-4 rounded-lg`}
        >
          <h3 className="text-lg font-medium mb-4 text-center">
            Distribución por generación
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={generationData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDarkMode ? "#333" : "#e0e0e0"}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: isDarkMode ? "#d1d5db" : "#333" }}
              />
              <YAxis tick={{ fill: isDarkMode ? "#d1d5db" : "#333" }} />
              <Tooltip
                formatter={(value) => [`${value} equipos`, "Cantidad"]}
                contentStyle={{
                  backgroundColor: isDarkMode ? "#2d2d2d" : "#fff",
                  borderColor: isDarkMode ? "#444" : "#ccc",
                }}
              />
              <Bar dataKey="value" fill="#673AB7">
                {generationData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráfico de distribución por velocidad */}
      <div className="mt-8">
        <SpeedDistributionChart normalizedData={normalizedData} />
      </div>

      {/* Gráfico de distribución de RAM */}
      {stats.ram && stats.ram.total > 0 && (
        <div
          className={`mt-8 ${
            isDarkMode ? "bg-dark-bg-tertiary" : "bg-gray-50"
          } p-4 rounded-lg`}
        >
          <h3 className="text-lg font-medium mb-4 text-center">
            Distribución por capacidad de RAM
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={Object.entries(stats.ram.distribution)
                .map(([size, count]) => ({
                  name: `${size} GB`,
                  value: count,
                }))
                .sort((a, b) => parseFloat(a.name) - parseFloat(b.name))}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDarkMode ? "#333" : "#e0e0e0"}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: isDarkMode ? "#d1d5db" : "#333" }}
              />
              <YAxis tick={{ fill: isDarkMode ? "#d1d5db" : "#333" }} />
              <Tooltip
                formatter={(value) => [`${value} equipos`, "Cantidad"]}
                contentStyle={{
                  backgroundColor: isDarkMode ? "#2d2d2d" : "#fff",
                  borderColor: isDarkMode ? "#444" : "#ccc",
                }}
              />
              <Bar dataKey="value" fill="#3F51B5">
                {Object.entries(stats.ram.distribution)
                  .map(([size, count]) => ({
                    name: `${size} GB`,
                    value: count,
                  }))
                  .sort((a, b) => parseFloat(a.name) - parseFloat(b.name))
                  .map((entry, index) => (
                    <Cell
                      key={`cell-ram-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráfico de distribución por tipo de almacenamiento */}
      {stats.storage && stats.storage.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div
            className={`${
              isDarkMode ? "bg-dark-bg-tertiary" : "bg-gray-50"
            } p-4 rounded-lg`}
          >
            <h3 className="text-lg font-medium mb-4 text-center">
              Distribución por tipo de disco
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={Object.entries(stats.storage.byType).map(
                    ([name, value]) => ({
                      name,
                      value,
                    })
                  )}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(1)}%`
                  }
                >
                  {Object.entries(stats.storage.byType).map(
                    ([name, value], index) => (
                      <Cell
                        key={`cell-storage-type-${index}`}
                        fill={
                          name === "SSD"
                            ? "#4CAF50"
                            : name === "HDD"
                            ? "#FF9800"
                            : "#9E9E9E"
                        }
                      />
                    )
                  )}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} equipos`, "Cantidad"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de capacidades más comunes */}
          <div
            className={`${
              isDarkMode ? "bg-dark-bg-tertiary" : "bg-gray-50"
            } p-4 rounded-lg`}
          >
            <h3 className="text-lg font-medium mb-4 text-center">
              Capacidades de almacenamiento más comunes
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={Object.entries(stats.storage.byCapacity)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([capacity, count]) => ({
                    name:
                      capacity >= 1000
                        ? `${capacity / 1000} TB`
                        : `${capacity} GB`,
                    value: count,
                  }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDarkMode ? "#333" : "#e0e0e0"}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: isDarkMode ? "#d1d5db" : "#333" }}
                />
                <YAxis tick={{ fill: isDarkMode ? "#d1d5db" : "#333" }} />
                <Tooltip
                  formatter={(value) => [`${value} equipos`, "Cantidad"]}
                  contentStyle={{
                    backgroundColor: isDarkMode ? "#2d2d2d" : "#fff",
                    borderColor: isDarkMode ? "#444" : "#ccc",
                  }}
                />
                <Bar dataKey="value" fill="#673AB7">
                  {Object.entries(stats.storage.byCapacity)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map((_, index) => (
                      <Cell
                        key={`cell-storage-cap-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsCharts;
