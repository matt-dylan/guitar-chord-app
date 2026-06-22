/**
 * Guitar Chord Data API
 * 
 * Loads chord data from the local JSON dictionary and provides functions
 * to access chord shapes by root note and suffix.
 */

import chordData from '../data/chord-dictionary.json' with { type: 'json' };

/**
 * Standard root note ordering.
 */
export const ROOTS = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];

/**
 * Parse a chord name like "Cm7" or "C minor" into { root, suffix }.
 */
export function parseChordName(name) {
  if (!name) return null;
  
  const trimmed = name.trim();
  const upper = trimmed.toUpperCase();
  
  // Root notes in order of longest match first
  const rootOrder = ['C#', 'D#', 'F#', 'G#', 'A#', 'C', 'D', 'E', 'F', 'G', 'A', 'B'];
  
  let matchedRoot = null;
  for (const root of rootOrder) {
    if (upper.startsWith(root)) {
      matchedRoot = root;
      break;
    }
  }
  
  if (!matchedRoot) return null;
  
  let suffix = trimmed.slice(matchedRoot.length).trim();
  if (!suffix) return { root: matchedRoot, suffix: 'major' };
  
  // Map common suffix aliases
  const suffixMap = {
    // Major (empty/default)
    '': 'major',
    'maj': 'major',
    
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
  
  // Check local dictionary
  if (chordData[root] && chordData[root][suffixName]) {
    const chord = chordData[root][suffixName];
    return {
      shape: chord.frets,
      barre: chord.barre,
      fingers: chord.fingerings,
      positions: chord.positions || [chord]
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
          fingers: chord.fingerings,
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
