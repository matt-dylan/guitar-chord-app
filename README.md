# Guitar Chord Pro

A modern, interactive guitar chord learning tool built with React and Vite. Visualize any guitar chord with a clear fretboard diagram, search your chord database, and master your chords with precision.

![Guitar Chord Pro Screenshot](./screenshot.png)

## Features

- **Interactive Fretboard** — Visualize chord shapes with color-coded finger placements (blue = fretted, green = open strings, red X = muted strings)
- **Root Note & Chord Type Selection** — Choose from all 12 root notes and 50+ chord types (Major, minor, 7th, sus, dim, augmented, and more)
- **Search Bar** — Quickly find any chord by name (e.g. "C", "G", "Am", "Bm7")
- **Clean Dark UI** — Easy on the eyes with a modern, responsive design

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

## Setup & Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/matt-dylan/guitar-chord-app.git
   cd guitar-chord-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

   The app will open at `http://localhost:5173`

## Available Scripts

| Command              | Description                        |
|----------------------|------------------------------------|
| `npm run dev`        | Start the Vite development server  |
| `npm run build`      | Build for production               |
| `npm run preview`    | Preview the production build       |

## Project Structure

```
guitar-chord-app/
├── src/
│   ├── components/        # React components
│   │   ├── ChordSearch.jsx
│   │   └── Fretboard.jsx
│   ├── data/              # Chord database & config
│   │   ├── chords.json
│   │   └── chords_db.json
│   ├── services/          # API & data services
│   │   └── chordService.js
│   ├── App.jsx            # Main application component
│   └── main.jsx           # Entry point
├── public/                # Static assets
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## Tech Stack

- **React 18** — UI framework
- **Vite 5** — Build tool & dev server
- **Tailwind CSS 3** — Utility-first styling
- **Lucide React** — Icon library

## License

This project is licensed under the [MIT License](LICENSE).
