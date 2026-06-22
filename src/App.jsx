import React, { useState, useRef, useEffect } from 'react';
import ChordSearch from './components/ChordSearch';
import Fretboard from './components/Fretboard';
import { getChordShape, getRoots, getSuffixes, getChordPositions } from './services/chordService';

function App() {
  const [chordShape, setChordShape] = useState([-1, 3, 2, 0, 1, 0]); // C major by default
  const [chordBarre, setChordBarre] = useState(null);
  const [chordFingers, setChordFingers] = useState(null);
  const [error, setError] = useState(null);
  const [currentChord, setCurrentChord] = useState('C');
  const [selectedRoot, setSelectedRoot] = useState('C');
  const [selectedSuffix, setSelectedSuffix] = useState('');
  const [currentPosition, setCurrentPosition] = useState(0);
  const [allPositions, setAllPositions] = useState([]);
  const chordSearchRef = useRef(null);

  // Load initial chord on mount
  useEffect(() => {
    loadInitialChord();
  }, []);

  const loadInitialChord = async () => {
    try {
      const result = await getChordShape('C', '');
      setChordShape(result.shape);
      setChordBarre(result.barre);
      setChordFingers(result.fingers);
      setAllPositions(result.positions || [result]);
      setCurrentPosition(0);
      setCurrentChord('C');
    } catch (err) {
      console.error('Failed to load initial chord:', err);
    }
  };

  const SUFFIX_DISPLAY = {
    '': 'maj', 'major': 'maj', 'maj': 'maj',
    'm': 'min', 'minor': 'min', '-': 'min',
    '5': '5', 'power': '5',
    '6': '6', '69': '69', 'm6': 'm6', 'min6': 'm6',
    '6add9': '6add9', '6b5': '6b5',
    '7': '7', 'dom7': '7',
    '7b5': '7b5', '7#9': '7#9', '7#9b5': '7#9b5',
    '7sus2': '7sus2', '7sus2#5': '7sus2#5', '7sus2sus4': '7sus2sus4',
    '7sus4': '7sus4', '7sus4#5': '7sus4#5',
    '9': '9', 'maj9': 'maj9', 'm9': 'm9', 'min9': 'm9',
    '9b5': '9b5', '9sus4': '9sus4', '9#11': '9#11',
    '11': '11', 'maj11': 'maj11', 'maj#11': 'maj#11',
    '13': '13', 'maj13': 'maj13',
    'add9': 'add9', 'add11': 'add11', 'madd9': 'madd9',
    'aug': 'Aug', '+': 'Aug',
    'aug7': 'Aug7', 'aug9': 'Aug9', 'augmaj7': 'Augmaj7', 'augmaj9': 'Augmaj9',
    'dim': 'Dim', 'o': 'Dim', '°': 'Dim',
    'dim7': 'Dim7', 'o7': 'Dim7', '°7': 'Dim7',
    'm7': 'm7', 'min7': 'm7', '-7': 'm7',
    'm7b5': 'm7b5', 'min7b5': 'm7b5', 'half-dim': 'm7b5', 'ø': 'm7b5',
    'maj7': 'maj7', 'ma7': 'maj7',
    'mmaj7': 'mMaj7', 'm(maj7)': 'mMaj7', 'min(maj7)': 'mMaj7',
    'mmaj7#5': 'mMaj7#5', 'mmaj7b5': 'mMaj7b5', 'mmaj7bb5': 'mMaj7bb5',
    'mmaj9': 'mMaj9', 'mmaj11': 'mMaj11', 'mmaj13': 'mMaj13',
    'm#5': 'm#5', 'm6add9': 'm6add9', 'm7#5': 'm7#5',
    'maj7b5': 'Maj7b5', 'majb5': 'Majb5', 'mbb5': 'Mbbl5',
    'maj7sus2': 'Maj7sus2', 'maj7sus4': 'Maj7sus4',
    'maj7sus2sus4': 'Maj7sus2sus4', 'maj7sus4#5': 'Maj7sus4#5',
    'sus': 'Sus', 'sus2': 'Sus2', 'sus4': 'Sus4', 'sus2sus4': 'Sus',
    'sus2#5': 'Sus2#5', 'sus2b5': 'Sus2b5', 'sus4#5': 'Sus4#5',
  };

  const formatChordName = (rawName) => {
    // Map DB root names back to user-facing names
    const DB_TO_USER = {
      'C#': 'C#', 'F#': 'F#',
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
    const displaySuffix = SUFFIX_DISPLAY[suffix] || suffix || 'maj';
    if (displaySuffix === 'maj' || displaySuffix === '') return root;
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
          'minor': 'm', 'm': 'm', '-': 'm',
          'major': '', '': '', 'maj': '',
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
          '6add9': '6add9', '6b5': '6b5',
          '7b5': '7b5', '7#9': '7#9', '7sus4': '7sus4', '7sus2': '7sus2',
          '9b5': '9b5', '9sus4': '9sus4',
          'maj11': 'maj11', 'maj#11': 'maj#11', 'maj13': 'maj13',
          'm11': 'm11', 'm13': 'm13', 'm6add9': 'm6add9',
          'm7#5': 'm7#5', 'aug7': 'aug7', 'aug9': 'aug9', 'augmaj7': 'augmaj7', 'augmaj9': 'augmaj9',
          'mmaj7#5': 'mmaj7#5', 'mmaj7b5': 'mmaj7b5',
          'mmaj7bb5': 'mmaj7bb5', 'mmaj9': 'mmaj9', 'mmaj11': 'mmaj11', 'mmaj13': 'mmaj13',
          'maj7b5': 'maj7b5', 'maj7sus2': 'maj7sus2', 'maj7sus4': 'maj7sus4',
          'maj7sus2sus4': 'maj7sus2sus4', 'maj7sus4#5': 'maj7sus4#5',
          'majb5': 'majb5',
          'mbb5': 'mbb5', 'm#5': 'm#5',
          'sus2#5': 'sus2#5', 'sus2b5': 'sus2b5', 'sus2sus4': 'sus2sus4',
          'sus4#5': 'sus4#5',
          '7sus2#5': '7sus2#5', '7sus2sus4': '7sus2sus4', '7sus4#5': '7sus4#5',
          '7#9b5': '7#9b5',
        };
        const suffix = suffixMap[suffixRaw] || suffixRaw || '';
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
    setAllPositions(result.positions || [result]);
    setCurrentPosition(0);
    
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
      
      setCurrentChord(formatChordName(chordName));
      setChordShape(result.shape);
      setChordBarre(result.barre);
      setChordFingers(result.fingers);
      setAllPositions(result.positions || [result]);
      setCurrentPosition(0);
      
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
    setSelectedSuffix('');
    setCurrentPosition(0);
    loadChord(root, '');
  };

  const handleSuffixChange = (suffix) => {
    setSelectedSuffix(suffix);
    setCurrentPosition(0);
    loadChord(selectedRoot, suffix);
  };

  const loadChord = async (root, suffix) => {
    try {
      const result = await getChordShape(root, suffix);
      setChordShape(result.shape);
      setChordBarre(result.barre);
      setChordFingers(result.fingers);
      setAllPositions(result.positions || [result]);
      setCurrentPosition(0);
      setCurrentChord(`${root} ${suffix === '' ? '' : suffix}`);
      setError(null);
    } catch (err) {
      console.error('Failed to load chord:', err);
      setError(err.message);
    }
  };

  const cyclePosition = (direction) => {
    if (allPositions.length <= 1) return;
    const newIndex = currentPosition + direction;
    if (newIndex >= 0 && newIndex < allPositions.length) {
      setCurrentPosition(newIndex);
      const pos = allPositions[newIndex];
      setChordShape(pos.frets);
      setChordBarre(pos.barre || null);
      setChordFingers(pos.fingers);
    }
  };

  const roots = getRoots();
  const suffixes = getSuffixes(selectedRoot);

  // Get current position data
  const currentPositionData = allPositions[currentPosition] || {};
  const hasCapo = currentPositionData.capo === true;
  
  // Calculate startFret: use capo/barre position if present, otherwise find the first fretted fret
  let startFret = 1;
  if (currentPositionData.frets && currentPositionData.frets.length > 0) {
    if (hasCapo && currentPositionData.barre) {
      startFret = currentPositionData.barre;
    } else {
      // Find the minimum fretted fret (excluding muted strings -1)
      const frettedFrets = currentPositionData.frets.filter(f => f > 0);
      startFret = frettedFrets.length > 0 ? Math.min(...frettedFrets) : 1;
    }
  }
  const capoFret = startFret;
  const displayFretCount = 4;

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
                  <option key={suffix} value={suffix}>
                    {SUFFIX_DISPLAY[suffix] || suffix}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Position Cycling - always visible for consistent layout */}
        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 mb-4 flex items-center justify-center gap-4">
            <button
              onClick={() => cyclePosition(-1)}
              disabled={allPositions.length <= 1 || currentPosition === 0}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all"
              title="Previous position"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-sm text-slate-300 font-medium">
              Position {currentPosition + 1} of {allPositions.length}
            </span>
            <button
              onClick={() => cyclePosition(1)}
              disabled={allPositions.length <= 1 || currentPosition === allPositions.length - 1}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all"
              title="Next position"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
        </div>

        {/* Fretboard */}
        <Fretboard 
          frets={chordShape} 
          barre={chordBarre} 
          dbFingers={chordFingers}
          startFret={capoFret}
          displayFretCount={displayFretCount}
        />

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
