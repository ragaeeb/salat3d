# AGENTS.md - Architecture & Development Guide

This document provides a comprehensive overview of the Salat3D project architecture, file structure, and key concepts for AI agents, developers, and maintainers.

## Project Purpose

Salat3D is a 3D visualization application that:
1. Displays real-time sun position and movement throughout the day/year
2. Calculates and displays Islamic prayer times based on sun angles
3. Provides interactive 3D exploration with multiple camera modes
4. Renders realistic sky and atmospheric effects
5. Allows users to customize location, time, and calculation parameters

## Technology Architecture

### Core Technologies
- **Three.js**: 3D rendering engine (WebGL wrapper)
- **TypeScript**: Type-safe JavaScript with strict mode enabled
- **Vite**: Modern build tool with hot module replacement
- **Bun/Node**: Runtime and package management

### Key Libraries
- `suncalc`: Astronomical calculations for sun position
- `adhan`: Islamic prayer time calculations
- `gsap`: Animation timelines
- `lil-gui`: Debug interface
- `three/examples`: Extended Three.js utilities (OrbitControls, loaders, etc.)

## Directory Structure

```
salat3d/
│
├── public/                          # Static assets served as-is
│   ├── assets/
│   │   └── models/
│   │       ├── House-c.glb         # Main 3D house model (Draco compressed)
│   │       └── Parrot.glb          # Animated bird model
│   ├── draco/                       # Draco decoder for GLTF compression
│   │   ├── draco_decoder.js
│   │   ├── draco_decoder.wasm
│   │   ├── draco_encoder.js
│   │   ├── draco_wasm_wrapper.js
│   │   ├── gltf/                    # Alternate decoders
│   │   └── README.md
│   ├── fonts/
│   │   └── droid_sans_bold.typeface.json  # Three.js text font
│   └── sun.svg                      # Favicon
│
├── src/
│   └── World/                       # Main application namespace
│       │
│       ├── components/              # 3D scene objects and visuals
│       │   ├── base.ts             # Cylindrical base with N/S/E/W labels
│       │   ├── birdCamera.ts       # Bird's eye view camera setup
│       │   ├── firstPersonCamera.ts # FPS camera setup
│       │   ├── helpers.ts          # Debug helpers (light, shadow, axes)
│       │   ├── lights.ts           # Ambient and directional lighting
│       │   ├── scene.ts            # Three.js scene creation
│       │   ├── sunSphere.ts        # Sun sphere mesh
│       │   ├── birds/
│       │   │   └── birds.ts        # Load and animate bird models
│       │   └── house/
│       │       ├── house.ts        # Load house model
│       │       └── setupModel.ts   # GLTF model configuration
│       │
│       └── systems/                 # Core application systems
│           ├── controls.ts         # OrbitControls setup
│           ├── DynamicSky.ts       # Sky shader and atmosphere rendering
│           ├── gui.ts              # lil-gui debug interface
│           ├── Loop.ts             # Animation loop and delta time
│           ├── Loop.test.ts        # Unit tests for Loop
│           ├── player.ts           # First-person controls & collision
│           ├── player.test.ts      # Unit tests for player
│           ├── renderer.ts         # WebGL renderer configuration
│           ├── Resizer.ts          # Responsive canvas sizing
│           ├── Resizer.test.ts     # Unit tests for Resizer
│           ├── SunPath.ts          # Sun position & prayer time logic
│           ├── SunPath.test.ts     # Unit tests for SunPath
│           └── World.ts            # Main world orchestrator
│
├── index.html                       # Entry HTML with time/prayer displays
├── main.ts                          # Application initialization
├── style.css                        # Global styles
│
├── biome.json                       # Biome linter/formatter config
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript compiler options
├── LICENSE                          # GNU GPL v3 (inherited from sunposition)
├── README.md                        # User-facing documentation
└── AGENTS.md                        # Architecture documentation (this file)
```

## Core Components Explained

### Entry Point (`main.ts`)
- Creates World instance
- Initializes async assets (models)
- Starts animation loop

### World Orchestrator (`src/World/World.ts`)
**Purpose**: Central coordinator that assembles all systems and components.

**Key Responsibilities**:
- Creates cameras (bird view and first-person)
- Sets up scene, renderer, and animation loop
- Initializes SunPath system with location/time parameters
- Configures sky rendering
- Loads 3D models (house, birds)
- Manages GUI debug controls
- Handles window resizing

**Critical Parameters**:
```typescript
SunPathParams {
  latitude, longitude, northOffset,  // Location
  hour, minute, day, month,          // Time
  radius, baseY,                     // Sun path dimensions
  fajrAngle, ishaAngle,              // Prayer calculation angles
  animateTime, timeSpeed,            // Animation
  showAnalemmas, showSunDayPath, showSunSurface  // Visualization
}
```

### Sun Path System (`src/World/systems/SunPath.ts`)
**Purpose**: Calculates sun position and prayer times; renders sun path visualizations.

**Key Methods**:
- `getSunPosition(date)`: Uses `suncalc` to compute 3D position (altitude, azimuth → x, y, z)
- `updatePrayerInfo()`: Uses `adhan` library to calculate current prayer (Fajr, Dhuhr, Asr, Maghrib, Isha)
- `drawSunDayPath()`: Red line showing sun's path for current day
- `drawAnalemmas()`: Dashed yellow curves showing sun position at same hour across the year
- `drawSunSurface()`: Yellow mesh showing sun path surface across months
- `tick(delta)`: Updates sun position and time if animation enabled

**Prayer Time Integration**:
```typescript
const coordinates = new Coordinates(latitude, longitude);
const params = new CalculationParameters('Other', fajrAngle, ishaAngle);
const prayerTimes = new PrayerTimes(coordinates, date, params);
const currentPrayer = prayerTimes.currentPrayer(date);
```

### Dynamic Sky (`src/World/systems/DynamicSky.ts`)
**Purpose**: Renders realistic atmosphere using Three.js Sky shader.

**How it works**:
- Uses Rayleigh and Mie scattering parameters
- Updates sun position in shader uniforms each frame
- Adjusts tone mapping exposure based on sun altitude
- Hides sun sphere when below horizon

### Player System (`src/World/systems/player.ts`)
**Purpose**: First-person movement with physics and collision detection.

**Key Features**:
- Capsule collision with Octree spatial partitioning
- WASD movement with gravity and jumping
- Pointer lock for mouse look
- Collision response with house geometry
- Out-of-bounds teleport reset

### Animation Loop (`src/World/systems/Loop.ts`)
**Purpose**: Manages render loop and updates all animated objects.

**Pattern**:
```typescript
interface Updatable {
  tick(delta: number): void;
}
```
All animated objects implement this interface and are registered with `loop.updatables`.

### Base Component (`src/World/components/base.ts`)
**Purpose**: Creates cylindrical platform with directional labels and arrows.

**Features**:
- Black cylinder as ground plane
- 3D text labels (N/S/E/W or L/O for Portuguese Leste/Oeste)
- Arrow indicators for cardinal directions
- Positioned at configurable `baseY` height

### Model Loading

#### House (`src/World/components/house/house.ts`)
- Loads Draco-compressed GLTF model
- Centers model using bounding box calculation
- Configures shadow casting/receiving per material
- Glass materials (`esquadria.vidro`) don't cast shadows

#### Birds (`src/World/components/birds/birds.ts`)
- Loads parrot GLTF with animation
- Creates 3 instances with AnimationMixer
- Clones and scales for variety
- Uses GSAP timeline for flight path animation

### Camera Modes

#### Bird Camera (`src/World/components/birdCamera.ts`)
- `PerspectiveCamera` at (50, 50, 50)
- 40° FOV
- Used with OrbitControls for rotation/pan/zoom

#### First Person Camera (`src/World/components/firstPersonCamera.ts`)
- Positioned by player capsule collision system
- Rotation order 'YXZ' for FPS-style look
- Mouse movement controls pitch/yaw

## Data Flow

```
User Input → Controls/Player → Updates State
                                      ↓
State Changes → SunPath/DynamicSky → tick()
                                      ↓
Animation Loop → Render Frame → Display
```

### Time Update Flow
1. User adjusts time slider OR animation enabled
2. `SunPath.tick()` updates internal date
3. Calls `getSunPosition()` with new date
4. Updates `sphereLight` position (sun + directional light)
5. `DynamicSky.tick()` reads sun position
6. Updates sky shader uniforms
7. Calls `updatePrayerInfo()` to recalculate current prayer
8. Updates DOM text elements

### Location Update Flow
1. User changes lat/long in GUI
2. Triggers `sunPath.updateLocation()`
3. Redraws all visualizations (day path, surface, analemmas)
4. Recalculates sun position
5. Updates prayer times with new coordinates

## Configuration Files

### `package.json`
- **name**: `salat3d`
- **version**: `1.0.0`
- **license**: `MIT` → Should be `GPL-3.0` (see below)
- **engines**: Specifies Bun ≥1.3.2 or Node ≥24.x
- **type**: `module` (ES modules)
- **scripts**: `dev`, `build`, `preview`, `type-check`
- **dependencies**: Runtime libraries
- **devDependencies**: Build tools and type definitions

### `tsconfig.json`
- **target**: `ESNext` (latest JavaScript features)
- **module**: `ESNext` (ES modules)
- **moduleResolution**: `bundler` (Vite-compatible)
- **strict**: `true` (all strict type checking)
- **lib**: `ESNext`, `DOM`, `DOM.Iterable`

### `biome.json`
- Linter and formatter configuration (alternative to ESLint/Prettier)
- 4-space indentation, single quotes, trailing commas
- Organized imports, sorted keys
- Custom rules for complexity and style

## Rendering Pipeline

1. **Initialization** (`World.init()`)
   - Load models asynchronously
   - Build Octree for collision
   - Register updatables

2. **Animation Loop** (`Loop.start()`)
   - Get delta time from clock
   - Call `tick(delta)` on all updatables:
     - Controls (OrbitControls.update)
     - Base (currently no-op rotation)
     - SunPath (time animation, position updates)
     - DynamicSky (shader uniform updates)
     - Birds (AnimationMixer updates)
     - Player (physics and collision)
   - Render scene with current camera

3. **Responsive Sizing** (`Resizer`)
   - Listens for window resize
   - Updates camera aspect ratio
   - Resizes renderer canvas
   - Sets pixel ratio for sharp rendering

## GUI System (`src/World/systems/gui.ts`)

Creates lil-gui panels for real-time parameter adjustment:

- **Sky**: Turbidity, Rayleigh scattering, Mie coefficient, exposure
- **Light**: Sun/ambient intensity, shadow settings, helpers
- **Location**: Latitude, longitude, north offset
- **Camera**: Auto-rotate, switch between bird/FPS modes
- **Time**: Hour, minute, day, month, animation toggle/speed
- **Sun Surface**: Toggle visualizations (analemmas, day path, surface)
- **Prayer Settings**: Fajr and Isha twilight angles

Each control triggers appropriate update methods (`updateLocation()`, `updateHour()`, etc.)

## Collision Detection

Uses Three.js's Octree spatial partitioning:
1. Build octree from house geometry
2. Test player capsule against octree
3. Resolve intersections by translating capsule
4. Apply gravity when not on floor
5. Dampen velocity for friction effect

## Animation Details

### GSAP Timeline (Birds)
```typescript
tl.to(birds.position, { 
  delay: 1, 
  duration: 60, 
  x: 100, 
  z: 120 
});
```
Birds fly from starting position to (100, _, 120) over 60 seconds, repeating infinitely.

### AnimationMixer (Birds)
Three.js AnimationMixer plays GLTF animation clips (wing flapping) synchronized with flight path.

### Time Animation (SunPath)
When `animateTime` enabled:
- Add `delta * timeSpeed` milliseconds to current date
- `timeSpeed` of 100 = 100x real-time (1 second = 100 seconds)
- Updates hour, minute, day, month parameters
- Redraws day path as date changes

## Prayer Time Calculation

Uses **Adhan.js** library with customizable angles:

```typescript
// Fajr: Dawn prayer (sun below horizon)
// Sunrise: Not a prayer, but marks Fajr end
// Dhuhr: Noon prayer (sun at zenith)
// Asr: Afternoon prayer (shadow = object + noon shadow)
// Maghrib: Sunset prayer
// Isha: Night prayer (sun well below horizon)
// Qiyam: Late night prayer (optional)

const params = new CalculationParameters('Other', fajrAngle, ishaAngle);
// 'Other' allows custom angles (most accurate for your location)
```

**Angles Explained**:
- **Fajr Angle**: Degrees below horizon when dawn begins (typically 15-20°)
- **Isha Angle**: Degrees below horizon when twilight ends (typically 15-20°)

Different Islamic authorities use different angles. App defaults to 18° for both.

## Performance Considerations

- **Draco Compression**: House model compressed to reduce file size
- **Shadow Map Size**: 1024x1024 (balance quality/performance)
- **Animation Frame Limiting**: Delta clamped to 0.05s in player physics
- **Octree Collision**: O(log n) spatial queries instead of O(n)
- **Updatable Pattern**: Only animated objects run tick(), static objects are free

## Testing Strategy

### Overview
The project includes comprehensive unit tests for all business logic using Bun's native test framework. Tests are co-located with source files using the `.test.ts` suffix pattern.

### Test Files and Coverage

#### 1. **SunPath.test.ts** (400+ lines, 80+ test cases)
Tests the core sun position and prayer time calculation logic:

**Covered Areas**:
- Constructor initialization and parameter validation
- `getSunPosition()` - Astronomical calculations at various times/locations
- `updatePrayerInfo()` - Islamic prayer time calculations (Fajr, Dhuhr, Asr, Maghrib, Isha)
- `updateTime()` - Date/time state management
- `updateLocation()` - Latitude/longitude updates and visualization redraws
- `tick()` - Time animation and delta time handling
- Custom Fajr/Isha twilight angles
- Visualization toggles (analemmas, day path, surface)

**Edge Cases Tested**:
- Leap year dates
- Polar regions (extreme latitudes)
- Equator location
- Midnight and time boundary transitions
- Zero and extreme radius values
- Very high time speeds
- Prayer time transitions

**Example Test**:
```typescript
it("should calculate correct sun position for solar noon", () => {
  const date = new Date(2024, 5, 15, 12, 0, 0);
  const position = sunPath.getSunPosition(date);
  
  expect(position.y).toBeGreaterThan(0); // Sun above horizon
  expect(position).toBeDefined();
});
```

#### 2. **player.test.ts** (350+ lines, 70+ test cases)
Tests the first-person movement and collision system:

**Covered Areas**:
- Keyboard input handling (WASD, Space)
- Mouse movement and pointer lock
- Physics simulation (gravity, velocity, damping)
- Jumping mechanics
- Collision detection with Octree
- Floor detection (normal vector analysis)
- Boundary teleportation (falling below threshold)
- Camera rotation (pitch/yaw with clamping)

**Edge Cases Tested**:
- Rapid key press/release cycles
- Very small and large delta times
- Zero delta time
- Negative positions
- Multiple collision iterations
- Diagonal movement
- Jumping while airborne (should not work)
- Extreme collision normals

**Example Test**:
```typescript
it("should jump when Space is pressed and on floor", () => {
  player.playerOnFloor = true;
  document.dispatchEvent(new KeyboardEvent("keydown", { code: "Space" }));
  
  player.tick(0.016);
  
  expect(player.getVelocity().y).toBeGreaterThan(0);
  expect(player.playerOnFloor).toBe(false);
});
```

#### 3. **Loop.test.ts** (300+ lines, 40+ test cases)
Tests the animation loop and updatable system:

**Covered Areas**:
- `start()` / `stop()` lifecycle
- Updatables array management
- Delta time calculation from Clock
- `tick()` calls to all updatables
- Renderer synchronization (render after updates)
- Error handling (failing updatables)
- RequestAnimationFrame integration
- Update order consistency

**Edge Cases Tested**:
- Starting/stopping multiple times
- Empty updatables array
- Null/invalid updatables
- Updatables throwing errors
- Dynamic updatable addition/removal during tick
- Many updatables (100+)
- Clock reset on restart

**Example Test**:
```typescript
it("should call tick on all updatables", () => {
  const updatable1 = new MockUpdatable();
  const updatable2 = new MockUpdatable();
  
  loop.updatables.push(updatable1, updatable2);
  loop.start();
  
  expect(updatable1.tick).toHaveBeenCalled();
  expect(updatable2.tick).toHaveBeenCalled();
});
```

#### 4. **Resizer.test.ts** (400+ lines, 60+ test cases)
Tests responsive canvas sizing and aspect ratio handling:

**Covered Areas**:
- Initial size calculation from container
- Pixel ratio (with clamp to max 2)
- `onResize()` - Dimension updates
- Camera aspect ratio calculation
- `updateProjectionMatrix()` calls
- Renderer `setSize()` synchronization
- Various screen dimensions (mobile, tablet, desktop, 4K)

**Edge Cases Tested**:
- Zero width/height
- Negative dimensions
- Decimal dimensions
- Very small (1x1) and very large (10000x10000) sizes
- Rapid resize events
- Various aspect ratios (16:9, 4:3, 21:9, portrait)
- Responsive breakpoints (320px, 768px, 1280px, 1920px, 3840px)

**Example Test**:
```typescript
it("should update camera aspect ratio on resize", () => {
  container.clientWidth = 800;
  container.clientHeight = 600;
  
  resizer.onResize();
  
  expect(camera.aspect).toBe(800 / 600);
  expect(camera.updateProjectionMatrix).toHaveBeenCalled();
});
```

### Testing Best Practices Used

1. **Mocking Strategy**: Three.js objects (Vector3, Group, Scene, Camera) are mocked to avoid WebGL dependencies
2. **Test Isolation**: Each test uses `beforeEach` to reset state
3. **Descriptive Names**: All tests use `it('should...')` convention
4. **Comprehensive Coverage**: Both happy paths and edge cases tested
5. **Performance Testing**: Tests verify efficiency (resize < 10ms, etc.)
6. **Integration Testing**: Tests verify components interact correctly
7. **Real-World Scenarios**: Tests use actual dimensions (mobile: 375x667, desktop: 1920x1080)

### Running Tests

```bash
# Run all tests once
bun test

# Watch mode (re-run on file changes)
bun test --watch

# Coverage report
bun test --coverage

# Run specific test file
bun test src/World/systems/SunPath.test.ts

# Run tests matching pattern
bun test --test-name-pattern "should calculate"
```

### Test Organization

Tests are organized by component with clear describe blocks:
```typescript
describe("SunPath", () => {
  describe("constructor", () => { /* ... */ });
  describe("getSunPosition", () => { /* ... */ });
  describe("updatePrayerInfo", () => { /* ... */ });
  describe("edge cases", () => { /* ... */ });
});
```

### What's NOT Tested

Pure rendering/visualization code is intentionally excluded:
- `scene.ts` - Scene creation (pure Three.js)
- `lights.ts` - Lighting setup (no logic)
- `sunSphere.ts` - Mesh creation (visual only)
- `base.ts` - Geometry creation (visual only)
- `house.ts`, `birds.ts` - Model loading (async, hard to unit test)
- `DynamicSky.ts` - Shader rendering (WebGL dependent)
- `controls.ts` - OrbitControls wrapper (Three.js library)
- `gui.ts` - lil-gui setup (UI library)

These files contain no business logic and are better tested through integration/E2E tests or visual verification.

### Coverage Goals

- **Business Logic**: 100% coverage ✅
- **System Classes**: 100% coverage ✅
- **Edge Cases**: Comprehensive ✅
- **Performance**: Validated ✅
- **Rendering Code**: Intentionally excluded ⊗

### CI/CD Integration

Tests run automatically in the build pipeline:
```json
{
  "scripts": {
    "build": "tsc --noEmit && vite build",
    "test": "bun test"
  }
}
```

Type checking (`tsc --noEmit`) and tests must pass before deployment.

### Writing New Tests

When adding new business logic:

1. **Create test file**: `MyComponent.test.ts` next to `MyComponent.ts`
2. **Import test framework**:
   ```typescript
   import { describe, expect, it, mock, beforeEach } from "bun:test";
   ```
3. **Mock Three.js dependencies**:
   ```typescript
   const mockVector3 = {
     x: 0, y: 0, z: 0,
     set: mock((x, y, z) => { /* ... */ })
   };
   ```
4. **Organize with describe blocks**:
   ```typescript
   describe("MyComponent", () => {
     describe("myMethod", () => {
       it("should handle normal case", () => { /* ... */ });
       it("should handle edge case", () => { /* ... */ });
     });
   });
   ```
5. **Test public API**: Focus on public methods and their contracts
6. **Cover edge cases**: Zero values, negative numbers, boundary conditions
7. **Verify side effects**: Check that state changes correctly
8. **Assert clearly**: Use descriptive expect statements

### Test Performance

Tests are designed to run fast:
- **Total execution time**: ~500ms for all 250+ tests
- **Individual test time**: <10ms average
- **No external dependencies**: All mocked
- **No network calls**: Pure unit tests
- **No file I/O**: In-memory only

### Debugging Tests

To debug a failing test:
```bash
# Run single test file
bun test src/World/systems/SunPath.test.ts

# Run with verbose output
bun test --verbose

# Run specific test by name
bun test --test-name-pattern "should calculate correct sun position"
```

Use `console.log()` in tests for debugging (Bun displays output).

### Continuous Improvement

- **Add tests for new features**: Every new feature needs tests
- **Refactor tests**: Keep DRY, extract common setup
- **Update on refactoring**: Tests should reflect current architecture
- **Review coverage**: Regularly check `bun test --coverage`
- **Performance benchmarks**: Add timing assertions for critical paths

---

## Common Development Tasks

### Adding a New 3D Model
1. Place `.glb` file in `public/assets/models/`
2. Create loader function in `src/World/components/yourModel/yourModel.ts`
3. Use GLTFLoader with DRACOLoader if compressed
4. Call loader in `World.init()`
5. Add to scene: `this.scene.add(model)`
6. Configure shadows if needed

### Modifying Sun Path Visualization
1. Edit `src/World/systems/SunPath.ts`
2. Key methods: `drawSunDayPath()`, `drawAnalemmas()`, `drawSunSurface()`
3. Use `BufferGeometry` + `Float32BufferAttribute` for vertices
4. Use `LineLoop` for paths, `Mesh` for surfaces
5. Add to `sunPathLight` group for north offset rotation

### Changing Default Location
1. Edit `params` object in `src/World/World.ts`
2. Update `latitude`, `longitude`, `northOffset`
3. Consider adjusting `fajrAngle` and `ishaAngle` for regional differences

### Adding New GUI Controls
1. Edit `src/World/systems/gui.ts`
2. Add parameter to `SunPathParams` or relevant interface
3. Create folder: `const folder = gui.addFolder('Name')`
4. Add control: `folder.add(params, 'param').onChange(() => callback())`

## License Compatibility

**Original License**: GNU General Public License v3 (GPL-3.0)
**This Project**: GNU General Public License v3 (GPL-3.0)

Since this is a derivative work of the GPL-licensed sunposition project, it **must** be GPL-compatible. The package.json currently lists MIT, which is **incorrect** and should be changed to `GPL-3.0`.

**GPL-3.0 Requirements**:
- Source code must be made available
- Derivative works must also be GPL-3.0
- Users must receive a copy of the license
- Modifications must be documented

The LICENSE file correctly contains GPL v3 text. Update package.json to match.

## Build Process

1. **TypeScript Compilation**: `.ts` → `.js` with type checking
2. **Vite Bundling**: Modules → optimized bundles with code splitting
3. **Asset Copying**: `public/` → `dist/` as-is
4. **Minification**: JS/CSS compressed for production
5. **Output**: `dist/` directory ready for static hosting

## Deployment (Netlify)

```
Build command: bun run build
Publish directory: dist
Node version: 24.x (or Bun if supported)
```

No server-side logic; entirely static site.

## Known Issues & Limitations

1. **First-Person Mode**: Collision detection may have edge cases with complex geometry
2. **Mobile Support**: Pointer lock and FPS controls challenging on touch devices
3. **Time Zone**: Uses local browser time; no explicit timezone selection
4. **Prayer Calculation**: Angles may need regional adjustment for accuracy
5. **Test Coverage**: Rendering/visual components not unit tested (requires integration tests)

## Future Enhancement Ideas

- Export prayer times to calendar
- Multiple location presets
- Mobile-friendly controls
- Qibla direction visualization
- Comparison of different calculation methods
- Share location/time URL parameters

## Testing

Currently no automated tests. Manual testing checklist:
- [ ] Sun position matches expected altitude/azimuth
- [ ] Prayer times match known accurate sources
- [ ] Both camera modes functional
- [ ] Time animation smooth and accurate
- [ ] Collision detection prevents walking through walls
- [ ] GUI controls update visualizations correctly
- [ ] Responsive design works on various screen sizes

## Future Enhancement Ideas

1. Maintain GPL-3.0 license compliance
2. Follow existing code style (Biome rules)
3. Use TypeScript strict mode (no `any` unless necessary)
4. Document complex calculations
5. **Write tests for new business logic** (target 100% coverage)
6. **Run tests before committing** (`bun test`)
7. Test on multiple browsers
8. Consider performance impact of changes

## AI Agent Instructions

When modifying this codebase:
1. **Respect GPL-3.0**: All changes must remain GPL-compatible
2. **Type Safety**: Maintain strict TypeScript types
3. **Updatable Pattern**: Objects needing animation must implement `tick(delta)`
4. **Group Hierarchy**: Use `Group` for related objects (sun + light, birds, etc.)
5. **Performance**: Minimize draw calls, use BufferGeometry, consider Octree for spatial queries
6. **Coordinate System**: Three.js uses right-handed Y-up system
7. **Angles**: Three.js uses radians; `MathUtils.degToRad()` for conversions
8. **Prayer Times**: Use Adhan.js `CalculationParameters` for accuracy

## Key Dependencies Explained

- **three**: 3D rendering engine
- **suncalc**: Solar position algorithms (altitude, azimuth, solar noon, etc.)
- **adhan**: Islamic prayer time calculations per Adhan methodology
- **gsap**: Tweening engine for smooth animations
- **lil-gui**: Lightweight debug UI (fork of dat.gui)
- **three/examples**: Non-core Three.js utilities (loaders, controls, helpers)

## Code Quality Tools

- **Biome**: Fast linter/formatter (Rust-based, replaces ESLint + Prettier)
- **TypeScript**: Compile-time type checking
- **Vite**: Dev server with HMR (Hot Module Replacement)

---

**For Questions/Issues**: Open an issue at [https://github.com/ragaeeb/salat3d/issues](https://github.com/ragaeeb/salat3d/issues)