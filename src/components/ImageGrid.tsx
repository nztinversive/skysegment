'use client';

import { ImageRecord, CLASS_LABELS } from '@/lib/types';
import Link from 'next/link';

export default function ImageGrid({ images }: { images: ImageRecord[] }) {
  if (images.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm">No images yet. Upload some aerial imagery to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {images.map(img => {
        const classCounts: Record<string, number> = {};
        img.segments.forEach(s => {
          classCounts[s.classLabel] = (classCounts[s.classLabel] || 0) + 1;
        });

        return (
          <Link
            key={img.id}
            href={`/viewer/${img.id}`}
            className="group bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-all hover:shadow-lg hover:shadow-blue-500/5"
          >
            <div className="aspect-video bg-gray-800 relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.thumbnailUrl}
                alt={img.originalName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-white font-medium">
                {img.segmentCount} segments
              </div>
            </div>
            <div className="p-3">
              <h3 className="text-sm font-medium text-gray-200 truncate">{img.originalName}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {img.width}×{img.height} • {new Date(img.uploadedAt).toLocaleDateString()}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(classCounts).slice(0, 4).map(([cls, count]) => (
                  <span key={cls} className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] text-gray-400">
                    {CLASS_LABELS[cls as keyof typeof CLASS_LABELS]} ({count})
                  </span>
                ))}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
