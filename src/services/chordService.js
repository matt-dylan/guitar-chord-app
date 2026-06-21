import chordData from '../data/chords_db.json';

// Database root names (as they appear in the JSON file)
// The new database uses the same root names: A, A#, B, C, C#, D, D#, E, F, F#, G, G#
const ROOTS = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];

// Mapping from common user input to database root names
const ROOT_ALIASES = {
  'C#': 'C#', 'Db': 'C#',
  'F#': 'F#', 'Gb': 'F#',
  'Eb': 'Eb', 'D#': 'D#',
  'Bb': 'Bb', 'A#': 'A#',
  'Ab': 'Ab', 'G#': 'G#',
  'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G', 'A': 'A', 'B': 'B',
};

/**
 * Parse a chord name like "Cm7", "Bbmaj7", "C#dim" into { root, suffix }
 */
function parseChordName(name) {
  const trimmed = name.trim();
  
  // Sort roots by length descending so we match longest first (e.g. "C#" before "C")
  const sortedRoots = [...ROOTS].sort((a, b) => b.length - a.length);
  
  // Try to match root note first (longest match wins)
  let matchedRoot = null;
  let rest = trimmed;
  
  for (const r of sortedRoots) {
    if (trimmed.startsWith(r)) {
      matchedRoot = r;
      rest = trimmed.slice(r.length);
      break;
    }
  }
  
  if (!matchedRoot) {
    return null; // Can't parse
  }
  
  // Normalize the suffix part
  let suffix = rest.toLowerCase().replace(/[^a-z0-9#b+]/g, '');
  
  // Map common aliases to the suffixes used in our database
  const suffixMap = {
    // Major (empty suffix)
    '': '',
    'maj': '',
    '+': 'aug',
    'aug': 'aug',
    
    // Minor
    'm': 'm',
    '-': 'm',
    'minor': 'm',
    
    // Diminished
    'dim': 'dim',
    'o': 'dim',
    '°': 'dim',
    
    // Dim7
    'dim7': 'dim7',
    'o7': 'dim7',
    '°7': 'dim7',
    
    // Suspended
    'sus': 'sus',
    'sus2': 'sus2',
    'sus4': 'sus4',
    'sus2sus4': 'sus2sus4',
    
    // Seventh chords
    '7': '7',
    'dom7': '7',
    'maj7': 'maj7',
    'ma7': 'maj7',
    'm(maj7)': 'mmaj7',
    'min(maj7)': 'mmaj7',
    'm7': 'm7',
    'min7': 'm7',
    '-7': 'm7',
    'm7b5': 'm7b5',
    'min7b5': 'm7b5',
    'half-dim': 'm7b5',
    'ø': 'm7b5',
    'dim7': 'dim7',
    'o7': 'dim7',
    '°7': 'dim7',
    '7b5': '7b5',
    '7#9': '7#9',
    '7sus4': '7sus4',
    '7sus2': '7sus2',
    'alt': 'alt',
    
    // Ninth, eleventh, thirteenth
    '9': '9',
    'maj9': 'maj9',
    'ma9': 'maj9',
    'm9': 'm9',
    'min9': 'm9',
    '9#11': '9#11',
    '9b5': '9b5',
    '9sus4': '9sus4',
    '11': '11',
    'maj11': 'maj11',
    'maj#11': 'maj#11',
    '13': '13',
    'maj13': 'maj13',
    'm6': 'm6',
    'min6': 'm6',
    'm69': 'm69',
    '6': '6',
    '69': '69',
    '6add9': '6add9',
    '6b5': '6b5',
    'add9': 'add9',
    'add11': 'add11',
    'madd9': 'madd9',
    
    // Power chords
    '5': '5',
    'power': '5',
  };
  
  // Try exact match first, then prefix matching (longest match wins)
  let matchedSuffix = null;
  let bestLen = 0;
  
  for (const [key, mapped] of Object.entries(suffixMap)) {
    if (key && suffix.startsWith(key) && key.length > bestLen) {
      // Make sure the character after the match is not a letter (to avoid "m7" matching "m")
      const afterMatch = suffix[key.length];
      if (!afterMatch || !/[a-z]/.test(afterMatch)) {
        bestLen = key.length;
        matchedSuffix = mapped;
      }
    }
  }
  
  if (matchedSuffix) {
    return { root: matchedRoot, suffix: matchedSuffix };
  }
  
  // If no suffix matched, return the raw suffix as-is (it might be a valid DB suffix)
  if (suffix) {
    return { root: matchedRoot, suffix };
  }
  
  // No suffix at all → default to major
  return { root: matchedRoot, suffix: 'major' };
}

/**
 * Fetches the chord shape for a given root and suffix from the local dictionary.
 * Accepts either:
 *   - Two args: getChordShape('C', 'minor')
 *   - One arg:  getChordShape('Cm') or getChordShape('C minor')
 */
export async function getChordShape(rootOrName, suffix) {
  let root, suffixName;
  
  if (suffix !== undefined) {
    // Two-arg form: use root directly (already mapped)
    root = rootOrName.trim().replace(/\s+/g, '');
    suffixName = suffix;
  } else {
    // Single-arg form: parse the chord name
    const parsed = parseChordName(rootOrName);
    if (!parsed) {
      throw new Error(`Could not parse chord name "${rootOrName}"`);
    }
    root = parsed.root;
    suffixName = parsed.suffix;
  }
  
  // Check local dictionary
  if (chordData[root] && chordData[root][suffixName]) {
    const chord = chordData[root][suffixName];
    return {
      shape: chord.frets,
      barre: chord.barre,
      fingers: chord.fingers,
      positions: chord.positions || [chord]  // Include all positions for cycling
    };
  }
  
  // Try common aliases for the suffix
  const aliases = {
    'minor': ['m', '-'],
    'major': ['', 'maj'],
    'dim': ['o', '°'],
    'dim7': ['o7', '°7'],
    'm7': ['min7', '-7'],
    'm7b5': ['min7b5', 'half-dim', 'ø'],
    'maj7': ['ma7'],
    'mmaj7': ['m(maj7)', 'min(maj7)'],
    'sus': [''],
    '7': ['dom7'],
    '5': ['power'],
    'aug': ['+'],
  };
  
  if (aliases[suffixName]) {
    for (const alias of aliases[suffixName]) {
      if (chordData[root] && chordData[root][alias]) {
        const chord = chordData[root][alias];
        return {
          shape: chord.frets,
          barre: chord.barre,
          fingers: chord.fingers,
          positions: chord.positions || [chord]
        };
      }
    }
  }
  
  throw new Error(`Chord "${rootOrName}" not found in the local library.`);
}

/**
 * Returns the list of available root notes.
 */
export function getRoots() {
  return ROOTS;
}

/**
 * Returns the list of available suffixes for a given root note.
 */
export function getSuffixes(root) {
  const normalizedName = root.trim().replace(/\s+/g, '');
  if (chordData[normalizedName]) {
    return Object.keys(chordData[normalizedName])
      .sort((a, b) => {
        // Sort empty string (major) first, then alphabetically
        if (a === '' && b !== '') return -1;
        if (a !== '' && b === '') return 1;
        return a.localeCompare(b);
      });
  }
  return [];
}

/**
 * Returns all positions for a given chord (for position cycling).
 */
export function getChordPositions(rootOrName, suffix) {
  let root, suffixName;
  
  if (suffix !== undefined) {
    root = rootOrName.trim().replace(/\s+/g, '');
    suffixName = suffix;
  } else {
    const parsed = parseChordName(rootOrName);
    if (!parsed) {
      throw new Error(`Could not parse chord name "${rootOrName}"`);
    }
    root = parsed.root;
    suffixName = parsed.suffix;
  }
  
  if (chordData[root] && chordData[root][suffixName]) {
    const chord = chordData[root][suffixName];
    return chord.positions || [chord];
  }
  
  throw new Error(`Chord "${rootOrName}" not found in the local library.`);
}
