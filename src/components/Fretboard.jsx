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

const Fretboard = ({ frets, barre, dbFingers, startFret = 1, displayFretCount = 4 }) => {
  // Use database barre info if available, otherwise detect it
  const barreInfo = barre ? {
    isBarre: true,
    barreFret: barre,
    startString: 0,
    endString: STRINGS_COUNT - 1
  } : detectBarreChord(frets);

  // Database fingers are in LowE-to-e order (thickest to thinnest)
  // SVG displays in high-e-to-LowE order (thinnest to thickest)
  // So we reverse to map correctly
  let fingerNumbers;
  if (dbFingers && Array.isArray(dbFingers) && dbFingers.length === STRINGS_COUNT) {
    // Use database fingers, reversed for SVG order
    fingerNumbers = [...dbFingers].reverse();
  } else {
    // Fallback to calculated fingers
    fingerNumbers = calculateFingerNumbers(frets, barreInfo);
  }

  const NUT_WIDTH = 6;

  const MARGIN_LEFT = 30;
  const NUT_X = MARGIN_LEFT + NUT_WIDTH;
  const MARGIN_TOP = 20;
  const FRET_WIDTH = 40;
  const STRING_HEIGHT = 35;
  const GRID_WIDTH = displayFretCount * FRET_WIDTH;
  const GRID_HEIGHT = (STRINGS_COUNT - 1) * STRING_HEIGHT;

  const viewWidth = MARGIN_LEFT + NUT_WIDTH + GRID_WIDTH + 15;
  const viewHeight = MARGIN_TOP + GRID_HEIGHT + 45;

  // Determine where to start showing fret numbers
  // If startFret > 1, show the barre/capo position and absolute fret numbers
  const fretStart = startFret > 1 ? startFret : 1;

  return (
    <div className="w-full bg-slate-900 p-4 rounded-xl shadow-2xl overflow-hidden">
      <svg
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        className="w-full max-w-[400px] mx-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Fret Lines (Vertical) */}
        {[...Array(displayFretCount + 1)].map((_, i) => (
          <line
            key={`fret-v-${i}`}
            x1={NUT_X + i * FRET_WIDTH}
            y1={MARGIN_TOP - 5}
            x2={NUT_X + i * FRET_WIDTH}
            y2={MARGIN_TOP + GRID_HEIGHT + 5}
            stroke="#475569"
            strokeWidth="2"
          />
        ))}

        {/* Nut (Thick vertical bar at fret 0, only for open positions) */}
        {startFret <= 1 && <line x1={NUT_X} y1={MARGIN_TOP - 5} x2={NUT_X} y2={MARGIN_TOP + GRID_HEIGHT + 5} stroke="#cbd5e1" strokeWidth={NUT_WIDTH} />}

        {/* Strings (Horizontal) */}
        {[...Array(STRINGS_COUNT)].map((_, i) => {
          const y = MARGIN_TOP + i * STRING_HEIGHT;
          return (
            <g key={`string-${i}`}>
              <text x={MARGIN_LEFT - 5} y={y + 4} textAnchor="end" fill="#94a3b8" className="text-xs font-bold uppercase">
                {STRING_NAMES[i]}
              </text>
              <line x1={NUT_X} y1={y} x2={NUT_X + GRID_WIDTH} y2={y} stroke="#94a3b8" strokeWidth="1.5" />
            </g>
          );
        })}

        {/* Barre Highlight */}
        {barreInfo && barreInfo.isBarre && (
          <rect
            x={NUT_X + (barreInfo.barreFret - startFret) * FRET_WIDTH - 4}
            y={MARGIN_TOP}
            width={8}
            height={GRID_HEIGHT}
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
            return <text key={`m-${stringIndex}`} x={MARGIN_LEFT - 5} y={y + 4} textAnchor="end" fill="#ef4444" className="font-bold">×</text>;
          }
          if (fret === 0) {
            return <circle key={`o-${stringIndex}`} cx={NUT_X} cy={y} r={10} fill="#22c55e" />;
          }
          if (fret > 0) {
            // Calculate x position based on fret relative to startFret
            const relativeFret = fret - startFret + 1;
            const x = NUT_X + relativeFret * FRET_WIDTH - (FRET_WIDTH / 2);
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

        {/* Fret Number Labels - absolute fret numbers based on startFret */}
        {[...Array(displayFretCount)].map((_, i) => (
          <text 
            key={`fn-${i}`} 
            x={NUT_X + (i + 1) * FRET_WIDTH - (FRET_WIDTH / 2)} 
            y={MARGIN_TOP + GRID_HEIGHT + 25} 
            textAnchor="middle" 
            fill="#64748b" 
            className="text-xs font-semibold"
          >
            {startFret + i}
          </text>
        ))}
      </svg>

      <div className="mt-3 flex gap-4 text-xs text-slate-400 justify-center">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span> Open</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Fretted</span>
        {barreInfo && barreInfo.isBarre && <span className="flex items-center gap-1"><span className="w-4 h-1 bg-red-500 inline-block rounded"></span> Barre</span>}
      </div>
    </div>
  );
};

export default Fretboard;
