import React, { useState, useRef, useEffect } from 'react';
import ChordSearch from './components/ChordSearch';
import Fretboard from './components/Fretboard';
import { getChordShape, getRoots, getSuffixes } from './services/chordService';

function App() {
  const [chordShape, setChordShape] = useState([-1, 3, 2, 0, 1, 0]); // C major by default
  const [chordBarre, setChordBarre] = useState(null);
  const [chordFingers, setChordFingers] = useState(null);
  const [error, setError] = useState(null);
  const [currentChord, setCurrentChord] = useState('C Major');
  const [selectedRoot, setSelectedRoot] = useState('C');
  const [selectedSuffix, setSelectedSuffix] = useState('major');
  const chordSearchRef = useRef(null);

  // Load initial chord on mount
  useEffect(() => {
    loadInitialChord();
  }, []);

  const loadInitialChord = async () => {
    try {
      const result = await getChordShape('C', 'major');
      setChordShape(result.shape);
      setChordBarre(result.barre);
      setChordFingers(result.fingers);
      setCurrentChord('C Major');
    } catch (err) {
      console.error('Failed to load initial chord:', err);
    }
  };

  const formatChordName = (rawName) => {
    const suffixMap = {
      'minor': 'Minor',
      'm': 'Minor',
      '-': 'Minor',
      'major': 'Major',
      '': 'Major',
      'maj': 'Major',
      'dim': 'Dim',
      'dim7': 'Dim7',
      'o': 'Dim',
      'o7': 'Dim7',
      'm7': 'm7',
      'min7': 'm7',
      '-7': 'm7',
      'm7b5': 'm7b5',
      'min7b5': 'm7b5',
      'maj7': 'maj7',
      'ma7': 'maj7',
      'mmaj7': 'mMaj7',
      'sus': 'Sus',
      'sus2': 'Sus2',
      'sus4': 'Sus4',
      'sus2sus4': 'Sus',
      '7': '7',
      'dom7': '7',
      '5': '5',
      'power': '5',
      'aug': 'Aug',
      '+': 'Aug',
      'add9': 'add9',
      'm9': 'm9',
      'maj9': 'maj9',
      '9': '9',
      '11': '11',
      '13': '13',
      'm6': 'm6',
      '6': '6',
      '69': '69',
      'add11': 'add11',
      'madd9': 'madd9',
    };
    
    // Map DB root names back to user-facing names
    const DB_TO_USER = {
      'Csharp': 'C#', 'Fsharp': 'F#',
      'Eb': 'Eb', 'Bb': 'Bb', 'Ab': 'Ab',
      'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G', 'A': 'A', 'B': 'B',
    };
    
    // Try to extract root and suffix from the raw name (longest root first)
    const USER_ROOTS = ['Ab', 'A#', 'Bb', 'B#', 'C#', 'Db', 'D#', 'Eb', 'E#', 'F#', 'Gb', 'G#', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];
    let root = '';
    let suffix = '';
    
    for (const r of USER_ROOTS) {
      if (rawName.startsWith(r)) {
        root = r;
        suffix = rawName.slice(r.length).toLowerCase();
        break;
      }
    }
    
    if (!root) return rawName;
    
    // Map suffix to display name
    const displaySuffix = suffixMap[suffix] || suffix || 'Major';
    if (displaySuffix === 'Major' || displaySuffix === '') return root;
    return `${root} ${displaySuffix}`;
  };

  // Parse a chord name into user-facing root and suffix for dropdown sync
  const parseChordForUI = (rawName) => {
    const USER_ROOTS = ['Ab', 'A#', 'Bb', 'B#', 'C#', 'Db', 'D#', 'Eb', 'E#', 'F#', 'Gb', 'G#', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];
    for (const r of USER_ROOTS) {
      if (rawName.startsWith(r)) {
        const root = r;
        const suffixRaw = rawName.slice(r.length).toLowerCase();
        // Map to a DB suffix the dropdown can use
        const suffixMap = {
          'minor': 'minor', 'm': 'minor', '-': 'minor',
          'major': 'major', '': 'major', 'maj': 'major',
          'dim': 'dim', 'dim7': 'dim7', 'o': 'dim', 'o7': 'dim7',
          'm7': 'm7', 'min7': 'm7', '-7': 'm7',
          'm7b5': 'm7b5', 'min7b5': 'm7b5',
          'maj7': 'maj7', 'ma7': 'maj7',
          'mmaj7': 'mmaj7', 'm(maj7)': 'mmaj7',
          'sus': 'sus', 'sus2': 'sus2', 'sus4': 'sus4',
          '7': '7', 'dom7': '7',
          '5': '5', 'power': '5',
          'aug': 'aug', '+': 'aug',
          'add9': 'add9', 'm9': 'm9', 'maj9': 'maj9', '9': '9',
          '11': '11', '13': '13', 'm6': 'm6', '6': '6', '69': '69',
          'add11': 'add11', 'madd9': 'madd9',
        };
        const suffix = suffixMap[suffixRaw] || suffixRaw || 'major';
        return { root, suffix };
      }
    }
    return null;
  };

  const handleChordFound = (name, result) => {
    setCurrentChord(formatChordName(name));
    setChordShape(result.shape);
    setChordBarre(result.barre);
    setChordFingers(result.fingers);
    
    // Sync dropdowns to the searched chord
    const parsed = parseChordForUI(name);
    if (parsed) {
      setSelectedRoot(parsed.root);
      setSelectedSuffix(parsed.suffix);
    }
    setError(null);
  };

  const handleSearchError = (errMsg) => {
    setError(errMsg);
  };

  const handleSearchDirectly = async (chordName) => {
    try {
      const result = await getChordShape(chordName);
      
      let displayName = chordName;
      if (chordName.endsWith('power')) {
        displayName = chordName.replace('power', '') + ' Power';
      } else if (chordName === 'C' || chordName === 'G' || chordName === 'D' || 
                 chordName === 'A' || chordName === 'E' || chordName === 'F') {
        displayName = chordName + ' Major';
      }
      
      setCurrentChord(displayName);
      setChordShape(result.shape);
      setChordBarre(result.barre);
      setChordFingers(result.fingers);
      
      // Sync dropdowns to the searched chord
      const parsed = parseChordForUI(chordName);
      if (parsed) {
        setSelectedRoot(parsed.root);
        setSelectedSuffix(parsed.suffix);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to load chord:', err);
    }
  };

  const handleRootChange = (root) => {
    setSelectedRoot(root);
    setSelectedSuffix('major');
    loadChord(root, 'major');
  };

  const handleSuffixChange = (suffix) => {
    setSelectedSuffix(suffix);
    loadChord(selectedRoot, suffix);
  };

  const loadChord = async (root, suffix) => {
    try {
      const result = await getChordShape(root, suffix);
      setChordShape(result.shape);
      setChordBarre(result.barre);
      setChordFingers(result.fingers);
      setCurrentChord(`${root} ${suffix === 'major' ? '' : suffix}`);
      setError(null);
    } catch (err) {
      console.error('Failed to load chord:', err);
      setError(err.message);
    }
  };

  const roots = getRoots();
  const suffixes = getSuffixes(selectedRoot);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-2">
          Guitar Chord Pro
        </h1>
        <p className="text-slate-400 text-lg">Master your chords with precision</p>
      </header>

      <main>
        {/* Chord Selector */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 mb-6 space-y-3">
          <h2 className="text-xl font-semibold text-white">
            {currentChord} <span className="text-slate-500 text-sm font-normal ml-2">Chord Shape</span>
          </h2>

          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="block text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Root Note</label>
              <select 
                value={selectedRoot}
                onChange={(e) => handleRootChange(e.target.value)}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {roots.map(root => (
                  <option key={root} value={root}>{root}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Chord Type</label>
              <select 
                value={selectedSuffix}
                onChange={(e) => handleSuffixChange(e.target.value)}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {suffixes.map(suffix => (
                  <option key={suffix} value={suffix}>{suffix === 'major' ? 'Major' : suffix}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Fretboard */}
        <Fretboard frets={chordShape} barre={chordBarre} dbFingers={chordFingers} />

        {/* Search box */}
        <ChordSearch 
          ref={chordSearchRef}
          onChordFound={handleChordFound} 
          onError={handleSearchError} 
        />

        {error && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
