// Symmetry system for visualizer nodes
// Determines how frequency bands are assigned to nodes based on symmetry mode

const SYMMETRY_MODES = {
  NONE: 'none',
  HORIZONTAL: 'horizontal', // L/R mirror
  VERTICAL: 'vertical', // Up/Down mirror
  QUAD: 'quad', // L/R + Up/Down
  RADIAL: 'radial' // Concentric rings
};

const SYMMETRY_LABELS = {
  [SYMMETRY_MODES.NONE]: 'No Symmetry',
  [SYMMETRY_MODES.HORIZONTAL]: 'L/R Symmetry',
  [SYMMETRY_MODES.VERTICAL]: 'Up/Down Symmetry',
  [SYMMETRY_MODES.QUAD]: 'Quad Symmetry',
  [SYMMETRY_MODES.RADIAL]: 'Radial Symmetry'
};

// Get all mode keys in order for cycling
const SYMMETRY_MODE_ORDER = [
  SYMMETRY_MODES.NONE,
  SYMMETRY_MODES.HORIZONTAL,
  SYMMETRY_MODES.VERTICAL,
  SYMMETRY_MODES.QUAD,
  SYMMETRY_MODES.RADIAL
];

/**
 * Calculate band index for a node based on symmetry mode
 * @param {number} nodeIndex - Index of the node (0 to totalNodes-1)
 * @param {number} totalNodes - Total number of nodes in the circle
 * @param {number} totalBands - Total number of frequency bands
 * @param {string} mode - Symmetry mode
 * @returns {number} Band index (0 to totalBands-1)
 */
function getSymmetryBandIndex(nodeIndex, totalNodes, totalBands, mode) {
  switch (mode) {
    case SYMMETRY_MODES.NONE:
      // Sequential: each node gets next band
      return nodeIndex % totalBands;

    case SYMMETRY_MODES.HORIZONTAL:
      // L/R mirror: nodes on opposite horizontal sides get same band
      return getHorizontalMirrorBand(nodeIndex, totalNodes, totalBands);

    case SYMMETRY_MODES.VERTICAL:
      // Up/Down mirror: nodes on opposite vertical sides get same band
      return getVerticalMirrorBand(nodeIndex, totalNodes, totalBands);

    case SYMMETRY_MODES.QUAD:
      // 4-way symmetry: all four quadrants mirror each other
      return getQuadMirrorBand(nodeIndex, totalNodes, totalBands);

    case SYMMETRY_MODES.RADIAL:
      // Radial: nodes distributed evenly across bands (multiple nodes per band)
      const nodesPerBand = Math.ceil(totalNodes / totalBands);
      return Math.floor(nodeIndex / nodesPerBand) % totalBands;

    default:
      return nodeIndex % totalBands;
  }
}

function getHorizontalMirrorBand(nodeIndex, totalNodes, totalBands) {
  // Calculate angle for this node (starting at top = -π/2)
  const angle = (nodeIndex / totalNodes) * Math.PI * 2 - Math.PI / 2;

  // Normalize angle to 0-2π range
  const normalizedAngle = ((angle + Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

  // Map to 0-1 range based on horizontal position
  // 0 = rightmost, 0.5 = leftmost, 1 = rightmost again
  let horizontalT = normalizedAngle / (Math.PI * 2);

  // Mirror left side to right side
  if (horizontalT > 0.5) {
    horizontalT = 1 - horizontalT;
  }

  // Map to band index (only use half the circle)
  const effectiveNodes = Math.ceil(totalNodes / 2);
  const effectiveIndex = Math.floor(horizontalT * effectiveNodes);
  return effectiveIndex % totalBands;
}

function getVerticalMirrorBand(nodeIndex, totalNodes, totalBands) {
  // Calculate angle for this node
  const angle = (nodeIndex / totalNodes) * Math.PI * 2 - Math.PI / 2;

  // Normalize to 0-2π
  const normalizedAngle = ((angle + Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

  // Map to vertical position (0 = top, 0.5 = bottom, 1 = top)
  let verticalT = (normalizedAngle + Math.PI / 2) / (Math.PI * 2);
  if (verticalT > 1) verticalT -= 1;

  // Mirror bottom to top
  if (verticalT > 0.5) {
    verticalT = 1 - verticalT;
  }

  const effectiveNodes = Math.ceil(totalNodes / 2);
  const effectiveIndex = Math.floor(verticalT * effectiveNodes);
  return effectiveIndex % totalBands;
}

function getQuadMirrorBand(nodeIndex, totalNodes, totalBands) {
  // Quad symmetry: map all 4 quadrants to one quadrant
  const angle = (nodeIndex / totalNodes) * Math.PI * 2 - Math.PI / 2;
  const normalizedAngle = ((angle + Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

  // Determine which quadrant (0-3)
  const quadrant = Math.floor(normalizedAngle / (Math.PI / 2));

  // Get angle within quadrant (0 to π/2)
  const angleInQuad = normalizedAngle % (Math.PI / 2);

  // Map to 0-1 within the quadrant
  const t = angleInQuad / (Math.PI / 2);

  // Only use 1/4 of the nodes
  const effectiveNodes = Math.ceil(totalNodes / 4);
  const effectiveIndex = Math.floor(t * effectiveNodes);
  return effectiveIndex % totalBands;
}

/**
 * Get the next symmetry mode (for cycling)
 */
function getNextSymmetryMode(currentMode) {
  const currentIndex = SYMMETRY_MODE_ORDER.indexOf(currentMode);
  const nextIndex = (currentIndex + 1) % SYMMETRY_MODE_ORDER.length;
  return SYMMETRY_MODE_ORDER[nextIndex];
}

/**
 * Get display label for a symmetry mode
 */
function getSymmetryLabel(mode) {
  return SYMMETRY_LABELS[mode] || 'Unknown';
}
