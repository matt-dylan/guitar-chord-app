#!/usr/bin/env python3
"""
Build a reduced 'essential' chord database from tombatossals/chords-db.

- Filters to commonly used chord types only (~25 per root + slash chords)
- Reduces each chord to 5 most common positions (open position first)
- Outputs the format expected by the React app (chords_db.json)
"""

import json
import os
import sys
from urllib.request import urlopen

# ─── Essential chord types (suffixes) ───
ESSENTIAL_SUFFIXES = [
    '',          # major
    'm',         # minor
    '5',         # power
    'sus2',
    'sus4',
    'm7',
    'maj7',
    '7',         # dominant 7th
    'm6',
    '6',
    'add9',
    'm7b5',      # half-diminished
    'dim',
    'dim7',
    'aug',
    'maj9',
    'm9',
    '9',
    '11',
    '13',
    '7sus4',
    '7#9',
    '6add9',
    'madd9',
    'maj7sus4',
]

# ─── Common slash chords ───
# Maps base suffix to list of common bass notes for each root
# Bass notes are calculated using interval theory
# For each root, we add: /5th, /3rd, /6th (most common inversions)
SLASH_CHORD_CONFIG = {
    'major': {
        # bass notes for each root: [5th, 3rd, 6th]
        'A': ['E', 'C#', 'F#'],
        'A#': ['F', 'D', 'F#'],
        'B': ['F', 'G#', 'A#'],
        'C': ['G', 'E', 'A'],
        'C#': ['G#', 'E#', 'A#'],
        'D': ['A', 'F#', 'B'],
        'D#': ['A#', 'G', 'C'],
        'E': ['B', 'G#', 'C#'],
        'F': ['C', 'A', 'D'],
        'F#': ['C#', 'A#', 'D#'],
        'G': ['D', 'B', 'E'],
        'G#': ['D#', 'C', 'F'],
    },
    'minor': {
        'A': ['E', 'C', 'F#'],
        'A#': ['F', 'D#', 'F#'],
        'B': ['F', 'D', 'A#'],
        'C': ['G', 'Eb', 'A'],
        'C#': ['G#', 'E', 'A#'],
        'D': ['A', 'F', 'B'],
        'D#': ['A#', 'G#', 'C'],
        'E': ['B', 'G', 'C#'],
        'F': ['C', 'Ab', 'D'],
        'F#': ['C#', 'A', 'D#'],
        'G': ['D', 'Bb', 'E'],
        'G#': ['D#', 'B', 'F'],
    },
    '7': {
        'A': ['E', 'C#', 'F#'],
        'A#': ['F', 'D', 'F#'],
        'B': ['F', 'G#', 'A#'],
        'C': ['G', 'E', 'A'],
        'C#': ['G#', 'E#', 'A#'],
        'D': ['A', 'F#', 'B'],
        'D#': ['A#', 'G', 'C'],
        'E': ['B', 'G#', 'C#'],
        'F': ['C', 'A', 'D'],
        'F#': ['C#', 'A#', 'D#'],
        'G': ['D', 'B', 'E'],
        'G#': ['D#', 'C', 'F'],
    },
    'maj7': {
        'A': ['E', 'C#'],
        'A#': ['F', 'D'],
        'B': ['F', 'G#'],
        'C': ['G', 'E'],
        'C#': ['G#', 'E#'],
        'D': ['A', 'F#'],
        'D#': ['A#', 'G'],
        'E': ['B', 'G#'],
        'F': ['C', 'A'],
        'F#': ['C#', 'A#'],
        'G': ['D', 'B'],
        'G#': ['D#', 'C'],
    },
    'm7': {
        'A': ['E', 'C'],
        'A#': ['F', 'D#'],
        'B': ['F', 'D'],
        'C': ['G', 'Eb'],
        'C#': ['G#', 'E'],
        'D': ['A', 'F'],
        'D#': ['A#', 'G#'],
        'E': ['B', 'G'],
        'F': ['C', 'Ab'],
        'F#': ['C#', 'A'],
        'G': ['D', 'Bb'],
        'G#': ['D#', 'B'],
    },
}

# ─── Database root name mapping ───
DB_ROOT_ALIASES = {
    'C#': 'Csharp', 'Db': 'Csharp',
    'F#': 'Fsharp', 'Gb': 'Fsharp',
    'Eb': 'Eb', 'D#': 'D#',
    'Bb': 'Bb', 'A#': 'A#',
    'Ab': 'Ab', 'G#': 'G#',
    'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G', 'A': 'A', 'B': 'B',
}

USER_ROOT_NAMES = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#']

SUFFIX_MAP = {
    'major': '',
    'minor': 'm',
    '': '',
}

def normalize_suffix(tomba_suffix):
    if '/' in tomba_suffix:
        parts = tomba_suffix.split('/')
        base = parts[0]
        bass = parts[1]
        base_norm = SUFFIX_MAP.get(base, base)
        return f"{base_norm}/{bass}"
    return SUFFIX_MAP.get(tomba_suffix, tomba_suffix)


def is_essential(tomba_suffix, root):
    # Handle slash chords from tombatossals
    if '/' in tomba_suffix:
        parts = tomba_suffix.split('/')
        base = parts[0]
        if base in ('major', 'minor', 'm7', 'maj7', '7', 'm6', '6', 'dim', 'dim7', 'aug', 'sus2', 'sus4', 'm7b5'):
            return True
        return False
    
    norm = SUFFIX_MAP.get(tomba_suffix, tomba_suffix)
    return norm in ESSENTIAL_SUFFIXES


def generate_slash_chord_keys(root, db_root):
    """Generate slash chord suffix keys to look up in tombatossals data."""
    slash_chords = []
    
    # For each base suffix type, get the bass notes for this root
    for base_suffix, bass_notes_by_root in SLASH_CHORD_CONFIG.items():
        if root not in bass_notes_by_root:
            continue
        for bass in bass_notes_by_root[root]:
            # Map base suffix to tombatossals slash format
            # tombatossals uses: /Bass (major), m/Bass (minor), 7/Bass (dom7)
            tomba_slash = {
                'major': f'/{bass}',
                'minor': f'm/{bass}',
                '7': f'7/{bass}',
                'maj7': f'maj7/{bass}',
                'm7': f'm7/{bass}',
            }[base_suffix]
            slash_chords.append(tomba_slash)
    
    return slash_chords


def score_position(pos):
    frets = pos['frets']
    open_count = sum(1 for f in frets if f == 0)
    barres = pos.get('barres', [])
    is_barre = len(barres) > 0
    base_fret = pos.get('baseFret', 1)
    
    score = 0
    score += open_count * 10
    score += 5 if is_barre else 0
    score -= base_fret * 2
    return score


def has_open_strings(frets):
    return any(f == 0 for f in frets)


def reduce_positions(positions, max_positions=5):
    if not positions:
        return []
    
    # Deduplicate by fret pattern
    seen = set()
    unique = []
    for pos in positions:
        key = tuple(pos['frets'])
        if key not in seen:
            seen.add(key)
            unique.append(pos)
    
    # Separate open positions from others
    open_positions = [p for p in unique if has_open_strings(p['frets'])]
    other_positions = [p for p in unique if not has_open_strings(p['frets'])]
    
    # Score and sort non-open positions
    scored = [(score_position(p), p) for p in other_positions]
    scored.sort(key=lambda x: -x[0])
    
    # Take top scorers (minus 1 slot for the best open position)
    slots_remaining = max_positions - len(open_positions)
    if slots_remaining < 0:
        slots_remaining = 0
    
    selected = open_positions + [p for _, p in scored[:slots_remaining]]
    return selected[:max_positions]


def calculate_start_fret(frets):
    fretted = [f for f in frets if f > 0]
    return min(fretted) if fretted else 1


def convert_position(pos):
    barres = pos.get('barres', [])
    return {
        'frets': pos['frets'],
        'fingers': pos['fingers'],
        'barre': barres[0] if barres else None,
        'capo': False,
        'startFret': calculate_start_fret(pos['frets']),
    }


def build_essential_db(tomba_data):
    chords = tomba_data['chords']
    result = {}
    
    for user_root in USER_ROOT_NAMES:
        db_root = DB_ROOT_ALIASES[user_root]
        if db_root not in chords:
            continue
        
        result[user_root] = {}
        
        # Build a lookup: suffix -> chord_type for this root
        root_chords = {ct['suffix']: ct for ct in chords[db_root]}
        
        # 1. Process essential non-slash suffixes
        for chord_type in chords[db_root]:
            tomba_suffix = chord_type.get('suffix', '')
            
            if '/' in tomba_suffix:
                continue  # Handle slash chords separately
            
            if not is_essential(tomba_suffix, db_root):
                continue
            
            norm_suffix = normalize_suffix(tomba_suffix)
            
            positions = chord_type.get('positions', [])
            if not positions:
                continue
            
            reduced = reduce_positions(positions, max_positions=5)
            
            first_pos = convert_position(reduced[0])
            all_positions = [convert_position(p) for p in reduced]
            
            result[user_root][norm_suffix] = {
                **first_pos,
                'positions': all_positions,
            }
        
        # 2. Add common slash chords from tombatossals
        slash_keys = generate_slash_chord_keys(user_root, db_root)
        for slash_suffix in slash_keys:
            if slash_suffix in root_chords:
                ct = root_chords[slash_suffix]
                positions = ct.get('positions', [])
                if not positions:
                    continue
                
                norm_suffix = normalize_suffix(slash_suffix)
                reduced = reduce_positions(positions, max_positions=5)
                
                first_pos = convert_position(reduced[0])
                all_positions = [convert_position(p) for p in reduced]
                
                result[user_root][norm_suffix] = {
                    **first_pos,
                    'positions': all_positions,
                }
    
    return result


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.join(script_dir, '..')
    
    tomba_path = '/tmp/tombatossals_guitar.json'
    
    if not os.path.exists(tomba_path):
        print("Fetching tombatossals/chords-db from GitHub...")
        url = 'https://raw.githubusercontent.com/tombatossals/chords-db/master/lib/guitar.json'
        response = urlopen(url, timeout=30)
        data = json.loads(response.read().decode('utf-8'))
        os.makedirs('/tmp', exist_ok=True)
        with open(tomba_path, 'w') as f:
            json.dump(data, f)
    else:
        with open(tomba_path, 'r') as f:
            data = json.load(f)
    
    print(f"Loaded tombatossals data: {len(data['chords'])} roots")
    
    essential_db = build_essential_db(data)
    
    total_chords = 0
    total_positions = 0
    for root in sorted(essential_db.keys()):
        chords = essential_db[root]
        total_chords += len(chords)
        for suffix, chord in chords.items():
            total_positions += len(chord.get('positions', []))
    
    print(f"\nEssential DB stats:")
    print(f"  Chord types: {total_chords}")
    print(f"  Total positions: {total_positions}")
    print(f"  Avg positions/chord: {total_positions / total_chords:.1f}")
    
    output_path = os.path.join(project_dir, 'src', 'data', 'chords_db.json')
    with open(output_path, 'w') as f:
        json.dump(essential_db, f, indent=2)
    
    file_size = os.path.getsize(output_path)
    print(f"\nSaved to: {output_path}")
    print(f"File size: {file_size / 1024:.1f} KB")
    
    print(f"\nSample: C major")
    print(json.dumps(essential_db['C'][''], indent=2))


if __name__ == '__main__':
    main()
