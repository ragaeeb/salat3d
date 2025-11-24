# Salat3D

A 3D interactive sun position and Islamic prayer times visualization app built with Three.js and TypeScript. This project adapts and extends the [sunposition project](https://github.com/elschilling/sunposition) by Eric Schilling to include Islamic prayer time calculations and enhanced visualization features.

![Salat3D Preview](https://user-images.githubusercontent.com/35701560/224489732-e5b23b52-6c41-4703-95bc-28ab044b13dd.png)
[![wakatime](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/b16388d4-0199-4c4f-8196-0710fe34f2b4.svg)](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/b16388d4-0199-4c4f-8196-0710fe34f2b4)
[![Netlify Status](https://api.netlify.com/api/v1/badges/b289b5bb-c66d-457b-8ce0-3a04fe4fad7d/deploy-status)](https://app.netlify.com/projects/salat3d/deploys)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)](https://www.typescriptlang.org/)
![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)

## Features

- **3D Sun Path Visualization**: Real-time sun position tracking throughout the day and year
- **Islamic Prayer Times**: Integrated prayer time calculations with configurable Fajr and Isha twilight angles
- **Interactive Camera Modes**: 
  - Bird's eye view with orbit controls
  - First-person walking mode with WASD controls
- **Dynamic Sky Rendering**: Realistic atmospheric scattering based on sun position
- **Analemma Curves**: Visualize the sun's position at the same time throughout the year
- **Sun Surface**: 3D surface showing sun paths across different months
- **Animated Birds**: Decorative animated parrots using GLTF models
- **Time Animation**: Fast-forward through time to see sun movement
- **Configurable Location**: Adjust latitude, longitude, and north offset

## Live Demo

🌐 [https://sunposition.vercel.app/](https://sunposition.vercel.app/)

## Technology Stack

- **Three.js** (v0.181.2): 3D rendering and visualization
- **TypeScript** (v5.9.3): Type-safe development
- **Vite** (v7.2.4): Build tool and dev server
- **SunCalc**: Solar position calculations
- **Adhan.js**: Islamic prayer time calculations
- **GSAP**: Animation timeline
- **lil-gui**: Debug UI controls

## Prerequisites

- **Bun** ≥1.3.2 (preferred) or **Node.js** ≥24.x
- Modern web browser with WebGL support

## Installation

```bash
# Clone the repository
git clone https://github.com/ragaeeb/salat3d.git
cd salat3d

# Install dependencies (using Bun - recommended)
bun install

# Or using npm
npm install
```

## Development

```bash
# Start the development server
bun run dev

# Or with npm
npm run dev
```

The app will be available at `http://localhost:5173` (or another port if 5173 is busy).

## Building for Production

```bash
# Type check and build
bun run build

# Or with npm
npm run build

# Preview production build
bun run preview
```

The built files will be in the `dist/` directory, ready for deployment.

## Deployment

This project is configured for deployment on **Netlify**:

1. Connect your GitHub repository to Netlify
2. Set build command: `bun run build` or `npm run build`
3. Set publish directory: `dist`
4. Deploy!

## Project Structure

```
salat3d/
├── public/                 # Static assets
│   ├── assets/
│   │   └── models/        # 3D models (GLTF/GLB)
│   │       ├── House-c.glb
│   │       └── Parrot.glb
│   ├── draco/             # Draco decoder for compressed models
│   ├── fonts/             # Three.js text fonts
│   └── sun.svg            # Favicon
├── src/
│   └── World/             # Main 3D world logic
│       ├── components/    # 3D scene components
│       └── systems/       # Core systems (rendering, controls, etc.)
├── index.html             # Entry HTML
├── main.ts                # Application entry point
├── style.css              # Global styles
└── package.json
```

See [AGENTS.md](./AGENTS.md) for detailed architecture documentation.

## Configuration

### Location Settings

Default location is set to São Paulo, Brazil. Modify in `src/World/World.ts`:

```typescript
const params: SunPathParams = {
  latitude: -23.029396,  // Your latitude
  longitude: -46.974293, // Your longitude
  northOffset: 303,      // Compass north adjustment
  // ... other settings
};
```

### Prayer Time Calculation

Adjust Fajr and Isha angles in the same file:

```typescript
fajrAngle: 18,  // Degrees below horizon for Fajr
ishaAngle: 18,  // Degrees below horizon for Isha
```

Or use the GUI controls (press 'G' to toggle) to adjust in real-time.

## Controls

### Bird's Eye View Mode (Default)
- **Left Mouse + Drag**: Rotate camera
- **Right Mouse + Drag**: Pan camera
- **Mouse Wheel**: Zoom in/out
- **Auto-rotate**: Enabled by default (toggle in GUI)

### First-Person Mode
- **W/A/S/D**: Move forward/left/backward/right
- **Mouse**: Look around (pointer lock)
- **Space**: Jump
- **Move**: Automatically locks pointer

### GUI Controls
- Press any control to open the debug menu
- Adjust time, location, rendering options, and more

## Updating Assets

### 3D Models

To replace or add 3D models:

1. Place GLTF/GLB files in `public/assets/models/`
2. For Draco-compressed models, ensure decoders are in `public/draco/`
3. Update model paths in:
   - House: `src/World/components/house/house.ts`
   - Birds: `src/World/components/birds/birds.ts`

### Fonts

Three.js text fonts go in `public/fonts/`. The app uses `droid_sans_bold.typeface.json` for directional labels (N/S/E/W).

### Icons

Replace `public/sun.svg` with your custom favicon.

## Credits

### Original Project
This project is adapted from **sunposition** by Eric Schilling:
- Repository: [https://github.com/elschilling/sunposition](https://github.com/elschilling/sunposition)
- License: GNU GPL v3

### Prayer Time Library
Islamic prayer time calculations powered by **Adhan.js**:
- Repository: [https://github.com/batoulapps/adhan-js](https://github.com/batoulapps/adhan-js)
- Maintained by: Batoul Apps

### Author
**Ragaeeb Haq**
- GitHub: [@ragaeeb](https://github.com/ragaeeb)
- Project: [https://github.com/ragaeeb/salat3d](https://github.com/ragaeeb/salat3d)

## License

This project is licensed under the **GNU General Public License v3.0** - see the [LICENSE](LICENSE) file for details.

As a derivative work of the GPL-licensed sunposition project, this project maintains GPL v3 compatibility while adding new features and Islamic prayer time integration.

## Testing

This project includes comprehensive unit tests for all business logic components using Bun's built-in test framework.

### Running Tests

```bash
# Run all tests once
bun test

# Run tests in watch mode (re-run on file changes)
bun test --watch

# Run tests with coverage report
bun test --coverage
```

### Test Coverage

The project aims for 100% coverage of business logic (non-rendering code):

- ✅ **SunPath.test.ts** - Sun position calculations, prayer times, time/location updates
- ✅ **player.test.ts** - First-person controls, physics, collision detection
- ✅ **Loop.test.ts** - Animation loop, delta time, updatables management
- ✅ **Resizer.test.ts** - Responsive canvas sizing, aspect ratio calculations

Tests cover:
- Core functionality and edge cases
- Error handling and boundary conditions
- Performance considerations
- Integration between components

### Test Structure

All tests follow the `it('should...')` convention for clear, readable test descriptions. Each test file is co-located with its source file using the `.test.ts` suffix.

Example test:
```typescript
import { describe, expect, it } from "bun:test";

describe("SunPath", () => {
  it("should calculate correct sun position for solar noon", () => {
    const position = sunPath.getSunPosition(date);
    expect(position.y).toBeGreaterThan(0);
  });
});
```

### Writing New Tests

When adding new business logic:

1. Create a `.test.ts` file next to your source file
2. Mock Three.js objects to avoid rendering dependencies
3. Test public methods and their edge cases
4. Aim for 100% coverage of logical branches
5. Use descriptive test names with `it('should...')`

### Continuous Integration

Tests run automatically during the build process. The build will fail if any tests fail or if type checking fails.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Write tests for new functionality
4. Ensure all tests pass (`bun test`)
5. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
6. Push to the branch (`git push origin feature/AmazingFeature`)
7. Open a Pull Request

## Issues

Found a bug or have a feature request? Please open an issue at:
[https://github.com/ragaeeb/salat3d/issues](https://github.com/ragaeeb/salat3d/issues)

## Acknowledgments

- Eric Schilling for the [original sunposition](https://github.com/elschilling/sunposition) concept and implementation
- Batoul Apps for the comprehensive [Adhan.js](https://github.com/batoulapps/adhan-js/) library
- Three.js community for excellent 3D rendering tools
- The open-source community

---

**Note**: This application requires WebGL support. Ensure your browser is up to date for the best experience.