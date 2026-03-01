'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import UploadZone from '@/components/UploadZone';
import ImageGrid from '@/components/ImageGrid';
import { Project, ImageRecord } from '@/lib/types';

export default function Home() {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const loadImages = useCallback(async () => {
    if (!activeProject) return;
    setLoading(true);
    // Fetch project to get image IDs, then fetch each image
    const projRes = await fetch('/api/projects');
    const projects: Project[] = await projRes.json();
    const proj = projects.find(p => p.id === activeProject.id);
    if (proj && proj.imageIds.length > 0) {
      const imgs = await Promise.all(
        proj.imageIds.map(id => fetch(`/api/images/${id}`).then(r => r.json()))
      );
      setImages(imgs.filter(Boolean));
    } else {
      setImages([]);
    }
    setLoading(false);
  }, [activeProject]);

  useEffect(() => { loadImages(); }, [loadImages]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeProjectId={activeProject?.id} onProjectSelect={setActiveProject} />

      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">
                {activeProject ? activeProject.name : 'SkySegment'}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {activeProject
                  ? `${images.length} images • Created ${new Date(activeProject.createdAt).toLocaleDateString()}`
                  : 'Aerial image segmentation platform'}
              </p>
            </div>
            {activeProject && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Ready for upload
              </div>
            )}
          </div>
        </header>

        <div className="p-6">
          {!activeProject ? (
            // Landing state
            <div className="max-w-2xl mx-auto text-center py-20">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-3xl font-bold mb-6">
                SS
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Welcome to SkySegment</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Upload aerial and drone imagery, automatically segment terrain features, and export analysis in GeoJSON, PNG, or CSV formats.
              </p>
              <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto text-left">
                {[
                  { icon: '📸', title: 'Upload', desc: 'Drag & drop aerial images' },
                  { icon: '🔍', title: 'Segment', desc: 'AI auto-detects features' },
                  { icon: '📊', title: 'Export', desc: 'GeoJSON, PNG, CSV' },
                ].map(item => (
                  <div key={item.title} className="p-4 bg-gray-900 rounded-xl border border-gray-800">
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <div className="text-sm font-medium text-gray-200">{item.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-8">← Create or select a project to begin</p>
            </div>
          ) : (
            <div className="space-y-6">
              <UploadZone projectId={activeProject.id} onUpload={loadImages} />
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 mx-auto border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <ImageGrid images={images} />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
