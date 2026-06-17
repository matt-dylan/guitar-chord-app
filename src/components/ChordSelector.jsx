import React from 'react';

const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const TYPES = [
  { id: 'maj', label: 'Major' },
  { id: 'min', label: 'Minor' },
  { id: 'sus2', label: 'Sus2' },
  { id: 'sus4', label: 'Sus4' },
  { id: '7', label: '7th' },
  { id: 'maj7', label: 'Maj7' },
  { id: 'min7', label: 'Min7' },
];

const ChordSelector = ({ selectedRoot, onSelectRoot, selectedType, onSelectType }) => {
  return (
    <div className="chord-card p-6 space-y-6">
      <div>
        <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Root Note</label>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {ROOT_NOTES.map((note) => (
            <button
              key={note}
              onClick={() => onSelectRoot(note === selectedRoot ? null : note)}
              className={`py-2 rounded-md font-bold transition-all ${
                selectedRoot === note
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 ring-2 ring-blue-400'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {note}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Chord Type</label>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => onSelectType(type.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedType === type.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 ring-2 ring-blue-400'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChordSelector;
