// tests/hardwareNormalizer.test.js
import { normalizeRAM } from "../utils/hardwareNormalizer";

describe("normalizeRAM", () => {
  test("Convierte valores de MB sin unidades correctamente", () => {
    const testCases = [
      { input: "2048", expected: 2 },
      { input: "4096", expected: 4 },
      { input: "6144", expected: 6 },
      { input: "8192", expected: 8 },
      { input: "12288", expected: 12 },
      { input: "16384", expected: 16 },
      { input: "16392", expected: 16 },
      { input: "24576", expected: 24 },
      { input: "32768", expected: 32 },
      { input: "65536", expected: 64 },
    ];

    testCases.forEach((testCase) => {
      const result = normalizeRAM(testCase.input);
      expect(result.capacityGB).toBeCloseTo(testCase.expected, 1);
    });
  });

  test("Maneja correctamente valores con unidades", () => {
    expect(normalizeRAM("8 GB").capacityGB).toBe(8);
    expect(normalizeRAM("16GB").capacityGB).toBe(16);
    expect(normalizeRAM("4.5 GB").capacityGB).toBe(4.5);
  });

  test("Maneja correctamente valores en MB con unidades", () => {
    expect(normalizeRAM("4096 MB").capacityGB).toBeCloseTo(4, 1);
    expect(normalizeRAM("8192MB").capacityGB).toBeCloseTo(8, 1);
  });
});
