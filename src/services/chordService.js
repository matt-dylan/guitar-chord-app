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
 * Parse a chord name like "Cm7", "Bbmaj7", "C#dim", "C/G" into { root, suffix }
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
  
  // Handle slash chords: e.g., "C/G" → suffix="/G", "Cm/G" → suffix="m/G"
  if (rest.startsWith('/')) {
    const bassNote = rest.slice(1);
    // The suffix is the part after root but before /, plus the bass note
    // e.g., "C/G" → suffix="/G", "Cm/G" → suffix="m/G"
    // We need to figure out what's before the /
    const slashIdx = rest.indexOf('/');
    const beforeSlash = rest.slice(0, slashIdx); // e.g., '' for "C/G", 'm' for "Cm/G"
    const afterSlash = rest.slice(slashIdx + 1); // e.g., 'G' for "C/G"
    
    // Map the part before slash to DB suffix
    let baseSuffix = '';
    const baseSuffixMap = {
      'm': 'm', 'min': 'm', '-': 'm', 'minor': 'm',
      'maj7': 'maj7', 'ma7': 'maj7',
      '7': '7', 'dom7': '7',
      'm7': 'm7', 'min7': 'm7', '-7': 'm7',
      'm7b5': 'm7b5', 'min7b5': 'm7b5',
      'maj': '', '': '',
      'sus2': 'sus2', 'sus4': 'sus4', 'sus': 'sus',
      'dim': 'dim', 'dim7': 'dim7',
      'aug': 'aug', '+': 'aug',
      '6': '6', 'm6': 'm6', 'min6': 'm6',
      '9': '9', 'maj9': 'maj9', 'm9': 'm9',
      '11': '11', '13': '13',
      'add9': 'add9', 'madd9': 'madd9',
      '7#9': '7#9', '7sus4': '7sus4',
    };
    
    baseSuffix = baseSuffixMap[beforeSlash] || beforeSlash;
    return { root: matchedRoot, suffix: `${baseSuffix}/${afterSlash}` };
  }
  
  // Also handle slash chords where the base is before the slash (e.g., "Cm/G" → rest="m/G")
  if (rest.includes('/')) {
    const slashIdx = rest.indexOf('/');
    const beforeSlash = rest.slice(0, slashIdx);
    const afterSlash = rest.slice(slashIdx + 1);
    
    let baseSuffix = '';
    const baseSuffixMap = {
      'm': 'm', 'min': 'm', '-': 'm', 'minor': 'm',
      'maj7': 'maj7', 'ma7': 'maj7',
      '7': '7', 'dom7': '7',
      'm7': 'm7', 'min7': 'm7', '-7': 'm7',
      'm7b5': 'm7b5', 'min7b5': 'm7b5',
      'maj': '', '': '',
      'sus2': 'sus2', 'sus4': 'sus4', 'sus': 'sus',
      'dim': 'dim', 'dim7': 'dim7',
      'aug': 'aug', '+': 'aug',
      '6': '6', 'm6': 'm6', 'min6': 'm6',
      '9': '9', 'maj9': 'maj9', 'm9': 'm9',
      '11': '11', '13': '13',
      'add9': 'add9', 'madd9': 'madd9',
      '7#9': '7#9', '7sus4': '7sus4',
    };
    
    baseSuffix = baseSuffixMap[beforeSlash] || beforeSlash;
    return { root: matchedRoot, suffix: `${baseSuffix}/${afterSlash}` };
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
    'min': 'm',
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
    const suffixes = Object.keys(chordData[normalizedName]);
    
    // Separate slash and non-slash suffixes
    const nonSlash = suffixes.filter(s => !s.includes('/'));
    const slash = suffixes.filter(s => s.includes('/'));
    
    // Sort non-slash: empty (major) first, then alphabetically
    nonSlash.sort((a, b) => {
      if (a === '' && b !== '') return -1;
      if (a !== '' && b === '') return 1;
      return a.localeCompare(b);
    });
    
    // Group slash chords by their base type (part before /)
    const slashGroups = {};
    for (const s of slash) {
      const parts = s.split('/');
      const base = parts[0] !== '' ? parts[0] : '';
      if (!slashGroups[base]) slashGroups[base] = [];
      slashGroups[base].push(s);
    }
    
    // Sort each group by bass note
    const bassOrder = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
    for (const base in slashGroups) {
      slashGroups[base].sort((a, b) => {
        const bassA = a.split('/')[1];
        const bassB = b.split('/')[1];
        return bassOrder.indexOf(bassA) - bassOrder.indexOf(bassB);
      });
    }
    
    // Interleave: for each non-slash suffix, add its slash chords after it
    const result = [];
    for (const ns of nonSlash) {
      result.push(ns);
      // Add slash chords that share this base
      const slashBase = ns === '' ? '' : ns;
      if (slashGroups[slashBase]) {
        result.push(...slashGroups[slashBase]);
      }
    }
    
    // Add any remaining slash groups (e.g., 7/G when 7 is in nonSlash)
    // (Already handled above since we iterate nonSlash)
    
    return result;
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
