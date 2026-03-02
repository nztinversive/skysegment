'use client';

import { useState } from 'react';
import { CustomClass, SegmentClass, CLASS_COLORS, CLASS_LABELS, CLASS_ICONS } from '@/lib/types';

const SEGMENT_CLASSES: SegmentClass[] = ['vegetation', 'water', 'structure', 'bare_earth', 'road', 'vehicle', 'unknown'];

const PRESETS: { name: string; classes: CustomClass[] }[] = [
  {
    name: '🏗️ Construction Site',
    classes: [
      { text: 'building or structure', classLabel: 'structure' },
      { text: 'person or worker', classLabel: 'vehicle' },
      { text: 'heavy equipment or crane or excavator', classLabel: 'unknown' },
      { text: 'bare soil or dirt', classLabel: 'bare_earth' },
      { text: 'road or pavement', classLabel: 'road' },
    ],
  },
  {
    name: '🌾 Agriculture',
    classes: [
      { text: 'crop or vegetation', classLabel: 'vegetation' },
      { text: 'bare soil or plowed field', classLabel: 'bare_earth' },
      { text: 'water or irrigation', classLabel: 'water' },
      { text: 'road or path', classLabel: 'road' },
      { text: 'building or barn', classLabel: 'structure' },
    ],
  },
  {
    name: '☀️ Solar / Rooftop',
    classes: [
      { text: 'solar panel', classLabel: 'structure' },
      { text: 'roof', classLabel: 'bare_earth' },
      { text: 'vegetation or tree', classLabel: 'vegetation' },
      { text: 'road or driveway', classLabel: 'road' },
      { text: 'vehicle or car', classLabel: 'vehicle' },
    ],
  },
  {
    name: '🏘️ Urban / Aerial',
    classes: [
      { text: 'tree or bush or grass', classLabel: 'vegetation' },
      { text: 'water or pond or river', classLabel: 'water' },
      { text: 'building or structure', classLabel: 'structure' },
      { text: 'bare soil or dirt', classLabel: 'bare_earth' },
      { text: 'road or pavement', classLabel: 'road' },
      { text: 'car or truck or vehicle', classLabel: 'vehicle' },
    ],
  },
];

interface ClassEditorProps {
  classes: CustomClass[];
  onChange: (classes: CustomClass[]) => void;
}

export default function ClassEditor({ classes, onChange }: ClassEditorProps) {
  const [newText, setNewText] = useState('');
  const [newLabel, setNewLabel] = useState<SegmentClass>('unknown');
  const [expanded, setExpanded] = useState(false);

  const addClass = () => {
    if (!newText.trim()) return;
    onChange([...classes, { text: newText.trim(), classLabel: newLabel }]);
    setNewText('');
  };

  const removeClass = (index: number) => {
    onChange(classes.filter((_, i) => i !== index));
  };

  const applyPreset = (preset: CustomClass[]) => {
    onChange(preset);
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-300">🎯 Segment Classes</span>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
            {classes.length} active
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-800 pt-3">
          {/* Presets */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Quick Presets</label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset.classes)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Current classes */}
          <div className="space-y-1.5">
            {classes.map((cls, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cls.color || CLASS_COLORS[cls.classLabel] }}
                />
                <span className="text-xs text-gray-400">{CLASS_ICONS[cls.classLabel]}</span>
                <span className="text-sm text-gray-200 flex-1 truncate">{cls.text}</span>
                <span className="text-xs text-gray-500">{CLASS_LABELS[cls.classLabel]}</span>
                <button
                  onClick={() => removeClass(i)}
                  className="text-gray-600 hover:text-red-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Add new class */}
          <div className="flex gap-2">
            <input
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addClass()}
              placeholder="What to find... (e.g. solar panel)"
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <select
              value={newLabel}
              onChange={e => setNewLabel(e.target.value as SegmentClass)}
              className="px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-blue-500"
            >
              {SEGMENT_CLASSES.map(cls => (
                <option key={cls} value={cls}>{CLASS_ICONS[cls]} {CLASS_LABELS[cls]}</option>
              ))}
            </select>
            <button
              onClick={addClass}
              disabled={!newText.trim()}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Add
            </button>
          </div>

          <p className="text-xs text-gray-600">
            Describe what SAM 3 should look for. Be specific — &ldquo;red car&rdquo; works better than &ldquo;vehicle&rdquo;.
          </p>
        </div>
      )}
    </div>
  );
}
