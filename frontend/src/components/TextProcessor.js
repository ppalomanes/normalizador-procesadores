// components/TextProcessor.js
import React, { useState, useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { ValidationRulesContext } from "../context/ValidationRulesContext";
import { normalizeProcessor } from "../utils/processorNormalizer";
import { Terminal, Check, X, ClipboardCopy, Send } from "lucide-react";

const TextProcessor = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const { rules } = useContext(ValidationRulesContext);
  const [inputText, setInputText] = useState("");
  const [results, setResults] = useState([]);
  const [copied, setCopied] = useState(false);

  // Procesar entrada de texto
  const processText = () => {
    if (!inputText.trim()) return;

    // Dividir por líneas y procesar cada una
    const lines = inputText.split("\n").filter((line) => line.trim());
    const processedResults = lines.map((line) => {
      try {
        return normalizeProcessor(line, rules);
      } catch (error) {
        console.error("Error al procesar:", error);
        return {
          original: line,
          normalized: "Error al procesar",
          meetsRequirements: false,
          reason: error.message || "Error desconocido",
        };
      }
    });

    setResults(processedResults);
  };

  // Copiar resultados al portapapeles
  const copyResults = () => {
    if (results.length === 0) return;

    const formattedResults = results
      .map(
        (result) =>
          `Original: ${result.original}\nNormalizado: ${
            result.normalized
          }\nCumple requisitos: ${result.meetsRequirements ? "Sí" : "No"}${
            result.reason ? "\nMotivo: " + result.reason : ""
          }`
      )
      .join("\n\n");

    navigator.clipboard
      .writeText(formattedResults)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Error al copiar:", err);
      });
  };

  return (
    <div
      className={`mb-8 ${
        isDarkMode ? "bg-dark-bg-secondary" : "bg-white"
      } p-6 rounded-lg shadow-md`}
    >
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Terminal
          className="mr-2 text-purple-600 dark:text-purple-400"
          size={22}
        />
        Procesador de texto rápido
      </h2>

      <p
        className={`mb-4 ${
          isDarkMode ? "text-dark-text-secondary" : "text-gray-600"
        }`}
      >
        Ingrese uno o más textos que describan procesadores (uno por línea) para
        normalizarlos y verificar si cumplen con los requisitos configurados.
      </p>

      <div className="mb-4">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ejemplo: Intel Core i5-8500 @ 3.00GHz&#10;AMD Ryzen 7 5800X&#10;Intel(R) Core(TM) i3-7100 CPU @ 3.90GHz"
          className={`w-full p-3 border rounded-lg ${
            isDarkMode
              ? "bg-dark-bg-tertiary border-dark-border text-dark-text-primary"
              : "border-gray-300"
          } min-h-[120px]`}
        />
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={processText}
          disabled={!inputText.trim()}
          className={`inline-flex items-center px-4 py-2 ${
            !inputText.trim()
              ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
              : isDarkMode
              ? "bg-purple-700 hover:bg-purple-800 text-white"
              : "bg-purple-600 hover:bg-purple-700 text-white"
          } rounded-lg focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors`}
        >
          <Send className="mr-2" size={18} />
          Procesar
        </button>

        <button
          onClick={copyResults}
          disabled={results.length === 0}
          className={`inline-flex items-center px-4 py-2 ${
            results.length === 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
              : isDarkMode
              ? "bg-blue-700 hover:bg-blue-800 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          } rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors`}
        >
          <ClipboardCopy className="mr-2" size={18} />
          {copied ? "Copiado!" : "Copiar resultados"}
        </button>
      </div>

      {/* Resultados */}
      {results.length > 0 && (
        <div
          className={`border rounded-lg ${
            isDarkMode ? "border-dark-border" : "border-gray-200"
          }`}
        >
          <div
            className={`p-3 border-b ${
              isDarkMode
                ? "border-dark-border bg-dark-bg-tertiary"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <h3 className="font-medium">Resultados ({results.length})</h3>
          </div>

          <div
            className={`divide-y ${
              isDarkMode ? "divide-dark-border" : "divide-gray-200"
            }`}
          >
            {results.map((result, index) => (
              <div key={index} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium">{result.original}</div>
                  <div
                    className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      result.meetsRequirements
                        ? isDarkMode
                          ? "bg-green-900 text-green-200"
                          : "bg-green-100 text-green-800"
                        : isDarkMode
                        ? "bg-red-900 text-red-200"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {result.meetsRequirements ? (
                      <>
                        <Check size={14} className="mr-1" /> Cumple
                      </>
                    ) : (
                      <>
                        <X size={14} className="mr-1" /> No cumple
                      </>
                    )}
                  </div>
                </div>

                <div
                  className={`mb-1 ${
                    isDarkMode ? "text-dark-text-secondary" : "text-gray-700"
                  }`}
                >
                  <span className="font-medium">Normalizado:</span>{" "}
                  {result.normalized}
                </div>

                {!result.meetsRequirements && result.reason && (
                  <div
                    className={`text-sm ${
                      isDarkMode ? "text-red-400" : "text-red-600"
                    }`}
                  >
                    <span className="font-medium">Motivo:</span> {result.reason}
                  </div>
                )}

                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span
                      className={`${
                        isDarkMode ? "text-dark-text-muted" : "text-gray-500"
                      }`}
                    >
                      Marca:
                    </span>{" "}
                    {result.brand}
                  </div>
                  <div>
                    <span
                      className={`${
                        isDarkMode ? "text-dark-text-muted" : "text-gray-500"
                      }`}
                    >
                      Modelo:
                    </span>{" "}
                    {result.model}
                  </div>
                  <div>
                    <span
                      className={`${
                        isDarkMode ? "text-dark-text-muted" : "text-gray-500"
                      }`}
                    >
                      Generación:
                    </span>{" "}
                    {result.generation || "N/A"}
                  </div>
                  <div>
                    <span
                      className={`${
                        isDarkMode ? "text-dark-text-muted" : "text-gray-500"
                      }`}
                    >
                      Velocidad:
                    </span>{" "}
                    {result.speed || "N/A"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TextProcessor;
