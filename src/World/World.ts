import gsap from 'gsap';
import type GUI from 'lil-gui';
import { type Mesh, type PerspectiveCamera, PMREMGenerator, type Scene, type WebGLRenderer } from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createBase, GROUND_RADIUS } from './components/base';
import { createBirdCamera } from './components/birdCamera';
import { loadBirds } from './components/birds/birds';
import { createFirstPersonCamera } from './components/firstPersonCamera';
import { createGarden } from './components/garden';
import { createDirectionalLightHelper, createShadowCameraHelper } from './components/helpers';
import { loadHouse } from './components/house/house';
import { createLibrary } from './components/library';
import { createLights } from './components/lights';
import { createMasjid } from './components/masjid';
import { createScene } from './components/scene';
import { createScrolls } from './components/scrolls';
import { createSunSphere } from './components/sunSphere';
import { createBookReader } from './systems/BookReader';
import { createControls } from './systems/controls';
import { DynamicSky, type SkyControl } from './systems/DynamicSky';
import { createGUI } from './systems/gui';
import { Loop } from './systems/Loop';
import { NightSky } from './systems/NightSky';
import { createPlayer } from './systems/player';
import { Resizer } from './systems/Resizer';
import { createRenderer } from './systems/renderer';
import { SunPath, type SunPathParams } from './systems/SunPath';

class World {
    private birdCamera: PerspectiveCamera;
    private firstPersonCamera: PerspectiveCamera;
    private activeCamera: PerspectiveCamera;
    private scene: Scene;
    private renderer: WebGLRenderer;
    private loop: Loop;
    private controls: OrbitControls & { tick: (delta: number) => void };
    private resizer: Resizer;

    private gui: GUI;
    private ground: ReturnType<typeof createBase>;
    private sunPath: SunPath;
    private tl: gsap.core.Timeline;

    constructor(container: Element) {
        this.birdCamera = createBirdCamera();
        this.firstPersonCamera = createFirstPersonCamera();
        this.activeCamera = this.birdCamera;

        this.scene = createScene();
        this.renderer = createRenderer();
        this.loop = new Loop(this.activeCamera, this.scene, this.renderer);
        container.append(this.renderer.domElement);
        this.controls = createControls(this.activeCamera, this.renderer.domElement);
        this.controls.tick = (_delta: number) => this.controls.update();

        const params: SunPathParams = {
            animateTime: true,
            baseY: 0,
            day: new Date().getDate(),
            fajrAngle: 18,
            // removed unused variable(),
            // removed unused variable(),
            hour: new Date().getHours(),
            ishaAngle: 18,
            latitude: -23.029396,
            longitude: -46.974293,
            minute: new Date().getMinutes(),
            // removed unused variable(),
            month: new Date().getMonth() + 1,
            northOffset: 303,
            radius: 18,
            shadowBias: -0.00086,
            showAnalemmas: true,
            showSunDayPath: true,
            showSunSurface: true,
            timeSpeed: 1,
        };

        const skyControl: SkyControl = {
            exposure: 6.99,
            mieCoefficient: 0.012,
            mieDirectionalG: 1,
            rayleigh: 0.425,
            turbidity: 10,
        };

        const { ambientLight, hemisphereLight, sunLight } = createLights();
        sunLight.shadow.camera.top = GROUND_RADIUS;
        sunLight.shadow.camera.bottom = -GROUND_RADIUS;
        sunLight.shadow.camera.left = -GROUND_RADIUS;
        sunLight.shadow.camera.right = GROUND_RADIUS;
        sunLight.shadow.bias = params.shadowBias;

        const sunSphere = createSunSphere();

        this.ground = createBase(params);
        this.sunPath = new SunPath(params, sunSphere, sunLight, this.ground);
        this.sunPath.sunPathLight.add(createGarden());

        const pmrem = new PMREMGenerator(this.renderer);
        const room = new RoomEnvironment();
        this.scene.environment = pmrem.fromScene(room, 0.04).texture;
        this.scene.environmentIntensity = 0.4;
        room.dispose();
        pmrem.dispose();

        const sky = new DynamicSky(skyControl, this.sunPath.sphereLight, this.renderer);

        const sunHelper = createDirectionalLightHelper(sunLight);
        const sunShadowHelper = createShadowCameraHelper(sunLight);
        // const axesHelper = createAxesHelper(30)
        sunShadowHelper.visible = false;

        const nightSky = new NightSky(this.sunPath);
        this.loop.updatables.push(this.ground, this.controls, this.sunPath, sky, nightSky);

        this.scene.add(
            sky.sky,
            ambientLight,
            hemisphereLight,
            sunHelper,
            sunShadowHelper,
            this.sunPath.sunPathLight,
            sunLight.target,
        );

        navigator.geolocation?.getCurrentPosition(({ coords }) => {
            params.latitude = coords.latitude;
            params.longitude = coords.longitude;
            this.sunPath.updateLocation();
        });

        const cameraControl = {
            birdView: () => {
                this.activeCamera = this.birdCamera;
                this.loop.camera = this.birdCamera;
                this.resizer.camera = this.birdCamera;
                this.resizer.onResize();
            },
            firstPerson: () => {
                this.activeCamera = this.firstPersonCamera;
                this.loop.camera = this.firstPersonCamera;
                this.resizer.camera = this.firstPersonCamera;
                this.resizer.onResize();
            },
        };

        this.gui = createGUI(
            params,
            ambientLight,
            sunLight,
            sunHelper,
            sunShadowHelper,
            this.sunPath,
            this.controls,
            skyControl,
            cameraControl,
        );
        this.resizer = new Resizer(container, this.activeCamera, this.renderer);

        this.tl = gsap.timeline({ repeat: -1 });
    }

    async init() {
        const { house } = await loadHouse();
        const birds = await loadBirds();
        for (let b = 0; b < birds.children.length; b++) {
            // Cast to any because birds children might not implement Updatable interface strictly in Three types, but we added tick
            this.loop.updatables.push(birds.children[b] as any);
        }
        const { books, group: library } = await createLibrary();
        const { group: scrolls, meshes: scrollMeshes } = await createScrolls();
        const masjid = createMasjid();
        this.scene.add(house, birds, library, masjid, scrolls);
        this.tl.to(birds.position, { delay: 1, duration: 60, x: 100, z: 120 });
        const decorations = [...this.ground.children];
        this.ground.remove(...decorations);
        const garden = this.sunPath.sunPathLight.getObjectByName('garden');
        const player = createPlayer(
            this.firstPersonCamera,
            house,
            this.ground,
            library,
            masjid,
            garden?.getObjectByName('gardenColliders'),
            garden?.getObjectByName('fountain'),
            garden?.getObjectByName('picnic'),
        );
        this.ground.add(...decorations);
        const reader = createBookReader({
            camera: this.firstPersonCamera,
            isActive: () => this.activeCamera === this.firstPersonCamera,
            items: [...books, ...scrollMeshes],
            sunPath: this.sunPath,
        });
        this.loop.updatables.push(player, reader);
        house.traverse((n) => {
            if ((n as Mesh).isMesh) {
                const material = (n as Mesh).material;
                const matName = Array.isArray(material) ? '' : (material as any).name;
                if (matName === 'esquadria.vidro') {
                    n.castShadow = false;
                } else {
                    n.castShadow = true;
                    n.receiveShadow = true;
                }
            }
        });

        if (this.gui) {
            // doing this purely to satisfy TS
        }
    }

    start() {
        this.loop.start();
    }

    stop() {
        this.loop.stop();
    }
}

export { World };
