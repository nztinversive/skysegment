'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ImageRecord, Segment, SegmentClass, CLASS_LABELS, CLASS_ICONS, CLASS_COLORS } from '@/lib/types';

export default function SegmentViewer({ image }: { image: ImageRecord }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [segments] = useState<Segment[]>(image.segments);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [classVisibility, setClassVisibility] = useState<Record<SegmentClass, boolean>>(() => {
    const vis: Record<string, boolean> = {};
    Object.keys(CLASS_COLORS).forEach(k => vis[k] = true);
    return vis;
  });
  const [overlayOpacity, setOverlayOpacity] = useState(0.4);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d')!;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Draw image
    ctx.drawImage(img, 0, 0);

    // Draw segments
    segments.forEach(seg => {
      if (!classVisibility[seg.classLabel]) return;
      if (!seg.visible) return;

      ctx.beginPath();
      seg.polygon.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();

      // Fill
      ctx.fillStyle = seg.color + Math.round(overlayOpacity * 255).toString(16).padStart(2, '0');
      ctx.fill();

      // Stroke
      ctx.strokeStyle = seg.color;
      ctx.lineWidth = selectedSegment?.id === seg.id ? 3 : 1;
      ctx.stroke();

      // Label for selected
      if (selectedSegment?.id === seg.id) {
        const cx = seg.polygon.reduce((s, p) => s + p[0], 0) / seg.polygon.length;
        const cy = seg.polygon.reduce((s, p) => s + p[1], 0) / seg.polygon.length;
        ctx.font = 'bold 14px system-ui';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        const label = CLASS_LABELS[seg.classLabel];
        ctx.strokeText(label, cx - ctx.measureText(label).width / 2, cy);
        ctx.fillText(label, cx - ctx.measureText(label).width / 2, cy);
      }
    });
  }, [segments, selectedSegment, classVisibility, overlayOpacity]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = image.imageUrl;
    img.onload = () => {
      imgRef.current = img;
      draw();
    };
  }, [image.imageUrl, draw]);

  useEffect(() => { draw(); }, [draw]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Find clicked segment (reverse order = topmost first)
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i];
      if (!classVisibility[seg.classLabel] || !seg.visible) continue;
      if (isPointInPolygon(x, y, seg.polygon)) {
        setSelectedSegment(seg);
        return;
      }
    }
    setSelectedSegment(null);
  };

  const toggleClass = (cls: SegmentClass) => {
    setClassVisibility(prev => ({ ...prev, [cls]: !prev[cls] }));
  };

  // Class summary
  const classSummary = Object.keys(CLASS_COLORS).map(cls => {
    const segs = segments.filter(s => s.classLabel === cls);
    const totalArea = segs.reduce((s, seg) => s + seg.areaPercent, 0);
    return { cls: cls as SegmentClass, count: segs.length, totalArea };
  }).filter(c => c.count > 0);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Canvas area */}
      <div className="flex-1 min-w-0">
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-300">{image.originalName}</h2>
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-500">Opacity</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={overlayOpacity}
                onChange={e => setOverlayOpacity(parseFloat(e.target.value))}
                className="w-24 accent-blue-500"
              />
            </div>
          </div>
          <div className="p-2">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="w-full h-auto cursor-crosshair rounded-lg"
            />
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex gap-2 mt-3">
          <a
            href={`/api/images/${image.id}/export?format=geojson`}
            download
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <span>📍</span> Export GeoJSON
          </a>
          <button
            onClick={() => exportAnnotatedPNG(canvasRef.current!)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <span>🖼️</span> Export PNG
          </button>
          <a
            href={`/api/images/${image.id}/export?format=csv`}
            download
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <span>📊</span> Export CSV
          </a>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-80 space-y-4">
        {/* Class legend / toggles */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Segment Classes</h3>
          <div className="space-y-2">
            {classSummary.map(({ cls, count, totalArea }) => (
              <button
                key={cls}
                onClick={() => toggleClass(cls)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  classVisibility[cls] ? 'bg-gray-800' : 'bg-gray-800/30 opacity-50'
                }`}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CLASS_COLORS[cls] }} />
                <span className="text-sm text-gray-300 flex-1 text-left">
                  {CLASS_ICONS[cls]} {CLASS_LABELS[cls]}
                </span>
                <span className="text-xs text-gray-500">{count}</span>
                <span className="text-xs text-gray-600">{totalArea.toFixed(1)}%</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected segment detail */}
        {selectedSegment && (
          <div className="bg-gray-900 rounded-xl border border-blue-500/30 p-4">
            <h3 className="text-sm font-semibold text-blue-400 mb-3">Segment Detail</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Class</span>
                <span className="text-gray-200 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: selectedSegment.color }} />
                  {CLASS_ICONS[selectedSegment.classLabel]} {CLASS_LABELS[selectedSegment.classLabel]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Area (px)</span>
                <span className="text-gray-200">{selectedSegment.areaPx.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Area (%)</span>
                <span className="text-gray-200">{selectedSegment.areaPercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Confidence</span>
                <span className="text-gray-200">{(selectedSegment.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Bbox</span>
                <span className="text-gray-200 text-xs font-mono">
                  {selectedSegment.bbox.map(Math.round).join(', ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Points</span>
                <span className="text-gray-200">{selectedSegment.polygon.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ID</span>
                <span className="text-gray-400 text-xs font-mono truncate max-w-[140px]">{selectedSegment.id}</span>
              </div>
            </div>
          </div>
        )}

        {/* Image info */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Image Info</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Dimensions</span>
              <span className="text-gray-300">{image.width}×{image.height}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Segments</span>
              <span className="text-gray-300">{image.segmentCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Uploaded</span>
              <span className="text-gray-300">{new Date(image.uploadedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function isPointInPolygon(x: number, y: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function exportAnnotatedPNG(canvas: HTMLCanvasElement) {
  const link = document.createElement('a');
  link.download = 'annotated_segments.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}
