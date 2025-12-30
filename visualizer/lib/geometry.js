export function mapRange(value, inMin, inMax, outMin, outMax) {
  return outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin || 1);
}

export function layoutNode(index, total, rect, arrangement, ringRadius) {
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const radius = Math.min(rect.width, rect.height) * ringRadius;

  switch (arrangement) {
    case 'circle': {
      const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
      return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
    }
    case 'edge': {
      const padding = 30;
      const w = rect.width - padding * 2;
      const h = rect.height - padding * 2;
      const perimeter = 2 * (w + h);
      const step = perimeter / total;
      const dist = step * index;
      if (dist < w) return { x: padding + dist, y: padding };
      if (dist < w + h) return { x: padding + w, y: padding + (dist - w) };
      if (dist < 2 * w + h) return { x: padding + w - (dist - w - h), y: padding + h };
      return { x: padding, y: padding + h - (dist - 2 * w - h) };
    }
    case 'grid': {
      const padding = 36;
      const ratio = rect.width / rect.height;
      let cols;
      let rows;
      if (ratio > 1) {
        cols = Math.ceil(Math.sqrt(total * ratio));
        rows = Math.ceil(total / cols);
      } else {
        rows = Math.ceil(Math.sqrt(total / ratio));
        cols = Math.ceil(total / rows);
      }
      const cellW = (rect.width - padding * 2) / cols;
      const cellH = (rect.height - padding * 2) / rows;
      const col = index % cols;
      const row = Math.floor(index / cols);
      return { x: padding + cellW * (col + 0.5), y: padding + cellH * (row + 0.5) };
    }
    default: {
      const padding = 32;
      const maxR = Math.min(rect.width, rect.height) / 2 - padding;
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const angle = -index * goldenAngle;
      const r = Math.sqrt(index / total) * maxR;
      return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
    }
  }
}

export function resizeCanvas(canvas, ctx) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
