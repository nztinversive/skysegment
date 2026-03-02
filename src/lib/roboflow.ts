import { Segment, SegmentClass, CLASS_COLORS } from './types';
import { v4 as uuid } from 'uuid';
import fs from 'fs';

const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY || '';
const SAM3_ENDPOINT = 'https://serverless.roboflow.com/sam3/concept_segment';

// Default classes to segment in aerial imagery
const DEFAULT_CLASSES: { text: string; classLabel: SegmentClass }[] = [
  { text: 'tree or bush or grass', classLabel: 'vegetation' },
  { text: 'water or pond or river', classLabel: 'water' },
  { text: 'building or structure or construction', classLabel: 'structure' },
  { text: 'bare soil or dirt or ground', classLabel: 'bare_earth' },
  { text: 'road or pavement or sidewalk', classLabel: 'road' },
  { text: 'car or truck or vehicle', classLabel: 'vehicle' },
];

interface RoboflowPrediction {
  confidence: number;
  masks: [number, number][][]; // array of polygons, each polygon is array of [x,y]
}

interface RoboflowPromptResult {
  echo: { text: string };
  predictions: RoboflowPrediction[];
}

interface RoboflowResponse {
  prompt_results: RoboflowPromptResult[];
}

/**
 * Run SAM 3 concept segmentation via Roboflow serverless API.
 * Sends the image as base64 with text prompts for each class.
 */
export async function segmentImage(
  imagePath: string,
  width: number,
  height: number,
  classes?: { text: string; classLabel: SegmentClass }[]
): Promise<Segment[]> {
  if (!ROBOFLOW_API_KEY) {
    throw new Error('ROBOFLOW_API_KEY not set');
  }

  const promptClasses = classes || DEFAULT_CLASSES;

  // Read image and encode as base64
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const response = await fetch(`${SAM3_ENDPOINT}?api_key=${ROBOFLOW_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      format: 'polygon',
      image: {
        type: 'base64',
        value: base64Image,
      },
      prompts: promptClasses.map(c => ({ type: 'text', text: c.text })),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Roboflow API error (${response.status}): ${text}`);
  }

  const data: RoboflowResponse = await response.json();
  const segments: Segment[] = [];
  const totalPixels = width * height;

  data.prompt_results.forEach((promptResult, promptIdx) => {
    const classInfo = promptClasses[promptIdx];
    if (!classInfo) return;

    promptResult.predictions.forEach((prediction) => {
      prediction.masks.forEach((polygon) => {
        if (polygon.length < 3) return;

        const typedPolygon: [number, number][] = polygon.map(([x, y]) => [
          Math.round(x),
          Math.round(y),
        ]);

        // Bounding box
        const xs = typedPolygon.map(p => p[0]);
        const ys = typedPolygon.map(p => p[1]);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);

        // Area via shoelace
        let areaPx = 0;
        for (let i = 0; i < typedPolygon.length; i++) {
          const j = (i + 1) % typedPolygon.length;
          areaPx += typedPolygon[i][0] * typedPolygon[j][1];
          areaPx -= typedPolygon[j][0] * typedPolygon[i][1];
        }
        areaPx = Math.abs(areaPx) / 2;

        segments.push({
          id: uuid(),
          classLabel: classInfo.classLabel,
          color: CLASS_COLORS[classInfo.classLabel],
          polygon: typedPolygon,
          bbox: [minX, minY, maxX - minX, maxY - minY],
          areaPx: Math.round(areaPx),
          areaPercent: parseFloat(((areaPx / totalPixels) * 100).toFixed(2)),
          confidence: prediction.confidence,
          visible: true,
        });
      });
    });
  });

  return segments;
}
