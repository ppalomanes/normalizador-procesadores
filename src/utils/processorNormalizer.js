// utils/processorNormalizer.js

/**
 * Normaliza y clasifica información de procesadores
 * @param {string} processor - Texto que describe el procesador
 * @param {Object} customRules - Reglas personalizadas de validación (opcional)
 * @returns {Object} Objeto con la información normalizada
 */
export const normalizeProcessor = (processor, customRules = null) => {
  // Intentar cargar reglas personalizadas del localStorage si no se proporcionan
  if (!customRules) {
    try {
      const storedRules = localStorage.getItem("validationRules");
      if (storedRules) {
        customRules = JSON.parse(storedRules);
      }
    } catch (error) {
      console.error("Error al cargar reglas personalizadas:", error);
      // Continuar con la normalización sin reglas personalizadas
    }
  }

  if (!processor || typeof processor !== "string") {
    return {
      original: processor || "",
      brand: "Desconocido",
      model: "Desconocido",
      generation: null,
      speed: null,
      normalized: "Desconocido",
      meetsRequirements: false,
      reason: "Datos de procesador no válidos",
    };
  }

  // Eliminar caracteres y palabras innecesarias
  let cleaned = processor
    .replace(/\[.*?\]/g, "") // Eliminar texto entre corchetes
    .replace(/\(.*?\)/g, " ") // Eliminar texto entre paréntesis
    .replace(
      /processor|cpu|procesador|@|with|con|de|dual|quad|core|cores|núcleos/gi,
      " "
    ) // Eliminar palabras comunes
    .replace(/\bv\d+\b/gi, "") // Eliminar versiones como "v2"
    .replace(/\s+/g, " ") // Reemplazar múltiples espacios por uno solo
    .trim();

  // Variables para almacenar información extraída
  let brand = null;
  let model = null;
  let generation = null;
  let speed = null;
  let modelNumber = null;
  let architecture = null;
  let extraInfo = null;

  // Extraer marca con patrones mejorados
  if (/\b(?:intel|intell|inten)\b/i.test(cleaned)) {
    brand = "Intel";
  } else if (/\b(?:amd|advanced\s*micro\s*devices)\b/i.test(cleaned)) {
    brand = "AMD";
  } else if (/\b(?:qualcomm|snapdragon|snap\s*dragon)\b/i.test(cleaned)) {
    brand = "Qualcomm";
  } else if (/\b(?:apple|m1|m2|m3|a\d+)\b/i.test(cleaned)) {
    brand = "Apple";
  } else if (/\b(?:arm|mediatek|mt\d+)\b/i.test(cleaned)) {
    brand = "ARM";
  } else if (/\b(?:samsung|exynos)\b/i.test(cleaned)) {
    brand = "Samsung";
  } else {
    // Intentar detectar marca por contexto
    const knownBrands = [
      { pattern: /core\s*i[3579]/i, brand: "Intel" },
      { pattern: /pentium|celeron|xeon/i, brand: "Intel" },
      { pattern: /ryzen|phenom|athlon|threadripper|epyc/i, brand: "AMD" },
    ];

    for (const { pattern, brand: detectedBrand } of knownBrands) {
      if (pattern.test(cleaned)) {
        brand = detectedBrand;
        break;
      }
    }

    if (!brand) {
      brand = "Otro";
    }
  }

  // Extraer modelo con patrones más específicos
  if (brand === "Intel") {
    // Patrones para Intel Core
    if (/core\s*i[3579]/i.test(cleaned)) {
      // Identificar modelos i3, i5, i7, i9
      if (/i3/i.test(cleaned)) {
        model = "Core i3";
      } else if (/i5/i.test(cleaned)) {
        model = "Core i5";
      } else if (/i7/i.test(cleaned)) {
        model = "Core i7";
      } else if (/i9/i.test(cleaned)) {
        model = "Core i9";
      } else {
        model = "Core (otro)";
      }

      // Extraer número de modelo con patrones más flexibles
      // Buscar patrones como i5-10400F, i7 9700K, i3 8100, etc.
      const modelPatterns = [
        /i[3579][\s-]+(\d{3,5}[A-Z]*)/i, // i5-10400F, i7-9700K
        /i[3579][\s-]+(\d{1,2}\d{2,3}[A-Z]*)/i, // i5 10400F, i7 9700K
      ];

      for (const pattern of modelPatterns) {
        const match = cleaned.match(pattern);
        if (match) {
          modelNumber = match[1];
          break;
        }
      }

      // Extraer generación del número de modelo si está disponible
      if (modelNumber && /^\d{4}/.test(modelNumber)) {
        // Para modelos como 10400, 9700K, etc.
        const genNumber = modelNumber.charAt(0);
        if (/^\d$/.test(genNumber)) {
          generation = `${genNumber}th Gen`;
        }
      } else if (modelNumber && /^\d{3}/.test(modelNumber)) {
        // Para modelos de 3 dígitos como 980, 850, etc.
        const genChar = modelNumber.charAt(0);
        if (genChar) {
          generation = `${genChar}th Gen`;
        }
      }

      // Detectar arquitectura especial como F, K, T, H, U, etc.
      if (modelNumber && /[A-Z]$/.test(modelNumber)) {
        const suffix = modelNumber.match(/([A-Z]+)$/)[1];

        // Interpretar los sufijos más comunes
        const suffixMeaning = {
          K: "Desbloqueado",
          F: "Sin gráficos integrados",
          T: "Bajo consumo",
          U: "Ultra bajo consumo (móvil)",
          H: "Alto rendimiento (móvil)",
          S: "Especial",
          X: "Extreme",
          G: "Con gráficos discretos",
        };

        architecture = suffixMeaning[suffix] || `Sufijo ${suffix}`;
      }
    } else if (/celeron/i.test(cleaned)) {
      model = "Celeron";
      // Buscar modelo específico del Celeron con patrones mejorados
      const celeronPatterns = [
        /celeron\s+([a-z0-9-]+)/i,
        /celeron\s+(\w\d{3,4})/i,
      ];

      for (const pattern of celeronPatterns) {
        const match = cleaned.match(pattern);
        if (match) {
          modelNumber = match[1];
          break;
        }
      }
    } else if (/pentium/i.test(cleaned)) {
      model = "Pentium";
      // Buscar modelo específico del Pentium
      const pentiumPatterns = [
        /pentium\s+([a-z0-9-]+)/i,
        /pentium\s+(\w\d{3,4})/i,
        /pentium\s+(gold|silver)/i,
      ];

      for (const pattern of pentiumPatterns) {
        const match = cleaned.match(pattern);
        if (match) {
          modelNumber = match[1];
          break;
        }
      }
    } else if (/atom/i.test(cleaned)) {
      model = "Atom";
      // Buscar modelo específico del Atom
      const atomMatch = cleaned.match(/atom\s+([a-z0-9-]+)/i);
      if (atomMatch) {
        modelNumber = atomMatch[1];
      }
    } else if (/xeon/i.test(cleaned)) {
      model = "Xeon";
      // Buscar modelo específico del Xeon
      const xeonPatterns = [
        /xeon\s+([a-z]\d+-\d{4}[a-z]*)/i, // E5-2670v2
        /xeon\s+([a-z]\d+\s*\d{4}[a-z]*)/i, // E5 2670v2
        /xeon\s+([a-z0-9-]+)/i, // Otros formatos
      ];

      for (const pattern of xeonPatterns) {
        const match = cleaned.match(pattern);
        if (match) {
          modelNumber = match[1];
          break;
        }
      }

      // Intentar extraer generación (v2, v3, v4, etc.)
      const genMatch = modelNumber ? modelNumber.match(/v(\d+)$/i) : null;
      if (genMatch) {
        generation = `v${genMatch[1]}`;
      }
    } else {
      model = "Otro Intel";
    }
  } else if (brand === "AMD") {
    // Mejorar detección de modelos AMD con patrones más flexibles

    // Ryzen series (3000, 5000, 7000)
    const ryzenSeries = {
      1: "1st Gen",
      2: "2nd Gen",
      3: "3rd Gen",
      4: "4th Gen",
      5: "5th Gen",
      7: "7th Gen",
      9: "9th Gen",
    };

    if (/ryzen/i.test(cleaned)) {
      // Detectar Ryzen 3, 5, 7, 9
      let ryzenLevel = null;

      if (/ryzen\s*3/i.test(cleaned)) {
        model = "Ryzen 3";
        ryzenLevel = 3;
      } else if (/ryzen\s*5/i.test(cleaned)) {
        model = "Ryzen 5";
        ryzenLevel = 5;
      } else if (/ryzen\s*7/i.test(cleaned)) {
        model = "Ryzen 7";
        ryzenLevel = 7;
      } else if (/ryzen\s*9/i.test(cleaned)) {
        model = "Ryzen 9";
        ryzenLevel = 9;
      } else {
        model = "Ryzen";
      }

      // Detectar número de modelo (1600, 3600, 5600X, etc.)
      const ryzenPatterns = [
        /ryzen\s*\d\s*(\d{4}X?)/i, // Ryzen 5 3600X
        /ryzen\s*\d\s*(\d{3,4}[A-Z]*)/i, // Otros formatos como Ryzen 5 Pro
        /ryzen\s*(\d{4}X?)/i, // Ryzen 3600X (sin número de serie)
      ];

      for (const pattern of ryzenPatterns) {
        const match = cleaned.match(pattern);
        if (match) {
          modelNumber = match[1];
          break;
        }
      }

      // Extraer generación del modelo
      if (modelNumber) {
        const firstDigit = modelNumber.charAt(0);
        if (ryzenSeries[firstDigit]) {
          generation = ryzenSeries[firstDigit];
        }
      }

      // Detectar series especiales
      if (/threadripper/i.test(cleaned)) {
        extraInfo = "Threadripper";
      } else if (/pro/i.test(cleaned)) {
        extraInfo = "Pro";
      }

      // Detectar arquitectura (X, XT, G, etc.)
      if (modelNumber && /[A-Z]+$/.test(modelNumber)) {
        const suffix = modelNumber.match(/([A-Z]+)$/)[1];

        const suffixMeaning = {
          X: "Alto rendimiento",
          XT: "Rendimiento mejorado",
          G: "Con gráficos integrados",
          U: "Ultra bajo consumo",
          H: "Alto rendimiento móvil",
          S: "Bajo consumo",
        };

        architecture = suffixMeaning[suffix] || `Sufijo ${suffix}`;
      }
    }
    // Procesadores más antiguos
    else if (/phenom/i.test(cleaned)) {
      model = "Phenom";

      if (/ii/i.test(cleaned) || /2/i.test(cleaned)) {
        model += " II";
      }

      // Detectar X2, X4, X6
      const coreMatch = cleaned.match(/x(\d+)/i);
      if (coreMatch) {
        extraInfo = `${coreMatch[1]} núcleos`;
      }

      // Extraer número de modelo
      const phenomMatch = cleaned.match(
        /phenom(?:\s*ii)?\s*(?:x\d+)?\s*(\d{3,4})/i
      );
      if (phenomMatch) {
        modelNumber = phenomMatch[1];
      }
    } else if (/athlon/i.test(cleaned)) {
      model = "Athlon";

      if (/ii/i.test(cleaned) || /2/i.test(cleaned)) {
        model += " II";
      }

      if (/64/i.test(cleaned)) {
        model += " 64";
      }

      // Detectar X2, X4
      const coreMatch = cleaned.match(/x(\d+)/i);
      if (coreMatch) {
        extraInfo = `${coreMatch[1]} núcleos`;
      }

      // Extraer número de modelo
      const athlonMatch = cleaned.match(
        /athlon(?:\s*ii)?(?:\s*64)?(?:\s*x\d+)?\s*(\d{3,4}[a-z]*)/i
      );
      if (athlonMatch) {
        modelNumber = athlonMatch[1];
      }
    } else if (/a(\d+)-/i.test(cleaned)) {
      // Series A4, A6, A8, A10, A12
      const seriesMatch = cleaned.match(/a(\d+)/i);
      if (seriesMatch) {
        model = `A${seriesMatch[1]}`;

        // Extraer número de modelo
        const modelMatch = cleaned.match(/a\d+(?:-|Series|\s+)(\d{4,}[a-z]*)/i);
        if (modelMatch) {
          modelNumber = modelMatch[1];
        }
      }
    } else if (/fx/i.test(cleaned)) {
      model = "FX";

      // Extraer número de serie (4100, 6300, 8350, etc.)
      const fxMatch = cleaned.match(/fx[\s-](\d+)/i);
      if (fxMatch) {
        modelNumber = fxMatch[1];

        // Determinar serie basada en primer dígito
        const series = {
          4: "Quad-Core",
          6: "Six-Core",
          8: "Eight-Core",
          9: "Eight-Core+",
        };

        if (modelNumber.length >= 4) {
          const firstDigit = modelNumber.charAt(0);
          if (series[firstDigit]) {
            extraInfo = series[firstDigit];
          }
        }
      }
    } else if (/epyc/i.test(cleaned)) {
      model = "EPYC";

      // Extraer número de modelo
      const epycMatch = cleaned.match(/epyc\s+(\d{4,}[a-z]*)/i);
      if (epycMatch) {
        modelNumber = epycMatch[1];
      }
    } else {
      model = "Otro AMD";
    }
  } else if (brand === "Qualcomm") {
    // Identificar modelos Snapdragon con patrones mejorados
    const snapdragonPatterns = [
      /snapdragon\s+(\d+)(?:\s+gen\s*(\d+))?/i, // Snapdragon 8 Gen 2
      /snapdragon\s+(\d+[a-z]*(?:\s*[a-z]+)?)/i, // Snapdragon 865+, 888 Plus
    ];

    for (const pattern of snapdragonPatterns) {
      const match = cleaned.match(pattern);
      if (match) {
        modelNumber = match[1];
        if (match[2]) {
          // Si capturó un número de generación
          generation = `Gen ${match[2]}`;
        }
        break;
      }
    }

    model = modelNumber ? `Snapdragon ${modelNumber}` : "Snapdragon";

    // Detectar variantes Plus, Ultra, etc.
    if (/plus|ultra|pro|lite/i.test(cleaned)) {
      const variantMatch = cleaned.match(/(plus|ultra|pro|lite)/i);
      if (variantMatch) {
        extraInfo =
          variantMatch[1].charAt(0).toUpperCase() +
          variantMatch[1].slice(1).toLowerCase();
      }
    }
  } else if (brand === "Apple") {
    // Identificar chips Apple con patrones mejorados
    if (/m1/i.test(cleaned)) {
      model = "M1";
      if (/pro/i.test(cleaned)) {
        model += " Pro";
      } else if (/max/i.test(cleaned)) {
        model += " Max";
      } else if (/ultra/i.test(cleaned)) {
        model += " Ultra";
      }
    } else if (/m2/i.test(cleaned)) {
      model = "M2";
      if (/pro/i.test(cleaned)) {
        model += " Pro";
      } else if (/max/i.test(cleaned)) {
        model += " Max";
      } else if (/ultra/i.test(cleaned)) {
        model += " Ultra";
      }
    } else if (/m3/i.test(cleaned)) {
      model = "M3";
      if (/pro/i.test(cleaned)) {
        model += " Pro";
      } else if (/max/i.test(cleaned)) {
        model += " Max";
      } else if (/ultra/i.test(cleaned)) {
        model += " Ultra";
      }
    } else if (/a\d+/i.test(cleaned)) {
      // Series A (A12, A13, A14, A15, etc.)
      const aSeriesMatch = cleaned.match(/a(\d+)/i);
      if (aSeriesMatch) {
        model = `A${aSeriesMatch[1]}`;

        if (/bionic/i.test(cleaned)) {
          model += " Bionic";
        }
      }
    } else {
      model = "Apple Silicon";
    }
  } else if (brand === "ARM") {
    // Procesadores ARM genéricos
    const armMatches = [
      /cortex[\s-]([a-z]\d+)/i, // Cortex-A53, Cortex-A72
      /([a-z]\d+)\s*cortex/i, // A53 Cortex
    ];

    for (const pattern of armMatches) {
      const match = cleaned.match(pattern);
      if (match) {
        model = `Cortex-${match[1].toUpperCase()}`;
        break;
      }
    }

    if (!model) {
      // MediaTek
      const mediatekMatch = cleaned.match(/(?:mediatek|mt)[\s-]?(\w+)/i);
      if (mediatekMatch) {
        model = `MediaTek ${mediatekMatch[1]}`;
      } else {
        model = "ARM genérico";
      }
    }
  } else if (brand === "Samsung") {
    // Procesadores Samsung Exynos
    const exynosMatch = cleaned.match(/exynos[\s-]?(\d+)/i);
    if (exynosMatch) {
      model = `Exynos ${exynosMatch[1]}`;
    } else {
      model = "Exynos";
    }
  }

  // Buscar generación explícitamente mencionada si aún no la tenemos
  if (!generation) {
    // Mejorar detección de generaciones con patrón más flexible
    const genMatches = [
      /(\d{1,2})(?:th|nd|rd|º|°|ª|va)\s*gen(?:eration)?/i, // 10th gen, 11ª generación
      /gen(?:eration)?[\s:-]*(\d{1,2})/i, // Generation 10, Gen:11
    ];

    for (const pattern of genMatches) {
      const match = cleaned.match(pattern);
      if (match) {
        const genNumber = parseInt(match[1]);
        generation = `${genNumber}th Gen`;
        break;
      }
    }
  }

  // Extraer velocidad con patrones mejorados
  const speedRegexPatterns = [
    /(\d+[\.,]\d+)\s*(?:GHz|ghz|Ghz|gh|G)/i, // Formato 3.4GHz
    /@\s*(\d+[\.,]\d+)/i, // Formato @ 3.4
    /(\d+[\.,]\d+)\s*[Hh][Zz]/, // Formato 3.4Hz
    /(\d+[\.,]\d+)\s*[Gg][Hh]/, // Formato 3.4Gh
  ];

  // Probar cada patrón hasta encontrar uno que funcione
  for (const pattern of speedRegexPatterns) {
    const speedMatch = cleaned.match(pattern);
    if (speedMatch) {
      // Normalizar formatos de decimales
      speed = parseFloat(speedMatch[1].replace(",", ".")) + " GHz";
      break;
    }
  }

  // Si aún no encontramos velocidad, buscar números aislados que puedan ser GHz
  if (!speed && model) {
    const numericRegex = /\b(\d+[\.,]\d+)\b/g;
    const numericMatches = [...cleaned.matchAll(numericRegex)];

    // Filtrar para eliminar números que probablemente no sean velocidades
    const possibleSpeeds = numericMatches
      .map((m) => parseFloat(m[1].replace(",", ".")))
      .filter((n) => n >= 1.0 && n <= 5.5); // Rango típico de velocidades de CPU

    if (possibleSpeeds.length > 0) {
      // Tomar el valor más alto como la velocidad probable
      speed = Math.max(...possibleSpeeds) + " GHz";
    }
  }

  // Extraer velocidad numérica para comparación
  let speedValue = 0;
  if (speed) {
    const numericSpeed = speed.match(/(\d+[\.,]\d+)/);
    if (numericSpeed) {
      speedValue = parseFloat(numericSpeed[1].replace(",", "."));
    }
  }

  // Construir cadena normalizada
  let normalized = `${brand} ${model}`;
  if (modelNumber) {
    normalized += ` ${modelNumber}`;
  }
  if (extraInfo) {
    normalized += ` ${extraInfo}`;
  }
  if (generation) {
    normalized += ` ${generation}`;
  }
  if (speed) {
    normalized += ` @ ${speed}`;
  }
  if (architecture) {
    normalized += ` (${architecture})`;
  }

  // Verificar si cumple con los requisitos (reglas mejoradas)
  let meetsRequirements = false;
  let reason = "";

  // Usar reglas personalizadas si están disponibles
  if (customRules) {
    // Verificar Intel Core i5
    if (brand === "Intel" && model === "Core i5") {
      const rule = customRules.intelCore.i5;
      let genNumber = 0;

      // Extraer número de generación de varias fuentes
      if (generation) {
        const genMatch = generation.match(/(\d+)/);
        if (genMatch) {
          genNumber = parseInt(genMatch[1]);
        }
      } else if (modelNumber && modelNumber.length >= 4) {
        // Intentar extraer del número de modelo (ej. 10400 -> gen 10)
        genNumber = parseInt(modelNumber.charAt(0));
      }

      if (genNumber >= rule.minGeneration) {
        if (speedValue >= rule.minSpeed) {
          meetsRequirements = true;
        } else if (rule.minSpeed > 0) {
          reason = `Velocidad insuficiente: ${
            speedValue || "Desconocida"
          } GHz (requiere ${rule.minSpeed} GHz o superior)`;
        }
      } else if (rule.minGeneration > 0) {
        reason = `Generación insuficiente: ${
          generation || `${genNumber || "Desconocida"} Gen`
        } (requiere ${rule.minGeneration}ª gen o superior)`;
      }
    }
    // Verificar Intel Core i7
    else if (brand === "Intel" && model === "Core i7") {
      const rule = customRules.intelCore.i7;
      let genNumber = 0;

      if (generation) {
        const genMatch = generation.match(/(\d+)/);
        if (genMatch) {
          genNumber = parseInt(genMatch[1]);
        }
      } else if (modelNumber && modelNumber.length >= 4) {
        // Extraer del número de modelo
        genNumber = parseInt(modelNumber.charAt(0));
      }

      if (genNumber >= rule.minGeneration || rule.minGeneration === 0) {
        if (speedValue >= rule.minSpeed || rule.minSpeed === 0) {
          meetsRequirements = true;
        } else {
          reason = `Velocidad insuficiente: ${
            speedValue || "Desconocida"
          } GHz (requiere ${rule.minSpeed} GHz o superior)`;
        }
      } else {
        reason = `Generación insuficiente: ${
          generation || `${genNumber || "Desconocida"} Gen`
        } (requiere ${rule.minGeneration}ª gen o superior)`;
      }
    }
    // Verificar Intel Core i9
    else if (brand === "Intel" && model === "Core i9") {
      const rule = customRules.intelCore.i9;
      let genNumber = 0;

      if (generation) {
        const genMatch = generation.match(/(\d+)/);
        if (genMatch) {
          genNumber = parseInt(genMatch[1]);
        }
      } else if (modelNumber && modelNumber.length >= 4) {
        genNumber = parseInt(modelNumber.charAt(0));
      }

      if (genNumber >= rule.minGeneration || rule.minGeneration === 0) {
        if (speedValue >= rule.minSpeed || rule.minSpeed === 0) {
          meetsRequirements = true;
        } else if (rule.minSpeed > 0) {
          reason = `Velocidad insuficiente: ${
            speedValue || "Desconocida"
          } GHz (requiere ${rule.minSpeed} GHz o superior)`;
        }
      } else if (rule.minGeneration > 0) {
        reason = `Generación insuficiente: ${
          generation || `${genNumber || "Desconocida"} Gen`
        } (requiere ${rule.minGeneration}ª gen o superior)`;
      }
    }
    // Verificar AMD Ryzen 5
    else if (brand === "AMD" && model === "Ryzen 5") {
      const rule = customRules.amdRyzen.ryzen5;
      let genNumber = 0;

      if (generation) {
        const genMatch = generation.match(/(\d+)/);
        if (genMatch) {
          genNumber = parseInt(genMatch[1]);
        }
      } else if (modelNumber && modelNumber.length >= 4) {
        // Extraer del número de modelo (ej. 3600 -> gen 3)
        genNumber = parseInt(modelNumber.charAt(0));
      }

      if (genNumber >= rule.minGeneration || rule.minGeneration === 0) {
        if (speedValue >= rule.minSpeed || rule.minSpeed === 0) {
          meetsRequirements = true;
        } else if (rule.minSpeed > 0) {
          reason = `Velocidad insuficiente: ${
            speedValue || "Desconocida"
          } GHz (requiere ${rule.minSpeed} GHz o superior)`;
        }
      } else if (rule.minGeneration > 0) {
        reason = `Generación insuficiente: ${
          generation || `${genNumber || "Desconocida"} Gen`
        } (requiere ${rule.minGeneration}ª gen o superior)`;
      }
    }
    // Verificar AMD Ryzen 7
    else if (brand === "AMD" && model === "Ryzen 7") {
      const rule = customRules.amdRyzen.ryzen7;

      if (rule.minSpeed === 0 && rule.minGeneration === 0) {
        meetsRequirements = true;
      } else {
        let genNumber = 0;
        if (generation) {
          const genMatch = generation.match(/(\d+)/);
          if (genMatch) {
            genNumber = parseInt(genMatch[1]);
          }
        } else if (modelNumber && modelNumber.length >= 4) {
          genNumber = parseInt(modelNumber.charAt(0));
        }

        if (genNumber >= rule.minGeneration || rule.minGeneration === 0) {
          if (speedValue >= rule.minSpeed || rule.minSpeed === 0) {
            meetsRequirements = true;
          } else if (rule.minSpeed > 0) {
            reason = `Velocidad insuficiente: ${
              speedValue || "Desconocida"
            } GHz (requiere ${rule.minSpeed} GHz o superior)`;
          }
        } else if (rule.minGeneration > 0) {
          reason = `Generación insuficiente: ${
            generation || `${genNumber || "Desconocida"} Gen`
          } (requiere ${rule.minGeneration}ª gen o superior)`;
        }
      }
    }
    // Verificar AMD Ryzen 9
    else if (brand === "AMD" && model === "Ryzen 9") {
      const rule = customRules.amdRyzen.ryzen9;

      if (rule.minSpeed === 0 && rule.minGeneration === 0) {
        meetsRequirements = true;
      } else {
        let genNumber = 0;
        if (generation) {
          const genMatch = generation.match(/(\d+)/);
          if (genMatch) {
            genNumber = parseInt(genMatch[1]);
          }
        } else if (modelNumber && modelNumber.length >= 4) {
          genNumber = parseInt(modelNumber.charAt(0));
        }

        if (genNumber >= rule.minGeneration || rule.minGeneration === 0) {
          if (speedValue >= rule.minSpeed || rule.minSpeed === 0) {
            meetsRequirements = true;
          } else if (rule.minSpeed > 0) {
            reason = `Velocidad insuficiente: ${
              speedValue || "Desconocida"
            } GHz (requiere ${rule.minSpeed} GHz o superior)`;
          }
        } else if (rule.minGeneration > 0) {
          reason = `Generación insuficiente: ${
            generation || `${genNumber || "Desconocida"} Gen`
          } (requiere ${rule.minGeneration}ª gen o superior)`;
        }
      }
    }
    // Verificar otros procesadores
    else {
      // Intel Xeon
      if (
        brand === "Intel" &&
        model === "Xeon" &&
        customRules.otherProcessors.intelXeon.enabled
      ) {
        meetsRequirements = true;
      }
      // AMD EPYC
      else if (
        brand === "AMD" &&
        model === "EPYC" &&
        customRules.otherProcessors.amdEpyc.enabled
      ) {
        meetsRequirements = true;
      }
      // Intel Celeron
      else if (
        brand === "Intel" &&
        model === "Celeron" &&
        customRules.otherProcessors.intelCeleron.enabled
      ) {
        meetsRequirements = true;
      }
      // Intel Pentium
      else if (
        brand === "Intel" &&
        model === "Pentium" &&
        customRules.otherProcessors.intelPentium.enabled
      ) {
        meetsRequirements = true;
      }
      // AMD Athlon
      else if (
        brand === "AMD" &&
        model === "Athlon" &&
        customRules.otherProcessors.amdAthlon.enabled
      ) {
        meetsRequirements = true;
      }
      // Cualquier otro procesador
      else {
        reason = `No cumple requisitos de marca/modelo: ${brand} ${model}`;
      }
    }
  } else {
    // Si no hay reglas personalizadas, usar las reglas por defecto
    // Verificar Intel Core i5
    if (brand === "Intel" && model === "Core i5") {
      let genNumber = 0;

      // Extraer número de generación de varias fuentes
      if (generation) {
        const genMatch = generation.match(/(\d+)/);
        if (genMatch) {
          genNumber = parseInt(genMatch[1]);
        }
      } else if (modelNumber && modelNumber.length >= 4) {
        // Intentar extraer del número de modelo (ej. 10400 -> gen 10)
        genNumber = parseInt(modelNumber.charAt(0));
      }

      if (genNumber >= 8) {
        if (speedValue >= 3.0) {
          meetsRequirements = true;
        } else {
          reason = `Velocidad insuficiente: ${
            speedValue || "Desconocida"
          } GHz (requiere 3.0 GHz o superior)`;
        }
      } else {
        reason = `Generación insuficiente: ${
          generation || `${genNumber || "Desconocida"} Gen`
        } (requiere 8va gen o superior)`;
      }
    }
    // Verificar AMD Ryzen 5
    else if (brand === "AMD" && model === "Ryzen 5") {
      // Verificar generación específica para Ryzen
      let genNumber = 0;

      if (generation) {
        const genMatch = generation.match(/(\d+)/);
        if (genMatch) {
          genNumber = parseInt(genMatch[1]);
        }
      } else if (modelNumber && modelNumber.length >= 4) {
        // Extraer del número de modelo (ej. 3600 -> gen 3)
        genNumber = parseInt(modelNumber.charAt(0));
      }

      // Para los Ryzen 5 de 3ra generación o superior, solo necesitan 3.5 GHz
      if (genNumber >= 3) {
        if (speedValue >= 3.5) {
          meetsRequirements = true;
        } else {
          reason = `Velocidad insuficiente: ${
            speedValue || "Desconocida"
          } GHz (requiere 3.5 GHz o superior)`;
        }
      } else if (speedValue >= 3.7) {
        // Para generaciones anteriores, necesitan 3.7 GHz
        meetsRequirements = true;
      } else {
        reason = `Velocidad insuficiente: ${
          speedValue || "Desconocida"
        } GHz (requiere 3.7 GHz o superior)`;
      }
    }
    // Verificar Intel Core i7/i9 recientes
    else if (
      brand === "Intel" &&
      (model === "Core i7" || model === "Core i9")
    ) {
      let genNumber = 0;

      if (generation) {
        const genMatch = generation.match(/(\d+)/);
        if (genMatch) {
          genNumber = parseInt(genMatch[1]);
        }
      } else if (modelNumber && modelNumber.length >= 4) {
        // Extraer del número de modelo
        genNumber = parseInt(modelNumber.charAt(0));
      }

      if (genNumber >= 7) {
        meetsRequirements = true;
      } else if (model === "Core i9") {
        // Todos los i9 son relativamente recientes y potentes
        meetsRequirements = true;
      } else {
        reason = `Generación insuficiente: ${
          generation || `${genNumber || "Desconocida"} Gen`
        } (requiere 7ma gen o superior)`;
      }
    }
    // Verificar AMD Ryzen 7/9
    else if (
      brand === "AMD" &&
      (model === "Ryzen 7" ||
        model === "Ryzen 9" ||
        model === "Ryzen Threadripper")
    ) {
      // Todos los Ryzen 7/9 y Threadripper son de alta gama
      meetsRequirements = true;
    }
    // Verificar Xeon recientes
    else if (brand === "Intel" && model === "Xeon") {
      // Verificar si es E5 v3 o superior, o E7 v3 o superior
      let isNewXeon = false;

      if (modelNumber) {
        // Verificar series E5/E7 con v3+ o series Gold/Silver/Bronze (más nuevas)
        if (
          /E[57].*v[3-9]/i.test(modelNumber) ||
          /Gold|Silver|Bronze|Platinum/i.test(modelNumber)
        ) {
          isNewXeon = true;
        }

        // Verificar series E-2xxx, que son todas recientes
        if (/E-\d{4}/i.test(modelNumber)) {
          isNewXeon = true;
        }
      }

      if (isNewXeon) {
        meetsRequirements = true;
      } else {
        reason =
          "Se requiere un Xeon E5 v3 o superior, E7 v3 o superior, o serie Gold/Silver/Bronze/Platinum";
      }
    }
    // Verificar EPYC de AMD
    else if (brand === "AMD" && model === "EPYC") {
      // Todos los EPYC son de alto rendimiento
      meetsRequirements = true;
    } else {
      reason = `No cumple requisitos de marca/modelo: ${brand} ${model}`;
    }
  }

  return {
    original: processor,
    brand,
    model,
    modelNumber,
    generation,
    extraInfo,
    architecture,
    speed,
    speedValue,
    normalized,
    meetsRequirements,
    reason,
  };
};
