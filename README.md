# Sun Position Visualizer

An interactive 3D sun position explorer built with Next.js 16, React 19, and React Three Fiber. The app visualises the sun path for any day and location while providing live altitude, azimuth, sunrise, and sunset information.

![Sun position visualiser screenshot](public/sun.svg)

## Getting started

This project uses [Bun](https://bun.sh/) as the package manager and runtime. Make sure Bun is installed (`bun --version`).

```bash
bun install
bun dev
```

### Available scripts

| Command       | Description                              |
| ------------- | ---------------------------------------- |
| `bun dev`     | Start the Next.js development server     |
| `bun run build` | Create an optimized production build      |
| `bun start`   | Run the production server                 |
| `bun run lint`  | Run Biome for formatting and lint checks |

## Features

- Next.js 16 App Router with React 19
- Real-time sun position derived from [SunCalc](https://github.com/mourner/suncalc)
- Physically-based 3D scene rendered with React Three Fiber and Three.js
- Animated daily cycle powered by GSAP
- Configurable latitude, longitude, date, and orientation controls
- Biome for linting and code formatting
