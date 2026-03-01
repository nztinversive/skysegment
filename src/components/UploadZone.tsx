'use client';

import { useState, useCallback } from 'react';

export default function UploadZone({ projectId, onUpload }: {
  projectId: string;
  onUpload: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setUploading(true);
    const fileArr = Array.from(files);
    for (let i = 0; i < fileArr.length; i++) {
      setProgress(`Uploading ${i + 1}/${fileArr.length}: ${fileArr[i].name}`);
      const formData = new FormData();
      formData.append('file', fileArr[i]);
      formData.append('projectId', projectId);
      await fetch('/api/upload', { method: 'POST', body: formData });
    }
    setUploading(false);
    setProgress('');
    onUpload();
  }, [projectId, onUpload]);

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
          <div className="w-10 h-10 mx-auto border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-blue-400">{progress}</p>
          <p className="text-xs text-gray-500">Processing & segmenting...</p>
        </div>
      ) : (
        <div className="space-y-3">
          <svg className="w-12 h-12 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-300">Drop aerial images here</p>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG, or TIFF • Click to browse</p>
          </div>
        </div>
      )}
    </div>
  );
}
