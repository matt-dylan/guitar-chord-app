# Guitar Chord Explorer

A modern, interactive guitar chord learning tool built with React, Vite, and Tailwind CSS.

## Features

- **Interactive Fretboard**: Visualize chord positions on a realistic 6-string, 12-fret fretboard
- **Multiple Positions**: View different ways to play the same chord across the fretboard (open position first, then movable shapes down the neck)
- **Barre Chords**: Clear visual indication of barre chord shapes with a distinct red marker
- **Position Navigation**: Switch between different chord positions with arrow controls below the fretboard
- **Position-Specific Finger Numbers**: Finger numbers adapt to each position and show only valid fingers for that chord
- **Note Annotations**: Note names displayed on fret positions for educational purposes
- **Dark Theme**: Modern dark UI with gradient accents
- **Responsive Design**: Works great on desktop and mobile

## Chord Data

The app uses chord data from the [guitar-chords-db-json](https://github.com/szaza/guitar-chords-db-json) repository, converted for use in this project. The data includes:

- **732 chord types** across 12 root notes and 61 qualities
- **13,742 total positions** (multiple ways to play each chord)
- **Barre chord detection** for visual clarity
- **Note name annotations** for educational purposes

## Running Locally

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open [http://localhost:5173](http://localhost:5173) in your browser

## Building for Production

```bash
npm run build
```

The optimized production build will be in the `dist/` directory.

## Chord Data Format

Each chord entry contains:
- `fretPositions`: Array of 6 strings with fret numbers (null = muted, 0 = open, >0 = fretted)
- `barre`: Object with `stringStart`, `stringEnd`, and `fret` for barre chords
- `noteNames`: Array of note names for each string
- `startFret`: The fret number where the chord shape begins

## Technology Stack

- **React 19** - UI library
- **Vite 7** - Build tool and dev server
- **Tailwind CSS 4** - Utility-first CSS framework
- **Chord Data** - guitar-chords-db-json (converted)

## License

MIT
