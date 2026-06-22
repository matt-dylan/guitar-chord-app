import React from 'react';

const Fretboard = ({ chord, positions, selectedPosition, onSelectPosition, isBarre, barreFret }) => {
  const STRING_COUNT = 6;
  const FRET_COUNT = 15;

  const stringLabels = ['E', 'A', 'D', 'G', 'B', 'e'];
  const noteMap = {
    'E': ['E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#'],
    'A': ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    'D': ['D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E'],
    'G': ['G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A'],
    'B': ['B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#'],
    'e': ['e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b', 'c', 'c#', 'd', 'd#', 'e', 'f', 'f#'],
  };

  const margin = { top: 40, right: 30, bottom: 50, left: 35 };
  const spacing = {
    string: 28,
    fret: 48,
  };

  const svgWidth = margin.left + (STRING_COUNT - 1) * spacing.string + margin.right + 20;
  const svgHeight = margin.top + FRET_COUNT * spacing.fret + margin.bottom;

  const getX = (stringIndex) => margin.left + stringIndex * spacing.string;
  const getY = (fretIndex) => margin.top + fretIndex * spacing.fret;

  // Get the actual start fret based on the selected position
  const getStartFret = () => {
    if (!positions || selectedPosition >= positions.length) return 1;
    const pos = positions[selectedPosition];
    if (pos.capo !== null && pos.capo !== undefined) return pos.capo + 1;
    return 1;
  };

  const startFret = getStartFret();

  // Render barre line if applicable
  const renderBarre = () => {
    if (!isBarre || barreFret === null || barreFret === undefined) return null;

    const pos = positions[selectedPosition];
    if (!pos) return null;

    // Find the first and last string that is fretted (not null, not -1, not 0)
    const frettedStrings = [];
    for (let s = 0; s < STRING_COUNT; s++) {
      const fret = pos.frets[s];
      if (fret !== null && fret > 0) {
        frettedStrings.push(s);
      }
    }

    if (frettedStrings.length === 0) return null;

    const minString = Math.min(...frettedStrings);
    const maxString = Math.max(...frettedStrings);

    // The barre fret is relative to the position, so actual fret = barreFret + startFret - 1
    const actualBarreFret = barreFret + startFret - 1;
    const y = getY(actualBarreFret - 1);
    const x1 = getX(minString) - 10;
    const x2 = getX(maxString) + 10;

    // Barre background pill
    return (
      <g>
        <rect
          x={x1}
          y={y - 10}
          width={x2 - x1}
          height={20}
          rx={10}
          fill="rgba(96, 165, 250, 0.15)"
        />
        <rect
          x={x1 + 4}
          y={y - 1}
          width={x2 - x1 - 8}
          height={2}
          fill="#60a5fa"
          rx={1}
        />
      </g>
    );
  };

  const renderFingerDots = () => {
    if (!chord || !positions || selectedPosition >= positions.length) return null;

    const pos = positions[selectedPosition];
    const frettedPositions = [];

    for (let s = 0; s < STRING_COUNT; s++) {
      const fret = pos.frets[s];
      if (fret !== null && fret > 0) {
        frettedPositions.push({ string: s, fret, fretNumber: fret + startFret - 1 });
      }
    }

    return frettedPositions.map((fp, idx) => {
      const cx = getX(fp.string);
      const cy = getY(fp.fret - 1);
      const note = noteMap[stringLabels[fp.string]][fp.fretNumber - 1];

      // Check if this is a barre note (same fret as barre)
      const isBarreNote = isBarre && fp.fret === barreFret;

      return (
        <g key={`dot-${fp.string}`}>
          <circle
            cx={cx}
            cy={cy}
            r={14}
            fill={isBarreNote ? '#3b82f6' : '#2563eb'}
            stroke={isBarreNote ? '#93c5fd' : '#60a5fa'}
            strokeWidth={2}
          />
          <text
            x={cx}
            y={cy + 1}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize={11}
            fontWeight="bold"
          >
            {note}
          </text>
        </g>
      );
    });
  };

  const renderOpenMutes = () => {
    if (!chord || !positions || selectedPosition >= positions.length) return null;

    const pos = positions[selectedPosition];
    const elements = [];

    for (let s = 0; s < STRING_COUNT; s++) {
      const fret = pos.frets[s];
      const cx = getX(s);
      const nutY = getY(0) - 12;

      if (fret === 0) {
        // Open string - circle
        elements.push(
          <circle
            key={`open-${s}`}
            cx={cx}
            cy={nutY - 10}
            r={6}
            fill="none"
            stroke="#94a3b8"
            strokeWidth={1.5}
          />
        );
      } else if (fret === -1) {
        // Muted string - X
        elements.push(
          <g key={`mute-${s}`} stroke="#ef4444" strokeWidth={2}>
            <line x1={cx - 4} y1={nutY - 14} x2={cx + 4} y2={nutY - 6} />
            <line x1={cx + 4} y1={nutY - 14} x2={cx - 4} y2={nutY - 6} />
          </g>
        );
      }
    }

    return elements;
  };

  const renderFretNumbers = () => {
    const fretNums = [];
    for (let f = 0; f < FRET_COUNT; f++) {
      const actualFret = f + startFret;
      fretNums.push(
        <text
          key={`fret-num-${f}`}
          x={getX(0)}
          y={getY(f) + spacing.fret - 12}
          textAnchor="middle"
          fill="#64748b"
          fontSize={12}
          fontWeight="500"
        >
          {actualFret}
        </text>
      );
    }
    return fretNums;
  };

  const renderFretMarkers = () => {
    const markerFrets = [3, 5, 7, 9, 12, 15];
    const dots = [];

    for (let f = 0; f < FRET_COUNT; f++) {
      const actualFret = f + startFret;
      if (markerFrets.includes(actualFret)) {
        if (actualFret === 12) {
          // Double dot for 12th fret
          dots.push(
            <circle key={`marker-${f}`} cx={getX(2)} cy={getY(f) + spacing.fret / 2} r={4} fill="#475569" />
          );
          dots.push(
            <circle key={`marker-${f}-2`} cx={getX(3)} cy={getY(f) + spacing.fret / 2} r={4} fill="#475569" />
          );
        } else {
          dots.push(
            <circle key={`marker-${f}`} cx={getX(2)} cy={getY(f) + spacing.fret / 2} r={4} fill="#475569" />
          );
        }
      }
    }

    return dots;
  };

  return (
    <div className="fretboard-container flex justify-center">
      <svg
        width={svgWidth}
        height={svgHeight}
        className="bg-slate-800 rounded-lg shadow-2xl"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        {/* String labels (E A D G B e) */}
        {stringLabels.map((label, i) => (
          <text
            key={`string-label-${i}`}
            x={getX(i)}
            y={margin.top - 18}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize={12}
            fontWeight="600"
          >
            {label}
          </text>
        ))}

        {/* Fret lines */}
        {Array.from({ length: FRET_COUNT }, (_, f) => (
          <line
            key={`fret-${f}`}
            x1={getX(0)}
            y1={getY(f)}
            x2={getX(STRING_COUNT - 1)}
            y2={getY(f)}
            stroke="#475569"
            strokeWidth={f === 0 ? 3 : 1.5}
          />
        ))}

        {/* String lines */}
        {Array.from({ length: STRING_COUNT }, (_, s) => (
          <line
            key={`string-${s}`}
            x1={getX(s)}
            y1={getY(0)}
            x2={getX(s)}
            y2={getY(FRET_COUNT - 1)}
            stroke="#94a3b8"
            strokeWidth={2.5 - s * 0.3}
          />
        ))}

        {/* Fret markers (dots) */}
        {renderFretMarkers()}

        {/* Barre line */}
        {renderBarre()}

        {/* Open string circles / muted Xs */}
        {renderOpenMutes()}

        {/* Finger dots with note names */}
        {renderFingerDots()}

        {/* Fret numbers at bottom */}
        {renderFretNumbers()}
      </svg>
    </div>
  );
};

export default Fretboard;
