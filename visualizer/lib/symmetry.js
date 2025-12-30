export const SYMMETRY_MODES = {
  NONE: 'none',
  VERTICAL: 'vertical',
  HORIZONTAL: 'horizontal',
  RADIAL: 'radial',
};

const ORDER = [SYMMETRY_MODES.NONE, SYMMETRY_MODES.VERTICAL, SYMMETRY_MODES.HORIZONTAL, SYMMETRY_MODES.RADIAL];

export function getNextSymmetryMode(current) {
  const idx = ORDER.indexOf(current);
  return ORDER[(idx + 1) % ORDER.length];
}

export function getSymmetryLabel(mode) {
  switch (mode) {
    case SYMMETRY_MODES.VERTICAL:
      return 'Vertical';
    case SYMMETRY_MODES.HORIZONTAL:
      return 'Horizontal';
    case SYMMETRY_MODES.RADIAL:
      return 'Radial';
    default:
      return 'None';
  }
}

export function assignSymmetry(nodes, symmetry, bandCount, center) {
  if (!nodes.length || symmetry === SYMMETRY_MODES.NONE) return nodes;

  const mirrored = nodes.map(node => ({ ...node }));
  const total = nodes.length;
  const half = Math.floor(total / 2);
  const cx = center?.x ?? 0;
  const cy = center?.y ?? 0;

  for (let i = 0; i < half; i++) {
    const partner = total - i - 1;
    const source = nodes[i];
    const target = mirrored[partner];

    if (symmetry === SYMMETRY_MODES.VERTICAL) {
      target.x = cx - (source.x - cx);
      target.bandIndex = (bandCount - 1) - source.bandIndex;
    } else if (symmetry === SYMMETRY_MODES.HORIZONTAL) {
      target.y = cy - (source.y - cy);
      target.bandIndex = (bandCount - 1) - source.bandIndex;
    } else if (symmetry === SYMMETRY_MODES.RADIAL) {
      target.x = cx - (source.x - cx);
      target.y = cy - (source.y - cy);
      target.bandIndex = source.bandIndex;
    }
  }

  return mirrored;
}
