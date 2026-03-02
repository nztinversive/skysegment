'use client';

import { useState, useCallback } from 'react';
import { CustomClass } from '@/lib/types';

export default function UploadZone({ projectId, classes, onUpload }: {
  projectId: string;
  classes: CustomClass[];
  onUpload: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [currentFile, setCurrentFile] = useState('');
  const [segmenting, setSegmenting] = useState(false);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setUploading(true);
    const fileArr = Array.from(files);
    for (let i = 0; i < fileArr.length; i++) {
      const file = fileArr[i];
      setCurrentFile(file.name);
      setProgress(`Uploading ${i + 1}/${fileArr.length}`);
      setSegmenting(false);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);
      if (classes.length > 0) {
        formData.append('classes', JSON.stringify(classes));
      }

      // Show segmenting state after a brief upload delay
      const segTimer = setTimeout(() => {
        setSegmenting(true);
        setProgress(`Segmenting ${i + 1}/${fileArr.length}`);
      }, 500);

      await fetch('/api/upload', { method: 'POST', body: formData });
      clearTimeout(segTimer);
    }
    setUploading(false);
    setSegmenting(false);
    setProgress('');
    setCurrentFile('');
    onUpload();
  }, [projectId, classes, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
        isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
      }`}
      onClick={() => {
        if (uploading) return;
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*';
        input.onchange = () => input.files && handleFiles(input.files);
        input.click();
      }}
    >
      {uploading ? (
        <div className="space-y-3">
          {segmenting ? (
            <div className="relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-2 border-2 border-blue-500 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse' }} />
            </div>
          ) : (
            <div className="w-10 h-10 mx-auto border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
          <p className="text-sm font-medium text-blue-400">{progress}</p>
          <p className="text-xs text-gray-500">{currentFile}</p>
          {segmenting && (
            <div className="flex items-center justify-center gap-2 text-xs text-cyan-400">
              <span className="inline-block w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
              SAM 3 analyzing {classes.length} classes...
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <svg className="w-12 h-12 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-300">Drop aerial images here</p>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG, or TIFF • Click to browse</p>
            {classes.length > 0 && (
              <p className="text-xs text-cyan-600 mt-2">
                🎯 Will segment: {classes.map(c => c.text).join(', ')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
