import { useState, useEffect } from 'react';
import Fretboard from './components/Fretboard';
import { chordDatabase } from './data/chordDatabase';

function App() {
  const [selectedChord, setSelectedChord] = useState('C major');
  const [selectedPosition, setSelectedPosition] = useState(0);
  const [chords, setChords] = useState({});
  const [positions, setPositions] = useState([]);

  // Load chord database
  useEffect(() => {
    setChords(chordDatabase);
    const firstChord = Object.keys(chordDatabase)[0];
    setSelectedChord(firstChord);
  }, []);

  // Update positions when chord changes
  useEffect(() => {
    if (chords[selectedChord]) {
      const chordData = chords[selectedChord];
      const posList = chordData.positions || [];
      setPositions(posList);
      setSelectedPosition(0);
    }
  }, [selectedChord, chords]);

  const handleChordSelect = (chord) => {
    setSelectedChord(chord);
  };

  const handlePositionChange = (direction) => {
    if (positions.length <= 1) return;
    if (direction === 'next') {
      setSelectedPosition((prev) => (prev + 1) % positions.length);
    } else {
      setSelectedPosition((prev) => (prev - 1 + positions.length) % positions.length);
    }
  };

  const handlePositionClick = (index) => {
    setSelectedPosition(index);
  };

  const getChordDisplay = (chordKey) => {
    const parts = chordKey.split(' ');
    return {
      root: parts[0],
      quality: parts.slice(1).join(' '),
    };
  };

  if (!chords[selectedChord]) {
    return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading...</div>;
  }

  const chordData = chords[selectedChord];
  const display = getChordDisplay(selectedChord);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Guitar Chord Master
          </h1>
          <p className="text-slate-400 text-sm mt-1">Learn and practice guitar chords</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chord Selection Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Chords</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {Object.keys(chords).map((chord) => (
                  <button
                    key={chord}
                    onClick={() => handleChordSelect(chord)}
                    className={`w-full text-left px-3 py-2 rounded transition-colors ${
                      selectedChord === chord
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {chord}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800 rounded-lg p-6">
              {/* Chord Title */}
              <div className="text-center mb-6">
                <h2 className="text-4xl font-bold">
                  <span className="text-blue-400">{display.root}</span>
                  <span className="text-slate-300"> {display.quality}</span>
                </h2>
              </div>

              {/* Fretboard */}
              <div className="flex justify-center mb-4">
                <Fretboard
                  chord={chordData}
                  positions={positions}
                  selectedPosition={selectedPosition}
                />
              </div>

              {/* Position Navigation - Moved below chord image */}
              {positions.length > 1 && (
                <div className="flex items-center justify-center gap-4 mt-4">
                  <button
                    onClick={() => handlePositionChange('prev')}
                    className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
                    aria-label="Previous position"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-slate-300 text-sm">
                    Position {selectedPosition + 1} of {positions.length}
                  </span>
                  <button
                    onClick={() => handlePositionChange('next')}
                    className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
                    aria-label="Next position"
                    disabled={positions.length <= 1}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
