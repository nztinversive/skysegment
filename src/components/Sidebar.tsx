'use client';

import { useState, useEffect } from 'react';
import { Project } from '@/lib/types';
import Link from 'next/link';

export default function Sidebar({ activeProjectId, onProjectSelect }: {
  activeProjectId?: string;
  onProjectSelect: (project: Project) => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(setProjects);
  }, []);

  const createProject = async () => {
    if (!newName.trim()) return;
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    });
    const project = await res.json();
    setProjects(prev => [...prev, project]);
    setNewName('');
    setShowNew(false);
    onProjectSelect(project);
  };

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      <div className="p-4 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
            SS
          </div>
          <span className="text-lg font-bold text-white">SkySegment</span>
        </Link>
      </div>

      <div className="p-3">
        <button
          onClick={() => setShowNew(true)}
          className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Project
        </button>
      </div>

      {showNew && (
        <div className="px-3 pb-3">
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createProject()}
            placeholder="Project name..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-2"
          />
          <div className="flex gap-2">
            <button onClick={createProject} className="flex-1 py-1.5 bg-blue-600 text-white rounded text-xs font-medium">Create</button>
            <button onClick={() => setShowNew(false)} className="flex-1 py-1.5 bg-gray-700 text-gray-300 rounded text-xs">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Projects</div>
        {projects.length === 0 && (
          <div className="px-3 py-4 text-sm text-gray-600 text-center">No projects yet</div>
        )}
        {projects.map(p => (
          <button
            key={p.id}
            onClick={() => onProjectSelect(p)}
            className={`w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-gray-800/50 transition-colors ${
              activeProjectId === p.id ? 'bg-gray-800 border-l-2 border-blue-500' : ''
            }`}
          >
            <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center text-gray-400 text-xs font-medium">
              {p.imageCount}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-200 truncate">{p.name}</div>
              <div className="text-xs text-gray-500">{p.imageCount} images</div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
