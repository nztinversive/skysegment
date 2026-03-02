'use client';

import { ImageRecord, SegmentClass, CLASS_COLORS, CLASS_LABELS, CLASS_ICONS } from '@/lib/types';

interface SegmentStatsProps {
  images: ImageRecord[];
}

export default function SegmentStats({ images }: SegmentStatsProps) {
  if (images.length === 0) return null;

  const segmentedImages = images.filter(img => img.segmented);
  const allSegments = segmentedImages.flatMap(img => img.segments);
  const totalSegments = allSegments.length;

  if (totalSegments === 0) return null;

  // Aggregate area by class
  const classStats: Record<string, { count: number; totalArea: number }> = {};
  allSegments.forEach(seg => {
    if (!classStats[seg.classLabel]) {
      classStats[seg.classLabel] = { count: 0, totalArea: 0 };
    }
    classStats[seg.classLabel].count += 1;
    classStats[seg.classLabel].totalArea += seg.areaPercent;
  });

  // Average area across images
  const entries = Object.entries(classStats)
    .map(([cls, stats]) => ({
      cls: cls as SegmentClass,
      count: stats.count,
      avgArea: segmentedImages.length > 0 ? stats.totalArea / segmentedImages.length : 0,
    }))
    .sort((a, b) => b.avgArea - a.avgArea);

  const maxArea = Math.max(...entries.map(e => e.avgArea), 1);

  // Pie chart data
  const totalArea = entries.reduce((s, e) => s + e.avgArea, 0);
  let cumAngle = 0;
  const pieSlices = entries.map(e => {
    const fraction = totalArea > 0 ? e.avgArea / totalArea : 0;
    const startAngle = cumAngle;
    cumAngle += fraction * 360;
    return { ...e, startAngle, endAngle: cumAngle, fraction };
  });

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
        📊 Segment Stats
        <span className="text-xs text-gray-500 font-normal">across {segmentedImages.length} image{segmentedImages.length !== 1 ? 's' : ''}</span>
      </h3>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">{segmentedImages.length}</div>
          <div className="text-xs text-gray-500 mt-1">Images</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">{totalSegments}</div>
          <div className="text-xs text-gray-500 mt-1">Total Segments</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-gray-500 mt-1">Classes Found</div>
        </div>
      </div>

      <div className="flex gap-6 flex-col sm:flex-row">
        {/* Pie chart */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <svg width="120" height="120" viewBox="0 0 120 120" className="mb-2">
            {pieSlices.map((slice, i) => {
              if (slice.fraction < 0.001) return null;
              const r = 50;
              const cx = 60, cy = 60;
              const startRad = (slice.startAngle - 90) * Math.PI / 180;
              const endRad = (slice.endAngle - 90) * Math.PI / 180;
              const largeArc = slice.fraction > 0.5 ? 1 : 0;
              const x1 = cx + r * Math.cos(startRad);
              const y1 = cy + r * Math.sin(startRad);
              const x2 = cx + r * Math.cos(endRad);
              const y2 = cy + r * Math.sin(endRad);

              // Full circle case
              if (slice.fraction > 0.999) {
                return (
                  <circle key={i} cx={cx} cy={cy} r={r} fill={CLASS_COLORS[slice.cls]} />
                );
              }

              return (
                <path
                  key={i}
                  d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`}
                  fill={CLASS_COLORS[slice.cls]}
                  stroke="#111827"
                  strokeWidth="1"
                />
              );
            })}
            <circle cx="60" cy="60" r="25" fill="#111827" />
          </svg>
          <div className="text-xs text-gray-500">Area Distribution</div>
        </div>

        {/* Bar chart */}
        <div className="flex-1 space-y-2">
          {entries.map(({ cls, count, avgArea }) => (
            <div key={cls} className="flex items-center gap-2">
              <span className="text-xs w-20 text-gray-400 truncate flex items-center gap-1">
                {CLASS_ICONS[cls]} {CLASS_LABELS[cls]}
              </span>
              <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(avgArea / maxArea) * 100}%`,
                    backgroundColor: CLASS_COLORS[cls],
                    minWidth: '2px',
                  }}
                />
              </div>
              <span className="text-xs text-gray-500 w-16 text-right">{count} seg{count !== 1 ? 's' : ''}</span>
              <span className="text-xs text-gray-600 w-14 text-right">{avgArea.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
