// utils/easing.js
// Easing functions for animations

export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function easeOutQuad(t) {
  return 1 - Math.pow(1 - t, 2);
}

export function easeInCubic(t) {
  return t * t * t;
}

export function easeInQuad(t) {
  return t * t;
}

export function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeInOutQuad(t) {
  return t < 0.5
    ? 2 * t * t
    : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function linear(t) {
  return t;
}
