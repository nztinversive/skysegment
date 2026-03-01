import { Segment, SegmentClass, CLASS_COLORS } from './types';
import { v4 as uuid } from 'uuid';

// Generate realistic mock segmentation polygons for a given image size
export function generateMockSegments(width: number, height: number): Segment[] {
  const segments: Segment[] = [];
  const rng = seedRandom(width * height);

  // Define region templates
  const templates: { classLabel: SegmentClass; weight: number; minSize: number; maxSize: number }[] = [
    { classLabel: 'vegetation', weight: 0.30, minSize: 0.05, maxSize: 0.20 },
    { classLabel: 'vegetation', weight: 0.15, minSize: 0.03, maxSize: 0.12 },
    { classLabel: 'structure', weight: 0.12, minSize: 0.02, maxSize: 0.08 },
    { classLabel: 'structure', weight: 0.08, minSize: 0.01, maxSize: 0.05 },
    { classLabel: 'road', weight: 0.10, minSize: 0.03, maxSize: 0.10 },
    { classLabel: 'bare_earth', weight: 0.10, minSize: 0.04, maxSize: 0.15 },
    { classLabel: 'water', weight: 0.06, minSize: 0.02, maxSize: 0.08 },
    { classLabel: 'vehicle', weight: 0.03, minSize: 0.005, maxSize: 0.02 },
    { classLabel: 'vehicle', weight: 0.02, minSize: 0.003, maxSize: 0.015 },
    { classLabel: 'unknown', weight: 0.04, minSize: 0.01, maxSize: 0.05 },
  ];

  for (const tmpl of templates) {
    const cx = rng() * width;
    const cy = rng() * height;
    const size = (tmpl.minSize + rng() * (tmpl.maxSize - tmpl.minSize));
    const radius = Math.sqrt(size * width * height / Math.PI);

    // Generate irregular polygon
    const numPoints = tmpl.classLabel === 'structure' ? 4 + Math.floor(rng() * 3) : 8 + Math.floor(rng() * 12);
    const polygon: [number, number][] = [];

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const jitter = tmpl.classLabel === 'structure' ? 0.85 + rng() * 0.3 : 0.5 + rng() * 1.0;
      const r = radius * jitter;
      const px = Math.max(0, Math.min(width, cx + Math.cos(angle) * r));
      const py = Math.max(0, Math.min(height, cy + Math.sin(angle) * r));
      polygon.push([Math.round(px), Math.round(py)]);
    }

    // Calculate bbox
    const xs = polygon.map(p => p[0]);
    const ys = polygon.map(p => p[1]);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    // Calculate area using shoelace formula
    let areaPx = 0;
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;
      areaPx += polygon[i][0] * polygon[j][1];
      areaPx -= polygon[j][0] * polygon[i][1];
    }
    areaPx = Math.abs(areaPx) / 2;

    segments.push({
      id: uuid(),
      classLabel: tmpl.classLabel,
      color: CLASS_COLORS[tmpl.classLabel],
      polygon,
      bbox: [minX, minY, maxX - minX, maxY - minY],
      areaPx: Math.round(areaPx),
      areaPercent: parseFloat(((areaPx / (width * height)) * 100).toFixed(2)),
      confidence: parseFloat((0.70 + rng() * 0.28).toFixed(2)),
      visible: true,
    });
  }

  return segments;
}

function seedRandom(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
