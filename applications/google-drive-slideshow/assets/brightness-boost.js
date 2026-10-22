const brightCanvasDitherOptions = {
  serpentine: true,
  errorDiffusionMatrix: "floydSteinberg",
};

// Tuned on Spectra 6 output (natural intent, Floyd–Steinberg dither).
// brightnessBoost 0 = off; 1–3 are equal steps from off to the level-3 preset below.
// Preview uses cssFilter; device render uses epdOptimize tone mapping + DRC.
const brightnessBoostLevels = [
  null,
  {
    cssFilter: "brightness(1.05) contrast(1.01)",
    epdOptimize: {
      intent: "natural",
      imageAdjustmentOptions: {
        toneMapping: {
          exposure: 0.1,
          contrast: 0.01,
          saturation: 0,
          strength: 0.11,
          shadowBoost: 0.08,
          highlightCompress: -0.03,
          midpoint: 0.5,
        },
        dynamicRangeCompression: {
          mode: "display",
          strength: 0.15,
          lowPercentile: 0.02,
          highPercentile: 0.99,
        },
      },
      canvasDitherOptions: brightCanvasDitherOptions,
    },
  },
  {
    cssFilter: "brightness(1.11) contrast(1.02)",
    epdOptimize: {
      intent: "natural",
      imageAdjustmentOptions: {
        toneMapping: {
          exposure: 0.19,
          contrast: 0.03,
          saturation: 0,
          strength: 0.21,
          shadowBoost: 0.15,
          highlightCompress: -0.06,
          midpoint: 0.5,
        },
        dynamicRangeCompression: {
          mode: "display",
          strength: 0.29,
          lowPercentile: 0.02,
          highPercentile: 0.99,
        },
      },
      canvasDitherOptions: brightCanvasDitherOptions,
    },
  },
  {
    cssFilter: "brightness(1.16) contrast(1.03)",
    epdOptimize: {
      intent: "natural",
      imageAdjustmentOptions: {
        toneMapping: {
          exposure: 0.29,
          contrast: 0.04,
          saturation: 0,
          strength: 0.32,
          shadowBoost: 0.23,
          highlightCompress: -0.09,
          midpoint: 0.5,
        },
        dynamicRangeCompression: {
          mode: "display",
          strength: 0.44,
          lowPercentile: 0.02,
          highPercentile: 0.99,
        },
      },
      canvasDitherOptions: brightCanvasDitherOptions,
    },
  },
];

export function normalizeBrightnessBoost(value) {
  if (value === undefined || value === null || value === "") {
    return 0;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(3, Math.round(value)));
  }
  const leadingDigit = String(value).trim().match(/^(\d)/);
  if (!leadingDigit) {
    return 0;
  }
  return Math.max(0, Math.min(3, Number(leadingDigit[1])));
}

export function defaultEpdOptimizeMeta() {
  return { intent: "natural" };
}

/** @param {number} level 0–3 */
export function brightnessBoostEpdMeta(level) {
  const config = brightnessBoostLevels[level];
  return config?.epdOptimize ?? null;
}

/** @param {number} level 0–3 */
export function brightnessBoostCssFilter(level) {
  const config = brightnessBoostLevels[level];
  return config?.cssFilter ?? "";
}
