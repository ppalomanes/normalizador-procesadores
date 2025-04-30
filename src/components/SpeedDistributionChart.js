// components/SpeedDistributionChart.js
import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const SpeedDistributionChart = ({ normalizedData }) => {
  const { isDarkMode } = useContext(ThemeContext);

  // No renderizar si no hay datos
  if (!normalizedData || normalizedData.length === 0) {
    return null;
  }

  // Función para extraer valor numérico de velocidad
  const getSpeedValue = (speedText) => {
    if (!speedText || speedText === "N/A") return null;
    const match = speedText.match(/(\d+\.\d+)/);
    return match ? parseFloat(match[1]) : null;
  };

  // Agrupar procesadores por velocidad en intervalos de 0.5 GHz
  const getSpeedDistribution = () => {
    const speeds = {};

    // Primero extraemos todos los valores de velocidad válidos
    const validSpeeds = normalizedData
      .map((item) => getSpeedValue(item["Velocidad"]))
      .filter((speed) => speed !== null);

    if (validSpeeds.length === 0) return [];

    // Encontrar el mínimo y máximo para definir intervalos
    const minSpeed = Math.floor(Math.min(...validSpeeds));
    const maxSpeed = Math.ceil(Math.max(...validSpeeds));

    // Crear intervalos de 0.5 GHz
    for (let i = minSpeed; i <= maxSpeed; i += 0.5) {
      const intervalLabel = `${i.toFixed(1)}-${(i + 0.5).toFixed(1)} GHz`;
      speeds[intervalLabel] = {
        min: i,
        max: i + 0.5,
        count: 0,
        compliant: 0,
        nonCompliant: 0,
      };
    }

    // Contar procesadores por intervalo
    normalizedData.forEach((item) => {
      const speedValue = getSpeedValue(item["Velocidad"]);
      if (speedValue === null) return;

      // Encontrar el intervalo al que pertenece
      for (const interval in speeds) {
        const { min, max } = speeds[interval];
        if (speedValue >= min && speedValue < max) {
          speeds[interval].count += 1;

          // Contar si cumple o no requisitos
          if (item["Cumple Requisitos"] === "Sí") {
            speeds[interval].compliant += 1;
          } else {
            speeds[interval].nonCompliant += 1;
          }
          break;
        }
      }
    });

    // Convertir a array para gráfico
    return Object.keys(speeds)
      .filter((key) => speeds[key].count > 0) // Solo mostrar intervalos con datos
      .map((key) => ({
        name: key,
        total: speeds[key].count,
        compliant: speeds[key].compliant,
        nonCompliant: speeds[key].nonCompliant,
      }));
  };

  const data = getSpeedDistribution();

  return (
    <div
      className={`p-4 rounded-lg ${
        isDarkMode ? "bg-dark-bg-tertiary" : "bg-gray-50"
      } mb-4`}
    >
      <h3 className="text-lg font-medium mb-3">
        Distribución por velocidad de procesador
      </h3>
      <div style={{ height: "300px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 70,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDarkMode ? "#333333" : "#e0e0e0"}
            />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={70}
              tick={{ fill: isDarkMode ? "#d1d5db" : "#333333" }}
            />
            <YAxis tick={{ fill: isDarkMode ? "#d1d5db" : "#333333" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDarkMode ? "#2d2d2d" : "#fff",
                borderColor: isDarkMode ? "#3f3f46" : "#ccc",
                color: isDarkMode ? "#f3f4f6" : "#333",
              }}
              formatter={(value, name) => {
                const label =
                  name === "compliant"
                    ? "Cumplen requisitos"
                    : name === "nonCompliant"
                    ? "No cumplen requisitos"
                    : "Total";
                return [value, label];
              }}
            />
            <Legend
              formatter={(value) => {
                return value === "compliant"
                  ? "Cumplen requisitos"
                  : value === "nonCompliant"
                  ? "No cumplen requisitos"
                  : "Total";
              }}
            />
            <Bar
              name="total"
              dataKey="total"
              fill="#8884d8"
              fillOpacity={0.3}
              stroke="#8884d8"
              strokeWidth={1}
            />
            <Bar
              name="compliant"
              dataKey="compliant"
              fill="#4CAF50"
              stackId="stack"
            />
            <Bar
              name="nonCompliant"
              dataKey="nonCompliant"
              fill="#FF5252"
              stackId="stack"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">
        Este gráfico muestra la distribución de procesadores por velocidad,
        indicando cuántos cumplen con los requisitos mínimos en cada rango.
      </p>
    </div>
  );
};

export default SpeedDistributionChart;
