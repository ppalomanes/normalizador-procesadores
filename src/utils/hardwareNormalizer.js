/**
 * Normaliza y clasifica información de memoria RAM
 * @param {string} ramInfo - Texto que describe la memoria RAM
 * @returns {Object} Objeto con la información normalizada
 */
export const normalizeRAM = (ramInfo) => {
  if (!ramInfo || typeof ramInfo !== "string") {
    return {
      original: ramInfo || "",
      normalized: "Desconocido",
      capacityGB: 0,
      type: "Desconocido",
    };
  }

  // Guardar el texto original
  const original = ramInfo.trim();

  // Limpiar el texto
  let cleaned = ramInfo
    .replace(/\(.*?\)/g, " ") // Eliminar texto entre paréntesis
    .replace(/\[.*?\]/g, " ") // Eliminar texto entre corchetes
    .replace(/\s+/g, " ") // Reemplazar múltiples espacios por uno solo
    .trim()
    .toLowerCase();

  // Buscar capacidad con patrones
  let capacityGB = 0;

  // 1. Primero buscar GB explícitos
  let capacityMatch =
    cleaned.match(/(\d+[\.,]\d+)\s*gb/i) ||
    cleaned.match(/(\d+[\.,]\d+)\s*g\b/i) ||
    cleaned.match(/(\d+[\.,]\d+)\s*gigabytes/i) ||
    cleaned.match(/(\d+[\.,]\d+)\s*gigas/i) ||
    cleaned.match(/(\d+)\s*gb/i) ||
    cleaned.match(/(\d+)\s*g\b/i) ||
    cleaned.match(/(\d+)\s*gigabytes/i) ||
    cleaned.match(/(\d+)\s*gigas/i);

  if (capacityMatch) {
    const rawCapacity = parseFloat(capacityMatch[1].replace(",", "."));
    capacityGB = rawCapacity;
  } else {
    // 2. Buscar en MB y convertir
    const mbMatch =
      cleaned.match(/(\d+[\.,]\d+)\s*mb/i) ||
      cleaned.match(/(\d+[\.,]\d+)\s*m\b/i) ||
      cleaned.match(/(\d+[\.,]\d+)\s*megabytes/i) ||
      cleaned.match(/(\d+)\s*mb/i) ||
      cleaned.match(/(\d+)\s*m\b/i) ||
      cleaned.match(/(\d+)\s*megabytes/i);

    if (mbMatch) {
      const mbValue = parseFloat(mbMatch[1].replace(",", "."));
      capacityGB = mbValue / 1024;
    } else {
      // 3. Detectar valor numérico sin unidades
      const numericMatch = cleaned.match(/^(\d+[\.,]?\d*)$/);
      if (numericMatch) {
        const value = parseFloat(numericMatch[1].replace(",", "."));

        // Aplicar heurística basada en el valor:
        if (value <= 64) {
          capacityGB = value; // Probablemente GB
        } else if (value <= 65536) {
          capacityGB = value / 1024; // Probablemente MB
        } else {
          capacityGB = value / (1024 * 1024); // Probablemente KB
        }
      } else {
        // 4. Buscar formatos mal escritos (como "16gGB")
        const malformedMatch =
          cleaned.match(/(\d+)g+\s*gb/i) ||
          cleaned.match(/(\d+)g+\s*g\b/i) ||
          cleaned.match(/(\d+)g+\s*gigabytes/i) ||
          cleaned.match(/(\d+)g+\s*gigas/i);

        if (malformedMatch) {
          capacityGB = parseInt(malformedMatch[1], 10);
        }
      }
    }
  }

  // Redondear a valores comunes de RAM
  if (capacityGB > 0) {
    capacityGB = roundToCommonRAMSize(capacityGB);
  }

  // Detectar tipo de memoria
  let type = "DDR";
  if (/ddr4/i.test(cleaned)) {
    type = "DDR4";
  } else if (/ddr3/i.test(cleaned)) {
    type = "DDR3";
  } else if (/ddr5/i.test(cleaned)) {
    type = "DDR5";
  } else if (/ddr2/i.test(cleaned)) {
    type = "DDR2";
  }

  // Detectar velocidad
  let speed = null;
  const speedMatch =
    cleaned.match(/(\d+)\s*mhz/i) || cleaned.match(/(\d+)\s*hz/i);
  if (speedMatch) {
    speed = parseInt(speedMatch[1], 10);
  }

  // Normalizar texto
  let normalized = `${capacityGB} GB`;
  if (type !== "DDR") {
    normalized += ` ${type}`;
  }
  if (speed) {
    normalized += ` ${speed} MHz`;
  }

  return {
    original,
    normalized,
    capacityGB,
    type,
    speed,
  };
};

/**
 * Función auxiliar para redondear a tamaños comunes de RAM
 * @param {number} sizeGB - Tamaño en GB a redondear
 * @returns {number} Tamaño redondeado a un valor común de RAM
 */
function roundToCommonRAMSize(sizeGB) {
  // La RAM viene siempre en potencias de 2 o combinaciones
  const commonSizes = [2, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128, 256, 512];

  // Regla especial: valores menores a 4 siempre redondean a 4 (mínimo común hoy en día)
  if (sizeGB > 0 && sizeGB < 4) return 4;

  // Encontrar el valor común más cercano
  let closest = commonSizes[0];
  let minDiff = Math.abs(sizeGB - closest);

  for (let i = 1; i < commonSizes.length; i++) {
    const diff = Math.abs(sizeGB - commonSizes[i]);
    if (diff < minDiff) {
      minDiff = diff;
      closest = commonSizes[i];
    }
  }

  return closest;
}

/**
 * Normaliza y clasifica información de almacenamiento
 * @param {string} storageInfo - Texto que describe el almacenamiento
 * @returns {Object} Objeto con la información normalizada
 */
export const normalizeStorage = (storageInfo) => {
  if (!storageInfo || typeof storageInfo !== "string") {
    return {
      original: storageInfo || "",
      normalized: "Desconocido",
      capacityGB: 0,
      type: "Desconocido",
    };
  }

  // Guardar el texto original
  const original = storageInfo.trim();

  // Limpiar el texto
  let cleaned = storageInfo
    .replace(/\(.*?\)/g, " ") // Eliminar texto entre paréntesis
    .replace(/\[.*?\]/g, " ") // Eliminar texto entre corchetes
    .replace(/\s+/g, " ") // Reemplazar múltiples espacios por uno solo
    .trim()
    .toLowerCase();

  // Detectar el tipo de almacenamiento
  let type = "Desconocido";
  if (
    /\bssd\b/i.test(cleaned) ||
    /estado\s*solido/i.test(cleaned) ||
    /solid\s*state/i.test(cleaned)
  ) {
    type = "SSD";
  } else if (
    /\bhdd\b/i.test(cleaned) ||
    /disco\s*duro/i.test(cleaned) ||
    /hard\s*drive/i.test(cleaned) ||
    /mechanical/i.test(cleaned)
  ) {
    type = "HDD";
  }

  // Buscar capacidad con patrones
  let capacityGB = 0;

  // Corregir abreviaturas erróneas como "TR" a "TB"
  cleaned = cleaned.replace(/\b1\s*tr\b/i, "1 tb");

  // Buscar patrones de TB primero
  let tbMatch =
    cleaned.match(/(\d+[\.,]\d+)\s*tb/i) ||
    cleaned.match(/(\d+[\.,]\d+)\s*t\b/i) ||
    cleaned.match(/(\d+[\.,]\d+)\s*terabytes/i) ||
    cleaned.match(/(\d+)\s*tb/i) ||
    cleaned.match(/(\d+)\s*t\b/i) ||
    cleaned.match(/(\d+)\s*terabytes/i);

  if (tbMatch) {
    // Convertir TB a GB
    const tbValue = parseFloat(tbMatch[1].replace(",", "."));
    capacityGB = tbValue * 1024;
  } else {
    // Si no encuentra TB, buscar GB
    let gbMatch =
      cleaned.match(/(\d+[\.,]\d+)\s*gb/i) ||
      cleaned.match(/(\d+[\.,]\d+)\s*g\b/i) ||
      cleaned.match(/(\d+[\.,]\d+)\s*gigabytes/i) ||
      cleaned.match(/(\d+)\s*gb/i) ||
      cleaned.match(/(\d+)\s*g\b/i) ||
      cleaned.match(/(\d+)\s*gigabytes/i);

    if (gbMatch) {
      capacityGB = parseFloat(gbMatch[1].replace(",", "."));
    } else {
      // Buscar formatos como "500 SSD", "120 SSD", etc.
      const storagePattern = /^(\d+)\s*(ssd|hdd|nvme|m\.2)?$/i;
      const storageMatch = cleaned.match(storagePattern);

      if (storageMatch) {
        capacityGB = parseFloat(storageMatch[1]);

        // Si solo indica el tipo sin tamaño específico, usar el tipo
        if (storageMatch[2] && !type) {
          type = storageMatch[2].toUpperCase();
        }
      } else {
        // Si no encuentra unidades, verificar si es solo un número
        const numericMatch = cleaned.match(/^(\d+[\.,]?\d*)$/);
        if (numericMatch) {
          const value = parseFloat(numericMatch[1].replace(",", "."));
          capacityGB = value; // Asumir que es GB directamente
        }
      }
    }
  }

  // Redondear a valores comerciales comunes
  const commercialCapacityGB = roundToCommercialStorage(capacityGB);

  // Normalizar texto
  let normalized = "";
  let displayCapacity = commercialCapacityGB;

  // Convertir a TB si es 1TB o más
  if (commercialCapacityGB >= 1000) {
    displayCapacity = Math.round(commercialCapacityGB / 102.4) / 10; // Dividir por 1024 y redondear a 1 decimal
    normalized = `${displayCapacity} TB`;
  } else {
    normalized = `${displayCapacity} GB`;
  }

  if (type !== "Desconocido") {
    normalized += ` ${type}`;
  }

  return {
    original,
    normalized,
    capacityGB: commercialCapacityGB, // Guardar el valor redondeado
    displayCapacity, // Guardar el valor que se muestra
    displayUnit: commercialCapacityGB >= 1000 ? "TB" : "GB",
    type,
  };
};

/**
 * Redondea una capacidad en GB a un valor comercial común
 * @param {number} sizeGB - Tamaño en GB
 * @returns {number} Tamaño redondeado a valor comercial
 */
function roundToCommercialStorage(sizeGB) {
  // Manejar valores no válidos o cero
  if (!sizeGB || isNaN(sizeGB) || sizeGB <= 0) {
    return 0;
  }

  // Lista de capacidades comerciales comunes en GB
  const commercialSizes = [
    16, 32, 60, 64, 120, 128, 240, 250, 256, 320, 480, 500, 512, 640, 750, 1000,
    1024, 2000, 2048, 3000, 4000,
  ];

  // Aproximación a valores de SSD comunes
  const ssdSizes = [120, 128, 240, 250, 256, 480, 500, 512, 1000, 1024, 2000];

  // Aproximación a valores de HDD comunes
  const hddSizes = [250, 320, 500, 640, 750, 1000, 2000, 3000, 4000];

  // Si es más de 1 TB, manejarlo de manera especial
  if (sizeGB >= 900) {
    // Redondear a TB
    const sizeInTB = sizeGB / 1024;

    // Si está cerca de un número entero de TB, redondearlo a ese valor
    if (Math.abs(Math.round(sizeInTB) - sizeInTB) < 0.2) {
      return Math.round(sizeInTB) * 1000; // Convertir a GB usando base 1000
    }

    // Si está entre 900 GB y 1.1 TB, considerar como 1 TB
    if (sizeGB >= 900 && sizeGB < 1126) {
      return 1000; // 1 TB en GB
    }

    // Para valores mayores, redondear al TB más cercano
    return Math.round(sizeInTB) * 1000;
  }

  // Casos específicos basados en rangos comunes para evitar valores erróneos
  if (sizeGB > 0 && sizeGB <= 20) return 16; // Muy pequeños probablemente son 16GB
  if (sizeGB > 20 && sizeGB < 50) return 32; // Entre 20-50GB son probablemente 32GB
  if (sizeGB >= 50 && sizeGB < 80) return 64; // Entre 50-80GB son probablemente 64GB
  if (sizeGB >= 80 && sizeGB < 130) return 120; // Entre 80-130GB son probablemente 120/128GB
  if (sizeGB >= 130 && sizeGB < 220) return 128; // Algunos valores cercanos a 128
  if (sizeGB >= 220 && sizeGB < 280) return 250; // Entre 220-280GB son probablemente 250/256GB
  if (sizeGB >= 280 && sizeGB < 400) return 320; // Entre 280-400GB son probablemente 320GB
  if (sizeGB >= 400 && sizeGB < 490) return 480; // Entre 400-490GB son probablemente 480/500GB
  if (sizeGB >= 490 && sizeGB < 600) return 500; // ~500GB
  if (sizeGB >= 600 && sizeGB < 800) return 750; // ~750GB

  // Para valores que no encajan en los casos específicos,
  // encontrar el valor comercial más cercano con un sesgo hacia tamaños comunes
  let closest = commercialSizes[0];
  let minDiff = Math.abs(sizeGB - closest);

  // Preferir tamaños HDD más comunes para valores grandes (>=200GB)
  const preferredSizes = sizeGB >= 200 ? hddSizes : ssdSizes;

  // Primero intentar con tamaños preferidos
  for (const size of preferredSizes) {
    const diff = Math.abs(sizeGB - size);
    // Usar un umbral de 15% para decidir si un valor está "cerca"
    if (diff / size < 0.15) {
      return size;
    }
  }

  // Si no hay coincidencia cercana con los preferidos, buscar el más cercano de todos
  for (let i = 1; i < commercialSizes.length; i++) {
    const diff = Math.abs(sizeGB - commercialSizes[i]);
    if (diff < minDiff) {
      minDiff = diff;
      closest = commercialSizes[i];
    }
  }

  return closest;
}

/**
 * Valida si la RAM cumple con los requisitos mínimos
 * @param {Object} ramData - Datos normalizados de RAM
 * @param {Object} rules - Reglas de validación (opcional)
 * @returns {Object} Resultado de la validación
 */
export const validateRAM = (ramData, rules = null) => {
  // Intentar cargar reglas si no se proporcionan
  if (!rules) {
    try {
      const storedRules = localStorage.getItem("validationRules");
      if (storedRules) {
        rules = JSON.parse(storedRules);
      }
    } catch (error) {
      console.error("Error al cargar reglas:", error);
    }
  }

  // Establecer reglas predeterminadas si no hay reglas
  if (!rules || !rules.ram) {
    rules = {
      ...rules,
      ram: {
        minCapacity: 8,
        name: "Memoria RAM",
      },
    };
  }

  const { capacityGB } = ramData;
  const minCapacity = rules.ram.minCapacity || 8;

  const meetsRequirements = capacityGB >= minCapacity;

  return {
    meetsRequirements,
    reason: meetsRequirements
      ? ""
      : `Capacidad insuficiente: ${capacityGB} GB (requiere ${minCapacity} GB o más)`,
  };
};

/**
 * Valida si el almacenamiento cumple con los requisitos mínimos
 * @param {Object} storageData - Datos normalizados de almacenamiento
 * @param {Object} rules - Reglas de validación (opcional)
 * @returns {Object} Resultado de la validación
 */
export const validateStorage = (storageData, rules = null) => {
  // Intentar cargar reglas si no se proporcionan
  if (!rules) {
    try {
      const storedRules = localStorage.getItem("validationRules");
      if (storedRules) {
        rules = JSON.parse(storedRules);
      }
    } catch (error) {
      console.error("Error al cargar reglas:", error);
    }
  }

  // Establecer reglas predeterminadas si no hay reglas
  if (!rules || !rules.storage) {
    rules = {
      ...rules,
      storage: {
        minCapacity: 256,
        preferSSD: true,
        name: "Almacenamiento",
      },
    };
  }

  // Obtener la capacidad real en GB y el tipo
  const { capacityGB, type } = storageData;
  const minCapacity = rules.storage?.minCapacity || 256;
  const preferSSD = rules.storage?.preferSSD || false;

  // Comprobar si cumple con los requisitos
  let meetsRequirements = capacityGB >= minCapacity;
  let reason = "";

  if (!meetsRequirements) {
    // Si no cumple con la capacidad mínima
    if (capacityGB >= 1000) {
      // Si está en TB, mostrar en TB
      reason = `Capacidad insuficiente: ${(capacityGB / 1000).toFixed(
        1
      )} TB (requiere ${
        minCapacity >= 1000
          ? (minCapacity / 1000).toFixed(1) + " TB"
          : minCapacity + " GB"
      } o más)`;
    } else {
      reason = `Capacidad insuficiente: ${capacityGB} GB (requiere ${
        minCapacity >= 1000
          ? (minCapacity / 1000).toFixed(1) + " TB"
          : minCapacity + " GB"
      } o más)`;
    }
  } else if (preferSSD && type !== "SSD") {
    // Si cumple con la capacidad pero se requiere SSD y no lo es
    meetsRequirements = false;
    reason = "Se requiere SSD pero se detectó otro tipo de almacenamiento";
  }

  return {
    meetsRequirements,
    reason,
  };
};
