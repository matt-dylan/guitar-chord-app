import React from 'react';

const STRINGS_COUNT = 6;
// Top to bottom on screen: high e, B, G, D, A, Low E
// Standard notation (bottom to top): E, A, D, G, B, e
const STRING_NAMES = ['e', 'B', 'G', 'D', 'A', 'E'];

const getChordFret = (stringIndex, frets) => frets[STRINGS_COUNT - 1 - stringIndex];

function detectBarreChord(frets) {
  const frettedNotes = [];
  let hasOpenString = false;
  
  for (let i = 0; i < STRINGS_COUNT; i++) {
    const fret = getChordFret(i, frets);
    if (fret === 0) hasOpenString = true;
    if (fret > 0) {
      frettedNotes.push({ string: i, fret });
    }
  }
  if (frettedNotes.length === 0) return null;

  const minFret = Math.min(...frettedNotes.map(n => n.fret));
  
  // Barre chords typically have no open strings and start at fret 1 or higher
  if (hasOpenString || minFret < 1) return null;

  const stringsAtMinFret = frettedNotes.filter(n => n.fret === minFret);

  if (stringsAtMinFret.length >= 2) {
    return {
      isBarre: true,
      barreFret: minFret,
      startString: Math.min(...stringsAtMinFret.map(n => n.string)),
      endString: Math.max(...stringsAtMinFret.map(n => n.string))
    };
  }
  return null;
}

function calculateFingerNumbers(frets, barreInfo) {
  const fingers = new Array(STRINGS_COUNT).fill(null);
  const frettedFretValues = new Set();

  for (let i = 0; i < STRINGS_COUNT; i++) {
    const fret = getChordFret(i, frets);
    // Include frets from strings that are played above the barre (not at the barre fret)
    if (fret > 0 && (!barreInfo || fret !== barreInfo.barreFret)) {
      frettedFretValues.add(fret);
    }
  }

  const sortedFretValues = Array.from(frettedFretValues).sort((a, b) => a - b);

  for (let i = 0; i < STRINGS_COUNT; i++) {
    const fret = getChordFret(i, frets);
    if (fret === null || fret === undefined || fret === -1) {
      fingers[i] = null; 
    } else if (fret === 0) {
      fingers[i] = 0; 
    } else if (barreInfo && i >= barreInfo.startString && i <= barreInfo.endString) {
      const fret = getChordFret(i, frets);
      if (fret === barreInfo.barreFret) {
        fingers[i] = 1; // Only strings AT the barre fret get finger 1
      } else {
        // Strings above the barre use the rank logic, starting at finger 2
        const rank = sortedFretValues.indexOf(fret);
        fingers[i] = Math.min(rank + 2, 4);
      }
    } else if (fret > 0) {
      const rank = sortedFretValues.indexOf(fret);
      fingers[i] = Math.min(rank + 1, 4);
    }
  }
  return fingers;
}

const Fretboard = ({ frets, barre, dbFingers }) => {
  // Use database barre info if available, otherwise detect it
  const barreInfo = barre ? {
    isBarre: true,
    barreFret: barre,
    startString: 0,
    endString: STRINGS_COUNT - 1
  } : detectBarreChord(frets);

  // Map database fingers (LowE, A, D, G, B, e) to SVG order (high e, B, G, D, A, Low E)
  const mappedFingers = dbFingers ? [...dbFingers].reverse() : null;
  const fingerNumbers = mappedFingers || calculateFingerNumbers(frets, barreInfo);

  const DISPLAY_FRET_COUNT = 4;

  const MARGIN_LEFT = 35;
  const MARGIN_TOP = 20;
  const FRET_WIDTH = 40;
  const STRING_HEIGHT = 35;
  const GRID_WIDTH = DISPLAY_FRET_COUNT * FRET_WIDTH;
  const GRID_HEIGHT = (STRINGS_COUNT - 1) * STRING_HEIGHT;

  const viewWidth = MARGIN_LEFT + GRID_WIDTH + 25;
  const viewHeight = MARGIN_TOP + GRID_HEIGHT + 60;

  return (
    <div className="w-full bg-slate-900 p-4 rounded-xl shadow-2xl overflow-hidden">
      <svg
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        className="w-full max-w-[400px] mx-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Fret Lines (Vertical) */}
        {[...Array(DISPLAY_FRET_COUNT + 1)].map((_, i) => (
          <line
            key={`fret-v-${i}`}
            x1={MARGIN_LEFT + i * FRET_WIDTH}
            y1={MARGIN_TOP - 5}
            x2={MARGIN_LEFT + i * FRET_WIDTH}
            y2={MARGIN_TOP + GRID_HEIGHT + 5}
            stroke="#475569"
            strokeWidth="2"
          />
        ))}

        {/* Nut (Thick line at fret 0) */}
        <line x1={MARGIN_LEFT} y1={MARGIN_TOP - 5} x2={MARGIN_LEFT + FRET_WIDTH} y2={MARGIN_TOP - 5} stroke="#cbd5e1" strokeWidth="6" />

        {/* Strings (Horizontal) */}
        {[...Array(STRINGS_COUNT)].map((_, i) => {
          const y = MARGIN_TOP + i * STRING_HEIGHT;
          return (
            <g key={`string-${i}`}>
              <text x={MARGIN_LEFT - 10} y={y + 4} textAnchor="end" fill="#94a3b8" className="text-xs font-bold uppercase">
                {STRING_NAMES[i]}
              </text>
              <line x1={MARGIN_LEFT} y1={y} x2={MARGIN_LEFT + GRID_WIDTH} y2={y} stroke="#94a3b8" strokeWidth="1.5" />
            </g>
          );
        })}

        {/* Barre Highlight */}
        {barreInfo && (
          <rect
            x={MARGIN_LEFT + barreInfo.barreFret * FRET_WIDTH - 4}
            y={MARGIN_TOP + barreInfo.startString * STRING_HEIGHT - 10}
            width={8}
            height={(barreInfo.endString - barreInfo.startString + 1) * STRING_HEIGHT + 20}
            rx="4"
            fill="#ef4444"
            opacity="0.5"
          />
        )}

        {/* Notes & Finger Numbers */}
        {frets.map((fretData, stringIndex) => {
          const fret = getChordFret(stringIndex, frets);
          const y = MARGIN_TOP + stringIndex * STRING_HEIGHT;

          if (fret === -1 || fret === null || fret === undefined) {
            return <text key={`m-${stringIndex}`} x={MARGIN_LEFT - 15} y={y + 4} textAnchor="end" fill="#ef4444" className="font-bold">×</text>;
          }
          if (fret === 0) {
            return <circle key={`o-${stringIndex}`} cx={MARGIN_LEFT + FRET_WIDTH / 2} cy={y} r={10} fill="#22c55e" />;
          }
          if (fret > 0) {
            const x = MARGIN_LEFT + fret * FRET_WIDTH - (FRET_WIDTH / 2);
            return (
              <g key={`f-${stringIndex}`}>
                <circle cx={x} cy={y} r={14} fill="#3b82f6" opacity="0.4" />
                <circle cx={x} cy={y} r={12} fill="#3b82f6" />
                {fingerNumbers[stringIndex] > 0 && (
                  <text x={x} y={y + 4} textAnchor="middle" className="fill-white text-[10px] font-bold">
                    {fingerNumbers[stringIndex]}
                  </text>
                )}
              </g>
            );
          }
          return null;
        })}

        {/* Fret Number Labels */}
        {[...Array(DISPLAY_FRET_COUNT)].map((_, i) => (
          <text 
            key={`fn-${i}`} 
            x={MARGIN_LEFT + (i + 1) * FRET_WIDTH - (FRET_WIDTH / 2)} 
            y={MARGIN_TOP + GRID_HEIGHT + 25} 
            textAnchor="middle" 
            fill="#64748b" 
            className="text-xs font-semibold"
          >
            {i + 1}
          </text>
        ))}
      </svg>

      <div className="mt-3 flex gap-4 text-xs text-slate-400 justify-center">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span> Open</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Fretted</span>
        {barreInfo && <span className="flex items-center gap-1"><span className="w-4 h-1 bg-red-500 inline-block rounded"></span> Barre</span>}
      </div>
    </div>
  );
};

export default Fretboard;