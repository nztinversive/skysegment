'use client';

import { useEffect, useState } from 'react';
import { ImageRecord } from '@/lib/types';
import SegmentViewer from '@/components/SegmentViewer';
import Link from 'next/link';

export default function ViewerPage({ params }: { params: { id: string } }) {
  const [image, setImage] = useState<ImageRecord | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/images/${params.id}`)
      .then(r => {
        if (!r.ok) throw new Error('Image not found');
        return r.json();
      })
      .then(setImage)
      .catch(e => setError(e.message));
  }, [params.id]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/" className="text-blue-400 hover:underline text-sm">← Back to dashboard</Link>
        </div>
      </div>
    );
  }

  if (!image) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-950 border-b border-gray-800 px-6 py-3 flex items-center gap-4">
        <Link href="/" className="text-gray-500 hover:text-gray-300 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-sm font-semibold text-white">{image.originalName}</h1>
          <p className="text-xs text-gray-500">{image.segmentCount} segments detected</p>
        </div>
      </header>
      <main className="flex-1 p-4">
        <SegmentViewer image={image} />
      </main>
    </div>
  );
}
