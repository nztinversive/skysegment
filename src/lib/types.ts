export interface Segment {
  id: string;
  classLabel: SegmentClass;
  color: string;
  polygon: [number, number][];  // array of [x, y] points (pixel coords)
  bbox: [number, number, number, number]; // [x, y, w, h]
  areaPx: number;
  areaPercent: number;
  confidence: number;
  visible: boolean;
}

export type SegmentClass = 
  | 'vegetation'
  | 'water'
  | 'structure'
  | 'bare_earth'
  | 'road'
  | 'vehicle'
  | 'unknown';

export interface ImageRecord {
  id: string;
  projectId: string;
  filename: string;
  originalName: string;
  width: number;
  height: number;
  uploadedAt: string;
  segmented: boolean;
  segmentCount: number;
  segments: Segment[];
  thumbnailUrl: string;
  imageUrl: string;
}

export interface CustomClass {
  text: string;        // SAM 3 text prompt (e.g. "solar panel")
  classLabel: SegmentClass;  // which visual class to map to
  color?: string;      // optional custom color override
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  imageCount: number;
  imageIds: string[];
  customClasses?: CustomClass[];
}

export const CLASS_COLORS: Record<SegmentClass, string> = {
  vegetation: '#22c55e',
  water: '#3b82f6',
  structure: '#f59e0b',
  bare_earth: '#a16207',
  road: '#6b7280',
  vehicle: '#ef4444',
  unknown: '#8b5cf6',
};

export const CLASS_LABELS: Record<SegmentClass, string> = {
  vegetation: 'Vegetation',
  water: 'Water',
  structure: 'Structure',
  bare_earth: 'Bare Earth',
  road: 'Road/Pavement',
  vehicle: 'Vehicle',
  unknown: 'Unknown',
};

export const CLASS_ICONS: Record<SegmentClass, string> = {
  vegetation: '🟢',
  water: '🔵',
  structure: '🏗️',
  bare_earth: '🟤',
  road: '⬛',
  vehicle: '🚗',
  unknown: '❓',
};
