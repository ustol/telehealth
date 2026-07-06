// Validated categorical palette (see dataviz skill references/palette.md),
// re-anchored on the SSNIT brand orange (#FF6600, matches ssnit.org.gh) as
// slot 1. Re-validated with scripts/validate_palette.js after the swap —
// worst adjacent CVD ΔE unaffected (24.2, between slots 3/4, not slot 1).
// Fixed order — assign by position, never cycled or reassigned by meaning.
export const CATEGORICAL = [
  "#FF6600", // 1 brand orange
  "#1baf7a", // 2 aqua
  "#eda100", // 3 yellow
  "#008300", // 4 green
  "#4a3aa7", // 5 violet
  "#e34948", // 6 red
  "#e87ba4", // 7 magenta
  "#2a78d6", // 8 blue
];

export const CHART_INK = {
  gridline: "#e1e0d9",
  axis: "#898781",
  secondaryText: "#52514e",
};
