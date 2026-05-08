export const Colors = {
  // ── V4 palette (Quiet / Nearly Monochrome) ─────────────────────────────
  background: '#F2F0EC', // neutral paper base
  paper: '#F2F0EC', // alias
  surface: '#FFFFFF', // elevated areas only
  softSurface: '#ECE9E3', // subtle grouping / selected
  border: '#D6D2CC', // structural separation
  muted: '#8A857C', // secondary info
  body: '#2E2C29', // primary reading
  ink: '#141312', // anchors & actions
  accent: '#4A4641', // interaction emphasis only (neutral)
  accentSurface: '#ECE9E3', // selected states (no color)

  // ── Status (meaning only) ─────────────────────────────────────────────
  statusGreen: '#3F5A48',
  statusRed: '#6A4040',
  statusPending: '#8A857C',

  // ── Utility ───────────────────────────────────────────────────────────
  white: '#FFFFFF',
  overlay: 'rgba(20, 19, 18, 0.10)',

  // ── Semantic aliases (keep Firebase/nav logic intact) ─────────────────
  cream: '#F2F0EC',
  terracotta: '#4A4641',
  sage: '#3F5A48',
  charcoal: '#2E2C29',
  sand: '#ECE9E3',
  sandDark: '#D6D2CC',
  tabActive: '#141312',
  tabInactive: '#8A857C',

  // ── Status tints (for SwapRequestCard compat) ─────────────────────────
  pendingBg: '#ECE9E3',
  acceptedBg: '#ECE9E3',
  rejectedBg: '#ECE9E3',
  completedBg: '#ECE9E3',

  // ── Extended (v1 compat — no longer used in UI) ───────────────────────
  base: '#141312',
  surface2: '#ECE9E3',
  subtle: '#D6D2CC',
  accentDim: '#ECE9E3',
  accentLight: '#ECE9E3',
  blush: '#ECE9E3',
  forest: '#3F5A48',
  marigold: '#4A4641',
  lavender: '#4A4641',
  clay: '#4A4641',
};
