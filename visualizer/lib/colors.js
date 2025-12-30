import { mapRange } from './geometry.js';

const COLORS = {
  monochrome: {
    base: '#e7ecf3',
    glow: 'rgba(231, 236, 243, 0.45)',
    connection: correlation => `rgba(231, 236, 243, ${0.22 + correlation * 0.45})`,
  },
  frequency: {
    hueRange: [0, 270],
    lightness: 68,
    glowLightness: 56,
  },
};

export function nodeColors(mode, bandIndex, bandCount, amplitude) {
  if (mode === 'frequency') {
    const hue = mapRange(bandIndex, 0, bandCount - 1, COLORS.frequency.hueRange[0], COLORS.frequency.hueRange[1]);
    const lightness = COLORS.frequency.lightness - amplitude * 10;
    return {
      fill: `hsl(${hue}, 80%, ${lightness}%)`,
      glow: `hsla(${hue}, 80%, ${COLORS.frequency.glowLightness}%, ${0.35 + amplitude * 0.4})`,
    };
  }

  return {
    fill: COLORS.monochrome.base,
    glow: COLORS.monochrome.glow,
  };
}

export function connectionColor(mode, bandIndexAverage, bandCount, correlation) {
  if (mode === 'frequency') {
    const hue = mapRange(bandIndexAverage, 0, bandCount - 1, COLORS.frequency.hueRange[0], COLORS.frequency.hueRange[1]);
    const lightness = COLORS.frequency.glowLightness + correlation * 15;
    return `hsla(${hue}, 90%, ${lightness}%, ${0.38 + correlation * 0.32})`;
  }
  return COLORS.monochrome.connection(correlation);
}
