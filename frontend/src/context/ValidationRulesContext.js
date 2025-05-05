// context/ValidationRulesContext.js
import React, { createContext, useState, useEffect } from "react";

// Reglas predeterminadas
const defaultRules = {
  intelCore: {
    i5: {
      minGeneration: 8,
      minSpeed: 3.0,
      name: "Intel Core i5",
    },
    i7: {
      minGeneration: 7,
      minSpeed: 0, // Cualquier velocidad
      name: "Intel Core i7",
    },
    i9: {
      minGeneration: 0, // Cualquier generación
      minSpeed: 0, // Cualquier velocidad
      name: "Intel Core i9",
    },
  },
  amdRyzen: {
    ryzen5: {
      minGeneration: 0, // Cualquier generación
      minSpeed: 3.7,
      name: "AMD Ryzen 5",
    },
    ryzen7: {
      minGeneration: 0, // Cualquier generación
      minSpeed: 0, // Cualquier velocidad
      name: "AMD Ryzen 7",
    },
    ryzen9: {
      minGeneration: 0, // Cualquier generación
      minSpeed: 0, // Cualquier velocidad
      name: "AMD Ryzen 9",
    },
  },
  otherProcessors: {
    intelXeon: {
      enabled: true,
      minGeneration: 0, // Cualquier generación
      minSpeed: 0, // Cualquier velocidad
      name: "Intel Xeon (E5 v3+, E7 v3+, series Gold/Silver/Bronze)",
    },
    amdEpyc: {
      enabled: true,
      minGeneration: 0, // Cualquier generación
      minSpeed: 0, // Cualquier velocidad
      name: "AMD EPYC",
    },
    intelCeleron: {
      enabled: false,
      minGeneration: 0,
      minSpeed: 0,
      name: "Intel Celeron",
    },
    intelPentium: {
      enabled: false,
      minGeneration: 0,
      minSpeed: 0,
      name: "Intel Pentium",
    },
    amdAthlon: {
      enabled: false,
      minGeneration: 0,
      minSpeed: 0,
      name: "AMD Athlon",
    },
  },
  // Nuevas reglas para RAM
  ram: {
    minCapacity: 8, // Mínimo 8GB de RAM
    name: "Memoria RAM",
  },
  // Nuevas reglas para almacenamiento
  storage: {
    minCapacity: 256, // Mínimo 256GB de almacenamiento
    preferSSD: true, // Preferir SSD sobre HDD
    name: "Almacenamiento",
  },
};

// Crear el contexto
export const ValidationRulesContext = createContext();

export const ValidationRulesProvider = ({ children }) => {
  // Cargar reglas guardadas o usar predeterminadas
  const [rules, setRules] = useState(() => {
    try {
      const storedRules = localStorage.getItem("validationRules");
      if (storedRules) {
        const parsedRules = JSON.parse(storedRules);
        // Asegurarse de que las secciones RAM y almacenamiento existan
        return {
          ...defaultRules,
          ...parsedRules,
          ram: {
            ...defaultRules.ram,
            ...(parsedRules.ram || {}),
          },
          storage: {
            ...defaultRules.storage,
            ...(parsedRules.storage || {}),
          },
        };
      }
      return defaultRules;
    } catch (error) {
      console.error("Error al cargar reglas:", error);
      return defaultRules;
    }
  });

  // Guardar reglas cuando cambien
  useEffect(() => {
    localStorage.setItem("validationRules", JSON.stringify(rules));
  }, [rules]);

  // Función para actualizar reglas
  const updateRules = (newRules) => {
    setRules(newRules);
  };

  // Función para restablecer reglas predeterminadas
  const resetRules = () => {
    setRules(defaultRules);
  };

  // Función para exportar reglas a JSON
  const exportRules = () => {
    const dataStr = JSON.stringify(rules, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = "hardware_validation_rules.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  // Función para importar reglas desde archivo JSON
  const importRules = (jsonFile) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedRules = JSON.parse(e.target.result);

        // Validar la estructura básica
        if (
          importedRules.intelCore &&
          importedRules.amdRyzen &&
          importedRules.otherProcessors
        ) {
          // Asegurarse de que las secciones RAM y almacenamiento existan
          const mergedRules = {
            ...defaultRules,
            ...importedRules,
            ram: {
              ...defaultRules.ram,
              ...(importedRules.ram || {}),
            },
            storage: {
              ...defaultRules.storage,
              ...(importedRules.storage || {}),
            },
          };

          setRules(mergedRules);
          return { success: true, message: "Reglas importadas correctamente" };
        } else {
          return {
            success: false,
            message: "El archivo no contiene un formato válido de reglas",
          };
        }
      } catch (error) {
        return {
          success: false,
          message: `Error al importar: ${error.message}`,
        };
      }
    };
    reader.readAsText(jsonFile);
  };

  return (
    <ValidationRulesContext.Provider
      value={{
        rules,
        updateRules,
        resetRules,
        exportRules,
        importRules,
      }}
    >
      {children}
    </ValidationRulesContext.Provider>
  );
};
