import chordData from '../data/chords_db.json';

// Database root names (as they appear in the JSON file)
const DB_ROOTS = ['C', 'Csharp', 'D', 'Eb', 'E', 'F', 'Fsharp', 'G', 'Ab', 'A', 'Bb', 'B'];

// Mapping from common user input to database root names
const ROOT_ALIASES = {
  'C#': 'Csharp', 'Db': 'Csharp',
  'F#': 'Fsharp', 'Gb': 'Fsharp',
  'Eb': 'Eb', 'D#': 'Eb',
  'Bb': 'Bb', 'A#': 'Bb',
  'Ab': 'Ab', 'G#': 'Ab',
  'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G', 'A': 'A', 'B': 'B',
};

const ROOTS = Object.keys(ROOT_ALIASES);

/**
 * Parse a chord name like "Cm7", "Bbmaj7", "C#dim" into { root, suffix }
 */
function parseChordName(name) {
  const trimmed = name.trim();
  
  // Sort roots by length descending so we match longest first (e.g. "Csharp" before "C", "Eb" before "E")
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
  
  // Map to database root name (e.g. "C#" -> "Csharp")
  const dbRoot = ROOT_ALIASES[matchedRoot];
  
  // Normalize the suffix part
  let suffix = rest.toLowerCase().replace(/[^a-z0-9#b+]/g, '');
  
  // Map common aliases to the suffixes used in our database
  const suffixMap = {
    // Major (empty suffix)
    '': 'major',
    'maj': 'major',
    '+': 'aug',
    'aug': 'aug',
    
    // Minor
    'm': 'minor',
    '-': 'minor',
    
    // Diminished
    'dim': 'dim',
    'o': 'dim',
    '°': 'dim',
    
    // Augmented
    'aug': 'aug',
    '+': 'aug',
    
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
    'alt': 'alt',
    
    // Ninth, eleventh, thirteenth
    '9': '9',
    'maj9': 'maj9',
    'ma9': 'maj9',
    'm9': 'm9',
    'min9': 'm9',
    '9#11': '9#11',
    '9b5': '9b5',
    '11': '11',
    'maj11': 'maj11',
    '13': '13',
    'maj13': 'maj13',
    'm6': 'm6',
    'min6': 'm6',
    'm69': 'm69',
    '6': '6',
    '69': '69',
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
    return { root: dbRoot, suffix: matchedSuffix };
  }
  
  // If no suffix matched, return the raw suffix as-is (it might be a valid DB suffix)
  if (suffix) {
    return { root: dbRoot, suffix };
  }
  
  // No suffix at all → default to major
  return { root: dbRoot, suffix: 'major' };
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
    // Two-arg form: map user-facing root names to DB names
    root = ROOT_ALIASES[rootOrName.trim().replace(/\s+/g, '')] || rootOrName.trim().replace(/\s+/g, '');
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
      fingers: chord.fingers
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
          fingers: chord.fingers
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
  const dbRoot = ROOT_ALIASES[normalizedName] || normalizedName;
  if (chordData[dbRoot]) {
    return Object.keys(chordData[dbRoot]);
  }
  return [];
}
