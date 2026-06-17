import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Search, AlertCircle, Music } from 'lucide-react';
import { getChordShape } from '../services/chordService';

const ChordSearch = forwardRef(({ onChordFound, onError }, ref) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const performSearch = async (chordName) => {
    const targetName = chordName || input;
    if (!targetName) return;

    setLoading(true);
    setError(null);
    
    try {
      const shape = await getChordShape(targetName);
      onChordFound(targetName.trim(), shape);
    } catch (err) {
      setError(err.message);
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    performSearch
  }));

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    await performSearch();
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg mb-6">
      <form onSubmit={handleSearch} className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. C, G, Am, Bm..."
            className="w-full bg-slate-900 text-white pl-10 pr-4 py-2 rounded-lg border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {loading ? '...' : <><Music className="w-4 h-4" /> Find</>}
        </button>
      </form>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-400 text-sm bg-red-950/30 p-3 rounded-lg border border-red-900/50">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
});

ChordSearch.displayName = 'ChordSearch';

export default ChordSearch;
