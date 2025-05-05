// utils/testRAMNormalization.js
const { normalizeRAM } = require("./hardwareNormalizer");

const valuesToTest = [
  "4096",
  "8192",
  "12288",
  "16384",
  "16392",
  "32768",
  "4096 MB",
  "8 GB",
  "16GB",
  "16 gigabytes",
  "1000", // Caso borde para comparar
];

valuesToTest.forEach((value) => {
  const result = normalizeRAM(value);
  console.log(
    `Input: "${value}" → Normalized: ${result.normalized} (${result.capacityGB} GB)`
  );
});

// Para ejecutar este script:
// node utils/testRAMNormalization.js
