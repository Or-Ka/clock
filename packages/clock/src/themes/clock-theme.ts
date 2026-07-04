// Design tokens for the analog clock renderer. Extracted from the renderer so
// the palette lives in one place, is part of the public API, and can grow into
// per-instance theming (injected via options) without touching the SVG code.

export interface ClockColors {
  readonly faceFill: string;
  readonly faceStroke: string;
  readonly hand: string;
  readonly secondHand: string;
  readonly innerRing: string;
  readonly hourTick: string;
  readonly minuteTick: string;
  readonly outerLabel: string;
  readonly innerLabel: string;
  readonly textHalo: string;
  readonly dateMuted: string;
  readonly dateStrong: string;
  readonly zmanitTick: string;
  readonly sunrise: string;
  readonly sunset: string;
  readonly custom: string;
}

export const defaultClockColors: ClockColors = {
  faceFill: "#101b26",
  faceStroke: "#6f879b",
  hand: "#eef5fb",
  secondHand: "#ff8d78",
  innerRing: "#8fb6e8",
  hourTick: "#d8e4ef",
  minuteTick: "#7890a3",
  outerLabel: "#f7f1de",
  innerLabel: "#b9c7d5",
  textHalo: "#101b26",
  dateMuted: "#b7c6d6",
  dateStrong: "#f2f7fb",
  zmanitTick: "#ff1f1f",
  sunrise: "#ffd400",
  sunset: "#ff4fd8",
  custom: "#00e5ff"
};
